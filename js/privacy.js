// js/privacy.js
// Privacy & Security Manager

class PrivacyManager {
    constructor() {
        this.pinEnabled = false;
        this.storedPin = null;
        this.pinAttempts = 0;
        this.maxAttempts = 5;
        this.lockoutUntil = null;
        this.hideAmounts = false;
        this.privacyMode = false;
        this.lastActivity = Date.now();
        this.sessionTimer = null;
        this.currentPinEntry = '';
        this.pendingAction = null;
        this.isLocked = false;
        this.sessionStartTime = Date.now();
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupActivityTracking();
        this.setupPrivacyMode();
        this.setupHideAmounts();
        
        // IMPORTANT: Only show PIN lock if it was locked before refresh
        // NOT on every refresh
        const wasLocked = sessionStorage.getItem('pin_locked') === 'true';
        
        if (this.pinEnabled && this.storedPin && wasLocked) {
            this.showPinLock();
        } else {
            // Clear the lock flag on normal load
            sessionStorage.removeItem('pin_locked');
            this.isLocked = false;
        }
        
        // Start the inactivity timer
        if (this.pinEnabled && !this.isLocked) {
            this.resetActivityTimer();
        }
    }

    async loadSettings() {
        // First load from localStorage as fallback
        this.pinEnabled = localStorage.getItem('privacy_pin_enabled') === 'true';
        this.storedPin = localStorage.getItem('privacy_pin');
        this.hideAmounts = localStorage.getItem('privacy_hide_amounts') === 'true';
        this.privacyMode = localStorage.getItem('privacy_mode') === 'true';

        // Then try to load from Firebase for cross-device sync
        if (window.currentUser && window.db) {
            try {
                const doc = await window.db.collection('users').doc(window.currentUser.uid).get();
                if (doc.exists) {
                    const data = doc.data();
                    if (data.privacySettings) {
                        this.pinEnabled = data.privacySettings.pinEnabled || false;
                        this.storedPin = data.privacySettings.storedPin || null;
                        this.hideAmounts = data.privacySettings.hideAmounts || false;
                        this.privacyMode = data.privacySettings.privacyMode || false;
                        
                        localStorage.setItem('privacy_pin_enabled', this.pinEnabled);
                        localStorage.setItem('privacy_pin', this.storedPin || '');
                        localStorage.setItem('privacy_hide_amounts', this.hideAmounts);
                        localStorage.setItem('privacy_mode', this.privacyMode);
                    }
                }
            } catch (error) {
                console.log('Could not load privacy settings from cloud:', error);
            }
        }

        if (this.hideAmounts) {
            document.body.classList.add('hide-amounts');
        }
    }

    async saveSettings() {
        localStorage.setItem('privacy_pin_enabled', this.pinEnabled);
        localStorage.setItem('privacy_pin', this.storedPin || '');
        localStorage.setItem('privacy_hide_amounts', this.hideAmounts);
        localStorage.setItem('privacy_mode', this.privacyMode);

        if (window.currentUser && window.db) {
            try {
                await window.db.collection('users').doc(window.currentUser.uid).update({
                    privacySettings: {
                        pinEnabled: this.pinEnabled,
                        storedPin: this.storedPin,
                        hideAmounts: this.hideAmounts,
                        privacyMode: this.privacyMode,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }
                });
                console.log('Privacy settings synced to cloud');
            } catch (error) {
                console.log('Could not sync privacy settings:', error);
            }
        }
    }

    setupActivityTracking() {
        const events = ['click', 'touchstart', 'keydown', 'scroll', 'mousemove'];
        events.forEach(event => {
            document.addEventListener(event, () => this.resetActivityTimer());
        });
    }

    resetActivityTimer() {
        this.lastActivity = Date.now();

        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }

