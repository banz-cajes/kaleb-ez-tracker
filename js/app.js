

// ============================================
// C4 SYSTEMS - Main Application
// ============================================

let allCommunications = [];
let editId = null;
let currentPage = 1;
let itemsPerPage = 10;
let currentMonthFilter = 'all';
let currentYearFilter = 'all';
let currentStatusFilter = 'all';
let currentView = 'all';
let selectedItems = new Set();
let unsubscribeListener = null;
let hideAccounts = false;
let nrGenerationLock = false;

const allRoles = ['Specialist', 'POIC', 'AN6A', 'N6A', 'N6B', 'N6C', 'N6D', 'N6E', 'N6F', 'N6G', 'EXO', 'DN6', 'N6'];

// ============================================
// INITIALIZATION
// ============================================

function initApp() {
    console.log('🚀 Initializing C4 SYSTEMS...');

    if (typeof loadSettings === 'function') {
        loadSettings();
        if (appSettings && appSettings.itemsPerPage) {
            itemsPerPage = appSettings.itemsPerPage;
        }
    }

        // ============================================
    // Initialize compliance badge on load
    // ============================================
    setTimeout(() => {
        updateComplianceBadge();
    }, 1000);

    const yearSelect = document.getElementById('sidebarYearSelect');
    if (yearSelect) {
        const currentYear = new Date().getFullYear();
        yearSelect.innerHTML = '<option value="all">All Years</option>';
        for (let y = currentYear - 5; y <= currentYear + 2; y++) {
            const option = document.createElement('option');
            option.value = y;
            option.textContent = y;
            if (y === currentYear) option.selected = true;
            yearSelect.appendChild(option);
        }
    }

    const container = document.getElementById('distributionCheckboxes');
    if (container) {
        container.innerHTML = allRoles.map(role =>
            `<div class="role-checkbox-item">
                <input type="checkbox" id="dist_${role}" value="${role}">
                <label for="dist_${role}">${role}</label>
            </div>`
        ).join('');
    }

    const form = document.getElementById('comms-form');
    if (form) form.addEventListener('submit', handleFormSubmit);

    const typeSelect = document.getElementById('type');
    if (typeSelect) typeSelect.addEventListener('change', toggleRecurrenceFields);

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', () => renderTable());

    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('moreDropdown');
        if (dropdown && !e.target.closest('.dropdown')) dropdown.classList.remove('show');
    });

    setCurrentMonth();
    setActiveView('all');
    setupRealtimeListener();

    console.log('✅ Initialization complete. Items per page:', itemsPerPage);
}

// ============================================
// REALTIME LISTENER - FIXED
// ============================================

function setupRealtimeListener() {
    if (unsubscribeListener) unsubscribeListener();
    if (!db || !currentUser) return;

    unsubscribeListener = db.collection("comms_monitoring")
        .orderBy("createdAt", "desc")
        .onSnapshot(snapshot => {
            try {
                let comms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                // DON'T filter for viewers - they can view all communications
                // Only filter if user is NOT an admin/approver AND has canViewAll = false
                // But since we set canViewAll to true for all roles above, this filter is now redundant
                // Keep it only for debugging or remove it
                
                allCommunications = comms;
                updateStats();
                renderTable();
                
                // Update compliance badge
                updateComplianceBadge();

                const analyticsView = document.getElementById('analyticsView');
                if (analyticsView && analyticsView.style.display !== 'none') {
                    if (typeof updateAnalyticsDashboard === 'function') {
                        updateAnalyticsDashboard();
                    }
                }

                const complianceView = document.getElementById('complianceView');
                if (complianceView && complianceView.style.display !== 'none') {
                    if (typeof renderComplianceView === 'function') {
                        renderComplianceView();
                    }
                }
            } catch (error) {
                console.error('Snapshot error:', error);
            }
        }, error => {
            console.error('Listener error:', error);
        });
}

// ============================================
// VIEW MANAGEMENT
// ============================================

window.setActiveView = function(view) {
    currentView = view;
    currentStatusFilter = view === 'pending' ? 'pending_filter' : (view === 'dashboard' ? 'all' : view);

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    const dashboardView = document.getElementById('dashboardView');
    const allCommsView = document.getElementById('allCommsView');
    const analyticsView = document.getElementById('analyticsView');
    const complianceView = document.getElementById('complianceView');

    if (dashboardView) dashboardView.style.display = 'none';
    if (allCommsView) allCommsView.style.display = 'none';
    if (analyticsView) analyticsView.style.display = 'none';
    if (complianceView) complianceView.style.display = 'none';

    if (view === 'dashboard') {
        if (dashboardView) dashboardView.style.display = 'block';
        document.getElementById('pageTitle').textContent = 'Dashboard';
        document.getElementById('pageSubtitle').textContent = 'Manage and track all communications';

    } else if (view === 'analytics') {
        if (analyticsView) analyticsView.style.display = 'block';
        document.getElementById('pageTitle').textContent = 'Analytics Dashboard';
        document.getElementById('pageSubtitle').textContent = 'Communication insights and metrics';

        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.querySelector('span')?.textContent === 'Analytics') {
                item.classList.add('active');
            }
        });

        setTimeout(() => {
            if (allCommunications && allCommunications.length > 0) {
                if (typeof updateAnalyticsDashboard === 'function') {
                    updateAnalyticsDashboard();
                }
            } else if (typeof showEmptyAnalytics === 'function') {
                showEmptyAnalytics();
            }
        }, 100);
        return;

    } else if (view === 'compliance') {
        if (complianceView) complianceView.style.display = 'block';
        document.getElementById('pageTitle').textContent = 'Compliance Management';
        document.getElementById('pageSubtitle').textContent = 'Track and manage compliance requirements';

        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.querySelector('span')?.textContent === 'Compliance') {
                item.classList.add('active');
            }
        });

        setTimeout(() => {
            if (typeof renderComplianceView === 'function') {
                renderComplianceView();
            }
        }, 100);
        return;

    } else {
        if (allCommsView) allCommsView.style.display = 'block';
        document.getElementById('pageTitle').textContent = view === 'all' ? 'All Communications' :
            view.charAt(0).toUpperCase() + view.slice(1) + ' Communications';
        document.getElementById('pageSubtitle').textContent = 'Manage and track all communications';

        document.querySelectorAll('.nav-item').forEach(item => {
            const itemText = item.querySelector('span')?.textContent;
            if (itemText === 'All Communications' && view === 'all') {
                item.classList.add('active');
            } else if (itemText === view.charAt(0).toUpperCase() + view.slice(1) + ' Communications') {
                item.classList.add('active');
            } else if (itemText === 'Pending Approval' && view === 'pending') {
                item.classList.add('active');
            }
        });
    }

    renderTable();
};

// ============================================
// STATS UPDATE
// ============================================

