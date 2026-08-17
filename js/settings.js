// ============================================
// C4 SYSTEMS - Settings Management
// ============================================

let appSettings = {
    itemsPerPage: 10,
    defaultView: 'all',
    dateFormat: 'military',
    autoRefresh: 0,
    emailNotifications: false,
    browserNotifications: false,
    soundAlerts: false,
    actionRequiredNotify: true,
    theme: 'light',
    compactMode: false,
    showAnimations: true,
    sidebarCollapsedDefault: false,
    exportFormat: 'excel',
    exportColumns: ['nr', 'subject', 'type', 'status', 'releaseDate', 'remarks'],
    sessionTimeout: 30
};

function loadSettings() {
    const saved = localStorage.getItem('c4_app_settings');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            appSettings = { ...appSettings, ...parsed };
            console.log('✅ Settings loaded:', appSettings);
        } catch (e) {
            console.error('Error loading settings', e);
        }
    }
    applySettings();
}

function applySettings() {
    // Items per page - this will be used by app.js
    if (appSettings.itemsPerPage) {
        // The global itemsPerPage will be set in app.js
    }

    // Theme
    applyTheme(appSettings.theme);

    // Compact mode
    if (appSettings.compactMode) {
        document.body.classList.add('compact-mode');
    } else {
        document.body.classList.remove('compact-mode');
    }

    // Animations
    if (!appSettings.showAnimations) {
        document.body.classList.add('no-animations');
    } else {
        document.body.classList.remove('no-animations');
    }

    // Sidebar collapsed
    const sidebar = document.getElementById('mainSidebar');
    if (sidebar) {
        if (appSettings.sidebarCollapsedDefault) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }
    }
}

function saveSettings() {
    const itemsPerPageElem = document.getElementById('itemsPerPageSetting');
    const defaultViewElem = document.getElementById('defaultViewSetting');
    const dateFormatElem = document.getElementById('dateFormatSetting');
    const autoRefreshElem = document.getElementById('autoRefreshSetting');
    const emailNotificationsElem = document.getElementById('emailNotifications');
    const browserNotificationsElem = document.getElementById('browserNotifications');
    const soundAlertsElem = document.getElementById('soundAlerts');
    const actionRequiredNotifyElem = document.getElementById('actionRequiredNotify');
    const compactModeElem = document.getElementById('compactMode');
    const showAnimationsElem = document.getElementById('showAnimations');
    const sidebarCollapsedDefaultElem = document.getElementById('sidebarCollapsedDefault');
    const exportFormatElem = document.getElementById('exportFormatSetting');
    const sessionTimeoutElem = document.getElementById('sessionTimeoutSetting');

    appSettings.itemsPerPage = itemsPerPageElem ? parseInt(itemsPerPageElem.value) : 10;
    appSettings.defaultView = defaultViewElem ? defaultViewElem.value : 'all';
    appSettings.dateFormat = dateFormatElem ? dateFormatElem.value : 'military';
    appSettings.autoRefresh = autoRefreshElem ? parseInt(autoRefreshElem.value) : 0;
    appSettings.emailNotifications = emailNotificationsElem ? emailNotificationsElem.checked : false;
    appSettings.browserNotifications = browserNotificationsElem ? browserNotificationsElem.checked : false;
    appSettings.soundAlerts = soundAlertsElem ? soundAlertsElem.checked : false;
    appSettings.actionRequiredNotify = actionRequiredNotifyElem ? actionRequiredNotifyElem.checked : true;
    appSettings.compactMode = compactModeElem ? compactModeElem.checked : false;
    appSettings.showAnimations = showAnimationsElem ? showAnimationsElem.checked : true;
    appSettings.sidebarCollapsedDefault = sidebarCollapsedDefaultElem ? sidebarCollapsedDefaultElem.checked : false;
    appSettings.exportFormat = exportFormatElem ? exportFormatElem.value : 'excel';
    appSettings.sessionTimeout = sessionTimeoutElem ? parseInt(sessionTimeoutElem.value) : 30;

    // Export columns
    appSettings.exportColumns = [];
    const exportNRElem = document.getElementById('exportNR');
    const exportSubjectElem = document.getElementById('exportSubject');
    const exportTypeElem = document.getElementById('exportType');
    const exportStatusElem = document.getElementById('exportStatus');
    const exportReleaseDateElem = document.getElementById('exportReleaseDate');
    const exportRemarksElem = document.getElementById('exportRemarks');

    if (exportNRElem && exportNRElem.checked) appSettings.exportColumns.push('nr');
    if (exportSubjectElem && exportSubjectElem.checked) appSettings.exportColumns.push('subject');
    if (exportTypeElem && exportTypeElem.checked) appSettings.exportColumns.push('type');
    if (exportStatusElem && exportStatusElem.checked) appSettings.exportColumns.push('status');
    if (exportReleaseDateElem && exportReleaseDateElem.checked) appSettings.exportColumns.push('releaseDate');
    if (exportRemarksElem && exportRemarksElem.checked) appSettings.exportColumns.push('remarks');

    localStorage.setItem('c4_app_settings', JSON.stringify(appSettings));
    console.log('💾 Settings saved:', appSettings);

    applySettings();
    
    // Update itemsPerPage in app.js if it exists
    if (typeof itemsPerPage !== 'undefined') {
        itemsPerPage = appSettings.itemsPerPage;
        if (typeof renderTable === 'function') {
            currentPage = 1;
            renderTable();
        }
    }
    
    showToast('Settings saved successfully!', 'success');
}

