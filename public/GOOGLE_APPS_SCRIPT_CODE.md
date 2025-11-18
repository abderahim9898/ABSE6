# Google Apps Script Code for Google Sheets Editor

Copy and paste the following code into your Google Apps Script project to enable communication with the React frontend.

## Setup Instructions

1. Open your Google Sheet
2. Click **Extensions** → **Apps Script**
3. Delete any existing code in the editor
4. Paste the code below into the `Code.gs` file
5. Replace `YOUR_SPREADSHEET_ID` with your actual Spreadsheet ID (from the URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`)
6. Save the project (Ctrl+S)
7. Click **Deploy** → **New deployment**
8. Select **Type** → **Web app**
9. Set **Execute as** to your account
10. Set **Who has access** to "Anyone"
11. Click **Deploy**
12. Copy the deployment URL and paste it into the React app's setup page

---

## Code.gs

```javascript
// Configuration: Update this with your Spreadsheet ID
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID";
const SHEET_NAME = "ABSENCES";

/**
 * Handle GET requests from the React frontend
 * Supports the action parameter to determine which function to call
 */
function doGet(e) {
  const action = e.parameter.action || "getData";

  // Set CORS headers
  const output = {};

  if (action === "getData") {
    output.success = true;
    output.data = getData();
  } else {
    output.success = false;
    output.error = "Unknown action: " + action;
  }

  return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Handle POST requests from the React frontend
 * Used for updating cells
 */
function doPost(e) {
  let output = {};

  try {
    // Parse the JSON body
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    if (action === "updateCell") {
      const row = postData.row;
      const col = postData.col;
      const value = postData.value;

      // Validate parameters
      if (row === undefined || col === undefined || value === undefined) {
        output.success = false;
        output.error = "Missing required parameters: row, col, value";
      } else {
        updateCell(row, col, value);
        output.success = true;
        output.message = "Cell updated successfully";
      }
    } else {
      output.success = false;
      output.error = "Unknown action: " + action;
    }
  } catch (error) {
    output.success = false;
    output.error = "Error processing request: " + error.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Get all data from the active sheet
 * Returns an object with rows array and headers
 */
function getData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Get the sheet named "ABSENCES"
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error("Sheet '" + SHEET_NAME + "' not found in spreadsheet");
  }
  
  // Get all data
  const range = sheet.getDataRange();
  const values = range.getValues();

  // Separate headers from data
  let headers = [];
  let rows = [];

  if (values.length > 0) {
    // First row is headers
    headers = values[0];
    // Rest are data rows
    rows = values.slice(1);
  }

  return {
    headers: headers,
    rows: rows,
  };
}

/**
 * Update a specific cell in the sheet
 * @param {number} row - The row index (0-based, where 0 is the first data row after headers)
 * @param {number} col - The column index (0-based)
 * @param {*} value - The new value for the cell
 */
function updateCell(row, col, value) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error("Sheet '" + SHEET_NAME + "' not found in spreadsheet");
  }

  // Add 2 to row because:
  // - Sheets are 1-indexed (not 0-indexed)
  // - We skip the header row
  const sheetRow = row + 2;
  const sheetCol = col + 1;

  // Update the cell
  sheet.getRange(sheetRow, sheetCol).setValue(value);
}
```

---

## How It Works

### Data Flow

1. **Frontend requests data**: 
   - Sends GET request to `?action=getData`
   - Receives JSON with `headers` and `rows` arrays

2. **User edits a cell**:
   - Frontend sends POST request with `action`, `row`, `col`, `value`
   - Apps Script updates the cell in Google Sheets
   - Returns success/error response

3. **Frontend updates state**:
   - Updates local state immediately for UI responsiveness
   - Handles errors and shows user feedback

### Important Notes

- **First row** is treated as headers
- **Data rows** start from row 2 in the spreadsheet
- **Zero-indexed**: Both row and column indices are 0-based in the frontend
- **CORS**: Apps Script deployed as a web app handles CORS automatically
- **Automatic sync**: All changes are saved directly to Google Sheets

### Security Notes

- The deployment URL should be kept private
- To restrict access, change the "Who has access" setting to specific users
- The spreadsheet owner can revoke access anytime

---

## Troubleshooting

### "Failed to fetch data" Error
- Ensure the Spreadsheet ID is correct
- Verify the Apps Script has been deployed
- Check that the deployment URL is correct

### Cells not updating
- Ensure the Apps Script has permission to edit the spreadsheet
- Check browser console for detailed error messages
- Verify the Apps Script deployment URL is accessible

### CORS Issues
- Apps Script web app deployments automatically handle CORS
- Make sure you deployed as "Web app", not as a library

