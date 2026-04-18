// js/notifications.js - FIXED VERSION
// Sileo Notification System

class SileoNotification {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.maxVisible = 5;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createContainer());
        } else {
            this.createContainer();
        }
    }

    createContainer() {
        // Check if container already exists
        let container = document.getElementById('sileo-container');

        if (!container) {
            container = document.createElement('div');
            container.id = 'sileo-container';
            document.body.appendChild(container);
        }

        this.container = container;
    }

    show(options) {
        // Ensure container exists
        if (!this.container) {
            this.createContainer();
        }

        const {
            title = '',
            message = '',
            type = 'info',
            duration = 3000,
            icon = null,
            onClick = null
        } = options;

        if (!message) return null;

        const notification = document.createElement('div');
        notification.className = `sileo-notification ${type}`;

        let iconHtml = '';
        if (icon) {
            iconHtml = `<i class="${icon}"></i>`;
        } else {
            switch (type) {
                case 'success':
                    iconHtml = '<i class="fas fa-check-circle"></i>';
                    break;
                case 'error':
                    iconHtml = '<i class="fas fa-times-circle"></i>';
                    break;
                case 'warning':
                    iconHtml = '<i class="fas fa-exclamation-triangle"></i>';
                    break;
                case 'loading':
                    iconHtml = '<i class="fas fa-spinner"></i>';
                    break;
                default:
                    iconHtml = '<i class="fas fa-info-circle"></i>';
            }
        }

        notification.innerHTML = `
            <div class="sileo-notification-content">
                <div class="sileo-notification-icon">${iconHtml}</div>
                <div class="sileo-notification-text">
                    ${title ? `<div class="sileo-notification-title">${this.escapeHtml(title)}</div>` : ''}
                    <div class="sileo-notification-message">${this.escapeHtml(message)}</div>
                </div>
            </div>
            ${duration > 0 ? '<div class="sileo-notification-progress"><div class="sileo-notification-progress-bar"></div></div>' : ''}
        `;

        if (onClick) {
            notification.style.cursor = 'pointer';
            notification.addEventListener('click', () => {
                onClick();
                this.remove(notification);
            });
        }

        this.container.appendChild(notification);
        this.notifications.push(notification);

        if (duration > 0) {
            const timeoutId = setTimeout(() => {
                this.remove(notification);
            }, duration);
            notification._timeoutId = timeoutId;
        }

        this.manageStack();
        return notification;
    }

    remove(notification) {
        if (!notification || !notification.parentNode) return;

        if (notification._timeoutId) {
            clearTimeout(notification._timeoutId);
        }

        notification.classList.add('sileo-exit');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
                const index = this.notifications.indexOf(notification);
                if (index > -1) this.notifications.splice(index, 1);
            }
        }, 300);
    }

    manageStack() {
        while (this.notifications.length > this.maxVisible) {
            const oldest = this.notifications[0];
            if (oldest) this.remove(oldest);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    success(message, title = 'Success', duration = 3000) {
        return this.show({ title, message, type: 'success', duration });
    }

    error(message, title = 'Error', duration = 4000) {
        return this.show({ title, message, type: 'error', duration });
    }

    warning(message, title = 'Warning', duration = 4000) {
        return this.show({ title, message, type: 'warning', duration });
    }

    info(message, title = 'Info', duration = 3000) {
        return this.show({ title, message, type: 'info', duration });
    }

    loading(message, title = 'Please wait', duration = 0) {
        return this.show({ title, message, type: 'loading', duration });
    }

    async promise(promise, options = {}) {
        const {
            loadingMessage = 'Processing...',
            loadingTitle = 'Please wait',
            successMessage = 'Completed successfully!',
            successTitle = 'Success',
            errorMessage = 'Operation failed',
            errorTitle = 'Error',
            onSuccess = null,
            onError = null
        } = options;

        const loadingNotif = this.loading(loadingMessage, loadingTitle);

        try {
            const result = await promise;
            this.remove(loadingNotif);
            this.success(successMessage, successTitle);
            if (onSuccess) onSuccess(result);
            return result;
        } catch (error) {
            this.remove(loadingNotif);
            const finalErrorMessage = errorMessage === 'Operation failed' && error.message ? error.message : errorMessage;
            this.error(finalErrorMessage, errorTitle);
            if (onError) onError(error);
            throw error;
        }
    }
}

// Initialize global sileo notifications (wait for DOM)
let sileo;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        sileo = new SileoNotification();
        window.sileo = sileo;
    });
} else {
    sileo = new SileoNotification();
    window.sileo = sileo;
}

