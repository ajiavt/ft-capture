<div align="center">
  <img src="assets/icon.png" alt="FT Capture Logo" width="120" height="120">
  <h1>🖥️ FT Capture</h1>
  <p><strong>Professional Screenshot Tool with Customizable Hotkeys and Areas</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-blue?style=flat-square" alt="Platform">
    <img src="https://img.shields.io/badge/Electron-27.0.0-47848f?style=flat-square&logo=electron" alt="Electron">
    <img src="https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js" alt="Node.js">
    <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License">
  </p>
</div>

---

## 💡 Ide Kenapa Saya Membuat Ini

Awalnya saya merasa kesulitan harus mendokumentasikan sesuatu, saat membuat Functional Test (kebutuhan kantor saya), saya harus menscreenshot banyak hal dengan berbeda area seleksi, tapi alat screenshot yang saya gunakan tidak menyediakan itu. Saya kepikiran untuk membuat sebuah makro yang jika ditekan maka akan menscreenshot area seleksi tertentu. Dan terciptalah aplikasi ini.

## ⭐ Features

- 🎯 **Custom Screenshot Areas** - Define specific screen regions and capture them instantly
- ⌨️ **Global Hotkeys** - Assign custom keyboard shortcuts for each capture area
- 📋 **Instant Clipboard** - Screenshots are automatically copied to clipboard for quick pasting
- 💾 **Auto-Save Option** - Optionally save captured screenshots to your chosen directory
- 🎨 **Color-Coded Macros** - Visual themes for easy macro identification
- 🖱️ **Visual Area Selection** - Intuitive drag-and-drop area selection interface
- 🔔 **Smart Notifications** - Beautiful toast notifications with visual feedback
- 🖥️ **Multi-Display Support** - Works seamlessly across multiple monitors
- 📊 **Statistics Dashboard** - Track your macro usage and efficiency

## 🖼️ Screenshots

<div align="center">
  <img src="https://via.placeholder.com/800x500/00b894/ffffff?text=Settings+Interface" alt="Settings Interface" width="700">
  <p><em>Intuitive settings interface for managing screenshot macros</em></p>
</div>

<div align="center">
  <img src="https://via.placeholder.com/600x300/00cec9/ffffff?text=Area+Selection" alt="Area Selection" width="500">
  <p><em>Visual area selection with real-time preview</em></p>
</div>

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed on your system
- Git for cloning the repository

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ajiavt/ft-capture.git
   cd ft-capture
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   npm start
   ```

### Building for Production

**For macOS:**
```bash
npm run build:mac
```

**For Windows:**
```bash
npm run build:win
```

**For all platforms:**
```bash
npm run build
```

## 📖 How to Use

### 1. Create a New Macro
- Click "Add New Macro" in the settings window
- Enter a descriptive name (e.g., "Top Navigation Bar")
- Set a unique hotkey combination (e.g., `Cmd+1`, `Ctrl+Shift+A`)
- Choose a color theme for visual identification

### 2. Define Screenshot Area
- Click "Set Area" for your new macro
- The screen will dim with selection overlays
- Click and drag to select the desired capture area
- Release to confirm the selection

### 3. Start Capturing
- Press your assigned hotkey anywhere on your system
- The defined area will be captured instantly
- Screenshot is automatically copied to clipboard
- Use `Ctrl+V` (or `Cmd+V`) to paste in any application

### 4. Manage Your Macros
- **Edit**: Modify name, hotkey, or color
- **Change Area**: Redefine the capture region
- **Test**: Preview capture without using hotkey
- **Delete**: Remove unwanted macros

## ⌨️ Default Hotkeys

| Action | Hotkey | Description |
|--------|---------|-------------|
| Open Settings | `Right-click tray icon` | Access main configuration |
| Quick Capture | `Custom hotkeys` | Capture assigned areas |
| Cancel Selection | `Esc` | Exit area selection mode |

## 🛠️ Configuration

### Settings Options

- **Save Path**: Choose where screenshots are saved (default: Desktop)
- **Auto-save**: Toggle automatic file saving (disabled by default)
- **Color Themes**: Customize macro identification colors

### File Locations

- **Settings**: Stored in system-specific config directory
- **Screenshots**: Saved to configured path or Desktop
- **Logs**: Available in developer console for debugging

## 🏗️ Architecture

FT Capture is built with a modular Object-Oriented Programming (OOP) architecture:

- **TrayManager**: System tray integration and menu handling
- **WindowManager**: Application window lifecycle management
- **CaptureManager**: Screenshot capture and processing logic
- **MacroManager**: Macro CRUD operations and hotkey registration
- **IPCManager**: Inter-process communication handling
- **AreaSelector**: Visual area selection interface

## 🔧 Development

### Project Structure

```
ft-capture/
├── src/
│   ├── main.js              # Application entry point
│   ├── settings.html        # Settings interface
│   ├── overlay.html         # Area selection overlay
│   ├── classes/             # Modular OOP classes
│   ├── css/                 # Stylesheets
│   └── js/                  # Frontend JavaScript
├── assets/                  # Static assets and icons
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

### Available Scripts

- `npm start` - Run the application in development mode
- `npm run dev` - Run with development flags
- `npm run build` - Build for all platforms
- `npm run build:mac` - Build for macOS
- `npm run build:win` - Build for Windows

### Contributing Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📋 Requirements

### System Requirements

- **Operating System**: macOS 10.14+, Windows 10+, or Linux (Ubuntu 18.04+)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 200MB free space
- **Display**: Any resolution supported

### Dependencies

- **Electron**: Cross-platform desktop app framework
- **electron-store**: Persistent data storage
- **Font Awesome**: Icon library for UI elements

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports & Feature Requests

If you encounter any bugs or have feature requests, please [create an issue](https://github.com/ajiavt/ft-capture/issues) on GitHub.

## 💬 Support

- 📧 Email: ajiavt@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/ajiavt/ft-capture/issues)
- 💡 Discussions: [GitHub Discussions](https://github.com/ajiavt/ft-capture/discussions)

## 🙏 Acknowledgments

- Built with ❤️ using Electron
- Icons from [Font Awesome](https://fontawesome.com/)
- UI design inspired by modern macOS applications
- Special thanks to the Electron community

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/ajiavt">ajiavt</a></p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>