function updateStats() {
    const currentMonth = currentMonthFilter !== 'all' ? parseInt(currentMonthFilter) : null;
    const currentYear = currentYearFilter !== 'all' ? parseInt(currentYearFilter) : null;

    const matchesDateFilter = (comm) => {
        if (!currentMonth && !currentYear) return true;

        let dateToUse = null;
        if (comm.status === 'released' && comm.releaseInfo?.dateTime) {
            dateToUse = new Date(comm.releaseInfo.dateTime);
        } else if (comm.createdAt) {
            dateToUse = comm.createdAt.toDate ? comm.createdAt.toDate() : new Date(comm.createdAt);
        }

        if (!dateToUse) return false;

        const month = dateToUse.getMonth() + 1;
        const year = dateToUse.getFullYear();

        if (currentMonth && currentYear) {
            return month === currentMonth && year === currentYear;
        }
        if (currentMonth) return month === currentMonth;
        if (currentYear) return year === currentYear;
        return true;
    };

    const filteredComms = allCommunications.filter(matchesDateFilter);

    const pendingCount = filteredComms.filter(c => isPendingApproval(c)).length;
    const complianceCount = filteredComms.reduce((acc, c) => acc + (c.compliance?.length || 0), 0);

    const stats = {
        total: filteredComms.length,
        draft: filteredComms.filter(c => c.status === 'draft').length,
        pending: pendingCount,
        approved: filteredComms.filter(c => c.status === 'approved').length,
        released: filteredComms.filter(c => c.status === 'released').length,
        rejected: filteredComms.filter(c => c.status === 'rejected').length,
        compliance: complianceCount,
    };

    document.getElementById('totalCount').textContent = stats.total;
    document.getElementById('draftCount').textContent = stats.draft;
    document.getElementById('pendingCount').textContent = stats.pending;
    document.getElementById('approvedCount').textContent = stats.approved;
    document.getElementById('releasedCount').textContent = stats.released;
    document.getElementById('rejectedCount').textContent = stats.rejected;
    document.getElementById('complianceCount').textContent = stats.compliance;

    // Sidebar badges
    document.getElementById('sidebarAllBadge').textContent = allCommunications.length;
    document.getElementById('sidebarDraftBadge').textContent = allCommunications.filter(c => c.status === 'draft').length;
    document.getElementById('sidebarPendingBadge').textContent = allCommunications.filter(c => isPendingApproval(c)).length;
    document.getElementById('sidebarApprovedBadge').textContent = allCommunications.filter(c => c.status === 'approved').length;
    document.getElementById('sidebarReleasedBadge').textContent = allCommunications.filter(c => c.status === 'released').length;
    document.getElementById('sidebarRejectedBadge').textContent = allCommunications.filter(c => c.status === 'rejected').length;
    
    // ============================================
    // FIX: UPDATE COMPLIANCE BADGE ON PAGE LOAD
    // ============================================
    updateComplianceBadge();
}

// ============================================
// NEW: Update Compliance Badge Count
// ============================================
function updateComplianceBadge() {
    let pendingCount = 0;
    let overdueCount = 0;
    
    allCommunications.forEach(comm => {
        if (comm.compliance && comm.compliance.length > 0) {
            comm.compliance.forEach(item => {
                const status = item.status || 'pending';
                const targetDate = new Date(item.targetDate);
                const now = new Date();
                
                // Count pending (not submitted and not overdue)
                if (status === 'pending' && targetDate >= now) {
                    pendingCount++;
                }
                // Count overdue (not submitted and past due date)
                else if (status !== 'submitted' && targetDate < now) {
                    overdueCount++;
                }
            });
        }
    });
    
    const total = pendingCount + overdueCount;
    const badge = document.getElementById('sidebarComplianceBadge');
    if (badge) {
        badge.textContent = total || 0;
        badge.style.background = total > 0 ? '#ef4444' : '#64748b';
        badge.title = `${total} items needing attention (${pendingCount} pending, ${overdueCount} overdue)`;
    }
}

// ============================================
// PENDING APPROVAL CHECK
// ============================================

function isPendingApproval(comm) {
    const status = comm.status;
    if (status === 'released' || status === 'rejected' || status === 'approved') return false;
    const approvals = comm.approvals || {};
    const distribution = comm.distribution || allRoles;
    const approvedCount = Object.values(approvals).filter(a => a.status === 'approve').length;
    const rejectedCount = Object.values(approvals).filter(a => a.status === 'reject').length;
    return approvedCount < distribution.length && rejectedCount === 0;
}

// ============================================
// RENDER TABLE
// ============================================

