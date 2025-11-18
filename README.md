# Google Sheets Editor

A production-ready React web application that enables seamless editing of Google Sheets data through a modern, responsive interface powered by Google Apps Script.

## ✨ Features

- **Real-time Editing**: Click any cell to edit inline with immediate visual feedback
- **Automatic Sync**: Changes are saved directly to Google Sheets
- **Responsive Design**: Fully functional on desktop, tablet, and mobile devices
- **RTL Support**: Automatic right-to-left layout detection for Arabic and Hebrew
- **Error Handling**: Clear error messages and loading states
- **No External Database**: All data stays in your Google Sheets
- **Zero Friction Setup**: Simple configuration form to connect your sheet
- **Production Ready**: Type-safe, tested, and optimized

## 🚀 Quick Start

### Frontend Setup

1. **Install Dependencies** (if not already done):
   ```bash
   pnpm install
   ```

2. **Start Development Server**:
   ```bash
   pnpm dev
   ```
   The app will open at `http://localhost:5173`

### Backend Setup (Google Apps Script)

1. **Create/Open Google Sheet**:
   - Create a new Google Sheet or use an existing one
   - Make sure you have a sheet named **"ABSENCES"**
   - Add your absences data with headers in the first row

2. **Create Apps Script**:
   - Open your Google Sheet
   - Click **Extensions** → **Apps Script**
   - Copy the entire code from `/public/GoogleAppsScript.js`
   - Paste it into the Apps Script editor (replace default code)
   - Update `SPREADSHEET_ID` with your sheet's ID from the URL

3. **Deploy as Web App**:
   - Click **Deploy** → **New deployment**
   - Select type: **Web app**
   - Execute as: Your account
   - Who has access: Anyone
   - Click **Deploy** and authorize
   - Copy the deployment URL

4. **Connect in React App**:
   - Paste the Apps Script deployment URL
   - The sheet name "ABSENCES" is pre-filled
   - Click **Connect & Load Data**

## 📁 Project Structure

```
client/
├── components/
│   ├── ui/                 # Pre-built UI components (Button, Input, etc.)
│   ├── SetupSheet.tsx      # Configuration form component
│   └── DataTable.tsx       # Main table display & editing component
├── hooks/
│   └── useSheetData.ts     # Custom hook for data management
├── pages/
│   ├── Index.tsx           # Main application page
│   └── NotFound.tsx        # 404 page
├── App.tsx                 # App entry point & routing
├── global.css              # Global styles & Tailwind configuration
└── vite-env.d.ts          # Vite environment types

server/
├── index.ts                # Express server configuration
└── routes/                 # API endpoint handlers

shared/
├── api.ts                  # Shared TypeScript interfaces

public/
├── GoogleAppsScript.js      # Google Apps Script backend code
├── SETUP_GUIDE.md           # Detailed setup instructions
└── GOOGLE_APPS_SCRIPT_CODE.md  # Apps Script code with documentation
```

## 🔧 Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool and dev server
- **React Router 6** - Client-side routing
- **TanStack Query** - Data fetching (optional)

### Backend
- **Google Apps Script** - Serverless backend
- **Google Sheets API** - Data storage

## 📖 How to Use

### Viewing Data
1. Connect your Google Sheet using the setup form
2. Data loads automatically with headers and rows displayed

### Editing Cells
1. Click any cell to enter edit mode
2. Type your new value
3. Press **Enter** to save or **Escape** to cancel
4. The change updates in Google Sheets instantly

### Managing Data
- **Refresh**: Click the refresh button to reload all data
- **Back**: Return to setup form to connect a different sheet
- **RTL**: The app automatically detects system language preferences

## 🔐 Security

- **Private URLs**: Keep your Apps Script deployment URL private
- **Revocable Access**: Revoke access anytime from Apps Script settings
- **No Data Storage**: All data remains in your Google Sheets
- **CORS Handled**: Apps Script web apps handle CORS automatically

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🛠️ Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start

# Run type checking
pnpm typecheck

# Run tests
pnpm test

# Format code
pnpm format.fix
```

## 🐛 Troubleshooting

### "Failed to fetch data"
- Verify the Apps Script deployment URL is correct
- Ensure the Apps Script is deployed as a "Web app"
- Check the SPREADSHEET_ID in the Apps Script code

### Cells won't update
- Check browser console (F12 → Console) for errors
- Verify the Apps Script is still deployed and active
- Ensure the sheet has headers in the first row

### Sheet name not found
- Use the exact sheet name (case-sensitive)
- Check the sheet tab at the bottom of your Google Sheet

## 📚 Additional Resources

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)

## 📄 License

This project is open source and available for personal and commercial use.

## 🎯 Future Enhancements

Potential features for future versions:
- Multi-sheet support
- Column sorting and filtering
- Row insertion/deletion
- Bulk editing
- Data validation
- Custom styling per cell
- Undo/Redo functionality
- Collaborative editing indicators

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

---

Built with ❤️ using React and Google Apps Script
