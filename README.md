# 🎨 Collaborative Pixel Art Editor

A real-time collaborative pixel art editor using the Wplace color palette. Multiple users can edit the same canvas simultaneously!

## ✨ Features

- **31 Wplace Colors**: Complete free color palette from Wplace
- **Real-time Collaboration**: Multiple users can edit simultaneously
- **Multiple Grid Sizes**: 16x16, 32x32, 64x64, 128x128
- **Image Import/Export**: Load images and convert to pixel art
- **Auto-save**: Automatic saving to local storage
- **Mobile Friendly**: Touch support for mobile devices
- **Keyboard Shortcuts**: Ctrl+S to save

## 🚀 Quick Start

1. **Local Development**: Simply open `index.html` in your browser
2. **GitHub Pages**: Push to GitHub and enable Pages in repository settings

## 🔧 Setup for Real-time Collaboration

To enable real-time collaboration, you'll need to set up Firebase:

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Realtime Database

2. **Configure Firebase**:
   - Copy your Firebase config
   - Replace the config in `script.js` (line 41)
   - Uncomment the Firebase initialization code at the bottom

3. **Deploy**:
   - Push to GitHub
   - Enable GitHub Pages in repository settings
   - Your collaborative pixel art editor is live!

## 🎮 How to Use

1. **Select a Color**: Click on any color from the palette
2. **Draw**: Click and drag on the canvas to draw pixels
3. **Tools**:
   - 🗑️ Clear Canvas: Remove all pixels
   - 💾 Save Image: Download as PNG
   - 📂 Load Image: Import and convert to pixel art
   - Resize: Change grid size

## 🌈 Color Palette

The editor uses the complete Wplace free color palette with 31 colors:
- Grayscale: 5 colors (black to white)
- Reds: 3 colors
- Oranges/Yellows: 4 colors  
- Greens: 4 colors
- Blues: 6 colors
- Purples: 3 colors
- Pinks: 3 colors
- Browns: 3 colors

## 📱 Mobile Support

- Touch to draw on mobile devices
- Responsive design for all screen sizes
- Optimized color palette for touch interaction

## 🔥 Firebase Configuration

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## 📁 File Structure

```
multiPixel/
├── index.html          # Main HTML file
├── style.css           # Styling and responsive design
├── script.js           # JavaScript logic and Firebase integration
├── README.md           # This file
└── wplace-palette-free-colours.txt  # Original color palette
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🎯 Roadmap

- [ ] User authentication
- [ ] Room-based editing
- [ ] Undo/Redo functionality
- [ ] Layer support
- [ ] Animation tools
- [ ] Custom brush sizes
- [ ] Color mixing tools

---

**Made with ❤️ for the pixel art community**