function resetSettings() {
    Swal.fire({
        title: 'Reset Settings?',
        text: 'This will restore all default settings. Continue?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Reset',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('c4_app_settings');
            loadSettings();
            showToast('Settings reset to default!', 'success');
            const activeTab = document.querySelector('.settings-tab.active');
            if (activeTab) {
                const tabId = activeTab.dataset.tab;
                showSettingsTab(tabId);
            }
        }
    });
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    } else if (theme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    } else if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDark) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
}

let autoRefreshInterval = null;

function startAutoRefresh(minutes) {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    if (minutes > 0) {
        autoRefreshInterval = setInterval(() => {
            if (typeof refreshData === 'function') {
                refreshData();
                showToast('Auto-refreshed data', 'info');
            }
        }, minutes * 60 * 1000);
    }
}

function openSettings(tab = 'general') {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;

    const itemsPerPageSetting = document.getElementById('itemsPerPageSetting');
    const defaultViewSetting = document.getElementById('defaultViewSetting');
    const dateFormatSetting = document.getElementById('dateFormatSetting');
    const autoRefreshSetting = document.getElementById('autoRefreshSetting');
    const emailNotifications = document.getElementById('emailNotifications');
    const browserNotifications = document.getElementById('browserNotifications');
    const soundAlerts = document.getElementById('soundAlerts');
    const actionRequiredNotify = document.getElementById('actionRequiredNotify');
    const compactMode = document.getElementById('compactMode');
    const showAnimations = document.getElementById('showAnimations');
    const sidebarCollapsedDefault = document.getElementById('sidebarCollapsedDefault');
    const exportFormatSetting = document.getElementById('exportFormatSetting');
    const sessionTimeoutSetting = document.getElementById('sessionTimeoutSetting');

    if (itemsPerPageSetting) itemsPerPageSetting.value = appSettings.itemsPerPage;
    if (defaultViewSetting) defaultViewSetting.value = appSettings.defaultView;
    if (dateFormatSetting) dateFormatSetting.value = appSettings.dateFormat;
    if (autoRefreshSetting) autoRefreshSetting.value = appSettings.autoRefresh;
    if (emailNotifications) emailNotifications.checked = appSettings.emailNotifications;
    if (browserNotifications) browserNotifications.checked = appSettings.browserNotifications;
    if (soundAlerts) soundAlerts.checked = appSettings.soundAlerts;
    if (actionRequiredNotify) actionRequiredNotify.checked = appSettings.actionRequiredNotify;
    if (compactMode) compactMode.checked = appSettings.compactMode;
    if (showAnimations) showAnimations.checked = appSettings.showAnimations;
    if (sidebarCollapsedDefault) sidebarCollapsedDefault.checked = appSettings.sidebarCollapsedDefault;
    if (exportFormatSetting) exportFormatSetting.value = appSettings.exportFormat;
    if (sessionTimeoutSetting) sessionTimeoutSetting.value = appSettings.sessionTimeout;

    const exportNR = document.getElementById('exportNR');
    const exportSubject = document.getElementById('exportSubject');
    const exportType = document.getElementById('exportType');
    const exportStatus = document.getElementById('exportStatus');
    const exportReleaseDate = document.getElementById('exportReleaseDate');
    const exportRemarks = document.getElementById('exportRemarks');

    if (exportNR) exportNR.checked = appSettings.exportColumns.includes('nr');
    if (exportSubject) exportSubject.checked = appSettings.exportColumns.includes('subject');
    if (exportType) exportType.checked = appSettings.exportColumns.includes('type');
    if (exportStatus) exportStatus.checked = appSettings.exportColumns.includes('status');
    if (exportReleaseDate) exportReleaseDate.checked = appSettings.exportColumns.includes('releaseDate');
    if (exportRemarks) exportRemarks.checked = appSettings.exportColumns.includes('remarks');

    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.theme === appSettings.theme) opt.classList.add('active');
    });

    modal.style.display = 'flex';
    showSettingsTab(tab);
}

