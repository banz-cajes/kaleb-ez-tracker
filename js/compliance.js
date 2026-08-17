// ============================================
// C4 SYSTEMS - Compliance Functions
// ============================================

let complianceItems = [];
let currentComplianceFilter = 'all';
let currentCompliancePage = 1;
const complianceItemsPerPage = 10;

// ============================================
// RENDER COMPLIANCE VIEW
// ============================================

function renderComplianceView() {
    console.log('📋 Rendering compliance view...');
    
    complianceItems = [];
    
    if (!allCommunications || allCommunications.length === 0) {
        console.log('No communications found');
        updateComplianceStats();
        renderComplianceTable([]);
        return;
    }
    
    allCommunications.forEach(comm => {
        if (comm.compliance && comm.compliance.length > 0) {
            comm.compliance.forEach((item, index) => {
                try {
                    const unit = item.unit && item.unit.trim() !== '' ? item.unit : 'Unknown Unit';
                    const requirements = item.requirements && item.requirements.trim() !== '' ? item.requirements : 'No specific requirements';
                    
                    const targetDate = new Date(item.targetDate);
                    const now = new Date();
                    let status = item.status || 'pending';
                    let statusDisplay = 'Pending';
                    
                    if (status === 'submitted') {
                        const submissionDate = new Date(item.submissionDate);
                        if (submissionDate <= targetDate) {
                            statusDisplay = 'On Time ✅';
                        } else {
                            statusDisplay = 'Late ⏰';
                        }
                    } else {
                        if (targetDate < now) {
                            statusDisplay = '⚠️ OVERDUE';
                        } else {
                            statusDisplay = '⏳ Pending';
                        }
                    }
                    
                    complianceItems.push({
                        id: comm.id,
                        commNr: comm.nr || 'N/A',
                        commSubject: comm.subject || 'N/A',
                        unit: unit,
                        requirements: requirements,
                        targetDate: item.targetDate,
                        targetDateObj: targetDate,
                        status: status,
                        statusDisplay: statusDisplay,
                        submissionDate: item.submissionDate,
                        submissionRemarks: item.submissionRemarks || '',
                        submittedAt: item.submittedAt,
                        submittedBy: item.submittedByName || item.submittedBy || 'Unknown',
                        index: index,
                        isOverdue: status !== 'submitted' && targetDate < now,
                        isLate: status === 'submitted' && new Date(item.submissionDate) > targetDate,
                        isOntime: status === 'submitted' && new Date(item.submissionDate) <= targetDate,
                        isPending: status === 'pending'
                    });
                } catch (e) {
                    console.warn('Error processing compliance item:', e);
                }
            });
        }
    });

    console.log(`Found ${complianceItems.length} compliance items`);
    updateComplianceStats();
    applyComplianceFilters();
}

// ============================================
// UPDATE COMPLIANCE STATS
// ============================================

function updateComplianceStats() {
    const total = complianceItems.length;
    const pending = complianceItems.filter(c => c.isPending).length;
    const overdue = complianceItems.filter(c => c.isOverdue).length;
    const ontime = complianceItems.filter(c => c.isOntime).length;
    const late = complianceItems.filter(c => c.isLate).length;

    const totalEl = document.getElementById('complianceTotalCount');
    const pendingEl = document.getElementById('compliancePendingCount');
    const overdueEl = document.getElementById('complianceOverdueCount');
    const ontimeEl = document.getElementById('complianceOntimeCount');
    const lateEl = document.getElementById('complianceLateCount');
    
    if (totalEl) totalEl.textContent = total || 0;
    if (pendingEl) pendingEl.textContent = pending || 0;
    if (overdueEl) overdueEl.textContent = overdue || 0;
    if (ontimeEl) ontimeEl.textContent = ontime || 0;
    if (lateEl) lateEl.textContent = late || 0;

    // ============================================
    // FIX: Use consistent badge calculation
    // ============================================
    const badgeCount = pending + overdue;
    const badge = document.getElementById('sidebarComplianceBadge');
    if (badge) {
        badge.textContent = badgeCount || 0;
        badge.style.background = badgeCount > 0 ? '#ef4444' : '#64748b';
        badge.title = `${badgeCount} items needing attention (${pending} pending, ${overdue} overdue)`;
    }
}


// ============================================
// APPLY COMPLIANCE FILTERS
// ============================================