// Toast fallback function
window.showToast = function (message, type = 'success') {
    if (window.sileo) {
        switch (type) {
            case 'success': window.sileo.success(message); break;
            case 'danger': case 'error': window.sileo.error(message); break;
            case 'warning': window.sileo.warning(message); break;
            default: window.sileo.info(message);
        }
    } else {
        // Fallback alert if sileo not ready
        console.log(`${type}: ${message}`);
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.className = type === 'success' ? 'toast-success' : type === 'danger' ? 'toast-danger' : 'toast-warning';
            toast.style.display = 'block';
            setTimeout(() => toast.style.display = 'none', 3000);
        } else {
            alert(message);
        }
    }
};

// ===== FREE EMAIL TO SMS (Works for PH numbers) =====

async function sendFreeSMS(phoneNumber, message) {
    // Detect mobile network
    const prefix = phoneNumber.substring(0, 4);
    let emailAddress = '';

    // Philippine mobile prefixes
    if (prefix === '0917' || prefix === '0918' || prefix === '0919' ||
        prefix === '0920' || prefix === '0921' || prefix === '0927' ||
        prefix === '0928' || prefix === '0929' || prefix === '0939' ||
        prefix === '0997' || prefix === '0998' || prefix === '0999') {
        // Globe / TM / GCash
        emailAddress = `${phoneNumber}@globe.com.ph`;
    }
    else if (prefix === '0908' || prefix === '0909' || prefix === '0910' ||
        prefix === '0912' || prefix === '0913' || prefix === '0914' ||
        prefix === '0915' || prefix === '0916' || prefix === '0917' ||
        prefix === '0926' || prefix === '0927' || prefix === '0928' ||
        prefix === '0929' || prefix === '0939' || prefix === '0949' ||
        prefix === '0950' || prefix === '0951' || prefix === '0955') {
        // Smart / TNT / Sun
        emailAddress = `${phoneNumber}@smart.com.ph`;
    }
    else {
        // Default to Globe
        emailAddress = `${phoneNumber}@globe.com.ph`;
    }

    // Send via email (using mailto: - opens email app)
    const subject = encodeURIComponent('Kaleb Tracker Alert');
    const body = encodeURIComponent(message);
    window.location.href = `mailto:${emailAddress}?subject=${subject}&body=${body}`;

    return true;
}

// Simpler version - Just show notification to copy
function sendSMSviaCopy(phoneNumber, message) {
    const smsLink = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;

    // Try to open SMS app
    window.location.href = smsLink;

    // Fallback: Copy to clipboard
    navigator.clipboard.writeText(`${message}\n\nSend to: ${phoneNumber}`);
    showToast('Message copied! Paste in your SMS app.', 'info');
}

// Register Service Worker for push notifications
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registered');
            return registration;
        } catch (error) {
            console.log('Service Worker registration failed:', error);
        }
    }
    return null;
}

// Request notification permission with better UX
async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.log("Browser doesn't support notifications");
        return false;
    }

    // Check if already granted
    if (Notification.permission === "granted") {
        await registerServiceWorker();
        return true;
    }

    // Check if denied
    if (Notification.permission === "denied") {
        if (window.sileo) {
            window.sileo.warning('Notifications are blocked. Please enable in browser settings.', 'Permission Blocked');
        }
        return false;
    }

    // Request permission
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
        // Register service worker for better notifications
        await registerServiceWorker();
        return true;
    }

    return false;
}

(function tryRegisterServiceWorkerOnLoad() {
    function run() {
        registerServiceWorker().catch(function () { });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();