function showSettingsTab(tabId) {
    document.querySelectorAll('.settings-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('.settings-tab').forEach(tab => tab.classList.remove('active'));

    const targetPane = document.getElementById(`settings-${tabId}`);
    if (targetPane) targetPane.classList.add('active');

    const targetTab = document.querySelector(`.settings-tab[data-tab="${tabId}"]`);
    if (targetTab) targetTab.classList.add('active');

    if (tabId === 'users') {
        setTimeout(() => loadUsersIntoSettings(), 100);
        const hideAccountsCheckbox = document.getElementById('hideAccountsSetting');
        if (hideAccountsCheckbox) {
            hideAccountsCheckbox.checked = localStorage.getItem('hideAccounts') === 'true';
        }
    }
}

// Load users into the settings UI (minimal implementation)
async function loadUsersIntoSettings() {
    const container = document.getElementById('settingsUserList');
    if (!container) return;
    container.innerHTML = `<div style="text-align:center; padding: 1rem; color: var(--gray-500);">` +
        `<i class="fas fa-spinner fa-spin"></i> Loading users...</div>`;

    if (!db) {
        container.innerHTML = `<div style="padding:1rem; color:var(--gray-500);">Firestore not initialized.</div>`;
        return;
    }

    try {
        // Only admins can manage users - if permissions object exists, check
        if (typeof permissions !== 'undefined' && !permissions.canManageUsers) {
            container.innerHTML = `<div style="padding:1rem; color:var(--gray-500);">You don't have permission to manage users.</div>`;
            return;
        }

        const snapshot = await db.collection('users').orderBy('email').get();
        if (snapshot.empty) {
            container.innerHTML = `<div style="padding:1rem; color:var(--gray-500);">No users found.</div>`;
            return;
        }

        const rows = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                const isAdmin = (typeof permissions !== 'undefined' && permissions.canManageUsers);
                rows.push(`
                    <div class="user-row" data-userid="${doc.id}" style="display:flex; align-items:center; justify-content:space-between; padding:0.5rem 0.75rem; border-bottom:1px solid var(--gray-100);">
                        <div style="display:flex; gap:0.75rem; align-items:center; min-width:0;">
                            <div style="width:36px; height:36px; border-radius:8px; background:var(--gray-100); display:flex; align-items:center; justify-content:center; font-weight:600;">${(data.name||'U').charAt(0).toUpperCase()}</div>
                            <div style="min-width:0;">
                                <div style="font-weight:600; font-size:0.85rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(data.name || doc.id)}</div>
                                <div style="font-size:0.7rem; color:var(--gray-500);">${escapeHtml(data.email || '')}</div>
                            </div>
                        </div>
                        <div style="display:flex; gap:0.5rem; align-items:center;">
                            <div style="font-size:0.75rem; color:var(--gray-600);">${escapeHtml(data.role || 'viewer')}</div>
                            ${isAdmin ? `
                                <button class="btn btn-sm" onclick="openEditUserModal('${doc.id}')">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="confirmDeleteUser('${doc.id}')">Delete</button>
                            ` : ''}
                        </div>
                    </div>
                `);
        });

        container.innerHTML = rows.join('');
    } catch (error) {
        console.error('Error loading users:', error);
        container.innerHTML = `<div style="padding:1rem; color:var(--gray-500);">Error loading users: ${error.message}</div>`;
    }
}