function applyComplianceFilters() {
    let filtered = [...complianceItems];
    
    if (currentComplianceFilter !== 'all') {
        switch(currentComplianceFilter) {
            case 'pending':
                filtered = filtered.filter(c => c.isPending);
                break;
            case 'overdue':
                filtered = filtered.filter(c => c.isOverdue);
                break;
            case 'ontime':
                filtered = filtered.filter(c => c.isOntime);
                break;
            case 'late':
                filtered = filtered.filter(c => c.isLate);
                break;
        }
    }
    
    const searchInput = document.getElementById('complianceSearch');
    const searchTerm = searchInput?.value?.toLowerCase() || '';
    if (searchTerm) {
        filtered = filtered.filter(c => 
            c.unit.toLowerCase().includes(searchTerm) ||
            c.requirements.toLowerCase().includes(searchTerm) ||
            c.commSubject.toLowerCase().includes(searchTerm) ||
            c.commNr.toLowerCase().includes(searchTerm)
        );
    }
    
    filtered.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return a.targetDateObj - b.targetDateObj;
    });
    
    const totalPages = Math.ceil(filtered.length / complianceItemsPerPage) || 1;
    if (currentCompliancePage > totalPages) currentCompliancePage = totalPages || 1;
    const paginated = filtered.slice((currentCompliancePage - 1) * complianceItemsPerPage, currentCompliancePage * complianceItemsPerPage);
    
    const prevBtn = document.getElementById('compliancePrevPage');
    const nextBtn = document.getElementById('complianceNextPage');
    const pageInfo = document.getElementById('compliancePageInfo');
    
    if (prevBtn) prevBtn.disabled = currentCompliancePage === 1;
    if (nextBtn) nextBtn.disabled = currentCompliancePage === totalPages || totalPages === 0;
    if (pageInfo) pageInfo.textContent = `Page ${currentCompliancePage} of ${totalPages || 1}`;
    
    renderComplianceTable(paginated);
}

// ============================================
// RENDER COMPLIANCE TABLE
// ============================================

