import { useEffect, useState, useCallback } from "react";

export interface SheetData {
  rows: (string | number | boolean | null)[][];
  headers?: (string | number | boolean | null)[];
}

export interface UseSheetDataOptions {
  scriptUrl: string;
}

export const useSheetData = ({ scriptUrl }: UseSheetDataOptions) => {
  const [data, setData] = useState<SheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!scriptUrl) {
      setError("Script URL is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = new URL(scriptUrl);
      url.searchParams.append("action", "getData");

      console.log("Fetching data from:", url.toString());

      let response;
      try {
        response = await fetch(url.toString());
      } catch (fetchError) {
        console.error("Fetch failed:", fetchError);
        throw new Error(
          "Cannot reach Google Apps Script. Make sure: " +
          "1) The deployment URL is correct, " +
          "2) The script is deployed as a web app with 'Execute as' = your account and 'Who has access' = Anyone, " +
          "3) You redeploy after making code changes"
        );
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      console.log("Full sheet data response:", JSON.stringify(result, null, 2));

      if (!result.success) {
        throw new Error(result.error || "API returned success: false");
      }

      // Handle both response formats:
      // Format 1: { success: true, data: { headers: [...], rows: [...] } }
      // Format 2: { success: true, headers: [...], rows: [...] }
      let sheetData = result.data;

      if (!sheetData) {
        // Check if data is at the root level instead
        if (result.headers || result.rows) {
          sheetData = {
            headers: result.headers || [],
            rows: result.rows || [],
          };
        } else {
          console.error("Response structure:", result);
          throw new Error("No data in response - check Apps Script response format");
        }
      }
      console.log("Sheet data object:", sheetData);
      console.log("Rows type:", typeof sheetData.rows, "Is array:", Array.isArray(sheetData.rows));

      // Convert rows object to array if needed (sometimes Google Apps Script returns as object)
      let rows = sheetData.rows;
      console.log("Initial rows object:", {
        isArray: Array.isArray(rows),
        type: typeof rows,
        keys: typeof rows === "object" ? Object.keys(rows) : "N/A",
        sample: rows,
      });

      if (!Array.isArray(rows)) {
        console.warn("Rows is not an array, attempting to convert...", typeof rows);

        if (typeof rows === "object" && rows !== null) {
          // Try to convert object to array
          // Google Apps Script sometimes returns {0: [...], 1: [...], 2: [...]}
          const convertedRows = Object.values(rows);
          console.log("Converted object to array:", convertedRows);

          // Verify each element is also an array
          if (
            Array.isArray(convertedRows) &&
            convertedRows.length > 0 &&
            Array.isArray(convertedRows[0])
          ) {
            rows = convertedRows;
            console.log("✓ Successfully converted rows to proper array format");
          } else {
            // Maybe it's a nested object structure, try a different approach
            console.warn("Converted values are not all arrays, inspecting structure...");
            console.log("First few items:", convertedRows.slice(0, 3));

            // Filter out non-array items and array-like objects
            rows = convertedRows.filter((item) => {
              if (Array.isArray(item)) return true;
              if (typeof item === "object" && item !== null) {
                const itemValues = Object.values(item);
                return itemValues.length > 0;
              }
              return false;
            });

            if (rows.length === 0) {
              throw new Error(
                "Rows data structure is not recognized. Expected array of arrays."
              );
            }

            console.log("Filtered and converted rows:", rows);
          }
        } else {
          console.error("Cannot convert rows format. Expected array or object, got:", {
            type: typeof sheetData.rows,
            value: sheetData.rows,
            allKeys: Object.keys(sheetData),
          });
          throw new Error("Invalid data format: rows must be an array or object");
        }
      }

      if (!Array.isArray(rows)) {
        console.error("Final validation failed. Rows is not an array:", rows);
        throw new Error("Failed to convert rows to array format");
      }

      console.log("Data loaded successfully:", {
        rowCount: rows.length,
        headerCount: sheetData.headers?.length || 0,
      });

      setData({
        rows: rows,
        headers: sheetData.headers || [],
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching sheet data:", err);
    } finally {
      setLoading(false);
    }
  }, [scriptUrl]);

  const updateCell = useCallback(
    async (row: number, col: number, value: string | number | boolean) => {
      if (!scriptUrl) {
        setError("Script URL is required");
        return false;
      }

      try {
        setUpdating(true);
        setError(null);

        const url = new URL(scriptUrl);

        // Use GET request for updates (more reliable with Google Apps Script)
        url.searchParams.append("action", "updateCell");
        url.searchParams.append("row", String(row));
        url.searchParams.append("col", String(col));
        url.searchParams.append("value", String(value));

        console.log("Updating cell via GET:", { row, col, value, url: url.toString() });

        const response = await fetch(url.toString(), {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        console.log("Update response:", result);

        if (result.success) {
          console.log("Cell updated successfully");

          // Update local state with the new value
          // Note: Columns I (8) and J (9) timestamps are updated on the server
          setData((prevData) => {
            if (!prevData) return prevData;

            const newRows = prevData.rows.map((r) => [...r]);
            if (newRows[row]) {
              newRows[row][col] = value;
              // Also update timestamp columns if they exist
              const now = new Date();
              const day = String(now.getDate()).padStart(2, "0");
              const month = String(now.getMonth() + 1).padStart(2, "0");
              const year = now.getFullYear();
              const dateStr = `${day}/${month}/${year}`;

              const hours = String(now.getHours()).padStart(2, "0");
              const minutes = String(now.getMinutes()).padStart(2, "0");
              const seconds = String(now.getSeconds()).padStart(2, "0");
              const timeStr = `${hours}:${minutes}:${seconds}`;

              // Column I (index 8) is the date, Column J (index 9) is the time
              if (newRows[row].length > 8) {
                newRows[row][8] = dateStr;
              }
              if (newRows[row].length > 9) {
                newRows[row][9] = timeStr;
              }
            }

            return {
              ...prevData,
              rows: newRows,
            };
          });

          return true;
        } else {
          throw new Error(result.error || "Failed to update cell");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";

        if (errorMessage.includes("Failed to fetch")) {
          console.error(
            "Network error - cannot reach Google Apps Script. Check your deployment URL.",
            err
          );
          setError(
            "Network error: Cannot connect to Google Apps Script. Verify the deployment URL is correct and accessible."
          );
        } else {
          console.error("Error updating cell:", err);
          setError(errorMessage);
        }

        return false;
      } finally {
        setUpdating(false);
      }
    },
    [scriptUrl]
  );

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    updating,
    updateCell,
    refetch,
  };
};
