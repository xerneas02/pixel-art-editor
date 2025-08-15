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
        this.isErasing = false;
        this.isBucketMode = false;
        this.pixels = {};
        this.users = new Set();
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        
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
        
        // Initialiser l'historique avec l'état initial
        this.saveToHistory();
        
        this.render();
        this.initFirebase();
        this.updateUndoRedoButtons();
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
        // Désactiver les autres modes si on sélectionne une couleur
        this.isErasing = false;
        this.isBucketMode = false;
        this.updateToolButtons();
        this.canvas.classList.remove('eraser-mode', 'bucket-mode');
        
        // Remove active class from all color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to selected button
        element.classList.add('active');
        
        this.currentColor = color;
        document.getElementById('currentColorDisplay').style.backgroundColor = color;
        document.getElementById('currentColorHex').textContent = color;
        document.getElementById('currentTool').textContent = 'Paint';
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
        document.getElementById('bucketBtn').addEventListener('click', () => this.toggleBucket());
        document.getElementById('eraserBtn').addEventListener('click', () => this.toggleEraser());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCanvas());
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
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
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                }
            }
            
            // Raccourcis sans Ctrl
            switch(e.key) {
                case 'b':
                case 'B':
                    this.toggleBucket();
                    break;
                case 'e':
                case 'E':
                    this.toggleEraser();
                    break;
                case 'Escape':
                    this.isErasing = false;
                    this.isBucketMode = false;
                    this.updateToolButtons();
                    this.canvas.classList.remove('eraser-mode', 'bucket-mode');
                    document.getElementById('currentTool').textContent = 'Paint';
                    break;
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
        if (this.isBucketMode) {
            // Mode bucket fill - action immédiate, pas de dessin continu
            this.bucketFill(e);
        } else {
            this.isDrawing = true;
            this.drawingStarted = false; // Pour l'historique
            this.draw(e);
        }
    }
    
    draw(e) {
        if (!this.isDrawing || this.isBucketMode) return;
        
        const coords = this.getCanvasCoordinates(e);
        const key = `${coords.x},${coords.y}`;
        
        if (coords.x >= 0 && coords.x < this.gridSize && coords.y >= 0 && coords.y < this.gridSize) {
            // Sauvegarder l'état avant modification pour l'historique
            if (!this.drawingStarted) {
                this.saveToHistory();
                this.drawingStarted = true;
            }
            
            if (this.isErasing) {
                // Mode effaceur
                if (this.pixels[key]) {
                    delete this.pixels[key];
                    this.ctx.clearRect(coords.x * this.pixelSize, coords.y * this.pixelSize, this.pixelSize, this.pixelSize);
                    this.drawGridAtPosition(coords.x, coords.y);
                    
                    // Envoyer à Firebase (suppression)
                    if (this.pixelsRef) {
                        this.pixelsRef.child(key).remove();
                        console.log(`Erasing pixel: ${key}`);
                    }
                }
            } else {
                // Mode dessin normal
                this.pixels[key] = this.currentColor;
                this.renderPixel(coords.x, coords.y, this.currentColor);
                
                // Envoyer à Firebase
                if (this.pixelsRef) {
                    this.pixelsRef.child(key).set(this.currentColor);
                    console.log(`Drawing pixel: ${key} = ${this.currentColor}`);
                }
            }
            
            // Sauvegarde locale en backup
            this.saveToLocalStorage();
        }
    }
    
    stopDrawing() {
        this.isDrawing = false;
        this.drawingStarted = false;
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
    
    drawGridAtPosition(x, y) {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        
        // Redessiner les lignes de grille autour de cette position
        this.ctx.beginPath();
        // Ligne verticale gauche
        this.ctx.moveTo(x * this.pixelSize, y * this.pixelSize);
        this.ctx.lineTo(x * this.pixelSize, (y + 1) * this.pixelSize);
        // Ligne verticale droite
        this.ctx.moveTo((x + 1) * this.pixelSize, y * this.pixelSize);
        this.ctx.lineTo((x + 1) * this.pixelSize, (y + 1) * this.pixelSize);
        // Ligne horizontale haut
        this.ctx.moveTo(x * this.pixelSize, y * this.pixelSize);
        this.ctx.lineTo((x + 1) * this.pixelSize, y * this.pixelSize);
        // Ligne horizontale bas
        this.ctx.moveTo(x * this.pixelSize, (y + 1) * this.pixelSize);
        this.ctx.lineTo((x + 1) * this.pixelSize, (y + 1) * this.pixelSize);
        this.ctx.stroke();
    }
    
    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            this.saveToHistory(); // Sauvegarder avant effacement
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
    
    // Nouvelles fonctions pour l'effaceur et l'historique
    toggleBucket() {
        this.isBucketMode = !this.isBucketMode;
        this.isErasing = false; // Désactiver l'effaceur
        this.updateToolButtons();
        
        if (this.isBucketMode) {
            this.canvas.classList.add('bucket-mode');
            this.canvas.classList.remove('eraser-mode');
            document.getElementById('currentTool').textContent = 'Bucket Fill';
            document.getElementById('currentColorDisplay').style.backgroundColor = this.currentColor;
            document.getElementById('currentColorHex').textContent = this.currentColor;
        } else {
            this.canvas.classList.remove('bucket-mode');
            document.getElementById('currentTool').textContent = 'Paint';
        }
    }
    
    toggleEraser() {
        this.isErasing = !this.isErasing;
        this.isBucketMode = false; // Désactiver le bucket
        this.updateToolButtons();
        
        if (this.isErasing) {
            this.canvas.classList.add('eraser-mode');
            this.canvas.classList.remove('bucket-mode');
            document.getElementById('currentTool').textContent = 'Eraser';
            document.getElementById('currentColorDisplay').style.backgroundColor = '#ff6b6b';
            document.getElementById('currentColorHex').textContent = 'ERASER';
        } else {
            this.canvas.classList.remove('eraser-mode');
            document.getElementById('currentTool').textContent = 'Paint';
            document.getElementById('currentColorDisplay').style.backgroundColor = this.currentColor;
            document.getElementById('currentColorHex').textContent = this.currentColor;
        }
    }
    
    updateToolButtons() {
        const bucketBtn = document.getElementById('bucketBtn');
        const eraserBtn = document.getElementById('eraserBtn');
        
        // Reset all tool buttons
        bucketBtn.classList.remove('active');
        eraserBtn.classList.remove('active');
        
        // Activate current tool
        if (this.isBucketMode) {
            bucketBtn.classList.add('active');
        } else if (this.isErasing) {
            eraserBtn.classList.add('active');
        }
    }
    
    bucketFill(e) {
        const coords = this.getCanvasCoordinates(e);
        
        if (coords.x >= 0 && coords.x < this.gridSize && coords.y >= 0 && coords.y < this.gridSize) {
            const targetKey = `${coords.x},${coords.y}`;
            const targetColor = this.pixels[targetKey] || null; // null pour pixels vides
            
            // Ne pas remplir si c'est déjà la même couleur
            if (targetColor === this.currentColor) {
                return;
            }
            
            // Sauvegarder l'état pour l'historique
            this.saveToHistory();
            
            // Effectuer le bucket fill
            const fillPixels = this.floodFill(coords.x, coords.y, targetColor, this.currentColor);
            
            // Appliquer les changements et synchroniser avec Firebase
            if (fillPixels.length > 0) {
                fillPixels.forEach(({x, y}) => {
                    const key = `${x},${y}`;
                    this.pixels[key] = this.currentColor;
                    this.renderPixel(x, y, this.currentColor);
                    
                    // Envoyer à Firebase
                    if (this.pixelsRef) {
                        this.pixelsRef.child(key).set(this.currentColor);
                    }
                });
                
                console.log(`Bucket fill: ${fillPixels.length} pixels filled with ${this.currentColor}`);
                this.saveToLocalStorage();
                this.showNotification(`Filled ${fillPixels.length} pixels!`);
            }
        }
    }
    
    floodFill(startX, startY, targetColor, fillColor) {
        const filledPixels = [];
        const stack = [{x: startX, y: startY}];
        const visited = new Set();
        
        while (stack.length > 0) {
            const {x, y} = stack.pop();
            const key = `${x},${y}`;
            
            // Vérifier les limites et si déjà visité
            if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize || visited.has(key)) {
                continue;
            }
            
            const currentColor = this.pixels[key] || null;
            
            // Vérifier si c'est la couleur cible
            if (currentColor !== targetColor) {
                continue;
            }
            
            // Marquer comme visité et ajouter à la liste
            visited.add(key);
            filledPixels.push({x, y});
            
            // Ajouter les pixels adjacents (4-connectés)
            stack.push({x: x + 1, y: y});
            stack.push({x: x - 1, y: y});
            stack.push({x: x, y: y + 1});
            stack.push({x: x, y: y - 1});
        }
        
        return filledPixels;
    }
    
    saveToHistory() {
        // Supprimer les états futurs si on est au milieu de l'historique
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        // Ajouter l'état actuel
        this.history.push(JSON.parse(JSON.stringify(this.pixels)));
        
        // Limiter la taille de l'historique
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
        
        this.updateUndoRedoButtons();
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.pixels = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.render();
            this.saveToLocalStorage();
            
            // Synchroniser avec Firebase
            if (this.pixelsRef) {
                this.pixelsRef.set(this.pixels);
            }
            
            this.updateUndoRedoButtons();
            this.showNotification('Undo successful!');
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.pixels = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.render();
            this.saveToLocalStorage();
            
            // Synchroniser avec Firebase
            if (this.pixelsRef) {
                this.pixelsRef.set(this.pixels);
            }
            
            this.updateUndoRedoButtons();
            this.showNotification('Redo successful!');
        }
    }
    
    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        undoBtn.disabled = this.historyIndex <= 0;
        redoBtn.disabled = this.historyIndex >= this.history.length - 1;
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
            
            // Configuration pour améliorer la synchronisation
            this.database.goOnline();
            
            // Références Firebase
            this.pixelsRef = this.database.ref('pixels');
            this.usersRef = this.database.ref('users');
            this.gridSizeRef = this.database.ref('gridSize');
            
            // Écouter les changements de pixels avec priorité temps réel
            this.pixelsRef.on('child_added', (snapshot) => {
                const key = snapshot.key;
                const color = snapshot.val();
                if (this.pixels[key] !== color) {
                    this.pixels[key] = color;
                    const [x, y] = key.split(',').map(Number);
                    this.renderPixel(x, y, color);
                    console.log(`Pixel added: ${key} = ${color}`);
                }
            });
            
            this.pixelsRef.on('child_changed', (snapshot) => {
                const key = snapshot.key;
                const color = snapshot.val();
                if (this.pixels[key] !== color) {
                    this.pixels[key] = color;
                    const [x, y] = key.split(',').map(Number);
                    this.renderPixel(x, y, color);
                    console.log(`Pixel changed: ${key} = ${color}`);
                }
            });
            
            this.pixelsRef.on('child_removed', (snapshot) => {
                const key = snapshot.key;
                if (this.pixels[key]) {
                    delete this.pixels[key];
                    const [x, y] = key.split(',').map(Number);
                    this.ctx.clearRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize);
                    this.drawGridAtPosition(x, y); // Redessiner la grille à cette position
                    console.log(`Pixel removed: ${key}`);
                }
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
            
            // Charger les données existantes une seule fois
            this.pixelsRef.once('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    console.log('Loading existing pixels:', Object.keys(data).length);
                    this.pixels = data;
                    this.render();
                }
            });
            
            // Gérer la présence utilisateur
            this.setupUserPresence();
            
            this.showNotification('🔥 Connected to Firebase! Real-time collaboration active!', false);
            
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.showNotification('❌ Failed to connect to Firebase. Using local mode.', true);
            this.simulateUsers(); // Fallback to simulated users
        }
    }
    
    setupUserPresence() {
        // Créer une référence unique pour cet utilisateur
        this.userRef = this.usersRef.push();
        
        // Générer un ID utilisateur unique
        this.userId = 'user_' + Math.random().toString(36).substr(2, 9);
        
        // Marquer l'utilisateur comme connecté
        this.userRef.set({
            id: this.userId,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            lastSeen: firebase.database.ServerValue.TIMESTAMP,
            status: 'online'
        });
        
        // Supprimer l'utilisateur à la déconnexion
        this.userRef.onDisconnect().remove();
        
        // Écouter les changements d'utilisateurs
        this.usersRef.on('value', (snapshot) => {
            const users = snapshot.val();
            const userCount = users ? Object.keys(users).length : 0;
            document.getElementById('userCount').textContent = userCount;
            
            if (userCount > 1) {
                this.showNotification(`👥 ${userCount} users online - Collaboration active!`);
            }
        });
        
        // Heartbeat amélioré pour maintenir la connexion et synchroniser
        setInterval(() => {
            if (this.userRef) {
                this.userRef.update({
                    lastSeen: firebase.database.ServerValue.TIMESTAMP,
                    status: 'online'
                });
            }
        }, 10000); // Toutes les 10 secondes
        
        // Test de connectivité Firebase
        this.database.ref('.info/connected').on('value', (snapshot) => {
            if (snapshot.val() === true) {
                console.log('✅ Connected to Firebase');
            } else {
                console.log('❌ Disconnected from Firebase');
                this.showNotification('Connection lost. Trying to reconnect...', true);
            }
        });
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