// Open edit user modal (simple role change)
function openEditUserModal(userId) {
    if (!db) return showToast('Firestore not initialized', 'error');
    const docRef = db.collection('users').doc(userId);
    docRef.get().then(doc => {
        if (!doc.exists) return showToast('User not found', 'error');
        const data = doc.data();
        const currentRole = data.role || 'viewer';
        Swal.fire({
            title: 'Edit User Role',
            input: 'select',
            inputOptions: {
                'viewer': 'Viewer',
                'creator': 'Creator',
                'approver': 'Approver',
                'admin': 'Admin'
            },
            inputValue: currentRole,
            showCancelButton: true,
            confirmButtonText: 'Save'
        }).then(result => {
            if (!result.isConfirmed) return;
            const newRole = result.value;
            docRef.update({ role: newRole }).then(() => {
                showToast('User role updated', 'success');
                loadUsersIntoSettings();
            }).catch(err => {
                console.error('Update user role error:', err);
                showToast('Failed to update user: ' + err.message, 'error');
            });
        });
    }).catch(err => {
        console.error('Get user error:', err);
        showToast('Error fetching user: ' + err.message, 'error');
    });
}

async function deleteUser(userId) {
    if (!db) return showToast('Firestore not initialized', 'error');
    
    const result = await Swal.fire({
        title: 'Delete User?',
        text: 'This will permanently remove the user from both Auth and Firestore.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel'
    });
    
    if (!result.isConfirmed) return;
    
    showLoading();
    try {
        // 1. Delete from Firestore
        await db.collection('users').doc(userId).delete();
        await db.collection('chat_profiles').doc(userId).delete();
        
        // 2. Delete from Firebase Auth (requires admin SDK - use a callable function or Cloud Function)
        // Note: Deleting Auth users from client is not allowed for security reasons.
        // You need a Cloud Function for this.
        // For now, we'll just delete the Firestore records.
        
        showToast('✅ User profile deleted! (Auth account must be disabled manually via Firebase Console)', 'success');
        loadUsersIntoSettings();
    } catch (error) {
        console.error('Delete user error:', error);
        showToast('Failed to delete user: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}


function confirmDeleteUser(userId) {
    Swal.fire({
        title: 'Delete User?',
        text: 'This will permanently remove the user. Continue?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Delete'
    }).then(result => {
        if (!result.isConfirmed) return;
        deleteUser(userId);
    });
}

function deleteUser(userId) {
    if (!db) return showToast('Firestore not initialized', 'error');
    db.collection('users').doc(userId).delete().then(() => {
        showToast('User deleted', 'success');
        loadUsersIntoSettings();
    }).catch(err => {
        console.error('Delete user error:', err);
        showToast('Failed to delete user: ' + err.message, 'error');
    });
}

// Logout helper from the settings modal
function logoutFromSettings() {
    closeModal('settingsModal');
    if (typeof logout === 'function') logout();
}

function initSettingsTabs() {
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            showSettingsTab(tabId);
        });
    });

    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            appSettings.theme = opt.dataset.theme;
            applyTheme(appSettings.theme);
        });
    });
}

// Open Create User modal and reset inputs
function openCreateUserModal() {
    if (typeof permissions !== 'undefined' && !permissions.canManageUsers) {
        return showToast('You do not have permission to create users.', 'error');
    }
    const modal = document.getElementById('createUserModal');
    if (!modal) return showToast('Create User modal not found', 'error');
    // clear fields
    const name = document.getElementById('newUserName');
    const email = document.getElementById('newUserEmail');
    const pass = document.getElementById('newUserPassword');
    const conf = document.getElementById('newUserConfirmPassword');
    const role = document.getElementById('newUserRole');
    if (name) name.value = '';
    if (email) email.value = '';
    if (pass) pass.value = '';
    if (conf) conf.value = '';
    if (role) role.value = 'viewer';
    openModal('createUserModal');
}

// Create a user document (note: does NOT create Firebase Auth user)
// ============================================
// CREATE USER - WITH FIREBASE AUTH
// ============================================

