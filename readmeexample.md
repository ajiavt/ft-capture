# Copy Items by Path

<div align="center">
  <img src="assets/logo.svg" alt="Copy Items by Path Logo" width="128" height="128">

**A professional utility for copying files and folders by path**

[![Downloads](https://img.shields.io/github/downloads/ajiavt/copy-items-by-path/total)](https://github.com/ajiavt/copy-items-by-path/releases)
[![License](https://img.shields.io/github/license/ajiavt/copy-items-by-path)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-blue)](https://github.com/ajiavt/copy-items-by-path/releases)
</div>

## 📖 Description

Copy Items by Path is a powerful desktop application built with Electron that allows you to efficiently copy multiple files and folders from a source directory to a target directory by simply listing their names. Perfect for developers, content creators, and anyone who needs to selectively copy specific items from large directories.

## ✨ Features

- 🎯 **Selective Copying**: Copy only the files and folders you need by listing their names
- 📁 **Intuitive Interface**: Simple, clean interface with drag-and-drop support for folder selection
- 🔄 **Real-time Progress**: Live progress tracking and detailed logging
- 🏷️ **Extension Flexibility**: Option to ignore file extensions when searching (enabled by default)
- 🖥️ **Cross-platform**: Available for both Windows and macOS
- ⚡ **Fast & Efficient**: Built with Electron for optimal performance

## 🚀 Quick Start

### Download

**[📥 Download Latest Release](https://github.com/ajiavt/copy-items-by-path/releases/latest)**

Choose your platform and download directly:

| Platform | Download Link | File Size | Description |
|----------|---------------|-----------|-------------|
| **Windows** | [📦 Download for Windows](https://github.com/ajiavt/copy-items-by-path/releases/download/v1.0.0/Copy.Items.by.Path.Setup.1.0.0.exe) | ~88 MB | `.exe` installer with automatic setup |
| **macOS** | [🍎 Download for macOS](https://github.com/ajiavt/copy-items-by-path/releases/download/v1.0.0/Copy.Items.by.Path-1.0.0-arm64.dmg) | ~108 MB | `.dmg` installer (recommended) |
| **macOS (Portable)** | [📁 Download Portable](https://github.com/ajiavt/copy-items-by-path/releases/download/v1.0.0/Copy.Items.by.Path-1.0.0-arm64-mac.zip) | ~104 MB | `.zip` archive, no installation required |

> 💡 **Quick Start**: Download, install, and start copying files selectively in minutes!

### Installation

#### Windows
1. Download the `.exe` file
2. Run the installer
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

#### macOS
1. Download the `.dmg` file
2. Open the DMG file
3. Drag the app to Applications folder
4. Launch from Applications or Launchpad

## 📋 How to Use

1. **Set Source Path**: Click "Browse..." to select the folder containing your files
2. **Set Target Path**: Click "Browse..." to select where you want to copy files
3. **List Items**: Enter the names of files/folders you want to copy (one per line)
4. **Configure Options**:
    - ✅ "Ignore file extensions" (recommended, enabled by default)
5. **Start Copy**: Click the green "Start Copy" button
6. **Monitor Progress**: Watch the real-time log for copy status

### Example Usage

```
Source Path: /Users/john/Documents/Projects
Target Path: /Users/john/Desktop/Backup

Items to Copy:
config.json
assets
README
package.json
src
```

The app will find and copy:
- `config.json` → exact match
- `assets/` → folder
- `README.md` → matches "README" (extension ignored)
- `package.json` → exact match
- `src/` → folder

## 🛠️ Development

### Prerequisites
- Node.js 16+
- npm or yarn

### Setup
```bash
git clone https://github.com/ajiavt/copy-items-by-path.git
cd copy-items-by-path
npm install
```

### Scripts
```bash
# Development
npm start          # Run in development mode
npm run dev        # Run with dev tools open

# Building
npm run build      # Build for current platform
npm run build:win  # Build for Windows
npm run build:mac  # Build for macOS
npm run build:all  # Build for all platforms
```

## 🏗️ Built With

- **[Electron](https://electronjs.org/)** - Desktop app framework
- **[Tailwind CSS](https://tailwindcss.com/)** - UI styling
- **[Node.js](https://nodejs.org/)** - JavaScript runtime
- **[Electron Builder](https://electron.build/)** - Application packaging

## 📸 Screenshots

<div align="center">
  <img src="assets/app-img.png" alt="Copy Items by Path - Main Interface" width="800">
  <p><em>Clean, intuitive interface for efficient file management</em></p>
</div>

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

If you encounter any bugs or have feature requests, please [create an issue](https://github.com/ajiavt/copy-items-by-path/issues) on GitHub.

## 💬 Support

- 📧 Email: ajiavt@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/ajiavt/copy-items-by-path/issues)
- 💡 Discussions: [GitHub Discussions](https://github.com/ajiavt/copy-items-by-path/discussions)

## 🙏 Acknowledgments

- Built with ❤️ using Electron
- Icons from [Heroicons](https://heroicons.com/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/ajiavt">ajiavt</a></p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>
