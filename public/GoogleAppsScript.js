// ============================================================================
// Google Sheets Editor - Google Apps Script Backend (IMPROVED)
// 
// SETUP INSTRUCTIONS:
// 1. Go to https://script.google.com/
// 2. Create a new project
// 3. Copy ALL of this code into the editor
// 4. Replace "YOUR_SPREADSHEET_ID" below with your actual Spreadsheet ID
//    (Find it in the URL: https://docs.google.com/spreadsheets/d/{YOUR_SPREADSHEET_ID}/edit)
// 5. Click Deploy > New Deployment > Type: Web app
// 6. Execute as: Your account
// 7. Who has access: Anyone
// 8. Copy the deployment URL
// 9. Update your website with the new deployment URL
//
// TO REDEPLOY AFTER CHANGES:
// 1. Make changes to the script
// 2. Click Deploy > Manage deployments
// 3. Delete the old deployment
// 4. Create new deployment with same settings
// ============================================================================

const SPREADSHEET_ID = "1BEJgp-ooyxWXdD2QBXKnfvEmzdC79UoWFtD4QLBk-ug";
const SHEET_NAME = "ABSENCES";

/**
 * Test endpoint - visit the deployment URL to test if script is working
 * @param {Object} e - Event object
 * @returns {HtmlOutput} Status page
 */
function doGet(e) {
  const action = e.parameter.action || "test";
  
  // Test endpoint - visible in browser
  if (action === "test") {
    return HtmlService.createHtmlOutput(`
      <h1>✅ Google Apps Script is Running!</h1>
      <p>Deployment URL is working correctly.</p>
      <hr>
      <h2>Test Results:</h2>
      <ul>
        <li>Script Status: <strong style="color:green;">ACTIVE</strong></li>
        <li>Spreadsheet ID: ${SPREADSHEET_ID}</li>
        <li>Sheet Name: ${SHEET_NAME}</li>
        <li>Timestamp: ${new Date().toLocaleString()}</li>
      </ul>
      <hr>
      <h3>API Endpoints:</h3>
      <ul>
        <li><code>?action=getData</code> - Get all data from sheet</li>
        <li><code>?action=updateCell&row=0&col=0&value=test</code> - Update a cell</li>
        <li><code>?action=test</code> - Test if script is running (this page)</li>
      </ul>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        h1 { color: #333; }
        code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
        li { margin: 8px 0; }
      </style>
    `);
  }

  // JSON API endpoints
  const output = {};

  try {
    if (action === "getData") {
      output.success = true;
      output.data = getData();
      output.message = "Data retrieved successfully";
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
      output.error = "Unknown action: " + action + ". Available actions: getData, updateCell, test";
    }
  } catch (error) {
    output.success = false;
    output.error = "Server error: " + error.toString();
    output.stack = error.stack;
    
    // Log error to Google Apps Script logs (visible in Executions)
    console.error("ERROR in doGet:", error);
  }

  const response = ContentService.createTextOutput(JSON.stringify(output));
  response.setMimeType(ContentService.MimeType.JSON);
  
  // Add CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  return response;
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
          postData = e.postData.contents;
        }
      }
    }

    const action = postData.action || e.parameter.action;

    if (action === "getData") {
      output.success = true;
      output.data = getData();
      output.message = "Data retrieved successfully";
    } else if (action === "updateCell") {
      const row = postData.row !== undefined ? postData.row : e.parameter.row;
      const col = postData.col !== undefined ? postData.col : e.parameter.col;
      const value = postData.value !== undefined ? postData.value : e.parameter.value;

      if (row === undefined || col === undefined || value === undefined) {
        output.success = false;
        output.error = "Missing required parameters: row, col, value";
      } else {
        updateCell(parseInt(row), parseInt(col), value);
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
    output.error = "Server error: " + error.toString();
    output.stack = error.stack;
    
    // Log error
    console.error("ERROR in doPost:", error);
  }

  const result = ContentService.createTextOutput(JSON.stringify(output));
  result.setMimeType(ContentService.MimeType.JSON);
  
  // Add CORS headers
  result.setHeader('Access-Control-Allow-Origin', '*');
  result.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  result.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  result.setHeader('Content-Type', 'application/json; charset=utf-8');

  return result;
}

/**
 * Handle CORS preflight requests
 */
function doOptions(e) {
  const output = ContentService.createTextOutput("");
  output.setMimeType(ContentService.MimeType.TEXT);
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return output;
}

/**
 * Retrieve all data from the sheet
 * The first row is treated as headers, subsequent rows are data
 * @returns {Object} Object containing headers array and rows array
 */
function getData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    if (!ss) {
      throw new Error("Spreadsheet not found. Check SPREADSHEET_ID is correct.");
    }
    
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error("Sheet '" + SHEET_NAME + "' not found in spreadsheet. Available sheets: " + ss.getSheets().map(s => s.getName()).join(", "));
    }

    const range = sheet.getDataRange();
    const values = range.getValues();

    let headers = [];
    let rows = [];

    if (values && values.length > 0) {
      headers = values[0];
      rows = values.slice(1);
    }

    console.log("getData() called. Headers: " + headers.length + ", Rows: " + rows.length);

    return {
      headers: headers,
      rows: rows,
    };
  } catch (error) {
    console.error("Error in getData():", error);
    throw error;
  }
}

/**
 * Update a single cell in the spreadsheet
 * Row and column indices are 0-based (JavaScript style)
 * @param {number} row - Zero-based row index (0 = first data row)
 * @param {number} col - Zero-based column index (0 = column A)
 * @param {*} value - The new value
 */
function updateCell(row, col, value) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error("Sheet '" + SHEET_NAME + "' not found");
    }

    // Convert to Apps Script 1-based indexing
    // Add 2 to row: +1 for 1-based indexing, +1 to skip header row
    const sheetRow = row + 2;
    const sheetCol = col + 1;

    sheet.getRange(sheetRow, sheetCol).setValue(value);
    
    console.log("Updated cell: row=" + sheetRow + ", col=" + sheetCol + ", value=" + value);
  } catch (error) {
    console.error("Error in updateCell():", error);
    throw error;
  }
}

/**
 * Update timestamp columns for row change tracking
 * Column I (8): Date in dd/mm/yyyy format
 * Column J (9): Time in HH:mm:ss format
 * @param {number} row - Zero-based row index
 */
function updateTimestampColumns(row) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error("Sheet '" + SHEET_NAME + "' not found");
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

    const sheetRow = row + 2;

    // Column I (index 8) = column 9 in Apps Script
    sheet.getRange(sheetRow, 9).setValue(dateStr);

    // Column J (index 9) = column 10 in Apps Script
    sheet.getRange(sheetRow, 10).setValue(timeStr);
    
    console.log("Updated timestamps for row " + sheetRow);
  } catch (error) {
    console.error("Error in updateTimestampColumns():", error);
    throw error;
  }
}
