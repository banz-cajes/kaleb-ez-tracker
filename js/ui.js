// ============================================
// C4 SYSTEMS - UI Enhancements
// ============================================

// Quick Filters
function initQuickFilters() {
    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', function() {
            chips.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            const filter = this.dataset.filter;
            if (filter === 'all') {
                setActiveView('all');
            } else {
                setActiveView(filter);
            }
        });
    });
}

// Enhanced Stat Cards
function enhanceStatCards() {
    const statCards = document.querySelectorAll('.stat-card');
    const views = ['all', 'draft', 'pending', 'approved', 'released', 'rejected', 'compliance'];

    statCards.forEach((card, index) => {
        if (views[index]) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                if (views[index] === 'compliance') {
                    showComplianceSummary();
                } else {
                    setActiveView(views[index]);
                    document.querySelectorAll('.filter-chip').forEach(chip => {
                        if (chip.dataset.filter === views[index]) {
                            chip.classList.add('active');
                        } else {
                            chip.classList.remove('active');
                        }
                    });
                }
            });
        }
    });
}

function showComplianceSummary() {
    if (typeof allCommunications === 'undefined' || !allCommunications) {
        showToast('No data available', 'info');
        return;
    }
    
    const commsWithCompliance = allCommunications.filter(c => c.compliance && c.compliance.length > 0);

    if (commsWithCompliance.length === 0) {
        showToast('No compliance items found', 'info');
        return;
    }

    let totalCompliance = 0;
    let pendingCompliance = 0;
    let submittedCompliance = 0;
    let overdueCompliance = 0;

    commsWithCompliance.forEach(comm => {
        comm.compliance.forEach(item => {
            totalCompliance++;
            if (item.status === 'submitted') {
                submittedCompliance++;
            } else {
                if (item.targetDate && new Date(item.targetDate) < new Date()) {
                    overdueCompliance++;
                }
                pendingCompliance++;
            }
        });
    });

    Swal.fire({
        title: 'Compliance Summary',
        html: `
            <div style="text-align: left;">
                <p><strong>Total Compliance Items:</strong> ${totalCompliance}</p>
                <p><strong>Pending:</strong> ${pendingCompliance}</p>
                <p><strong>Submitted:</strong> ${submittedCompliance}</p>
                <p><strong>Overdue:</strong> ${overdueCompliance}</p>
                <hr>
                <p><strong>Communications with Compliance:</strong> ${commsWithCompliance.length}</p>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'OK'
    });
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl + N: New Communication
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (typeof permissions !== 'undefined' && permissions.canCreate) {
            if (typeof toggleForm === 'function') toggleForm();
        } else {
            showToast('No permission to create', 'error');
        }
    }

    // Ctrl + F: Focus Search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
        showToast('Search focused', 'info');
    }

    // Ctrl + R: Refresh Data
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (typeof refreshData === 'function') refreshData();
    }

    // Ctrl + S: Save Form
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const form = document.getElementById('form-container');
        if (form && form.classList.contains('active')) {
            document.getElementById('comms-form')?.dispatchEvent(new Event('submit'));
        }
    }

    // Escape: Close Modal
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            if (modal.style.display === 'flex') {
                closeModal(modal.id);
            }
        });
    }

    // Ctrl + /: Show Shortcuts Help
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        showShortcutsHelp();
    }
});

function showShortcutsHelp() {
    Swal.fire({
        title: 'Keyboard Shortcuts',
        html: `
            <div style="text-align: left;">
                <p><kbd>Ctrl + N</kbd> - New Communication</p>
                <p><kbd>Ctrl + F</kbd> - Focus Search</p>
                <p><kbd>Ctrl + R</kbd> - Refresh Data</p>
                <p><kbd>Ctrl + S</kbd> - Save Form</p>
                <p><kbd>Esc</kbd> - Close Modal</p>
                <p><kbd>Ctrl + /</kbd> - Show this help</p>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Got it'
    });
}

// Initialize UI on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initQuickFilters();
    enhanceStatCards();
    
    // Load theme preference
    const savedTheme = localStorage.getItem('theme_preference');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const icon = document.getElementById('themeIcon');
        if (icon) icon.className = 'fas fa-sun';
    }
});