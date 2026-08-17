// js/auth.js
// Authentication functions

function getAuthService() {
    if (window.auth) return window.auth;
    if (window.firebase && firebase.apps && firebase.apps.length) {
        window.auth = firebase.auth();
        window.db = firebase.firestore();
        return window.auth;
    }
    return null;
}

function getDbService() {
    if (window.db) return window.db;
    if (window.firebase && firebase.apps && firebase.apps.length) {
        window.auth = firebase.auth();
        window.db = firebase.firestore();
        return window.db;
    }
    return null;
}

function setFormMessage(elementId, message, type = 'error') {
    const messageEl = document.getElementById(elementId);
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.className = `form-message show ${type}`;
}

function clearFormMessage(elementId) {
    const messageEl = document.getElementById(elementId);
    if (!messageEl) return;

    messageEl.textContent = '';
    messageEl.className = 'form-message';
}

function setButtonLoading(button, isLoading, loadingText) {
    if (!button) return;

    if (isLoading) {
        button.dataset.originalHtml = button.innerHTML;
        button.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span><span>${loadingText}</span>`;
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
    } else {
        button.innerHTML = button.dataset.originalHtml || button.innerHTML;
        button.disabled = false;
        button.removeAttribute('aria-busy');
        delete button.dataset.originalHtml;
    }
}

function getFriendlyAuthError(error) {
    switch (error?.code) {
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'The email or password does not match our records.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please wait a few minutes and try again.';
        case 'auth/network-request-failed':
            return 'Network problem. Check your internet connection and try again.';
        case 'auth/email-already-in-use':
            return 'This email is already registered. Try signing in instead.';
        case 'auth/weak-password':
            return 'Password is too weak. Use at least 6 characters.';
        default:
            return error?.message || 'Something went wrong. Please try again.';
    }
}

async function handleLogin() {
    const authService = getAuthService();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;

    clearFormMessage('loginError');

    if (!email || !password) {
        setFormMessage('loginError', 'Please enter your email and password.', 'error');
        return;
    }

    if (!authService) {
        setFormMessage('loginError', 'Login service is still loading. Please refresh the page.', 'error');
        return;
    }

    const btn = document.querySelector('#loginForm .btn');
    setButtonLoading(btn, true, 'Signing in...');

    try {
        const persistence = rememberMe ?
            firebase.auth.Auth.Persistence.LOCAL :
            firebase.auth.Auth.Persistence.SESSION;
        await authService.setPersistence(persistence);
        await authService.signInWithEmailAndPassword(email, password);
        setFormMessage('loginError', 'Signed in. Loading your dashboard...', 'success');
        window.location.href = 'index.html';
    } catch (error) {
        setFormMessage('loginError', getFriendlyAuthError(error), 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

async function handleSignup() {
    const authService = getAuthService();
    const dbService = getDbService();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    clearFormMessage('signupError');

    if (!name) {
        setFormMessage('signupError', 'Please enter your name.', 'error');
        return;
    }

    if (!email) {
        setFormMessage('signupError', 'Please enter your email.', 'error');
        return;
    }

    if (password.length < 6) {
        setFormMessage('signupError', 'Password must be at least 6 characters.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        setFormMessage('signupError', 'Passwords do not match.', 'error');
        return;
    }

    if (!authService || !dbService) {
        setFormMessage('signupError', 'Signup service is still loading. Please refresh the page.', 'error');
        return;
    }

    const btn = document.querySelector('#signupForm .btn');
    setButtonLoading(btn, true, 'Creating account...');

    try {
        const userCredential = await authService.createUserWithEmailAndPassword(email, password);
        setFormMessage('signupError', 'Saving your profile...', 'info');
        await userCredential.user.updateProfile({ displayName: name });
        await dbService.collection('users').doc(userCredential.user.uid).set({
            email: email, name: name, createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            transactions: [], goals: [], bills: [], monthlyBudget: 0, debtGoal: 0, savingsGoal: 0
        });
        await userCredential.user.sendEmailVerification();
        setFormMessage('signupError', 'Account created. Loading your dashboard...', 'success');
        window.location.href = 'index.html';
    } catch (error) {
        setFormMessage('signupError', getFriendlyAuthError(error), 'error');
    } finally {
        setButtonLoading(btn, false);
    }
}

async function showForgotPassword() {
    const authService = getAuthService();
    const emailInput = document.getElementById('loginEmail');
    const email = emailInput.value.trim();

    clearFormMessage('loginError');

    if (!email) {
        setFormMessage('loginError', 'Enter your email first, then tap Forgot Password again.', 'info');
        emailInput.focus();
        return;
    }

    if (!authService) {
        setFormMessage('loginError', 'Password reset is still loading. Please refresh the page.', 'error');
        return;
    }

    try {
        setFormMessage('loginError', 'Sending password reset email...', 'info');
        await authService.sendPasswordResetEmail(email);
        setFormMessage('loginError', 'Password reset email sent. Please check your inbox.', 'success');
    } catch (error) {
        setFormMessage('loginError', getFriendlyAuthError(error), 'error');
    }
}

function showToast(message, type) {
    // Simple toast implementation for login page
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; bottom: 20px; left: 20px; right: 20px;
        background: ${type === 'error' ? '#ef4444' : '#10b981'};
        color: white; padding: 12px 20px; border-radius: 12px;
        text-align: center; z-index: 10000; animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
