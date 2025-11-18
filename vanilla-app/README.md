# ABSENCES Management - Vanilla HTML/CSS/JS Version

This is a pure HTML, CSS, and JavaScript version of the ABSENCES management application. No frameworks, no build tools, no dependencies needed.

## Features

✅ **Data Management**
- Display data from Google Apps Script
- Inline cell editing for editable columns
- Bulk edit operations on selected rows

✅ **Filtering**
- Search by employee name (real-time)
- Filter by date (multi-select)
- Filter by equipe (single-select)
- Filter by motif d'absence (single-select)
- Clear all filters at once

✅ **Row Selection & Bulk Operations**
- Select/deselect individual rows
- Select all visible rows with one click
- Clear all selections
- Bulk edit for selected rows

✅ **Notifications & Alerts**
- Toast notifications for success/error/info messages
- Telegram notification support (via backend)
- Modal dialogs for confirmation

✅ **Internationalization**
- English & French language support
- Auto-detect system language
- Toggle between EN/FR
- Language preference saved to browser

✅ **Statistics**
- View statistics by motif d'absence
- View statistics by equipe
- Display count for each category

✅ **Responsive Design**
- Works on desktop, tablet, mobile
- Optimized layout for all screen sizes
- Touch-friendly buttons and inputs

## How to Use

### 1. Setup

1. Open `vanilla-app/index.html` in your web browser
2. Or copy the entire `vanilla-app` folder to your web server
3. Update the `CONFIG.GOOGLE_APPS_SCRIPT_URL` in `app.js` with your actual Google Apps Script URL

### 2. Configure Google Apps Script URL

Edit `vanilla-app/app.js` line 3:

```javascript
const CONFIG = {
    GOOGLE_APPS_SCRIPT_URL: 'YOUR_SCRIPT_URL_HERE',
    SHEET_NAME: 'ABSENCES',
    // ... other config
};
```

### 3. Main Features

#### Filtering Data
- **Name Search**: Type employee name in the "Name" field (real-time filtering)
- **Date Filter**: Click "Date" button to select multiple dates
- **Equipe Filter**: Click "Equipe" button to select one equipe
- **Motif Filter**: Click "Motif d'absence" button to select one motif
- **Clear Filters**: Click "Clear Filters" button to reset all filters

#### Editing Cells
- Click any non-readonly cell to edit
- Type new value and press Enter to save
- Press Escape to cancel
- Readonly columns: Finca, Date, Code, Nom et Prénom, Equipe

#### Bulk Operations
- Check boxes to select rows
- Click "Select All" to select all visible rows
- Click "Clear" to deselect all rows
- Click a column header to start bulk edit for that column
- Enter value and click "Confirm" to update all selected rows

#### Notifications
- Click "Mark Complete" button
- Select a completion date
- Click "Send to Telegram" to send notification
- (Requires backend API configured)

#### Statistics
- Click "Statistics" button
- View breakdown by motif and equipe
- Shows count for each category

#### Language
- Click language button (EN/FR) to toggle
- System language auto-detected on first load
- Preference saved in browser storage

#### Refresh
- Click "Refresh" button to reload data from Google Apps Script

## File Structure

```
vanilla-app/
├── index.html          # Main HTML structure
├── styles.css          # All CSS styling
├── app.js              # All JavaScript logic
└── README.md           # This file
```

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## API Endpoints

The app communicates with Google Apps Script using these actions:

### getData
Fetches all data from the sheet

```
GET https://your-script-url/exec?action=getData
```

Response:
```json
{
  "success": true,
  "data": {
    "headers": ["Finca", "Date", "Code", ...],
    "rows": [["F20", "18/12/2025", "12145", ...], ...]
  }
}
```

### updateCell
Updates a single cell value

```
GET https://your-script-url/exec?action=updateCell&row=0&col=1&value=newValue
```

Response:
```json
{
  "success": true,
  "message": "Cell updated"
}
```

## Customization

### Colors
Edit CSS color variables at the top of `styles.css`:

```css
:root {
    --color-primary: #3b82f6;
    --color-success: #16a34a;
    --color-danger: #dc2626;
    /* ... more colors ... */
}
```

### Column Configuration
Edit `CONFIG` object in `app.js`:

```javascript
const CONFIG = {
    READ_ONLY_COLS: ['finca', 'date', 'code', 'nom et prénom', 'equipe'],
    HIDDEN_COLS: [8, 9]  // Column indices to hide
};
```

### Translations
Add or modify translations in the `TRANSLATIONS` object in `app.js`:

```javascript
const TRANSLATIONS = {
    en: { /* English translations */ },
    fr: { /* French translations */ }
};
```

## Troubleshooting

### Data not loading
1. Check browser console (F12) for error messages
2. Verify Google Apps Script URL is correct
3. Check that Google Apps Script is deployed as "Anyone"
4. Verify network connectivity

### Cells not editing
- Check if column is in READ_ONLY_COLS list
- Verify you have permission to edit
- Check browser console for errors

### Notifications not sending
- Verify backend API is running
- Check if Telegram configuration is correct
- Verify API endpoint is accessible

### Language not changing
- Clear browser cache/localStorage
- Try incognito/private window
- Check browser console for errors

## Performance Tips

- The table supports up to 5000+ rows comfortably
- Filtering is done client-side (instant)
- Editing is done via Google Apps Script (network dependent)
- Statistics are calculated on-demand

## Limitations

- Read-only columns cannot be edited (set in CONFIG)
- Columns 8 & 9 are hidden by default (for timestamps)
- Single equipe/motif filter (multi-select available for dates)
- No offline support (requires network connection)

## Support

For issues or feature requests, check:
1. Browser console (F12) for error details
2. Network tab to verify API calls
3. Google Apps Script logs

## License

Same as parent project
