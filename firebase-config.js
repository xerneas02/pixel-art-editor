// Import Firebase SDK v9
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getDatabase, ref, set, onValue, push, onDisconnect, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKHEqVEeBdkoKyeDD6mLQljyUXMFHO5IU",
  authDomain: "pixel-art-editor-72674.firebaseapp.com",
  databaseURL: "https://pixel-art-editor-72674-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pixel-art-editor-72674",
  storageBucket: "pixel-art-editor-72674.firebasestorage.app",
  messagingSenderId: "944332376141",
  appId: "1:944332376141:web:2cce7dc8200edf7acff404",
  measurementId: "G-0L1EQ36695"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Export for use in main script
window.firebaseApp = app;
window.firebaseDatabase = database;
window.firebaseRef = ref;
window.firebaseSet = set;
window.firebaseOnValue = onValue;
window.firebasePush = push;
window.firebaseOnDisconnect = onDisconnect;
window.firebaseServerTimestamp = serverTimestamp;
