// firebase-config.js
// SECURITY: API Key is safe to expose in client apps.
// This file loads the key from a global variable (set in HTML) or falls back to a default.

let firebaseConfig;

// 1. Try to load from the global `window.FIREBASE_API_KEY` (set in index.html)
const apiKey = typeof window !== 'undefined' && window.FIREBASE_API_KEY 
    ? window.FIREBASE_API_KEY 
    : null;

// 2. Fallback to hardcoded key if environment variable is not set
const defaultApiKey = 'AIzaSyAxjoyWIO6Cd4iyh73IGJ7FE01gaf58GfU';

// 3. Build the config
firebaseConfig = {
    apiKey: apiKey || defaultApiKey,
    authDomain: "comms-monitoring.firebaseapp.com",
    databaseURL: "https://comms-monitoring-default-rtdb.firebaseio.com",
    projectId: "comms-monitoring",
    storageBucket: "comms-monitoring.firebasestorage.app",
    messagingSenderId: "178413618862",
    appId: "1:178413618862:web:291d6f4bdba871a058cf3f",
    measurementId: "G-DXEDZGT3GW"
};

// Validate config
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    console.error('Firebase configuration missing!');
} else {
    console.log('Firebase configuration loaded successfully');
}

// Export for use in other files (works for both browser and Node)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { firebaseConfig };
}