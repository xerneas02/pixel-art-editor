// Wplace color palette from the provided file
const WPLACE_COLORS = [
    '#000000', '#3c3c3c', '#787878', '#d2d2d2', '#ffffff',
    '#600018', '#ed1c24', '#ff7f27', '#f6aa09', '#f9dd3b',
    '#fffabc', '#0eb968', '#13e67b', '#87ff5e', '#0c816e',
    '#10aea6', '#13e1be', '#28509e', '#4093e4', '#60f7f2',
    '#6b50f6', '#99b1fb', '#780c99', '#aa38b9', '#e09ff9',
    '#cb007a', '#ec1f80', '#f38da9', '#684634', '#95682a',
    '#f8b277'
];

class PixelArtEditor {
    constructor() {
        this.canvas = document.getElementById('pixelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 32;
        this.pixelSize = 16;
        this.currentColor = '#000000';
        this.isDrawing = false;
        this.pixels = {};
        this.users = new Set();
        
        // Firebase configuration - Votre vraie config Firebase
        this.firebaseConfig = {
            apiKey: "AIzaSyCKHEqVEeBdkoKyeDD6mLQljyUXMFHO5IU",
            authDomain: "pixel-art-editor-72674.firebaseapp.com",
            databaseURL: "https://pixel-art-editor-72674-default-rtdb.europe-west1.firebasedatabase.app",
            projectId: "pixel-art-editor-72674",
            storageBucket: "pixel-art-editor-72674.firebasestorage.app",
            messagingSenderId: "944332376141",
            appId: "1:944332376141:web:2cce7dc8200edf7acff404"
        };
        
        this.firebase = null;
        this.database = null;
        this.pixelsRef = null;
        this.usersRef = null;
        this.userRef = null;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.createColorPalette();
        this.setupEventListeners();
        this.loadFromLocalStorage();
        this.render();
        this.initFirebase();
    }
    
    setupCanvas() {
        this.canvas.width = this.gridSize * this.pixelSize;
        this.canvas.height = this.gridSize * this.pixelSize;
        this.ctx.imageSmoothingEnabled = false;
    }
    
    createColorPalette() {
        const palette = document.getElementById('colorPalette');
        palette.innerHTML = '';
        
        WPLACE_COLORS.forEach((color, index) => {
            const colorBtn = document.createElement('div');
            colorBtn.className = 'color-btn';
            colorBtn.style.backgroundColor = color;
            colorBtn.setAttribute('data-color', color);
            
            if (index === 0) {
                colorBtn.classList.add('active');
            }
            
            colorBtn.addEventListener('click', () => {
                this.selectColor(color, colorBtn);
            });
            
            palette.appendChild(colorBtn);
        });
    }
    
    selectColor(color, element) {
        // Remove active class from all color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to selected button
        element.classList.add('active');
        
        this.currentColor = color;
        document.getElementById('currentColorDisplay').style.backgroundColor = color;
        document.getElementById('currentColorHex').textContent = color;
    }
    
    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        // Tool buttons
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCanvas());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveImage());
        document.getElementById('loadBtn').addEventListener('click', () => this.loadImage());
        document.getElementById('resizeBtn').addEventListener('click', () => this.resizeGrid());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveToLocalStorage();
                        this.showNotification('Canvas saved!');
                        break;
                    case 'z':
                        e.preventDefault();
                        // Could implement undo functionality
                        break;
                }
            }
        });
    }
    
    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: Math.floor((e.clientX - rect.left) * scaleX / this.pixelSize),
            y: Math.floor((e.clientY - rect.top) * scaleY / this.pixelSize)
        };
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        this.draw(e);
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const coords = this.getCanvasCoordinates(e);
        const key = `${coords.x},${coords.y}`;
        
        if (coords.x >= 0 && coords.x < this.gridSize && coords.y >= 0 && coords.y < this.gridSize) {
            this.pixels[key] = this.currentColor;
            this.renderPixel(coords.x, coords.y, this.currentColor);
            
            // Envoyer à Firebase si connecté
            if (this.pixelsRef) {
                this.pixelsRef.child(key).set(this.currentColor);
            }
            
            // Sauvegarde locale en backup
            this.saveToLocalStorage();
        }
    }
    
    stopDrawing() {
        this.isDrawing = false;
    }
    
    renderPixel(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize);
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw pixels
        Object.entries(this.pixels).forEach(([key, color]) => {
            const [x, y] = key.split(',').map(Number);
            this.renderPixel(x, y, color);
        });
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= this.gridSize; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.pixelSize, 0);
            this.ctx.lineTo(x * this.pixelSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.gridSize; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.pixelSize);
            this.ctx.lineTo(this.canvas.width, y * this.pixelSize);
            this.ctx.stroke();
        }
    }
    
    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            this.pixels = {};
            
            // Effacer sur Firebase
            if (this.pixelsRef) {
                this.pixelsRef.set({});
            }
            
            this.render();
            this.saveToLocalStorage();
            this.showNotification('Canvas cleared!');
        }
    }
    
    saveImage() {
        // Create a temporary canvas without grid for export
        const exportCanvas = document.createElement('canvas');
        const exportCtx = exportCanvas.getContext('2d');
        exportCanvas.width = this.gridSize;
        exportCanvas.height = this.gridSize;
        
        // Draw pixels without grid
        Object.entries(this.pixels).forEach(([key, color]) => {
            const [x, y] = key.split(',').map(Number);
            exportCtx.fillStyle = color;
            exportCtx.fillRect(x, y, 1, 1);
        });
        
        // Download the image
        const link = document.createElement('a');
        link.download = `pixel-art-${Date.now()}.png`;
        link.href = exportCanvas.toDataURL();
        link.click();
        
        this.showNotification('Image saved!');
    }
    
    loadImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        this.loadImageToCanvas(img);
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    }
    
    loadImageToCanvas(img) {
        // Create temporary canvas to process the image
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Scale image to grid size
        tempCanvas.width = this.gridSize;
        tempCanvas.height = this.gridSize;
        tempCtx.drawImage(img, 0, 0, this.gridSize, this.gridSize);
        
        const imageData = tempCtx.getImageData(0, 0, this.gridSize, this.gridSize);
        this.pixels = {};
        
        // Convert each pixel to nearest palette color
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const index = (y * this.gridSize + x) * 4;
                const r = imageData.data[index];
                const g = imageData.data[index + 1];
                const b = imageData.data[index + 2];
                const a = imageData.data[index + 3];
                
                if (a > 128) { // Only process non-transparent pixels
                    const nearestColor = this.findNearestColor(r, g, b);
                    this.pixels[`${x},${y}`] = nearestColor;
                }
            }
        }
        
        this.render();
        this.saveToLocalStorage();
        this.showNotification('Image loaded and converted to palette!');
    }
    
    findNearestColor(r, g, b) {
        let nearestColor = WPLACE_COLORS[0];
        let minDistance = Infinity;
        
        WPLACE_COLORS.forEach(color => {
            const colorR = parseInt(color.slice(1, 3), 16);
            const colorG = parseInt(color.slice(3, 5), 16);
            const colorB = parseInt(color.slice(5, 7), 16);
            
            const distance = Math.sqrt(
                Math.pow(r - colorR, 2) +
                Math.pow(g - colorG, 2) +
                Math.pow(b - colorB, 2)
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestColor = color;
            }
        });
        
        return nearestColor;
    }
    
    resizeGrid() {
        const newSize = parseInt(document.getElementById('gridSize').value);
        this.gridSize = newSize;
        this.pixelSize = Math.min(512 / newSize, 16);
        this.setupCanvas();
        
        // Synchroniser avec Firebase
        if (this.database) {
            this.database.ref('gridSize').set(newSize);
        }
        
        this.render();
        this.showNotification(`Grid resized to ${newSize}x${newSize}!`);
    }
    
    saveToLocalStorage() {
        const data = {
            pixels: this.pixels,
            gridSize: this.gridSize,
            timestamp: Date.now()
        };
        localStorage.setItem('pixelArtData', JSON.stringify(data));
    }
    
    loadFromLocalStorage() {
        const saved = localStorage.getItem('pixelArtData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.pixels = data.pixels || {};
                if (data.gridSize) {
                    this.gridSize = data.gridSize;
                    document.getElementById('gridSize').value = this.gridSize;
                    this.setupCanvas();
                }
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
    }
    
    // Initialisation Firebase
    initFirebase() {
        try {
            // Initialiser Firebase
            firebase.initializeApp(this.firebaseConfig);
            this.database = firebase.database();
            
            // Références Firebase
            this.pixelsRef = this.database.ref('pixels');
            this.usersRef = this.database.ref('users');
            this.gridSizeRef = this.database.ref('gridSize');
            
            // Écouter les changements de pixels
            this.pixelsRef.on('child_added', (snapshot) => {
                const key = snapshot.key;
                const color = snapshot.val();
                if (this.pixels[key] !== color) {
                    this.pixels[key] = color;
                    const [x, y] = key.split(',').map(Number);
                    this.renderPixel(x, y, color);
                }
            });
            
            this.pixelsRef.on('child_changed', (snapshot) => {
                const key = snapshot.key;
                const color = snapshot.val();
                this.pixels[key] = color;
                const [x, y] = key.split(',').map(Number);
                this.renderPixel(x, y, color);
            });
            
            this.pixelsRef.on('child_removed', (snapshot) => {
                const key = snapshot.key;
                delete this.pixels[key];
                const [x, y] = key.split(',').map(Number);
                this.ctx.clearRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize);
                this.render(); // Re-render pour afficher la grille
            });
            
            // Écouter les changements de taille de grille
            this.gridSizeRef.on('value', (snapshot) => {
                const newSize = snapshot.val();
                if (newSize && newSize !== this.gridSize) {
                    this.gridSize = newSize;
                    document.getElementById('gridSize').value = newSize;
                    this.pixelSize = Math.min(512 / newSize, 16);
                    this.setupCanvas();
                    this.render();
                    this.showNotification(`Grid synchronized to ${newSize}x${newSize}!`);
                }
            });
            
            // Charger les données existantes
            this.pixelsRef.once('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    this.pixels = data;
                    this.render();
                }
            });
            
            // Gérer la présence utilisateur
            this.setupUserPresence();
            
            this.showNotification('Connected to Firebase! 🔥', false);
            
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.showNotification('Failed to connect to Firebase. Using local mode.', true);
            this.simulateUsers(); // Fallback to simulated users
        }
    }
    
    setupUserPresence() {
        // Créer une référence unique pour cet utilisateur
        this.userRef = this.usersRef.push();
        
        // Marquer l'utilisateur comme connecté
        this.userRef.set({
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Supprimer l'utilisateur à la déconnexion
        this.userRef.onDisconnect().remove();
        
        // Écouter les changements d'utilisateurs
        this.usersRef.on('value', (snapshot) => {
            const users = snapshot.val();
            const userCount = users ? Object.keys(users).length : 0;
            document.getElementById('userCount').textContent = userCount;
        });
        
        // Heartbeat pour maintenir la connexion
        setInterval(() => {
            if (this.userRef) {
                this.userRef.update({
                    lastSeen: firebase.database.ServerValue.TIMESTAMP
                });
            }
        }, 30000); // Toutes les 30 secondes
    }
    
    showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'error' : ''}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Fonction de fallback si Firebase ne fonctionne pas
    simulateUsers() {
        let userCount = 1;
        setInterval(() => {
            userCount = Math.floor(Math.random() * 8) + 1;
            document.getElementById('userCount').textContent = userCount;
        }, 10000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PixelArtEditor();
});