function renderTable() {
    const body = document.getElementById('comms-body');
    if (!body) return;
    
    // Skip table rendering for non-communication views
    if (currentView === 'dashboard' || currentView === 'analytics' || currentView === 'compliance') {
        return;
    }

    let filtered = [...allCommunications];

    if (currentMonthFilter !== 'all' || currentYearFilter !== 'all') {
        filtered = filtered.filter(comm => {
            try {
                let dateToUse = null;
                if (comm.status === 'released' && comm.releaseInfo?.dateTime) {
                    dateToUse = new Date(comm.releaseInfo.dateTime);
                } else if (comm.createdAt) {
                    dateToUse = comm.createdAt.toDate ? comm.createdAt.toDate() : new Date(comm.createdAt);
                }
                if (!dateToUse || isNaN(dateToUse.getTime())) return false;

                const month = dateToUse.getMonth() + 1;
                const year = dateToUse.getFullYear();

                if (currentMonthFilter !== 'all' && currentYearFilter !== 'all') {
                    return month === parseInt(currentMonthFilter) && year === parseInt(currentYearFilter);
                }
                if (currentMonthFilter !== 'all') return month === parseInt(currentMonthFilter);
                if (currentYearFilter !== 'all') return year === parseInt(currentYearFilter);
                return true;
            } catch (e) {
                return false;
            }
        });
    }

    if (currentStatusFilter !== 'all') {
        if (currentStatusFilter === 'pending_filter') {
            filtered = filtered.filter(comm => isPendingApproval(comm));
        } else {
            filtered = filtered.filter(comm => comm.status === currentStatusFilter);
        }
    }

    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(comm => {
            if (comm.subject?.toLowerCase().includes(searchTerm)) return true;
            if (comm.nr?.toLowerCase().includes(searchTerm)) return true;
            if (comm.releaseInfo?.number?.toLowerCase().includes(searchTerm)) return true;
            if (comm.type?.toLowerCase().includes(searchTerm)) return true;
            return false;
        });
    }

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages || totalPages === 0;
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages || 1}`;

    if (!paginated.length) {
        body.innerHTML = `
            <tr class="empty-state">
                <td colspan="8">
                    <i class="fas fa-inbox"></i>
                    <p>No communications found</p>
                    <button class="btn btn-primary" onclick="toggleForm()">Add Your First</button>
                </td>
            </tr>
        `;
        return;
    }

    body.innerHTML = paginated.map(comm => {
        const status = comm.status || 'draft';
        const approvals = comm.approvals || {};
        const distribution = comm.distribution || [];
        const n6Approved = approvals['N6']?.status === 'approve';
        const showReleaseButton = n6Approved && !['released', 'rejected'].includes(status) && permissions.canRelease;
        const canEdit = permissions.canEdit && status === 'draft';
        const canApprove = permissions.canApprove && !['released', 'rejected'].includes(status);
        const canDelete = permissions.canDelete;

        return `
            <tr>
                <td><input type="checkbox" class="row-checkbox" value="${comm.id}" onchange="toggleSelect('${comm.id}')"></td>
                <td><strong>${escapeHtml(comm.nr || 'N/A')}</strong></td>
                <td>
                    <div class="subject-with-type">
                        <div class="comm-subject">${escapeHtml(comm.subject || 'N/A')}</div>
                        <div class="comm-type">${escapeHtml(comm.type || 'Radio Message')}</div>
                        ${getRecurrenceDisplay(comm)}
                    </div>
                </td>
                <td>
                    ${getDistributionSummary(distribution, approvals)}
                    <button class="action-btn view" onclick='openDistributionModal("${comm.id}")' title="View Details">
                        <i class="fas fa-list"></i>
                    </button>
                </td>
                <td>${getCombinedStatusDisplay(status, comm.releaseInfo)}</td>
                <td>
                    ${getComplianceDisplay(comm.compliance || [], comm.id)}
                    <button class="action-btn compliance" onclick='openComplianceModal("${comm.id}")' title="Manage Compliance">
                        <i class="fas fa-clipboard-list"></i>
                    </button>
                </td>
                <td class="remarks-cell">
                    <div style="white-space: pre-wrap; word-break: break-word;">${escapeHtml((comm.remarks || '—'))}</div>
                    <button class="remarks-edit-btn" onclick="openRemarksModal('${comm.id}', '${escapeHtml(comm.remarks || '').replace(/'/g, "\\'")}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn view" onclick='openTimelineModal("${comm.id}")' title="Timeline">
                            <i class="fas fa-history"></i>
                        </button>
                        ${canEdit ? `<button class="action-btn" onclick='editLog("${comm.id}")' title="Edit"><i class="fas fa-edit"></i></button>` : ''}
                        ${canApprove ? `<button class="action-btn approve" onclick='openApprovalModal("${comm.id}")' title="Approve/Reject"><i class="fas fa-check-circle"></i></button>` : ''}
                        ${showReleaseButton ? `<button class="action-btn release" onclick="openReleaseModal('${comm.id}')" title="Release"><i class="fas fa-paper-plane"></i></button>` : ''}
                        ${canDelete ? `<button class="action-btn delete" onclick="deleteLog('${comm.id}')" title="Delete"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    clearSelection();
}

// ============================================
// HELPER FUNCTIONS FOR TABLE RENDERING
// ============================================

function getDistributionSummary(distribution = [], approvals = {}) {
    if (!distribution.length) return '<span>None</span>';
    let html = '<div class="distribution-summary">';
    distribution.forEach(role => {
        const status = approvals[role]?.status || 'pending';
        const statusClass = status === 'approve' ? 'approved' : (status === 'reject' ? 'rejected' : 'pending');
        const icon = status === 'approve' ? '✓' : (status === 'reject' ? '✗' : '⏳');
        html += `<span class="dist-role ${statusClass}" title="${role}: ${status}">${icon} ${escapeHtml(role)}</span>`;
    });
    html += '</div>';
    return html;
}

function getCombinedStatusDisplay(status, releaseInfo) {
    if (status === 'released' && releaseInfo) {
        return `
            <div class="release-info">
                <span class="status-badge released"><i class="fas fa-paper-plane"></i> Released</span>
                <span class="release-number">#${escapeHtml(releaseInfo.number || 'N/A')}</span>
                <span class="release-date">${releaseInfo.dateTime ? formatDateTime(releaseInfo.dateTime) : ''}</span>
            </div>
        `;
    }
    const badges = {
        'draft': '<span class="status-badge draft"><i class="fas fa-pen"></i> Draft</span>',
        'pending': '<span class="status-badge pending"><i class="fas fa-clock"></i> Pending</span>',
        'approved': '<span class="status-badge approved"><i class="fas fa-check-circle"></i> Approved</span>',
        'rejected': '<span class="status-badge rejected"><i class="fas fa-times-circle"></i> Rejected</span>'
    };
    return badges[status] || badges.pending;
}

function getRecurrenceDisplay(comm) {
    if (comm.type !== 'Report' || !comm.recurrence || comm.recurrence === 'none') return '';
    const labels = { weekly: 'Weekly', monthly: 'Monthly', semi_annual: 'Semi-annual', annually: 'Annual' };
    const due = comm.nextDueDate ? ` · Next: ${formatRecurrenceDate(comm.nextDueDate)}` : '';
    return `<div class="recurrence-badge"><i class="fas fa-repeat"></i> ${labels[comm.recurrence] || comm.recurrence}${due}</div>`;
}

function formatRecurrenceDate(value) {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? escapeHtml(value) : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getComplianceDisplay(compliance = [], commId) {
    if (!compliance.length) return '<span>None</span>';
    let html = '<div class="compliance-list">';
    compliance.forEach((c, idx) => {
        try {
            const targetDateTime = new Date(c.targetDate);
            const submissionDateTime = c.submissionDate ? new Date(c.submissionDate) : null;
            const now = new Date();

            let statusClass = 'pending';
            let statusText = '⏳ Pending';
            let dateDisplay = '';

            if (c.status === 'submitted' && submissionDateTime) {
                if (submissionDateTime > targetDateTime) {
                    statusClass = 'late';
                    statusText = '⚠ LATE';
                } else {
                    statusClass = 'ontime';
                    statusText = '✓ ON TIME';
                }
                dateDisplay = `<div style="font-size:0.55rem;">Submitted: ${formatDateMilitary(submissionDateTime)}</div>`;
            } else if (targetDateTime < now) {
                statusClass = 'overdue';
                statusText = '⚠ OVERDUE';
                dateDisplay = `<div style="font-size:0.55rem;">Due: ${formatDateMilitary(targetDateTime)}</div>`;
            } else {
                statusClass = 'pending';
                statusText = '⏳ PENDING';
                dateDisplay = `<div style="font-size:0.55rem;">Due: ${formatDateMilitary(targetDateTime)}</div>`;
            }

            html += `
                <div class="compliance-item ${statusClass === 'overdue' || statusClass === 'late' ? 'overdue' : ''}" 
                     onclick="openComplianceDetailsModal('${commId}', ${idx})">
                    <div class="compliance-unit">${escapeHtml(c.unit || 'Unknown')}</div>
                    <div><span class="compliance-badge ${statusClass}">${statusText}</span></div>
                    ${dateDisplay}
                </div>
            `;
        } catch (e) {}
    });
    html += '</div>';
    return html;
}

// ============================================
// SIDEBAR TOGGLE
// ============================================

window.toggleSidebar = function() {
    document.getElementById('mainSidebar').classList.toggle('collapsed');
};

window.toggleSection = function(section) {
    const menu = document.getElementById(section + 'Menu');
    const title = event.currentTarget;
    if (menu) menu.classList.toggle('collapsed');
    if (title) title.classList.toggle('collapsed');
};

// ============================================
// FILTERS
// ============================================

window.applyFilters = () => {
    currentMonthFilter = document.getElementById('sidebarMonthSelect').value;
    currentYearFilter = document.getElementById('sidebarYearSelect').value;
    currentPage = 1;
    renderTable();
};

window.setCurrentMonth = () => {
    const now = new Date();
    document.getElementById('sidebarMonthSelect').value = now.getMonth() + 1;
    document.getElementById('sidebarYearSelect').value = now.getFullYear();
    currentMonthFilter = now.getMonth() + 1;
    currentYearFilter = now.getFullYear();
    renderTable();
};

window.clearTimeFilters = () => {
    document.getElementById('sidebarMonthSelect').value = 'all';
    document.getElementById('sidebarYearSelect').value = 'all';
    currentMonthFilter = 'all';
    currentYearFilter = 'all';
    currentPage = 1;
    renderTable();
};

// ============================================
// TOGGLE FORM
// ============================================

window.toggleForm = function() {
    if (!permissions.canCreate && !editId) {
        showToast('No permission', 'error');
        return;
    }

    const form = document.getElementById('form-container');
    if (form.classList.contains('active')) {
        if (currentReservationId && currentReservationNR) {
            releaseReservedNR(currentReservationId, currentReservationNR);
            currentReservationId = null;
            currentReservationNR = null;
        }
        editId = null;
        document.getElementById('comms-form').reset();
        document.querySelectorAll('#distributionCheckboxes input').forEach(cb => cb.checked = false);
        form.classList.remove('active');
        document.getElementById('nr').value = '';
        document.getElementById('nr').disabled = false;
    } else {
        if (!editId) {
            const nrField = document.getElementById('nr');
            nrField.value = '...';
            nrField.disabled = true;
            const saveBtn = document.querySelector('#comms-form button[type="submit"]');
            const originalText = saveBtn?.innerHTML;
            if (saveBtn) {
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reserving...';
                saveBtn.disabled = true;
            }
            reserveNRNumber().then(({ reservationId, nr }) => {
                currentReservationId = reservationId;
                currentReservationNR = nr;
                nrField.value = nr;
                nrField.disabled = false;
                if (saveBtn) {
                    saveBtn.innerHTML = originalText;
                    saveBtn.disabled = false;
                }
            }).catch(error => {
                console.error('NR reservation failed:', error);
                nrField.value = '01';
                nrField.disabled = false;
                if (saveBtn) {
                    saveBtn.innerHTML = originalText;
                    saveBtn.disabled = false;
                }
                showToast('Using fallback NR: 01', 'warning');
            });
        }
        document.getElementById('formTitle').textContent = editId ? 'Edit Communication' : 'New Communication';
        form.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// ============================================
// NR NUMBER GENERATION
// ============================================

let currentReservationId = null;
let currentReservationNR = null;

async function reserveNRNumber() {
    const reservationId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    try {
        const counterRef = db.collection('metadata').doc('counters');
        const counterDoc = await counterRef.get();
        let nextNR;
        if (!counterDoc.exists) {
            const snapshot = await db.collection("comms_monitoring")
                .orderBy("nr", "desc")
                .limit(1)
                .get();
            let maxNR = 0;
            if (!snapshot.empty) {
                const lastNR = snapshot.docs[0].data().nr;
                maxNR = parseInt(lastNR) || 0;
            }
            nextNR = maxNR + 1;
        } else {
            const currentCounter = counterDoc.data().lastNR || 0;
            const reservations = counterDoc.data().reservations || {};
            let reservedNumbers = new Set(Object.values(reservations));
            nextNR = currentCounter + 1;
            while (reservedNumbers.has(nextNR)) {
                nextNR++;
            }
        }
        await counterRef.set({
            lastNR: counterDoc?.data()?.lastNR || (nextNR - 1),
            reservations: {
                ...(counterDoc?.data()?.reservations || {}),
                [reservationId]: nextNR
            }
        });
        const newNR = String(nextNR).padStart(2, '0');
        return { reservationId, nr: newNR };
    } catch (error) {
        console.error('NR reservation error:', error);
        throw error;
    }
}

async function releaseReservedNR(reservationId, nr) {
    if (!reservationId) return;
    try {
        const counterRef = db.collection('metadata').doc('counters');
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(counterRef);
            if (!doc.exists) return;
            const reservations = doc.data().reservations || {};
            if (reservations[reservationId]) {
                delete reservations[reservationId];
                transaction.update(counterRef, { reservations: reservations });
            }
        });
    } catch (error) {
        console.error('Error releasing NR:', error);
    }
}

async function commitNRNumber(nr) {
    try {
        const counterRef = db.collection('metadata').doc('counters');
        const nrInt = parseInt(nr);
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(counterRef);
            let currentCounter = doc.exists ? (doc.data().lastNR || 0) : 0;
            if (nrInt > currentCounter) {
                transaction.update(counterRef, { lastNR: nrInt });
            }
        });
    } catch (error) {
        console.error('Error committing NR:', error);
    }
}

// ============================================
// FORM HANDLING
// ============================================

function handleFormSubmit(e) {
    e.preventDefault();

    if (!permissions.canCreate && !editId) {
        showToast('No permission', 'error');
        return;
    }

    const nr = document.getElementById('nr').value.trim();
    const type = document.getElementById('type').value;
    const subject = sanitizeInput(document.getElementById('subject').value);
    const remarks = sanitizeInput(document.getElementById('remarks').value);
    const recurrence = type === 'Report' ? document.getElementById('recurrence').value : 'none';
    const recurrenceStartDate = type === 'Report' ? document.getElementById('recurrenceStartDate').value : '';

    if (!nr || nr === '...') {
        showToast('Please wait for NR number to generate', 'error');
        return;
    }

    if (!type || !subject) {
        showToast('Please fill required fields', 'error');
        return;
    }

    if (recurrence !== 'none' && !recurrenceStartDate) {
        showToast('Choose the first due date for this recurring report', 'error');
        return;
    }

    const distribution = Array.from(document.querySelectorAll('#distributionCheckboxes input:checked')).map(cb => cb.value);
    if (distribution.length === 0) {
        showToast('Select at least one role', 'error');
        return;
    }

    showLoading();
    const data = {
        nr,
        type,
        subject,
        remarks: remarks || '',
        distribution,
        recurrence,
        recurrenceStartDate: recurrenceStartDate || null,
        nextDueDate: recurrence !== 'none' ? recurrenceStartDate : null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (!editId) {
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        data.createdBy = currentUser.uid;
        data.createdByName = currentUser.email;
        data.status = 'draft';
        data.approvals = {};
        data.compliance = [];
    }

    if (editId) {
        db.collection("comms_monitoring").doc(editId).update(data)
            .then(() => {
                showToast('Updated!');
                editId = null;
                toggleForm();
                hideLoading();
            })
            .catch(error => {
                console.error('Update error:', error);
                showToast('Error: ' + error.message, 'error');
                hideLoading();
            });
    } else {
        db.collection("comms_monitoring").add(data)
            .then(() => {
                showToast('Added with NR: ' + nr);
                commitNRNumber(nr);
                if (currentReservationId && currentReservationNR === nr) {
                    releaseReservedNR(currentReservationId, nr);
                    currentReservationId = null;
                    currentReservationNR = null;
                }
                toggleForm();
                hideLoading();
            })
            .catch(error => {
                console.error('Add error:', error);
                showToast('Error: ' + error.message, 'error');
                hideLoading();
            });
    }
}

// ============================================
// EDIT LOG
// ============================================

window.editLog = async (id) => {
    if (!permissions.canEdit) { showToast('No permission to edit', 'error'); return; }
    try {
        const doc = await db.collection("comms_monitoring").doc(id).get();
        if (!doc.exists) { showToast('Not found', 'error'); return; }
        const d = doc.data();
        editId = id;
        document.getElementById('nr').value = d.nr || '';
        document.getElementById('type').value = d.type || 'Radio Message';
        document.getElementById('subject').value = d.subject || '';
        document.getElementById('remarks').value = d.remarks || '';
        document.getElementById('recurrence').value = d.recurrence || 'none';
        document.getElementById('recurrenceStartDate').value = d.recurrenceStartDate || d.nextDueDate || '';
        toggleRecurrenceFields();
        const distribution = d.distribution || [];
        document.querySelectorAll('#distributionCheckboxes input').forEach(cb => { cb.checked = distribution.includes(cb.value); });
        document.getElementById('form-container').classList.add('active');
        document.getElementById('formTitle').textContent = 'Edit Communication';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) { showToast('Error loading', 'error'); }
};

function toggleRecurrenceFields() {
    const isReport = document.getElementById('type')?.value === 'Report';
    const recurrenceGroup = document.getElementById('recurrenceGroup');
    const dateGroup = document.getElementById('recurrenceStartGroup');
    if (recurrenceGroup) recurrenceGroup.style.display = isReport ? '' : 'none';
    if (dateGroup) dateGroup.style.display = isReport ? '' : 'none';
    if (!isReport) {
        document.getElementById('recurrence').value = 'none';
        document.getElementById('recurrenceStartDate').value = '';
    }
}

// ============================================
// DELETE LOG
// ============================================

window.deleteLog = async (id) => {
    if (!permissions.canDelete) {
        showToast('No permission to delete', 'error');
        return;
    }

    const result = await Swal.fire({
        title: 'Delete Communication?',
        text: 'This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Yes, Delete',
        cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    showLoading();
    try {
        await db.collection("comms_monitoring").doc(id).delete();
        await reindexNRNumbers();
        showToast('Deleted successfully!', 'success');
        setTimeout(() => refreshData(), 500);
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Error: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
};

// ============================================
// REINDEX NR NUMBERS
// ============================================

async function reindexNRNumbers() {
    try {
        const snapshot = await db.collection("comms_monitoring").orderBy("createdAt", "asc").get();
        let index = 1;
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            const newNr = String(index).padStart(2, '0');
            if (doc.data().nr !== newNr) batch.update(doc.ref, { nr: newNr });
            index++;
        });
        await batch.commit();
        const maxNR = snapshot.size;
        const counterRef = db.collection('metadata').doc('counters');
        await counterRef.set({ lastNR: maxNR });
        console.log('Reindex complete. Counter updated to:', maxNR);
    } catch (error) {
        console.error('Error reindexing:', error);
    }
}

// ============================================
// REMARKS MODAL
// ============================================

window.openRemarksModal = function(docId, currentRemarks) {
    document.getElementById('remarksDocId').value = docId;
    const textarea = document.getElementById('remarksInput');
    const previewDiv = document.getElementById('remarksPreview');
    let cleanRemarks = currentRemarks || '';
    cleanRemarks = cleanRemarks.replace(/\n/g, ' ').replace(/\r/g, ' ');
    textarea.value = cleanRemarks;
    previewDiv.textContent = cleanRemarks || '—';
    document.getElementById('remarksModal').style.display = 'flex';
    setTimeout(() => textarea.focus(), 100);
};

window.saveRemarks = async function() {
    const docId = document.getElementById('remarksDocId').value;
    const textarea = document.getElementById('remarksInput');
    let remarks = textarea.value.replace(/\n/g, ' ').replace(/\r/g, ' ').trim();

    if (!remarks) {
        const result = await Swal.fire({
            title: 'Clear Remarks?',
            text: 'Remarks will be empty. Continue?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Clear',
            cancelButtonText: 'Cancel'
        });
        if (!result.isConfirmed) return;
    }

    showLoading();
    try {
        await db.collection("comms_monitoring").doc(docId).update({
            remarks: remarks,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast('Remarks updated successfully!');
        closeModal('remarksModal');
        setTimeout(() => refreshData(), 500);
    } catch (error) {
        console.error('Save remarks error:', error);
        showToast('Error: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
};

function closeRemarksModal() {
    const modal = document.getElementById('remarksModal');
    if (modal) modal.style.display = 'none';
}

// ============================================
// APPROVAL MODAL
// ============================================

window.openApprovalModal = async function(docId) {
    if (!permissions.canApprove) { showToast('No permission', 'error'); return; }
    const doc = await db.collection("comms_monitoring").doc(docId).get();
    if (!doc.exists) return;
    const data = doc.data();
    const approvals = data.approvals || {};
    const distribution = data.distribution || allRoles;
    const roleSelect = document.getElementById('modalRole');
    roleSelect.innerHTML = '';
    let hasPending = false;
    distribution.forEach(role => { if (!approvals[role]) { roleSelect.add(new Option(role, role)); hasPending = true; } });
    if (!hasPending) { roleSelect.add(new Option('All roles have acted', '', true, true)); roleSelect.disabled = true; }
    else roleSelect.disabled = false;
    document.getElementById('modalDocId').value = docId;
    document.getElementById('modalRemarks').value = '';
    document.getElementById('approvalModal').style.display = 'flex';
};

window.submitApproval = async function() {
    const docId = document.getElementById('modalDocId').value;
    const role = document.getElementById('modalRole').value;
    const action = document.querySelector('input[name="actionType"]:checked').value;
    const remarks = sanitizeInput(document.getElementById('modalRemarks').value);
    if (!role || role === 'All roles have acted') { showToast('Please select a role', 'error'); return; }
    showLoading();
    try {
        const doc = await db.collection("comms_monitoring").doc(docId).get();
        if (!doc.exists) throw new Error('Not found');
        const data = doc.data();
        const approvals = data.approvals || {};
        if (approvals[role]) { showToast(`${role} already acted`, 'error'); return; }
        approvals[role] = { status: action, timestamp: new Date().toISOString(), remarks, approvedBy: currentUser.uid, approvedByName: currentUser.email };
        const distribution = data.distribution || allRoles;
        const approvedCount = Object.values(approvals).filter(a => a.status === 'approve').length;
        const rejectedCount = Object.values(approvals).filter(a => a.status === 'reject').length;
        let overallStatus = 'pending';
        if (rejectedCount > 0) overallStatus = 'rejected';
        else if (approvedCount === distribution.length) overallStatus = 'approved';
        await db.collection("comms_monitoring").doc(docId).update({
            approvals, status: overallStatus,
            lastAction: { role, action, timestamp: new Date().toISOString(), remarks, userId: currentUser.uid, userName: currentUser.email },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast(`${role} ${action}d!`);
        closeModal('approvalModal');
    } catch (error) { showToast('Error: ' + error.message, 'error'); }
    finally { hideLoading(); }
};

// ============================================
// RELEASE MODAL
// ============================================

window.openReleaseModal = function(docId) {
    if (!permissions.canRelease) { showToast('No permission', 'error'); return; }
    const now = new Date();
    document.getElementById('releaseDocId').value = docId;
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('releaseDateTime').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    document.getElementById('releaseNumber').value = `REL-${now.getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    document.getElementById('releaseRemarks').value = '';
    document.getElementById('releaseTo').value = '';
    document.getElementById('releaseModal').style.display = 'flex';
};

window.submitRelease = async function() {
    const docId = document.getElementById('releaseDocId').value;
    const releaseNumber = document.getElementById('releaseNumber').value.trim();
    const releaseDateTime = document.getElementById('releaseDateTime').value;
    if (!releaseNumber || !releaseDateTime) { showToast('Release Number and Date required', 'error'); return; }
    showLoading();
    try {
        await db.collection("comms_monitoring").doc(docId).update({
            status: 'released',
            releaseInfo: {
                number: releaseNumber, dateTime: releaseDateTime,
                remarks: sanitizeInput(document.getElementById('releaseRemarks').value),
                releasedTo: sanitizeInput(document.getElementById('releaseTo').value),
                releasedBy: currentUser.uid,
                releasedByName: currentUser.email,
                releasedAt: new Date().toISOString()
            },
            lastAction: { role: currentUser.email, action: 'release', timestamp: new Date().toISOString(), remarks: `Released: ${releaseNumber}` },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast('Released!');
        closeModal('releaseModal');
    } catch (error) { showToast(error.message, 'error'); }
    finally { hideLoading(); }
};

// ============================================
// DISTRIBUTION MODAL
// ============================================

window.openDistributionModal = async function(commId) {
    const comm = allCommunications.find(c => c.id === commId);
    if (!comm) return;
    const approvals = comm.approvals || {};
    const distribution = comm.distribution || [];
    let html = '<div style="max-height: 400px; overflow-y: auto;">';

    if (!distribution.length) {
        html += '<p style="text-align:center; padding:1rem;">No distribution assigned</p>';
    } else {
        distribution.forEach(role => {
            const status = approvals[role]?.status || 'pending';
            const displayStatus = status === 'approve' ? 'APPROVED' : (status === 'reject' ? 'REJECTED' : 'PENDING');
            const date = approvals[role]?.timestamp ? formatDateTime(approvals[role].timestamp) : 'Not yet acted';
            const remarks = approvals[role]?.remarks || '';
            const iconColor = status === 'approve' ? '#10b981' : (status === 'reject' ? '#ef4444' : '#f59e0b');

            html += `<div style="padding:0.75rem; border-bottom:1px solid var(--gray-200);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="font-size:0.9rem;">${escapeHtml(role)}</strong>
                    <span style="background:${iconColor}20; color:${iconColor}; padding:0.25rem 0.75rem; border-radius:20px; font-weight:700; font-size:0.7rem;">
                        ${displayStatus}
                    </span>
                </div>
                <div style="font-size:0.7rem; color:var(--gray-500); margin-top:0.25rem;">${date}</div>
                ${remarks ? `<div style="font-size:0.7rem; margin-top:0.5rem; background:var(--gray-50); padding:0.5rem; border-radius:8px;">${escapeHtml(remarks)}</div>` : ''}
            </div>`;
        });
    }

    if (comm.releaseInfo) {
        html += `<div style="margin-top:1rem; padding:0.75rem; background:var(--gray-50); border-radius:8px;">
            <strong>Release Information</strong><br>
            Number: ${escapeHtml(comm.releaseInfo.number)}<br>
            Date: ${formatDateTime(comm.releaseInfo.dateTime)}<br>
            To: ${escapeHtml(comm.releaseInfo.releasedTo || 'N/A')}<br>
            Released By: ${escapeHtml(comm.releaseInfo.releasedByName || comm.releaseInfo.releasedBy || 'N/A')}<br>
            ${comm.releaseInfo.remarks ? `Remarks: ${escapeHtml(comm.releaseInfo.remarks)}` : ''}
        </div>`;
    }

    html += '</div>';
    document.getElementById('distributionContent').innerHTML = html;
    document.getElementById('distributionModal').style.display = 'flex';
};

// ============================================
// TIMELINE MODAL
// ============================================

window.openTimelineModal = async function(commId) {
    const comm = allCommunications.find(c => c.id === commId);
    if (!comm) return;
    let html = '<div style="max-height: 400px; overflow-y: auto;">';
    const events = [];

    if (comm.createdAt) events.push({
        type: 'Created',
        role: comm.createdByName || 'System',
        date: comm.createdAt,
        remarks: `Created: ${comm.nr} - ${comm.subject}`
    });

    if (comm.approvals) {
        Object.entries(comm.approvals).forEach(([role, data]) => {
            if (data?.timestamp) events.push({
                type: data.status === 'approve' ? 'Approved' : 'Rejected',
                role,
                date: new Date(data.timestamp),
                remarks: data.remarks
            });
        });
    }

    if (comm.releaseInfo?.dateTime) events.push({
        type: 'Released',
        role: comm.releaseInfo.releasedByName || comm.releaseInfo.releasedBy || 'N6 Officer',
        date: new Date(comm.releaseInfo.dateTime),
        remarks: `Released as ${comm.releaseInfo.number} by ${comm.releaseInfo.releasedByName || comm.releaseInfo.releasedBy || 'N6 Officer'}`
    });

    if (comm.compliance) {
        comm.compliance.forEach(c => {
            if (c.submittedAt) events.push({
                type: 'Complied',
                role: c.unit,
                date: new Date(c.submittedAt),
                remarks: c.requirements
            });
        });
    }

    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (!events.length) {
        html += '<p style="text-align:center; padding:2rem;">No actions taken yet</p>';
    } else {
        events.forEach(e => {
            const iconColor = e.type === 'Approved' ? '#10b981' :
                e.type === 'Rejected' ? '#ef4444' :
                e.type === 'Released' ? '#3b82f6' : '#8b5cf6';
            const iconClass = e.type === 'Approved' ? 'fa-check-circle' :
                e.type === 'Rejected' ? 'fa-times-circle' :
                e.type === 'Released' ? 'fa-paper-plane' : 'fa-clipboard-check';

            html += `<div style="padding:0.75rem; border-bottom:1px solid var(--gray-200); display:flex; gap:0.75rem;">
                <div style="width:32px; height:32px; border-radius:50%; background:${iconColor}20; display:flex; align-items:center; justify-content:center;">
                    <i class="fas ${iconClass}" style="color:${iconColor};"></i>
                </div>
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between;">
                        <strong>${escapeHtml(e.role)}</strong>
                        <span style="font-size:0.7rem; color:var(--gray-500);">${formatDateTime(e.date)}</span>
                    </div>
                    <div style="font-weight:600; color:${iconColor};">${e.type}</div>
                    ${e.remarks ? `<div style="font-size:0.7rem;">${escapeHtml(e.remarks)}</div>` : ''}
                </div>
            </div>`;
        });
    }
    html += '</div>';
    document.getElementById('timelineContent').innerHTML = html;
    document.getElementById('timelineModal').style.display = 'flex';
};

// ============================================
// COMPLIANCE MODAL
// ============================================

window.openComplianceModal = function(docId) {
    document.getElementById('complianceDocId').value = docId;
    document.getElementById('complianceUnit').value = '';
    document.getElementById('complianceTargetDateTime').value = '';
    document.getElementById('complianceRequirements').value = '';
    document.getElementById('complianceSubmitUnit').value = '';
    document.getElementById('complianceSubmissionDateTime').value = '';
    document.getElementById('complianceSubmissionRemarks').value = '';
    document.getElementById('complianceModal').style.display = 'flex';
};

window.saveCompliance = async function() {
    const docId = document.getElementById('complianceDocId').value;
    const unit = sanitizeInput(document.getElementById('complianceUnit').value);
    const targetDateTime = document.getElementById('complianceTargetDateTime').value;
    const requirements = sanitizeInput(document.getElementById('complianceRequirements').value);

    if (!unit || !targetDateTime) {
        showToast('Unit and Target Date & Time required', 'error');
        return;
    }

    if (!docId) {
        showToast('Document ID not found', 'error');
        return;
    }

    showLoading();
    try {
        const docRef = db.collection("comms_monitoring").doc(docId);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error('Communication not found');
        }

        const compliance = doc.data().compliance || [];

        if (compliance.find(c => c.unit === unit && c.status === 'pending')) {
            showToast(`Pending requirement for ${unit} exists`, 'error');
            return;
        }

        compliance.push({
            unit,
            targetDate: targetDateTime,
            requirements: requirements || 'No specific requirements',
            status: 'pending',
            createdAt: new Date().toISOString(),
            createdBy: currentUser.uid
        });

        await docRef.update({
            compliance,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showToast('Compliance added successfully!');
        closeModal('complianceModal');
        setTimeout(() => refreshData(), 500);

    } catch (error) {
        console.error('Save compliance error:', error);
        showToast('Error: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
};

window.markAsComplied = async function() {
    const docId = document.getElementById('complianceDocId').value;
    const unit = sanitizeInput(document.getElementById('complianceSubmitUnit').value);
    const submissionDateTime = document.getElementById('complianceSubmissionDateTime').value;
    const submissionRemarks = sanitizeInput(document.getElementById('complianceSubmissionRemarks').value);

    if (!unit || !submissionDateTime) {
        showToast('Unit and Submission Date & Time required', 'error');
        return;
    }

    showLoading();
    try {
        const doc = await db.collection("comms_monitoring").doc(docId).get();
        if (!doc.exists) throw new Error('Not found');
        const compliance = doc.data().compliance || [];
        const index = compliance.findIndex(c => c.unit === unit && c.status === 'pending');

        if (index === -1) {
            showToast(`No pending requirement for ${unit}`, 'error');
            return;
        }

        compliance[index].status = 'submitted';
        compliance[index].submissionDate = submissionDateTime;
        compliance[index].submissionRemarks = submissionRemarks || 'No remarks';
        compliance[index].submittedAt = new Date().toISOString();
        compliance[index].submittedBy = currentUser.uid;
        compliance[index].submittedByName = currentUser.email;

        await db.collection("comms_monitoring").doc(docId).update({
            compliance,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showToast('Compliance marked!');
        closeModal('complianceModal');
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
};

// ============================================
// EXPORT FUNCTIONS
// ============================================

window.toggleExportMenu = function() {
    const menu = document.getElementById('exportMenu');
    menu.classList.toggle('show');
    document.addEventListener('click', function closeExport(e) {
        if (!e.target.closest('.export-dropdown')) {
            menu.classList.remove('show');
            document.removeEventListener('click', closeExport);
        }
    });
};

window.exportToExcel = function() {
    if (!allCommunications.length) {
        showToast('No data to export', 'error');
        return;
    }

    const exportData = allCommunications.map((comm, index) => {
        const sequentialNR = (index + 1).toString();
        let dateReleased = '';
        if (comm.status === 'released' && comm.releaseInfo?.dateTime) {
            dateReleased = formatDateMilitaryExport(comm.releaseInfo.dateTime);
        }
        let targetDate = '';
        if (comm.compliance?.length > 0) {
            const complianceWithDate = comm.compliance.find(c => c.targetDate);
            if (complianceWithDate?.targetDate) {
                targetDate = formatDateMilitaryExport(complianceWithDate.targetDate);
            }
        }
        return {
            'NR': sequentialNR,
            'SUBJECT': comm.subject || 'N/A',
            'DATE RELEASED': dateReleased,
            'TARGET DATE': targetDate,
            'REMARKS': (comm.remarks || '').replace(/\n/g, ' ').replace(/\r/g, ' ').trim() || '—'
        };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [{ wch: 8 }, { wch: 50 }, { wch: 25 }, { wch: 25 }, { wch: 40 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Communications');
    XLSX.writeFile(wb, `communications_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Export complete!', 'success');
};

window.exportToCSV = function() {
    if (!allCommunications.length) {
        showToast('No data to export', 'error');
        return;
    }

    let csv = 'NR,SUBJECT,DATE RELEASED,TARGET DATE,REMARKS\n';
    allCommunications.forEach((comm, index) => {
        const sequentialNR = (index + 1).toString();
        let dateReleased = '';
        if (comm.status === 'released' && comm.releaseInfo?.dateTime) {
            dateReleased = formatDateMilitaryExport(comm.releaseInfo.dateTime);
        }
        let targetDate = '';
        if (comm.compliance?.length > 0) {
            const complianceWithDate = comm.compliance.find(c => c.targetDate);
            if (complianceWithDate?.targetDate) {
                targetDate = formatDateMilitaryExport(complianceWithDate.targetDate);
            }
        }
        const cleanRemarks = (comm.remarks || '').replace(/\n/g, ' ').replace(/\r/g, ' ').trim() || '—';

        const escapeCSV = (str) => {
            if (str === undefined || str === null) return '';
            str = String(str);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                str = str.replace(/"/g, '""');
                return `"${str}"`;
            }
            return str;
        };

        csv += [
            escapeCSV(sequentialNR),
            escapeCSV(comm.subject || 'N/A'),
            escapeCSV(dateReleased),
            escapeCSV(targetDate),
            escapeCSV(cleanRemarks)
        ].join(',') + '\n';
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `communications_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV Export complete!', 'success');
};

function formatDateMilitaryExport(dateValue) {
    if (!dateValue) return '';
    try {
        const d = new Date(dateValue);
        if (isNaN(d.getTime())) return '';
        const day = d.getDate();
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return `${day}-${hours}${minutes}H-${months[d.getMonth()]}-${d.getFullYear()}`;
    } catch (e) {
        return '';
    }
}

// ============================================
// TOGGLE DROPDOWN
// ============================================

window.toggleDropdown = function() {
    const dropdown = document.getElementById('moreDropdown');
    dropdown.classList.toggle('show');
};

// ============================================
// PAGINATION
// ============================================

window.changePage = (dir) => {
    if (dir === 'next') currentPage++;
    else currentPage--;
    renderTable();
};

// ============================================
// REFRESH DATA
// ============================================

window.refreshData = async () => {
    try {
        const snapshot = await db.collection("comms_monitoring").orderBy("createdAt", "desc").get();
        allCommunications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateStats();
        renderTable();
        showToast('Data refreshed successfully!', 'success');
    } catch (error) {
        console.error('Refresh error:', error);
        showToast('Error refreshing data: ' + error.message, 'error');
    }
};

// ============================================
// TEST CONNECTION
// ============================================

window.testFirebaseConnection = async () => {
    showLoading();
    try {
        await db.collection('comms_monitoring').doc('test').set({ test: true });
        await db.collection('comms_monitoring').doc('test').delete();
        showToast('Connected!');
    } catch (error) {
        showToast('Failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
};

// ============================================
// THEME TOGGLE
// ============================================

window.toggleTheme = function() {
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('dark-theme');
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    localStorage.setItem('theme_preference', newTheme);
    showToast(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode activated`, 'info');
};

// ============================================
// SELECTION & BULK ACTIONS
// ============================================

window.toggleSelect = (id) => {
    if (selectedItems.has(id)) selectedItems.delete(id);
    else selectedItems.add(id);
    updateSelectedCount();
};

window.toggleSelectAll = () => {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    const selectAll = document.getElementById('selectAll');
    checkboxes.forEach(cb => {
        cb.checked = selectAll.checked;
        if (selectAll.checked) selectedItems.add(cb.value);
        else selectedItems.delete(cb.value);
    });
    updateSelectedCount();
};

window.toggleSelectAllFromHeader = () => {
    const headerCheck = document.getElementById('selectAllHeader');
    const selectAll = document.getElementById('selectAll');
    if (selectAll) selectAll.checked = headerCheck.checked;
    toggleSelectAll();
};

function updateSelectedCount() {
    const countSpan = document.getElementById('selectedCount');
    if (countSpan) countSpan.textContent = `${selectedItems.size} selected`;
    const bulkActions = document.getElementById('bulkActions');
    if (bulkActions) bulkActions.style.display = selectedItems.size ? 'flex' : 'none';
}

window.clearSelection = () => {
    selectedItems.clear();
    updateSelectedCount();
    document.querySelectorAll('.row-checkbox, #selectAll, #selectAllHeader').forEach(cb => {
        if (cb) cb.checked = false;
    });
};

window.bulkDelete = async () => {
    if (!permissions.canDelete) {
        showToast('No permission', 'error');
        return;
    }
    if (!selectedItems.size) return;
    if (confirm(`Delete ${selectedItems.size} items?`)) {
        showLoading();
        try {
            const batch = db.batch();
            selectedItems.forEach(id => batch.delete(db.collection("comms_monitoring").doc(id)));
            await batch.commit();
            await reindexNRNumbers();
            clearSelection();
            showToast('Deleted!');
        } catch (error) {
            showToast('Error: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }
};

window.bulkApprove = async () => {
    if (!permissions.canApprove) {
        showToast('No permission', 'error');
        return;
    }
    if (!selectedItems.size) return;
    showLoading();
    try {
        const batch = db.batch();
        selectedItems.forEach(id => batch.update(db.collection("comms_monitoring").doc(id), {
            status: 'approved',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }));
        await batch.commit();
        clearSelection();
        showToast('Approved!');
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
};

window.bulkRelease = async () => {
    if (!permissions.canRelease) {
        showToast('No permission', 'error');
        return;
    }
    if (!selectedItems.size) return;
    showLoading();
    try {
        const batch = db.batch();
        selectedItems.forEach(id => batch.update(db.collection("comms_monitoring").doc(id), {
            status: 'released',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }));
        await batch.commit();
        clearSelection();
        showToast('Released!');
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
};

// ============================================
// ADD TEST DATA
// ============================================

window.addTestData = async () => {
    if (!permissions.canCreate) { showToast('No permission', 'error'); return; }
    showLoading();
    try {
        const snapshot = await db.collection("comms_monitoring").get();
        const baseCount = snapshot.size + 1;
        for (let i = 0; i < 5; i++) {
            const status = ['draft', 'pending', 'approved', 'released', 'rejected'][i % 5];
            await db.collection('comms_monitoring').add({
                nr: String(baseCount + i).padStart(2, '0'),
                type: ['Radio Message', 'Conference Notice', 'EDF', 'Military Letter'][i % 4],
                subject: `Test Communication ${i + 1}`,
                remarks: 'Test data for C4 SYSTEMS',
                distribution: allRoles.slice(0, 3),
                status: status,
                approvals: {},
                compliance: [],
                createdBy: currentUser.uid,
                createdByName: currentUser.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        showToast('Test data added!');
    } catch (error) { showToast('Error: ' + error.message, 'error'); }
    finally { hideLoading(); }
};

// ============================================
// SHOW CLEAR ALL CONFIRM
// ============================================

window.showClearAllConfirm = () => {
    if (!permissions.canDelete) { showToast('No permission', 'error'); return; }
    document.getElementById('clearAllModal').style.display = 'flex';
};

window.clearAllData = async () => {
    if (!confirm('Delete ALL communications permanently?')) return;
    showLoading();
    try {
        const snapshot = await db.collection("comms_monitoring").get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        showToast('All cleared!');
        closeModal('clearAllModal');
    } catch (error) { showToast('Error: ' + error.message, 'error'); }
    finally { hideLoading(); }
};

// ============================================
// REPAIR NR COUNTER
// ============================================

window.repairNRCounter = async function() {
    const result = await Swal.fire({
        title: 'Repair NR Counter',
        text: 'This will recalculate the correct NR counter from existing communications. Continue?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        confirmButtonText: 'Yes, Repair',
        cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    showLoading();
    try {
        const snapshot = await db.collection("comms_monitoring").get();
        const comms = [];
        snapshot.forEach(doc => {
            const nr = parseInt(doc.data().nr);
            if (!isNaN(nr)) comms.push(nr);
        });
        const maxNR = comms.length > 0 ? Math.max(...comms) : 0;
        const counterRef = db.collection('metadata').doc('counters');
        await counterRef.set({ lastNR: maxNR });
        showToast(`Counter repaired to NR ${maxNR}`, 'success');
        setTimeout(() => refreshData(), 500);
    } catch (error) {
        console.error('Repair error:', error);
        showToast('Repair failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
};

// ============================================
// DEBUG NRs
// ============================================

window.debugNRs = function() {
    if (!allCommunications || allCommunications.length === 0) {
        showToast('No communications found', 'info');
        return;
    }
    const nrs = allCommunications.map(c => c.nr).filter(n => n);
    console.log('All NRs:', nrs);
    console.log('Total:', nrs.length);
    console.log('Unique:', new Set(nrs).size);
    showToast(`Found ${nrs.length} NR numbers`, 'info');
};

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (permissions.canCreate) toggleForm();
        else showToast('No permission to create', 'error');
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
        showToast('Search focused', 'info');
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refreshData();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const form = document.getElementById('form-container');
        if (form && form.classList.contains('active')) {
            document.getElementById('comms-form')?.dispatchEvent(new Event('submit'));
        }
    }

    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            if (modal.style.display === 'flex') {
                closeModal(modal.id);
            }
        });
    }

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

// ============================================
// INITIALIZE ON LOAD
// ============================================

// Load saved theme
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme_preference');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const icon = document.getElementById('themeIcon');
        if (icon) icon.className = 'fas fa-sun';
    }
});

console.log('📋 App.js loaded successfully');


// ============================================
// KEYBOARD SHORTCUTS - ENTER TO SAVE
// ============================================

// Save form when Enter is pressed (not in textarea)
document.addEventListener('keydown', function(e) {
    // Check if Enter is pressed
    if (e.key === 'Enter' && !e.shiftKey) {
        const activeElement = document.activeElement;
        
        // === COMMS FORM ===
        // If focus is in an input field (not textarea) and form is visible
        if (activeElement && activeElement.closest) {
            const formContainer = activeElement.closest('#form-container');
            if (formContainer && formContainer.classList.contains('active')) {
                const isTextarea = activeElement.tagName === 'TEXTAREA';
                const isButton = activeElement.tagName === 'BUTTON';
                
                // Don't save if in textarea or button
                if (!isTextarea && !isButton) {
                    e.preventDefault();
                    const form = document.getElementById('comms-form');
                    if (form) {
                        form.dispatchEvent(new Event('submit'));
                        showToast('💾 Saving...', 'info');
                    }
                    return;
                }
            }
        }
    }
});

// Also add specific handler for the form
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        const activeElement = document.activeElement;
        
        // === REMARKS MODAL ===
        if (activeElement && activeElement.id === 'remarksInput') {
            // Enter in remarks textarea - save remarks
            e.preventDefault();
            if (typeof saveRemarks === 'function') {
                saveRemarks();
            }
            return;
        }
        
        // === COMPLIANCE MODAL ===
        if (activeElement && activeElement.closest && activeElement.closest('#complianceModal')) {
            const isTextarea = activeElement.tagName === 'TEXTAREA';
            const isButton = activeElement.tagName === 'BUTTON';
            
            if (!isTextarea && !isButton) {
                e.preventDefault();
                // Check if edit section is visible
                const editSection = document.getElementById('complianceEditSection');
                if (editSection && editSection.style.display !== 'none') {
                    if (typeof saveComplianceEdit === 'function') {
                        saveComplianceEdit();
                        showToast('💾 Saving compliance...', 'info');
                    }
                } else {
                    if (typeof saveCompliance === 'function') {
                        saveCompliance();
                        showToast('💾 Saving compliance...', 'info');
                    }
                }
            }
            return;
        }
        
        // === APPROVAL MODAL ===
        if (activeElement && activeElement.closest && activeElement.closest('#approvalModal')) {
            const isTextarea = activeElement.tagName === 'TEXTAREA';
            const isButton = activeElement.tagName === 'BUTTON';
            
            if (!isTextarea && !isButton) {
                e.preventDefault();
                if (typeof submitApproval === 'function') {
                    submitApproval();
                }
            }
            return;
        }
        
        // === RELEASE MODAL ===
        if (activeElement && activeElement.closest && activeElement.closest('#releaseModal')) {
            const isTextarea = activeElement.tagName === 'TEXTAREA';
            const isButton = activeElement.tagName === 'BUTTON';
            
            if (!isTextarea && !isButton) {
                e.preventDefault();
                if (typeof submitRelease === 'function') {
                    submitRelease();
                }
            }
            return;
        }
    }
});

// Ctrl+Enter in textareas to save
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activeElement = document.activeElement;
        
        // Textarea in comms form
        if (activeElement && activeElement.tagName === 'TEXTAREA' && activeElement.id === 'remarks') {
            e.preventDefault();
            const formContainer = activeElement.closest('#form-container');
            if (formContainer && formContainer.classList.contains('active')) {
                const form = document.getElementById('comms-form');
                if (form) {
                    form.dispatchEvent(new Event('submit'));
                    showToast('💾 Saving...', 'info');
                }
            }
            return;
        }
        
        // Textarea in remarks modal
        if (activeElement && activeElement.id === 'remarksInput') {
            e.preventDefault();
            if (typeof saveRemarks === 'function') {
                saveRemarks();
            }
            return;
        }
    }
});



// ============================================
// MOBILE SIDEBAR TOGGLE
// ============================================

function toggleMobileSidebar() {
    const sidebar = document.getElementById('mainSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar || !overlay) {
        // Create overlay dynamically if not in HTML
        const overlayDiv = document.createElement('div');
        overlayDiv.id = 'sidebarOverlay';
        overlayDiv.className = 'sidebar-overlay';
        overlayDiv.onclick = toggleMobileSidebar;
        document.body.appendChild(overlayDiv);
        
        // Toggle again after creating
        setTimeout(toggleMobileSidebar, 10);
        return;
    }
    
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
    
    // Prevent body scroll when sidebar is open
    document.body.style.overflow = sidebar.classList.contains('mobile-open') ? 'hidden' : '';
}

// Auto-detect mobile and adjust sidebar behavior
function initMobileSidebar() {
    const sidebar = document.getElementById('mainSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    // If on mobile, make sidebar hidden by default
    if (window.innerWidth <= 767) {
        if (sidebar) sidebar.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Listen to resize events
window.addEventListener('resize', initMobileSidebar);

// Close sidebar when clicking outside
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('mainSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggleBtn = document.querySelector('.toggle-sidebar-btn');
    
    if (sidebar && sidebar.classList.contains('mobile-open') && 
        !sidebar.contains(e.target) && 
        !toggleBtn?.contains(e.target) &&
        window.innerWidth <= 767) {
        toggleMobileSidebar();
    }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', initMobileSidebar);