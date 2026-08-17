// ============================================
// C4 SYSTEMS - Utility Functions
// ============================================

// XSS Protection
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Input Sanitization
function sanitizeInput(str) {
    if (!str) return '';
    return str
        .trim()
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .slice(0, 500);
}

// Date Formatting
function formatDateTime(date) {
    if (!date) return 'N/A';
    try {
        const d = date.toDate ? date.toDate() : new Date(date);
        if (isNaN(d.getTime())) return 'Invalid Date';
        return d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return 'Invalid Date';
    }
}

function formatDateMilitary(date) {
    if (!date) return 'N/A';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Invalid Date';
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const day = d.getDate();
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${day} ${month} ${year} ${hours}${minutes}H`;
    } catch (e) {
        return 'Invalid Date';
    }
}

// Toast Notifications
function showToast(message, type = 'success') {
    let icon = 'success';
    let bgColor = '#10b981';

    switch (type) {
        case 'success': icon = 'success'; bgColor = '#10b981'; break;
        case 'error': icon = 'error'; bgColor = '#ef4444'; break;
        case 'warning': icon = 'warning'; bgColor = '#f59e0b'; break;
        case 'info': icon = 'info'; bgColor = '#3b82f6'; break;
    }

    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: icon,
        title: message,
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        background: bgColor,
        color: 'white',
        iconColor: 'white',
        width: '280px',
        padding: '0.5rem 0.75rem',
        customClass: {
            popup: 'compact-toast',
            title: 'compact-title'
        }
    });
}

// Loading Overlay
function showLoading() {
    const loader = document.getElementById('globalLoading');
    if (loader) loader.classList.add('active');
}

function hideLoading() {
    const loader = document.getElementById('globalLoading');
    if (loader) loader.classList.remove('active');
}

// Modal Helpers
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}

// Format File Size
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


// ============================================
// NETWORK STATUS HELPERS
// ============================================

// Check if Firestore is connected
function isFirestoreConnected() {
    return window.isFirestoreConnected !== false;
}

// Update connection status UI
function updateConnectionStatus(status, message) {
    const dot = document.getElementById('connectionDot');
    const text = document.getElementById('connectionText');
    const container = document.getElementById('connectionStatus');
    
    if (!dot || !text || !container) return;
    
    container.className = 'connection-status';
    
    switch(status) {
        case 'online':
            dot.style.background = '#10b981';
            text.textContent = message || 'Online';
            container.classList.remove('offline', 'connecting');
            break;
        case 'offline':
            dot.style.background = '#ef4444';
            text.textContent = message || 'Offline';
            container.classList.add('offline');
            break;
        case 'connecting':
            dot.style.background = '#f59e0b';
            text.textContent = message || 'Connecting...';
            container.classList.add('connecting');
            break;
        default:
            dot.style.background = '#94a3b8';
            text.textContent = message || 'Unknown';
    }
}

// Monitor network status
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        updateConnectionStatus('online', 'Online');
        // Try to reconnect Firestore
        if (typeof setupRealtimeListener === 'function') {
            setTimeout(setupRealtimeListener, 1000);
        }
    });
    
    window.addEventListener('offline', () => {
        updateConnectionStatus('offline', 'Offline');
    });
}