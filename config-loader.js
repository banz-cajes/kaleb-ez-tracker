// ============================================
// CONFIG LOADER - Environment Variable Support
// ============================================
// 
// This file provides environment variable loading for browser environments.
// Usage:
// 1. Create a separate config.js file (not committed, local only):
//    window.FIREBASE_CONFIG = { apiKey: "...", ... };
//    
// 2. Load config.js BEFORE firebase-config.js in index.html:
//    <script src="config.js"></script>
//    <script src="js/firebase-config.js"></script>
//
// 3. Or: Load from external config.json file:
//    <script>loadConfigFromJSON('config.json');</script>
//    <script src="js/firebase-config.js"></script>

async function loadConfigFromJSON(configPath = 'config.json') {
    try {
        const response = await fetch(configPath);
        if (!response.ok) {
            console.warn(`Config file not found at ${configPath}. Using defaults.`);
            return;
        }
        const config = await response.json();
        window.FIREBASE_CONFIG = config;
        console.log('✅ Firebase config loaded from', configPath);
    } catch (error) {
        console.warn(`Failed to load config from ${configPath}:`, error.message);
        console.log('Using default Firebase configuration...');
    }
}

// Auto-load config.json if it exists (optional)
document.addEventListener('DOMContentLoaded', () => {
    if (window.FIREBASE_CONFIG) {
        console.log('✅ Firebase config already loaded from window.FIREBASE_CONFIG');
    }
});

console.log('✅ Config loader ready. Set window.FIREBASE_CONFIG before loading firebase-config.js');
