// js/auth.js
// Authentication functions

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    const errorDiv = document.getElementById('loginError');

    errorDiv.classList.remove('show');
    errorDiv.textContent = '';

    if (!email || !password) {
        errorDiv.textContent = 'Please enter email and password';
        errorDiv.classList.add('show');
        return;
    }

    const btn = document.querySelector('#loginForm .btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    btn.disabled = true;

    try {
        const persistence = rememberMe ?
            firebase.auth.Auth.Persistence.LOCAL :
            firebase.auth.Auth.Persistence.SESSION;
        await auth.setPersistence(persistence);
        await auth.signInWithEmailAndPassword(email, password);
        window.location.href = 'index.html';
    } catch (error) {
        let errorMessage = 'Invalid email or password.';
        if (error.code === 'auth/user-not-found') errorMessage = 'No account found with this email';
        else if (error.code === 'auth/wrong-password') errorMessage = 'Incorrect password';
        else if (error.code === 'auth/too-many-requests') errorMessage = 'Too many attempts. Try again later.';
        errorDiv.textContent = errorMessage;
        errorDiv.classList.add('show');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function handleSignup() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const errorDiv = document.getElementById('signupError');

    errorDiv.classList.remove('show');
    errorDiv.textContent = '';

    if (!name) {
        errorDiv.textContent = 'Please enter your name';
        errorDiv.classList.add('show');
        return;
    }

    if (!email) {
        errorDiv.textContent = 'Please enter your email';
        errorDiv.classList.add('show');
        return;
    }

    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters';
        errorDiv.classList.add('show');
        return;
    }

    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.classList.add('show');
        return;
    }

    const btn = document.querySelector('#signupForm .btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    btn.disabled = true;

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });
        await db.collection('users').doc(userCredential.user.uid).set({
            email: email, name: name, createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            transactions: [], goals: [], bills: [], monthlyBudget: 0, debtGoal: 0, savingsGoal: 0
        });
        await userCredential.user.sendEmailVerification();
        window.location.href = 'index.html';
    } catch (error) {
        let errorMessage = 'Signup failed. ';
        if (error.code === 'auth/email-already-in-use') errorMessage = 'Email already registered. Please sign in.';
        else if (error.code === 'auth/weak-password') errorMessage = 'Password is too weak.';
        else errorMessage += error.message;
        errorDiv.textContent = errorMessage;
        errorDiv.classList.add('show');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function showForgotPassword() {
    const email = prompt('Enter your email address to reset your password:');
    if (email) {
        auth.sendPasswordResetEmail(email)
            .then(() => alert('Password reset email sent! Check your inbox.'))
            .catch(error => alert('Error: ' + error.message));
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