async function createUser() {
    if (typeof permissions !== 'undefined' && !permissions.canManageUsers) {
        return showToast('You do not have permission to create users.', 'error');
    }

    const name = document.getElementById('newUserName')?.value.trim();
    const email = document.getElementById('newUserEmail')?.value.trim();
    const password = document.getElementById('newUserPassword')?.value || '';
    const confirm = document.getElementById('newUserConfirmPassword')?.value || '';
    const role = document.getElementById('newUserRole')?.value || 'viewer';

    if (!name || !email) return showToast('Name and email are required', 'error');
    if (!password || password.length < 6) return showToast('Password must be at least 6 characters', 'error');
    if (password !== confirm) return showToast('Passwords do not match', 'error');

    if (!db) return showToast('Firestore not initialized', 'error');

    // Show loading
    const btn = document.querySelector('#createUserModal .btn-primary');
    const originalText = btn?.innerHTML;
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        btn.disabled = true;
    }

    try {
        // 1. CREATE FIREBASE AUTH USER
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;

        // 2. CREATE USER PROFILE IN FIRESTORE
        const userData = {
            name: sanitizeInput(name),
            email: sanitizeInput(email),
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser?.uid || 'system'
        };

        await db.collection('users').doc(uid).set(userData);

        // 3. CREATE CHAT PROFILE
        await db.collection('chat_profiles').doc(uid).set({
            name: sanitizeInput(name),
            email: sanitizeInput(email),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // 4. SEND EMAIL VERIFICATION (optional but recommended)
        try {
            await userCredential.user.sendEmailVerification();
        } catch (verifyError) {
            console.warn('Could not send verification email:', verifyError);
        }

        showToast(`✅ User "${name}" created successfully!`, 'success');
        closeModal('createUserModal');
        loadUsersIntoSettings();

    } catch (error) {
        console.error('Create user error:', error);
        let message = 'Failed to create user';
        if (error.code === 'auth/email-already-in-use') {
            message = 'Email already registered. Please use a different email.';
        } else if (error.code === 'auth/weak-password') {
            message = 'Password is too weak. Use at least 6 characters.';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Invalid email format.';
        }
        showToast(message, 'error');
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

function enable2FA() {
    showToast('2FA setup coming soon!', 'info');
}

function viewLoginHistory() {
    showToast('Login history feature coming soon!', 'info');
}

function clearLocalData() {
    Swal.fire({
        title: 'Clear Local Data?',
        text: 'This will remove cached data and saved settings. You will remain logged in.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Clear',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('c4_app_settings');
            localStorage.removeItem('hideAccounts');
            localStorage.removeItem('theme_preference');
            showToast('Local data cleared!', 'success');
            loadSettings();
            const activeTab = document.querySelector('.settings-tab.active');
            if (activeTab) {
                const tabId = activeTab.dataset.tab;
                showSettingsTab(tabId);
            }
            const hideAccountsCheckbox = document.getElementById('hideAccountsSetting');
            if (hideAccountsCheckbox) {
                hideAccountsCheckbox.checked = false;
            }
            if (activeTab && activeTab.dataset.tab === 'users') {
                loadUsersIntoSettings();
            }
        }
    });
}

function requestNotificationPermission() {
    if ('Notification' in window && appSettings.browserNotifications) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showToast('Notifications enabled!', 'success');
            }
        });
    }
}

function checkAndNotify() {
    if (!appSettings.actionRequiredNotify) return;

    // This will be populated by app.js
    if (typeof allCommunications !== 'undefined' && allCommunications && allCommunications.length > 0) {
        const pendingCount = allCommunications.filter(c => {
            const status = c.status || 'draft';
            if (status === 'released' || status === 'rejected' || status === 'approved') return false;
            const approvals = c.approvals || {};
            const distribution = c.distribution || [];
            const approvedCount = Object.values(approvals).filter(a => a.status === 'approve').length;
            const rejectedCount = Object.values(approvals).filter(a => a.status === 'reject').length;
            return approvedCount < distribution.length && rejectedCount === 0;
        }).length;

        if (pendingCount > 0) {
            showToast(`You have ${pendingCount} pending ${pendingCount === 1 ? 'communication' : 'communications'} to review`, 'info');

            if (appSettings.browserNotifications && Notification.permission === 'granted') {
                new Notification('Pending Approvals', {
                    body: `You have ${pendingCount} pending ${pendingCount === 1 ? 'communication' : 'communications'} to review`,
                    icon: '/favicon.ico'
                });
            }
        }
    }
}

// Initialize settings
loadSettings();
initSettingsTabs();

// Check for notifications permission
if (Notification.permission === 'default' && appSettings.browserNotifications) {
    requestNotificationPermission();
}

// Check for pending actions periodically
setInterval(checkAndNotify, 30000);