function renderComplianceTable(items) {
    const body = document.getElementById('complianceBody');
    if (!body) return;
    
    if (!items || items.length === 0) {
        const hasItems = complianceItems.length > 0;
        body.innerHTML = `
            <tr class="empty-state">
                <td colspan="7">
                    <i class="fas fa-clipboard-check" style="font-size: 2.5rem; color: var(--gray-400);"></i>
                    <p style="margin-top: 0.5rem; color: var(--gray-500);">
                        ${hasItems ? 'No items match your filters' : 'No compliance items found'}
                    </p>
                    ${!hasItems ? `
                    <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 1rem; flex-wrap: wrap;">
                        <button class="btn btn-outline" onclick="setActiveView('all')">
                            <i class="fas fa-envelope"></i> View Communications
                        </button>
                    </div>
                    ` : `
                    <button class="btn btn-outline" onclick="filterCompliance('all')" style="margin-top: 0.5rem;">
                        <i class="fas fa-times"></i> Clear Filters
                    </button>
                    `}
                </td>
            </tr>
        `;
        return;
    }
    
    body.innerHTML = items.map(item => {
        const statusColor = item.isOverdue ? '#ef4444' : 
                           item.isLate ? '#f59e0b' : 
                           item.isOntime ? '#10b981' : '#3b82f6';
        
        const statusBg = item.isOverdue ? '#fee2e2' : 
                        item.isLate ? '#fef3c7' : 
                        item.isOntime ? '#dcfce7' : '#dbeafe';
        
        const statusIcon = item.isOverdue ? 'fa-exclamation-triangle' :
                          item.isLate ? 'fa-clock' :
                          item.isOntime ? 'fa-check-circle' : 'fa-clock';
        
        const overdueText = item.isOverdue ? 
            `<div class="compliance-overdue-days">⚠️ Overdue by ${getDaysOverdue(item.targetDateObj)} days</div>` : '';
        
        const daysRemaining = (!item.isOverdue && !item.isOntime && !item.isLate && item.isPending) ? 
            `<div class="compliance-days-remaining">${getDaysUntil(item.targetDateObj)} days remaining</div>` : '';
        
        const submissionHtml = item.submissionDate ? `
            <div class="compliance-submission-date">${formatDateMilitary(item.submissionDate)}</div>
            <div class="compliance-submitted-by">By: ${escapeHtml(item.submittedBy)}</div>
            ${item.submissionRemarks ? `<div class="compliance-submission-remarks">${escapeHtml(item.submissionRemarks)}</div>` : ''}
        ` : `<span style="font-size:0.65rem; color:var(--gray-400);">Not submitted</span>`;
        
        return `
            <tr class="${item.isOverdue ? 'compliance-overdue-row' : ''}">
                <td>
                    <div class="compliance-unit-name">${escapeHtml(item.unit)}</div>
                </td>
                <td>
                    <div class="compliance-comm-subject">${escapeHtml(item.commSubject)}</div>
                    <div class="compliance-comm-nr">NR: ${escapeHtml(item.commNr)}</div>
                </td>
                <td>
                    <div class="compliance-requirements">${escapeHtml(item.requirements)}</div>
                </td>
                <td>
                    <div class="compliance-target-date">${formatDateMilitary(item.targetDate)}</div>
                    ${overdueText}
                    ${daysRemaining}
                </td>
                <td>
                    <span style="display:inline-flex; align-items:center; gap:0.4rem; padding:0.3rem 0.8rem; border-radius:20px; background:${statusBg}; color:${statusColor}; font-weight:600; font-size:0.65rem; white-space:nowrap;">
                        <i class="fas ${statusIcon}" style="font-size:0.55rem;"></i> ${item.statusDisplay}
                    </span>
                </td>
                <td>${submissionHtml}</td>
                <td>
                    <div class="action-btns" style="display: flex; gap: 4px; flex-wrap: wrap;">
                        <button class="action-btn view" onclick="openComplianceDetailsModal('${item.id}', ${item.index})" title="View Details" style="background: #dbeafe; color: #1e40af;">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn" onclick="openCommunicationFromCompliance('${item.id}')" title="View Communication" style="background: #e2e8f0; color: #475569;">
                            <i class="fas fa-envelope"></i>
                        </button>
                        <button class="action-btn" onclick="openComplianceEdit('${item.id}', ${item.index})" title="Edit Compliance" style="background: #fef3c7; color: #92400e;">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        ${!item.submissionDate ? `
                            <button class="action-btn approve" onclick="quickMarkComplied('${item.id}', ${item.index})" title="Mark as Complied" style="background: #dcfce7; color: #166534;">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// FILTER FUNCTIONS
// ============================================

window.filterCompliance = function(filter) {
    currentComplianceFilter = filter;
    currentCompliancePage = 1;
    
    const buttons = document.querySelectorAll('#complianceView .action-bar-left .btn');
    buttons.forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline');
    });
    
    const filterMap = {
        'all': 0,
        'pending': 1,
        'overdue': 2,
        'ontime': 3,
        'late': 4
    };
    const index = filterMap[filter] || 0;
    if (buttons[index]) {
        buttons[index].classList.remove('btn-outline');
        buttons[index].classList.add('btn-primary');
    }
    
    applyComplianceFilters();
};

window.filterComplianceList = function() {
    currentCompliancePage = 1;
    applyComplianceFilters();
};

window.changeCompliancePage = function(dir) {
    if (dir === 'next') currentCompliancePage++;
    else currentCompliancePage--;
    applyComplianceFilters();
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getDaysOverdue(date) {
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function getDaysUntil(date) {
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
}

// ============================================
// OPEN COMMUNICATION FROM COMPLIANCE
// ============================================

function openCommunicationFromCompliance(commId) {
    setActiveView('all');
    setTimeout(() => {
        const rows = document.querySelectorAll('#comms-body tr');
        rows.forEach(row => {
            if (row.querySelector(`input[value="${commId}"]`)) {
                row.style.background = '#fef3c7';
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => {
                    row.style.background = '';
                }, 3000);
            }
        });
    }, 500);
}

// ============================================
// QUICK MARK COMPLIED
// ============================================

function quickMarkComplied(commId, complianceIndex) {
    Swal.fire({
        title: 'Mark as Complied?',
        text: 'This will mark the compliance item as submitted.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Yes, Mark Complied',
        cancelButtonText: 'Cancel',
        input: 'textarea',
        inputLabel: 'Remarks (optional)',
        inputPlaceholder: 'Enter remarks...'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const remarks = result.value || 'Marked as complied';
            const doc = await db.collection("comms_monitoring").doc(commId).get();
            if (!doc.exists) {
                showToast('Communication not found', 'error');
                return;
            }
            
            const data = doc.data();
            const compliance = data.compliance || [];
            
            if (!compliance[complianceIndex]) {
                showToast('Compliance item not found', 'error');
                return;
            }
            
            const now = new Date().toISOString();
            compliance[complianceIndex].status = 'submitted';
            compliance[complianceIndex].submissionDate = now;
            compliance[complianceIndex].submissionRemarks = remarks;
            compliance[complianceIndex].submittedAt = now;
            compliance[complianceIndex].submittedBy = currentUser.uid;
            compliance[complianceIndex].submittedByName = currentUser.email;
            
            await db.collection("comms_monitoring").doc(commId).update({
                compliance: compliance,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showToast('✅ Compliance marked as submitted!', 'success');
            renderComplianceView();
        }
    });
}

// ============================================
// COMPLIANCE DETAILS MODAL
// ============================================

window.openComplianceDetailsModal = function(commId, complianceIndex) {
    const comm = allCommunications.find(c => c.id === commId);
    if (!comm?.compliance?.[complianceIndex]) {
        showToast('Compliance item not found', 'error');
        return;
    }
    
    const item = comm.compliance[complianceIndex];
    
    const unit = item.unit && item.unit.trim() !== '' ? item.unit : 'Unknown Unit';
    const requirements = item.requirements && item.requirements.trim() !== '' ? item.requirements : 'No specific requirements';
    
    const targetDateTime = new Date(item.targetDate);
    const submissionDateTime = item.submissionDate ? new Date(item.submissionDate) : null;
    const now = new Date();

    let statusClass = 'pending', statusText = 'Pending', statusDesc = '';

    if (item.status === 'submitted' && submissionDateTime) {
        if (submissionDateTime > targetDateTime) {
            statusClass = 'late';
            statusText = 'LATE';
            statusDesc = `Submitted ${formatDateMilitary(submissionDateTime)} (After deadline)`;
        } else {
            statusClass = 'ontime';
            statusText = 'ON TIME';
            statusDesc = `Submitted ${formatDateMilitary(submissionDateTime)} (On or before deadline)`;
        }
    } else if (targetDateTime < now) {
        statusClass = 'overdue';
        statusText = 'OVERDUE';
        statusDesc = `Deadline ${formatDateMilitary(targetDateTime)} has passed`;
    } else {
        statusClass = 'pending';
        statusText = 'PENDING';
        statusDesc = `Deadline: ${formatDateMilitary(targetDateTime)}`;
    }

    const modalContent = document.getElementById('complianceDetailsContent');
    if (modalContent) {
        modalContent.innerHTML = `
            <div style="padding: 0.5rem;">
                <div style="background: linear-gradient(135deg, ${statusClass === 'ontime' ? '#10b981' : statusClass === 'late' || statusClass === 'overdue' ? '#ef4444' : '#f59e0b'}10, transparent); border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                        <h4 style="margin: 0; color: var(--gray-800);">${escapeHtml(unit)}</h4>
                        <span class="compliance-status-badge ${statusClass}" style="background: ${statusClass === 'ontime' ? '#10b981' : statusClass === 'late' || statusClass === 'overdue' ? '#ef4444' : '#f59e0b'}20; color: ${statusClass === 'ontime' ? '#166534' : statusClass === 'late' || statusClass === 'overdue' ? '#991b1b' : '#854d0e'}; padding: 0.25rem 0.75rem; border-radius: 20px; font-weight: 600;">
                            ${statusText}
                        </span>
                    </div>
                    <div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--gray-600);">
                        <strong>Communication:</strong> ${escapeHtml(comm.subject)} (NR: ${escapeHtml(comm.nr)})
                    </div>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <div style="font-size: 0.7rem; color: var(--gray-500); text-transform: uppercase; margin-bottom: 0.25rem;">Requirements</div>
                    <div style="background: var(--gray-50); padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; white-space: pre-wrap;">${escapeHtml(requirements)}</div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <div style="font-size: 0.7rem; color: var(--gray-500); text-transform: uppercase; margin-bottom: 0.25rem;">Target Date & Time</div>
                        <div style="font-weight: 600; color: var(--gray-800);">${formatDateMilitary(targetDateTime)}</div>
                    </div>
                    ${submissionDateTime ? `
                    <div>
                        <div style="font-size: 0.7rem; color: var(--gray-500); text-transform: uppercase; margin-bottom: 0.25rem;">Submission Date & Time</div>
                        <div style="font-weight: 600; color: var(--gray-800);">${formatDateMilitary(submissionDateTime)}</div>
                        <div style="font-size: 0.6rem; color: var(--gray-500);">By: ${escapeHtml(item.submittedByName || item.submittedBy || 'Unknown')}</div>
                    </div>
                    ` : ''}
                </div>
                
                <div>
                    <div style="font-size: 0.7rem; color: var(--gray-500); text-transform: uppercase; margin-bottom: 0.25rem;">Status Details</div>
                    <div style="background: var(--gray-50); padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; color: var(--gray-700);">${escapeHtml(statusDesc)}</div>
                </div>
                
                ${item.submissionRemarks ? `
                <div style="margin-top: 1rem;">
                    <div style="font-size: 0.7rem; color: var(--gray-500); text-transform: uppercase; margin-bottom: 0.25rem;">Remarks</div>
                    <div style="background: var(--gray-50); padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; color: var(--gray-700);">${escapeHtml(item.submissionRemarks)}</div>
                </div>
                ` : ''}
                
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="btn btn-outline btn-sm" onclick="openCommunicationFromCompliance('${commId}')">
                        <i class="fas fa-envelope"></i> View Communication
                    </button>
                    ${!submissionDateTime ? `
                    <button class="btn btn-success btn-sm" onclick="quickMarkComplied('${commId}', ${complianceIndex})">
                        <i class="fas fa-check"></i> Mark Complied
                    </button>
                    ` : ''}
                    <button class="btn btn-outline btn-sm" onclick="closeModal('complianceDetailsModal')">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        `;
    }
    document.getElementById('complianceDetailsModal').style.display = 'flex';
};

console.log('✅ Compliance.js loaded');

// ============================================
// EDIT COMPLIANCE - Open Edit Mode
// ============================================

window.openComplianceEdit = function(docId, index) {
    console.log('📝 Opening compliance edit for:', docId, index);
    
    const comm = allCommunications.find(c => c.id === docId);
    if (!comm) {
        showToast('Communication not found', 'error');
        return;
    }
    
    if (!comm.compliance || !comm.compliance[index]) {
        showToast('Compliance item not found', 'error');
        return;
    }
    
    const item = comm.compliance[index];
    
    // Store the docId and index for saving
    document.getElementById('complianceDocId').value = docId;
    document.getElementById('complianceEditIndex').value = index;
    
    // Fill the edit form with current data
    document.getElementById('complianceEditUnit').value = item.unit || '';
    document.getElementById('complianceEditRequirements').value = item.requirements || '';
    document.getElementById('complianceEditStatus').value = item.status || 'pending';
    
    // Format target date for datetime-local input
    if (item.targetDate) {
        const date = new Date(item.targetDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        document.getElementById('complianceEditTargetDateTime').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    // Hide add section, show edit section
    document.getElementById('complianceAddSection').style.display = 'none';
    document.getElementById('complianceEditSection').style.display = 'block';
    
    // Show the modal
    document.getElementById('complianceModal').style.display = 'flex';
    
    // Clear other fields
    document.getElementById('complianceUnit').value = '';
    document.getElementById('complianceTargetDateTime').value = '';
    document.getElementById('complianceRequirements').value = '';
    document.getElementById('complianceSubmitUnit').value = '';
    document.getElementById('complianceSubmissionDateTime').value = '';
    document.getElementById('complianceSubmissionRemarks').value = '';
};

// ============================================
// SAVE COMPLIANCE EDIT
// ============================================

window.saveComplianceEdit = async function() {
    const docId = document.getElementById('complianceDocId').value;
    const index = parseInt(document.getElementById('complianceEditIndex').value);
    const unit = sanitizeInput(document.getElementById('complianceEditUnit').value);
    const targetDateTime = document.getElementById('complianceEditTargetDateTime').value;
    const requirements = sanitizeInput(document.getElementById('complianceEditRequirements').value);
    const status = document.getElementById('complianceEditStatus').value;
    
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
        
        const data = doc.data();
        const compliance = data.compliance || [];
        
        if (!compliance[index]) {
            throw new Error('Compliance item not found');
        }
        
        // Update the compliance item
        compliance[index].unit = unit;
        compliance[index].targetDate = new Date(targetDateTime).toISOString();
        compliance[index].requirements = requirements || 'No specific requirements';
        compliance[index].status = status;
        compliance[index].updatedAt = new Date().toISOString();
        
        await docRef.update({
            compliance: compliance,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('✅ Compliance updated successfully!');
        closeModal('complianceModal');
        setTimeout(() => refreshData(), 500);
        setTimeout(() => renderComplianceView(), 600);
        
    } catch (error) {
        console.error('Save compliance edit error:', error);
        showToast('Error: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
};

// ============================================
// CANCEL COMPLIANCE EDIT
// ============================================

window.cancelComplianceEdit = function() {
    // Hide edit section, show add section
    document.getElementById('complianceAddSection').style.display = 'block';
    document.getElementById('complianceEditSection').style.display = 'none';
    
    // Clear edit fields
    document.getElementById('complianceEditUnit').value = '';
    document.getElementById('complianceEditTargetDateTime').value = '';
    document.getElementById('complianceEditRequirements').value = '';
    document.getElementById('complianceEditStatus').value = 'pending';
    document.getElementById('complianceDocId').value = '';
    document.getElementById('complianceEditIndex').value = '';
    
    // Close modal
    closeModal('complianceModal');
};