# 🔥 Configuration Firebase - Guide Étape par Étape

## 1. 📝 Créer le Projet Firebase

1. **Aller sur** : https://console.firebase.google.com/
2. **Cliquer** : "Ajouter un projet"
3. **Nom** : `pixel-art-collaborative` (ou votre choix)
4. **Google Analytics** : Désactiver (optionnel)
5. **Créer le projet**

## 2. 🗄️ Configurer Realtime Database

### Dans Firebase Console :
1. **Menu** → "Realtime Database"
2. **Cliquer** → "Créer une base de données"
3. **Localisation** → `europe-west1` (Europe)
4. **Mode de sécurité** → "Commencer en mode test"

### Règles de sécurité (temporaires) :
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

⚠️ **Important** : Ces règles sont pour les tests. En production, utilisez des règles plus sécurisées.

## 3. 🌐 Configuration Web App

### Dans Firebase Console :
1. **Paramètres** (⚙️) → "Paramètres du projet"
2. **Onglet "Général"** → Section "Vos applications"
3. **Cliquer** sur l'icône Web `</>`
4. **Nom de l'app** : `pixel-art-editor`
5. **Cocher** "Configurer Firebase Hosting" (optionnel)

### Configuration à copier :
Vous obtiendrez quelque chose comme :
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "pixel-art-collaborative.firebaseapp.com",
  databaseURL: "https://pixel-art-collaborative-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "pixel-art-collaborative",
  storageBucket: "pixel-art-collaborative.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};
```

## 4. 🔧 Remplacer dans script.js

### Trouver cette section (ligne ~42) :
```javascript
this.firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://VOTRE_PROJECT_ID-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_PROJECT_ID.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
};
```

### Remplacer par votre vraie configuration Firebase

## 5. 🚀 Test Local

1. **Ouvrir** `index.html` dans votre navigateur
2. **Vérifier** la console (F12) pour les erreurs
3. **Tester** : Dessiner des pixels
4. **Ouvrir** un second onglet → Les changements doivent apparaître !

## 6. 📤 Déployer sur GitHub Pages

### Option A : GitHub Pages classique
1. **Push** vers votre repository
2. **Settings** → "Pages" 
3. **Source** : "Deploy from a branch"
4. **Branch** : `main` / `root`

### Option B : Firebase Hosting (recommandé)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 🔧 Fonctionnalités Activées

✅ **Collaboration temps réel** - Plusieurs utilisateurs simultanés  
✅ **Synchronisation automatique** - Changements instantanés  
✅ **Compteur d'utilisateurs** - Voir qui est en ligne  
✅ **Persistence** - Sauvegarde automatique sur Firebase  
✅ **Fallback local** - Fonctionne sans Firebase  

## 🛡️ Sécurité (Production)

Pour la production, remplacez les règles par :
```json
{
  "rules": {
    "pixels": {
      ".read": true,
      ".write": true,
      "$key": {
        ".validate": "newData.isString()"
      }
    },
    "gridSize": {
      ".read": true,
      ".write": true,
      ".validate": "newData.isNumber() && newData.val() >= 16 && newData.val() <= 128"
    },
    "users": {
      ".read": true,
      ".write": true
    }
  }
}
```

## 🐛 Dépannage

### Erreur CORS :
- Servir via un serveur web (pas `file://`)
- Utiliser Live Server de VS Code

### Firebase ne se connecte pas :
- Vérifier la configuration
- Vérifier les règles de la base de données
- Regarder la console pour les erreurs

### Quota dépassé :
- Firebase gratuit : 100 connexions simultanées
- Upgrade vers Blaze plan si nécessaire
