# Google Apps Script Deployment - Complete Guide

If you're experiencing "Failed to fetch" errors when updating cells, follow these steps to redeploy your Google Apps Script.

## Step 1: Update Your Apps Script Code

1. Open your Google Sheet
2. Click **Extensions** → **Apps Script**
3. Delete ALL existing code
4. Copy the ENTIRE code from `/public/GoogleAppsScript.js`
5. Paste it into your Apps Script editor
6. **Important**: Update line 10 with your Spreadsheet ID:
   ```javascript
   const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID";
   ```
   Replace `YOUR_SPREADSHEET_ID` with the ID from your Google Sheet URL:
   ```
   https://docs.google.com/spreadsheets/d/[YOUR_SPREADSHEET_ID]/edit
   ```
7. **Save** the file (Ctrl+S)

## Step 2: Create a New Deployment

1. In the Apps Script editor, click the **Deploy** button (top right)
2. If you see "New deployment" button, click it
3. Select **Type**: click the dropdown and select **Web app**
4. Set the following:
   - **Execute as**: Your Google Account
   - **Who has access**: Select **Anyone** (this is important for CORS)
5. Click the **Deploy** button

## Step 3: Authorize the Script

1. A popup will ask you to authorize the script
2. Click "Review permissions"
3. Sign in with your Google account if needed
4. Click "Allow" to give the script permission to edit your sheet

## Step 4: Get Your New Deployment URL

1. After deployment, you'll see a message: **"Deployment successful"**
2. Click on the deployment URL shown (it looks like: `https://script.google.com/macros/d/[ID]/usercache`)
3. Copy this URL

## Step 5: Update the React App

1. Update the URL in `/client/pages/Index.tsx` at the top:
   ```typescript
   const GOOGLE_APPS_SCRIPT_URL = "YOUR_NEW_DEPLOYMENT_URL_HERE";
   ```
2. Replace `YOUR_NEW_DEPLOYMENT_URL_HERE` with the URL from Step 4

## Troubleshooting

### Still getting "Failed to fetch" error?
- Make sure you deployed as "Web app", not as a library
- Make sure "Who has access" is set to "Anyone"
- Try clearing your browser cache and reloading

### Sheet name not found?
- Verify the sheet is named exactly "ABSENCES" (case-sensitive)
- Check that your Spreadsheet ID in the Apps Script is correct

### Changes not saving?
- Check the browser console (F12) for detailed error messages
- The app will try to use GET as a fallback if POST fails

### First time setup?
If this is your first time setting up, make sure:
1. Your Google Sheet exists with data
2. The sheet is named "ABSENCES"
3. Headers are in the first row
4. Data rows start from the second row

## Testing Your Setup

1. Try loading the app - the ABSENCES table should appear
2. Try editing a cell and saving
3. Refresh the page to verify the change was saved

If you continue experiencing issues, check:
- Browser console (F12 → Console tab) for error messages
- Google Apps Script execution log (in the editor, click "Run" → "View logs")

---

**Important**: Always use the latest deployment URL. Old deployment URLs may stop working over time.
