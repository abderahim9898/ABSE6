// ============================================================================
// Google Sheets Editor - Google Apps Script Backend
// 
// Copy this entire file into your Google Apps Script project
// 
// IMPORTANT: Replace "YOUR_SPREADSHEET_ID" with your actual Spreadsheet ID
// from the URL: https://docs.google.com/spreadsheets/d/{YOUR_SPREADSHEET_ID}/edit
// ============================================================================

const SPREADSHEET_ID = "1BEJgp-ooyxWXdD2QBXKnfvEmzdC79UoWFtD4QLBk-ug";
const SHEET_NAME = "ABSENCES";

/**
 * Handle GET requests from the React frontend
 * @param {Object} e - Event object containing request parameters
 * @returns {TextOutput} JSON response
 */
function doGet(e) {
  const action = e.parameter.action || "getData";
  const output = {};

  try {
    if (action === "getData") {
      output.success = true;
      output.data = getData();
    } else if (action === "updateCell") {
      // Handle updateCell via GET (fallback from POST)
      const row = e.parameter.row;
      const col = e.parameter.col;
      const value = e.parameter.value;

      if (row === undefined || col === undefined || value === undefined) {
        output.success = false;
        output.error = "Missing required parameters: row, col, value";
      } else {
        updateCell(parseInt(row), parseInt(col), value);
        // Update timestamp columns I (8) and J (9)
        updateTimestampColumns(parseInt(row));
        output.success = true;
        output.message = "Cell updated successfully";
        output.data = {
          row: row,
          col: col,
          value: value,
        };
      }
    } else {
      output.success = false;
      output.error = "Unknown action: " + action;
    }
  } catch (error) {
    output.success = false;
    output.error = "Error in doGet: " + error.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Handle POST requests from the React frontend
 * @param {Object} e - Event object containing request body
 * @returns {TextOutput} JSON response
 */
function doPost(e) {
  const output = {};

  try {
    // Handle both JSON body and URL-encoded body
    let postData = {};

    if (e.postData) {
      if (e.postData.type === ContentService.MimeType.JSON) {
        postData = JSON.parse(e.postData.contents);
      } else if (e.postData.contents) {
        try {
          postData = JSON.parse(e.postData.contents);
        } catch (parseError) {
          // If JSON parsing fails, try to use it as-is
          postData = e.postData.contents;
        }
      }
    }

    const action = postData.action || e.parameter.action;

    if (action === "updateCell") {
      const row = postData.row !== undefined ? postData.row : e.parameter.row;
      const col = postData.col !== undefined ? postData.col : e.parameter.col;
      const value = postData.value !== undefined ? postData.value : e.parameter.value;

      if (row === undefined || col === undefined || value === undefined) {
        output.success = false;
        output.error = "Missing required parameters: row, col, value";
      } else {
        updateCell(parseInt(row), parseInt(col), value);
        // Update timestamp columns I (8) and J (9)
        updateTimestampColumns(parseInt(row));
        output.success = true;
        output.message = "Cell updated successfully";
        output.data = {
          row: row,
          col: col,
          value: value,
        };
      }
    } else {
      output.success = false;
      output.error = "Unknown action: " + action;
    }
  } catch (error) {
    output.success = false;
    output.error = "Error in doPost: " + error.toString();
  }

  // Create output with explicit CORS headers
  const result = ContentService.createTextOutput(JSON.stringify(output));
  result.setMimeType(ContentService.MimeType.JSON);

  return result;
}

/**
 * Retrieve all data from the first sheet of the spreadsheet
 * The first row is treated as headers, subsequent rows are data
 * @returns {Object} Object containing headers array and rows array
 */
function getData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error("Sheet '" + SHEET_NAME + "' not found in spreadsheet");
  }

  const range = sheet.getDataRange();
  const values = range.getValues();

  let headers = [];
  let rows = [];

  if (values && values.length > 0) {
    // First row contains headers
    headers = values[0];
    // Remaining rows contain data
    rows = values.slice(1);
  }

  return {
    headers: headers,
    rows: rows,
  };
}

/**
 * Update a single cell in the spreadsheet
 * Row and column indices are 0-based (JavaScript style)
 * Row 0 is the first data row (after headers)
 * Column 0 is the first column
 * @param {number} row - Zero-based row index
 * @param {number} col - Zero-based column index
 * @param {*} value - The new value to set in the cell
 */
function updateCell(row, col, value) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error("Sheet '" + SHEET_NAME + "' not found in spreadsheet");
  }

  // Convert from JavaScript zero-indexed to Apps Script one-indexed
  // Add 2 to row because:
  // 1. Apps Script uses 1-based indexing (not 0-based)
  // 2. The first row (row 1) is the header, so data starts at row 2
  const sheetRow = row + 2;
  const sheetCol = col + 1;

  // Get the cell and set its value
  sheet.getRange(sheetRow, sheetCol).setValue(value);
}

/**
 * Update timestamp columns (I and J) for the given row
 * Column I (index 8): Date in dd/mm/yyyy format
 * Column J (index 9): Time in HH:mm:ss format
 * @param {number} row - Zero-based row index
 */
function updateTimestampColumns(row) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error("Sheet '" + SHEET_NAME + "' not found in spreadsheet");
  }

  const now = new Date();

  // Format: dd/mm/yyyy
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const dateStr = day + "/" + month + "/" + year;

  // Format: HH:mm:ss
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const timeStr = hours + ":" + minutes + ":" + seconds;

  // Convert from JavaScript zero-indexed to Apps Script one-indexed
  const sheetRow = row + 2;

  // Column I is index 8 (0-based), which is column 9 (1-based in Apps Script)
  sheet.getRange(sheetRow, 9).setValue(dateStr);

  // Column J is index 9 (0-based), which is column 10 (1-based in Apps Script)
  sheet.getRange(sheetRow, 10).setValue(timeStr);
}