        // Only set timer if PIN is enabled, not locked, and app is active
        if (this.pinEnabled && !this.isLocked && !document.hidden) {
            this.sessionTimer = setTimeout(() => {
                this.autoLock();
            }, 600000); // 10 minutes
        }
    }

    autoLock() {
        // Only lock if there was actual inactivity (no recent activity)
        const inactiveTime = Date.now() - this.lastActivity;
        
        if (this.pinEnabled && this.storedPin && !this.isLocked && inactiveTime >= 600000) {
            console.log('Auto-locking due to 10 minutes of inactivity');
            
            // Set flag that we're locking
            sessionStorage.setItem('pin_locked', 'true');
            this.isLocked = true;
            
            if (window.sileo) window.sileo.info('Auto-locking for security', 'Session Timeout');
            this.showPinLock();
        }
    }

    setupPrivacyMode() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.privacyMode) {
                document.body.classList.add('privacy-blur-active');
                this.privacyBlurTimeout = setTimeout(() => {
                    document.body.classList.remove('privacy-blur-active');
                }, 500);
            } else if (!document.hidden && this.privacyMode) {
                if (this.privacyBlurTimeout) {
                    clearTimeout(this.privacyBlurTimeout);
                }
                document.body.classList.remove('privacy-blur-active');
                // Reset activity timer when app becomes visible again
                this.resetActivityTimer();
            }
        });
    }

    setupHideAmounts() {
        document.body.addEventListener('click', (e) => {
            if (this.hideAmounts) {
                const amountElement = e.target.closest('.amount-value, .stat-value, .net-worth-value, .current-amount, .bill-amount');
                if (amountElement) {
                    const originalFilter = amountElement.style.filter;
                    amountElement.style.filter = 'blur(0)';
                    setTimeout(() => {
                        amountElement.style.filter = originalFilter;
                    }, 1000);
                }
            }
        });
    }

    showPinLock(action = null) {
        if (this.isLocked && document.querySelector('.pin-lock-overlay')) return;
        
        this.isLocked = true;
        this.pendingAction = action;
        this.currentPinEntry = '';

        const existingOverlay = document.querySelector('.pin-lock-overlay');
        if (existingOverlay) existingOverlay.remove();

        const overlay = document.createElement('div');
        overlay.className = 'pin-lock-overlay';
        overlay.innerHTML = `
            <div class="pin-lock-container">
                <div class="pin-title"><i class="fas fa-lock"></i> App Locked</div>
                <div class="pin-subtitle">Enter your PIN to continue</div>
                <div class="pin-display" id="pinDisplay">●●●●</div>
                <div class="pin-keypad" id="pinKeypad">
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(key => `
                        <button class="pin-key" data-key="${key}">${key}</button>
                    `).join('')}
                </div>
                <div class="pin-actions">
                    <button class="btn-secondary" id="pinCancelBtn">Cancel</button>
                    <button class="btn-primary" id="pinSubmitBtn">Unlock</button>
                </div>
                <div id="pinError" class="pin-error"></div>
                ${this.pinAttempts > 0 ? `<div class="pin-attempts">Attempts: ${this.pinAttempts}/${this.maxAttempts}</div>` : ''}
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        const display = document.getElementById('pinDisplay');
        const errorDiv = document.getElementById('pinError');

        const updateDisplay = () => {
            display.textContent = '●'.repeat(this.currentPinEntry.length) + '○'.repeat(4 - this.currentPinEntry.length);
        };
        updateDisplay();

        document.getElementById('pinKeypad').addEventListener('click', (e) => {
            const key = e.target.closest('.pin-key')?.dataset.key;
            if (!key) return;

            if (key === '⌫') {
                this.currentPinEntry = this.currentPinEntry.slice(0, -1);
                updateDisplay();
                errorDiv.textContent = '';
            } else if (key && key !== '') {
                if (this.currentPinEntry.length < 4) {
                    this.currentPinEntry += key;
                    updateDisplay();
                    errorDiv.textContent = '';
                    if (this.currentPinEntry.length === 4) {
                        this.verifyPin();
                    }
                }
            }
        });

        document.getElementById('pinSubmitBtn').onclick = () => this.verifyPin();
        document.getElementById('pinCancelBtn').onclick = () => {
            if (this.pendingAction === 'logout') {
                if (window.handleLogout) window.handleLogout();
            } else {
                errorDiv.textContent = 'PIN required to access app';
                errorDiv.style.color = 'var(--warning)';
            }
        };
    }

    verifyPin() {
        const errorDiv = document.getElementById('pinError');

        if (this.lockoutUntil && Date.now() < this.lockoutUntil) {
            const minutesLeft = Math.ceil((this.lockoutUntil - Date.now()) / 60000);
            errorDiv.textContent = `Too many attempts. Try again in ${minutesLeft} minute(s).`;
            return;
        }

        if (this.currentPinEntry === this.storedPin) {
            this.pinAttempts = 0;
            this.lockoutUntil = null;
            this.isLocked = false;
            
            // Clear the lock flag
            sessionStorage.removeItem('pin_locked');
            
            this.closePinLock();
            this.resetActivityTimer();
            
            if (window.sileo) window.sileo.success('Unlocked successfully', 'Welcome Back');
            this.pendingAction = null;
        } else {
            this.pinAttempts++;
            errorDiv.textContent = `Incorrect PIN. ${this.maxAttempts - this.pinAttempts} attempts remaining.`;

            if (this.pinAttempts >= this.maxAttempts) {
                this.lockoutUntil = Date.now() + 300000;
                errorDiv.textContent = 'Too many failed attempts. Locked for 5 minutes.';
                this.currentPinEntry = '';
                const display = document.getElementById('pinDisplay');
                if (display) display.textContent = '●●●●';
                const keypad = document.getElementById('pinKeypad');
                if (keypad) keypad.style.pointerEvents = 'none';
                setTimeout(() => {
                    if (keypad) keypad.style.pointerEvents = '';
                    this.pinAttempts = 0;
                }, 300000);
            } else {
                this.currentPinEntry = '';
                const display = document.getElementById('pinDisplay');
                if (display) display.textContent = '●●●●';
            }
        }
    }

    closePinLock() {
        const overlay = document.querySelector('.pin-lock-overlay');
        if (overlay) {
            overlay.remove();
            document.body.style.overflow = '';
        }
    }

    async enablePin(pin) {
        if (pin && pin.length === 4 && /^\d+$/.test(pin)) {
            this.storedPin = pin;
            this.pinEnabled = true;
            this.pinAttempts = 0;
            this.isLocked = false;
            
            // Clear any lock flag
            sessionStorage.removeItem('pin_locked');
            
            await this.saveSettings();
            this.resetActivityTimer();
            
            if (window.sileo) window.sileo.success('PIN lock enabled! It will sync across your devices.', 'Security Active');
            return true;
        }
        return false;
    }

    async disablePin() {
        if (confirm('Disable PIN lock? Your data will still be protected by device security.')) {
            this.storedPin = null;
            this.pinEnabled = false;
            this.isLocked = false;
            
            // Clear lock flag and timer
            sessionStorage.removeItem('pin_locked');
            
            if (this.sessionTimer) {
                clearTimeout(this.sessionTimer);
            }
            
            await this.saveSettings();
            
            if (window.sileo) window.sileo.info('PIN lock disabled', 'Security Off');
            return true;
        }
        return false;
    }

    showPinSetupModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'pinSetupModal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content pin-setup-modal">
                <button class="modal-close" onclick="window.closePinSetupModal && window.closePinSetupModal()"><i class="fas fa-times"></i></button>
                <h2><i class="fas fa-lock"></i> Set PIN Lock</h2>
                <p>Set a 4-digit PIN to lock the app after 10 minutes of inactivity</p>
                <div class="form-group">
                    <label class="form-label">Enter 4-digit PIN</label>
                    <input type="password" id="pinInput1" class="form-control" maxlength="4" pattern="\\d*" inputmode="numeric" placeholder="••••">
                </div>
                <div class="form-group">
                    <label class="form-label">Confirm PIN</label>
                    <input type="password" id="pinInput2" class="form-control" maxlength="4" pattern="\\d*" inputmode="numeric" placeholder="••••">
                </div>
                <button class="btn-primary" onclick="window.savePinSetup && window.savePinSetup()" style="width:100%; margin-top:16px;">Enable PIN Lock</button>
                ${this.pinEnabled ? `<button class="btn-danger" onclick="window.disablePinSetup && window.disablePinSetup()" style="width:100%; margin-top:8px;">Disable PIN Lock</button>` : ''}
            </div>
        `;

        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
    }

    closePinSetupModal() {
        const modal = document.getElementById('pinSetupModal');
        if (modal) {
            modal.remove();
            document.body.classList.remove('modal-open');
        }
    }
}

