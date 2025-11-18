# Google Sheets Editor - Complete Setup Guide

A modern, responsive React web application for editing Google Sheets data in real-time through a Google Apps Script backend.

## 🚀 Quick Start

### Phase 1: Prepare Your Google Sheet

1. Create a new Google Sheet or use an existing one
2. **Important**: Ensure you have a sheet named **"ABSENCES"** in your spreadsheet
3. Add your absences data with headers in the first row
4. Copy your **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### Phase 2: Create Google Apps Script

1. Open your Google Sheet
2. Click **Extensions** → **Apps Script**
3. A new tab will open with the Apps Script editor
4. Delete any existing code and paste the complete code from `GOOGLE_APPS_SCRIPT_CODE.md`
5. Replace `YOUR_SPREADSHEET_ID` with your actual Spreadsheet ID
6. Save the file (Ctrl+S or Cmd+S)

### Phase 3: Deploy the Apps Script

1. In the Apps Script editor, click the **Deploy** button (top right)
2. Click **New deployment**
3. Select **Type** dropdown → Choose **Web app**
4. Set the following:
   - **Execute as**: Your Google account
   - **Who has access**: Anyone
5. Click **Deploy** and authorize when prompted
6. A deployment ID will be shown - copy the deployment URL from the notification

The URL will look like:
```
https://script.google.com/macros/d/[DEPLOYMENT_ID]/usercache
```

### Phase 4: Connect to the React App

1. Open the React Google Sheets Editor app
2. Paste the **Apps Script deployment URL** into the field
3. The sheet name is pre-filled with **"ABSENCES"**
4. Click **Connect & Load Data**

That's it! Your data will load and you can start editing.

---

## 📊 Features

✅ **Real-time Editing**: Click any cell to edit inline
✅ **Automatic Saving**: Changes are saved to Google Sheets instantly
✅ **Responsive Design**: Works on desktop, tablet, and mobile
✅ **RTL Support**: Automatic right-to-left layout for Arabic and Hebrew
✅ **Error Handling**: Clear error messages if something goes wrong
✅ **Loading States**: Visual feedback during data fetching
✅ **Dark Mode Ready**: Uses system preferences for dark/light mode
✅ **No External Dependencies**: Pure React with Tailwind CSS styling

---

## 🎮 How to Use

### Viewing Data
- The app displays your Google Sheet in a clean, modern table
- Headers appear in the first row with a gray background
- Row numbers appear in the first column

### Editing Cells
1. Click any cell to edit it
2. Type your new value
3. Press **Enter** to save or **Escape** to cancel
4. The cell will update instantly in both the app and Google Sheets

### Other Actions
- **Back Button**: Return to the setup page
- **Refresh Button**: Re-fetch all data from Google Sheets
- **Automatic RTL**: App automatically detects system language preference

---

## 🛡️ Security & Privacy

- The deployment URL should be treated like a password
- Keep it private or share only with trusted users
- You can revoke access anytime from the Apps Script deployment settings
- All data stays in your Google Sheets - the app doesn't store anything

---

## 🔧 Troubleshooting

### "Failed to fetch data" Error
**Solution**:
- Verify your Apps Script deployment URL is correct
- Ensure the Apps Script is deployed as a "Web app"
- Check that the Spreadsheet ID in the Apps Script code matches your actual sheet

### Cells Won't Update
**Solution**:
- Check your browser's console (F12 → Console tab) for error messages
- Verify the Apps Script deployment is still active
- Try refreshing the page

### Sheet Name Not Found
**Solution**:
- Use the exact name of the sheet (case-sensitive)
- Check the sheet tab at the bottom of your Google Sheet for the exact name
- If empty cells are showing, your sheet might need headers in the first row

### CORS Errors
**Solution**:
- These should not occur with Apps Script web apps
- If they do, try redeploying the Apps Script

---

## 📝 Technical Details

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **API Communication**: Fetch API

### Backend (Google Apps Script)
- **Runtime**: Google Apps Script V8
- **Functions**:
  - `doGet(e)`: Handles GET requests for fetching data
  - `doPost(e)`: Handles POST requests for updating cells
  - `getData()`: Retrieves all sheet data
  - `updateCell(row, col, value)`: Updates a specific cell

### Data Format
The app sends/receives data as JSON:

**GET Response** (getData):
```json
{
  "success": true,
  "data": {
    "headers": ["Name", "Email", "Status"],
    "rows": [
      ["John Doe", "john@example.com", "Active"],
      ["Jane Smith", "jane@example.com", "Pending"]
    ]
  }
}
```

**POST Request** (updateCell):
```json
{
  "action": "updateCell",
  "row": 0,
  "col": 1,
  "value": "newemail@example.com"
}
```

---

## 💡 Tips & Best Practices

1. **Headers**: Always include headers in the first row of your sheet
2. **Data Types**: The app preserves data types (numbers, dates, etc.)
3. **Empty Cells**: Empty cells are shown as "—" for clarity
4. **Bulk Edits**: Edit one cell at a time - no multi-cell editing yet
5. **Backup**: Consider keeping backups of important data
6. **Performance**: Very large sheets (10,000+ rows) may load slowly

---

## 🔄 Version Updates

The Apps Script code is stable and production-ready. If you update the React frontend, no changes to the Apps Script are needed.

---

## 🎯 Next Steps

1. **Customize**: Modify the app colors and styling to match your brand
2. **Share**: Share the app URL with your team
3. **Integrate**: Use the Apps Script deployment URL in other applications
4. **Extend**: Add more features like sorting, filtering, or validation

---

## 📧 Support

For issues with:
- **React App**: Check the browser console (F12) for error messages
- **Google Sheets**: Visit https://support.google.com/docs
- **Apps Script**: Visit https://developers.google.com/apps-script

---

Enjoy your Google Sheets Editor! 🎉
