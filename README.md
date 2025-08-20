# FT Capture

A powerful cross-platform screenshot application with customizable hotkeys and area selection, built with Electron.

## Features

🎯 **Visual Area Selection** - Intuitive drag & drop interface to define screenshot areas  
⌨️ **Custom Hotkeys** - Unlimited hotkey combinations for instant capture  
📋 **Clipboard Integration** - Screenshots automatically copied to clipboard  
🖥️ **Multi-Monitor Support** - Works seamlessly across multiple displays  
⚙️ **Persistent Settings** - Your areas and hotkeys are saved between sessions  
🔄 **Background Operation** - Runs in system tray, always ready to capture  

## Quick Start

1. **Launch the app** - Look for the 📷 icon in your system tray
2. **Create your first area**: Press `Cmd+Shift+A` (Mac) or `Ctrl+Shift+A` (Windows)
3. **Drag to select** the area you want to capture
4. **Name your area** when prompted
5. **Assign a hotkey** via Settings (e.g., `Cmd+1`, `Ctrl+2`)
6. **Capture instantly** using your custom hotkey
7. **Paste anywhere** with `Cmd+V` / `Ctrl+V`

## Hotkeys

- `Cmd+Shift+A` / `Ctrl+Shift+A` - Start area selection
- Custom hotkeys for each area (configurable)

## Installation

### From Source
```bash
git clone <repository-url>
cd ft-capture
npm install
npm start
```

### Building Distributables
```bash
# Build for current platform
npm run build

# Build for macOS
npm run build:mac

# Build for Windows
npm run build:win
```

## Usage Examples

### Common Workflows

**Document Screenshots**: Define areas for specific document sections and quickly capture them for presentations.

**Web Development**: Capture UI components, error messages, or specific webpage sections.

**Content Creation**: Screenshot specific areas for tutorials, documentation, or social media.

### Hotkey Examples
- `Cmd+1` - Top-left corner area
- `Cmd+2` - Main content area  
- `Cmd+3` - Sidebar section
- `Ctrl+Shift+1` - Custom area 1
- `Alt+S` - Status bar area

## Settings

Access settings by:
- Right-clicking the tray icon → Settings
- Or launch the app if no tray icon is visible

### Configuration Options
- **Screenshot Areas**: Add, edit, or remove capture areas
- **Hotkey Assignment**: Set custom keyboard shortcuts
- **Save Location**: Choose where to save screenshot files (optional)
- **Auto-save**: Toggle automatic file saving in addition to clipboard

## System Requirements

- **macOS**: 10.15 (Catalina) or later
- **Windows**: Windows 10 or later
- **Memory**: 100MB RAM minimum
- **Storage**: 50MB disk space

## Permissions

### macOS
The app may request:
- **Screen Recording** permission for screenshot capture
- **Accessibility** permission for global hotkeys

### Windows
- **Screen capture** access
- **Global hotkey** registration

## Architecture

Built with:
- **Electron** - Cross-platform desktop framework
- **Node.js** - Backend runtime
- **electron-store** - Settings persistence
- **Native APIs** - Screen capture and global shortcuts

## File Structure

```
ft-capture/
├── src/
│   ├── main.js          # Main Electron process
│   ├── settings.html    # Settings UI
│   └── overlay.html     # Area selection overlay
├── assets/              # Icons and resources
├── package.json         # Project configuration
└── README.md           # This file
```

## Troubleshooting

### Screenshots not working
- Check system permissions for screen recording
- Restart the application
- Verify hotkeys aren't conflicting with other apps

### Hotkeys not registering
- Ensure hotkey format is correct (e.g., `CommandOrControl+1`)
- Check for conflicts with system or other app shortcuts
- Try alternative key combinations

### App not appearing in tray
- Check if system tray is enabled
- Look for the app in hidden tray icons
- Restart the application

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on target platforms
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issue tracker.

---

**Made with ❤️ for efficient screenshot workflows**