// Initialize privacy manager
window.privacyManager = new PrivacyManager();

window.showPinSetup = function() {
    if (window.privacyManager) window.privacyManager.showPinSetupModal();
};

window.closePinSetupModal = function() {
    if (window.privacyManager) window.privacyManager.closePinSetupModal();
};

window.savePinSetup = async function() {
    const pin1 = document.getElementById('pinInput1').value;
    const pin2 = document.getElementById('pinInput2').value;

    if (!pin1 || !pin2) {
        if (window.showToast) window.showToast('Please enter PIN in both fields', 'danger');
        return;
    }

    if (pin1.length !== 4 || !/^\d+$/.test(pin1)) {
        if (window.showToast) window.showToast('PIN must be 4 digits', 'danger');
        return;
    }

    if (pin1 !== pin2) {
        if (window.showToast) window.showToast('PINs do not match', 'danger');
        return;
    }

    if (await window.privacyManager.enablePin(pin1)) {
        window.closePinSetupModal();
        const pinToggle = document.getElementById('pinLockToggle');
        if (pinToggle) pinToggle.checked = true;
    }
};

window.disablePinSetup = async function() {
    if (await window.privacyManager.disablePin()) {
        window.closePinSetupModal();
        const pinToggle = document.getElementById('pinLockToggle');
        if (pinToggle) pinToggle.checked = false;
    }
};

window.togglePinLock = async function() {
    if (window.privacyManager.pinEnabled) {
        await window.privacyManager.disablePin();
        const pinToggle = document.getElementById('pinLockToggle');
        if (pinToggle) pinToggle.checked = false;
    } else {
        window.showPinSetup();
    }
};

window.toggleHideAmounts = function() {
    window.privacyManager.toggleHideAmounts();
    const toggle = document.getElementById('hideAmountsToggle');
    if (toggle) toggle.checked = window.privacyManager.hideAmounts;
};

window.togglePrivacyMode = function() {
    window.privacyManager.togglePrivacyMode();
    const toggle = document.getElementById('privacyModeToggle');
    if (toggle) toggle.checked = window.privacyManager.privacyMode;
};

window.loadPrivacySettings = function() {
    const pinToggle = document.getElementById('pinLockToggle');
    const hideAmountsToggle = document.getElementById('hideAmountsToggle');
    const privacyModeToggle = document.getElementById('privacyModeToggle');

    if (pinToggle && window.privacyManager) pinToggle.checked = window.privacyManager.pinEnabled;
    if (hideAmountsToggle && window.privacyManager) hideAmountsToggle.checked = window.privacyManager.hideAmounts;
    if (privacyModeToggle && window.privacyManager) privacyModeToggle.checked = window.privacyManager.privacyMode;
};