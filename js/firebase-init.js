// ============================================
// C4 SYSTEMS - Firebase Initialization
// ============================================

let db, auth;

try {
    if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK not loaded!');
    }

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    // Initialize Auth
    auth = firebase.auth();

    // Initialize Firestore
    db = firebase.firestore();

    // ============================================
    // FIX: Handle blocked connections with fallbacks
    // ============================================
    
    // Configure Firestore settings with multiple fallback strategies
    const settings = {
        // Auto-detect and use long-polling when WebSockets are blocked
        experimentalAutoDetectLongPolling: true,
        // Ignore undefined properties to avoid errors
        ignoreUndefinedProperties: true,
        // Use HTTP/1.1 fallback for environments that block HTTP/2
        useFetchStreams: false,
        // Enable offline persistence for better reliability
        persistence: true
    };
    
    // Apply settings
    db.settings(settings);

    // ============================================
    // ENABLE PERSISTENCE WITH RETRY LOGIC
    // ============================================
    
    // Try to enable persistence with multiple attempts
    let persistenceAttempts = 0;
    const maxPersistenceAttempts = 3;
    
    function enablePersistenceWithRetry() {
        db.enablePersistence({ synchronizeTabs: true })
            .then(() => {
                console.log('✅ Firestore persistence enabled');
            })
            .catch((err) => {
                persistenceAttempts++;
                console.warn(`⚠️ Persistence attempt ${persistenceAttempts} failed:`, err.code);
                
                if (persistenceAttempts < maxPersistenceAttempts) {
                    // Retry with a delay
                    setTimeout(enablePersistenceWithRetry, 2000);
                } else {
                    // Fallback: continue without persistence
                    console.warn('⚠️ Persistence not available, continuing without it');
                }
            });
    }
    
    enablePersistenceWithRetry();

    // ============================================
    // AUTH PERSISTENCE
    // ============================================
    
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            console.log('✅ Auth persistence set to LOCAL');
        })
        .catch((err) => {
            console.warn('⚠️ Auth persistence error:', err);
            // Fallback: try session storage
            auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
                .catch(() => console.warn('⚠️ Auth persistence fallback failed'));
        });

    console.log('✅ Firebase initialized successfully');

} catch (error) {
    console.error('❌ Firebase initialization error:', error);
    
    // Handle the error gracefully
    const errorMessage = error.message || 'Unknown error';
    document.body.innerHTML = `
        <div style="text-align: center; padding: 50px; font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fef2f2; border-radius: 16px; padding: 40px; border: 1px solid #fca5a5;">
                <h2 style="color: #dc2626; margin-bottom: 16px;">⚠️ Connection Issue</h2>
                <p style="color: #6b7280; margin-bottom: 12px;">${errorMessage}</p>
                <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
                    This may be caused by an ad blocker, privacy extension, or network firewall.
                </p>
                <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="location.reload()" style="padding: 10px 24px; cursor: pointer; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600;">Retry</button>
                    <button onclick="window.location.href='login.html'" style="padding: 10px 24px; cursor: pointer; background: #6b7280; color: white; border: none; border-radius: 8px; font-size: 14px;">Go to Login</button>
                </div>
                <div style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                    <p>If the problem persists, try:</p>
                    <ul style="text-align: left; margin: 8px 0; padding-left: 20px;">
                        <li>Disabling ad blockers or privacy extensions</li>
                        <li>Using a different browser (Chrome, Firefox, Edge)</li>
                        <li>Connecting from a different network</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}