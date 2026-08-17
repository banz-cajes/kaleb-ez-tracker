// ============================================
// C4 SYSTEMS - Analytics Functions
// ============================================

let trendChart = null;
let statusChart = null;
let typeChart = null;
let currentChartPeriod = '30d';
let analyticsData = {};

// ============================================
// UPDATE ANALYTICS DASHBOARD
// ============================================

function updateAnalyticsDashboard() {
    console.log('📊 Updating analytics dashboard...');
    
    if (!allCommunications || allCommunications.length === 0) {
        console.log('No communications found for analytics');
        showEmptyAnalytics();
        return;
    }

    const data = calculateAnalyticsData(allCommunications);
    analyticsData = data;
    
    console.log(`📊 Analytics data: ${data.totalComms} communications`);
    console.log(`📊 Status distribution:`, data.statusDistribution);
    console.log(`📊 Type distribution:`, data.typeDistribution);
    console.log(`📊 Top users:`, data.topUsers);

    // Update summary stats
    const totalEl = document.getElementById('analyticsTotalComms');
    const avgEl = document.getElementById('analyticsAvgTime');
    const rateEl = document.getElementById('analyticsComplianceRate');
    const usersEl = document.getElementById('analyticsActiveUsers');
    
    if (totalEl) totalEl.textContent = data.totalComms || 0;
    if (avgEl) avgEl.textContent = formatAvgTime(data.avgApprovalTime);
    if (rateEl) rateEl.textContent = (data.complianceRate || 0) + '%';
    if (usersEl) usersEl.textContent = data.activeUsers || 0;

    // Update compliance stats
    const onTimeEl = document.getElementById('complianceOnTime');
    const pendingEl = document.getElementById('compliancePending');
    const lateEl = document.getElementById('complianceLate');
    const overdueEl = document.getElementById('complianceOverdue');
    
    if (onTimeEl) onTimeEl.textContent = data.complianceStats?.onTime || 0;
    if (pendingEl) pendingEl.textContent = data.complianceStats?.pending || 0;
    if (lateEl) lateEl.textContent = data.complianceStats?.late || 0;
    if (overdueEl) overdueEl.textContent = data.complianceStats?.overdue || 0;

    // Update charts
    updateCharts(data, currentChartPeriod);
    updateTopUsers(data.topUsers);
}

// ============================================
// CALCULATE ANALYTICS DATA
// ============================================

function calculateAnalyticsData(comms) {
    const totalComms = comms.length || 0;
    const releasedComms = comms.filter(c => c.status === 'released');

    // Calculate average approval time
    let totalApprovalTime = 0;
    let approvalCount = 0;

    comms.forEach(comm => {
        if (comm.approvals && Object.keys(comm.approvals).length > 0) {
            const approvalTimes = Object.values(comm.approvals)
                .filter(a => a.timestamp)
                .map(a => new Date(a.timestamp).getTime());

            if (approvalTimes.length > 0) {
                const firstApproval = Math.min(...approvalTimes);
                const createdAt = comm.createdAt?.toDate ?
                    comm.createdAt.toDate().getTime() :
                    new Date(comm.createdAt).getTime();

                if (createdAt && firstApproval > createdAt) {
                    totalApprovalTime += (firstApproval - createdAt);
                    approvalCount++;
                }
            }
        }
    });

    const avgApprovalTime = approvalCount > 0 ? totalApprovalTime / approvalCount : 0;

    // Calculate compliance rate
    let totalComplianceItems = 0;
    let completedCompliance = 0;

    comms.forEach(comm => {
        if (comm.compliance && comm.compliance.length > 0) {
            comm.compliance.forEach(item => {
                totalComplianceItems++;
                if (item.status === 'submitted') {
                    completedCompliance++;
                }
            });
        }
    });

    const complianceRate = totalComplianceItems > 0 ?
        Math.round((completedCompliance / totalComplianceItems) * 100) : 0;

    // Compliance stats
    const complianceStats = {
        onTime: 0,
        pending: 0,
        late: 0,
        overdue: 0
    };

    comms.forEach(comm => {
        if (comm.compliance && comm.compliance.length > 0) {
            comm.compliance.forEach(item => {
                const targetDate = new Date(item.targetDate);
                const now = new Date();

                if (item.status === 'submitted') {
                    const submissionDate = new Date(item.submissionDate);
                    if (submissionDate <= targetDate) {
                        complianceStats.onTime++;
                    } else {
                        complianceStats.late++;
                    }
                } else {
                    if (targetDate < now) {
                        complianceStats.overdue++;
                    } else {
                        complianceStats.pending++;
                    }
                }
            });
        }
    });

    // Get active users
    const activeUserSet = new Set();
    comms.forEach(comm => {
        if (comm.createdBy) activeUserSet.add(comm.createdBy);
        if (comm.approvals) {
            Object.values(comm.approvals).forEach(approval => {
                if (approval.approvedBy) activeUserSet.add(approval.approvedBy);
            });
        }
    });

    // Top users
    const userCounts = {};
    comms.forEach(comm => {
        const user = comm.createdByName || comm.createdBy || 'Unknown';
        userCounts[user] = (userCounts[user] || 0) + 1;
    });

    const topUsers = Object.entries(userCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    // Type distribution
    const typeDistribution = {};
    comms.forEach(comm => {
        const type = comm.type || 'Radio Message';
        typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    // Status distribution
    const statusDistribution = {
        draft: 0,
        pending: 0,
        approved: 0,
        released: 0,
        rejected: 0
    };

    comms.forEach(comm => {
        const status = comm.status || 'draft';
        if (status === 'pending' || (status === 'draft' && comm.approvals && Object.keys(comm.approvals).length > 0)) {
            statusDistribution.pending++;
        } else if (statusDistribution[status] !== undefined) {
            statusDistribution[status]++;
        }
    });

    // Trend data
    const trendData = calculateTrendData(comms, currentChartPeriod);

    return {
        totalComms,
        avgApprovalTime,
        complianceRate,
        activeUsers: activeUserSet.size,
        complianceStats,
        topUsers,
        typeDistribution,
        statusDistribution,
        trendData,
        releasedComms: releasedComms.length
    };
}

// ============================================
// CALCULATE TREND DATA
// ============================================

function calculateTrendData(comms, period) {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const dates = [];
    const createdCounts = [];
    const releasedCounts = [];

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    const dailyCreated = {};
    const dailyReleased = {};

    comms.forEach(comm => {
        if (comm.createdAt) {
            const date = comm.createdAt.toDate ?
                comm.createdAt.toDate() :
                new Date(comm.createdAt);

            if (date >= startDate) {
                const key = date.toISOString().split('T')[0];
                dailyCreated[key] = (dailyCreated[key] || 0) + 1;
            }
        }

        if (comm.status === 'released' && comm.releaseInfo?.dateTime) {
            const date = new Date(comm.releaseInfo.dateTime);
            if (date >= startDate) {
                const key = date.toISOString().split('T')[0];
                dailyReleased[key] = (dailyReleased[key] || 0) + 1;
            }
        }
    });

    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0];
        dates.push(key);
        createdCounts.push(dailyCreated[key] || 0);
        releasedCounts.push(dailyReleased[key] || 0);
    }

    return {
        labels: dates.map(d => formatDateForChart(d)),
        created: createdCounts,
        released: releasedCounts
    };
}

// ============================================
// FORMAT HELPERS
// ============================================

function formatDateForChart(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatAvgTime(milliseconds) {
    if (!milliseconds) return '0h';
    const hours = milliseconds / (1000 * 60 * 60);
    if (hours < 1) {
        const minutes = Math.round(hours * 60);
        return `${minutes}m`;
    }
    return `${Math.round(hours)}h`;
}

// ============================================
// UPDATE CHARTS
// ============================================

function updateCharts(data, period) {
    updateTrendChart(data.trendData);
    updateStatusChart(data.statusDistribution);
    updateTypeChart(data.typeDistribution);
}

// ============================================
// TREND CHART
// ============================================

function updateTrendChart(trendData) {
    const canvas = document.getElementById('trendChart');
    if (!canvas) {
        console.warn('Trend chart canvas not found');
        return;
    }
    const ctx = canvas.getContext('2d');

    if (trendChart) trendChart.destroy();

    const hasData = trendData.created.some(v => v > 0) || trendData.released.some(v => v > 0);
    
    if (!hasData) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📊 No data available', canvas.width / 2, canvas.height / 2);
        return;
    }

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trendData.labels,
            datasets: [
                {
                    label: 'Created',
                    data: trendData.created,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#3b82f6'
                },
                {
                    label: 'Released',
                    data: trendData.released,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#10b981'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { size: 10 },
                        boxWidth: 12,
                        padding: 10,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    titleColor: '#1e293b',
                    bodyColor: '#475569',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 10
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: { size: 9 }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 15,
                        font: { size: 8 }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// ============================================
// STATUS CHART
// ============================================

function updateStatusChart(statusDistribution) {
    const canvas = document.getElementById('statusChart');
    if (!canvas) {
        console.warn('Status chart canvas not found');
        return;
    }
    const ctx = canvas.getContext('2d');

    if (statusChart) statusChart.destroy();

    const colors = {
        draft: '#94a3b8',
        pending: '#f59e0b',
        approved: '#3b82f6',
        released: '#10b981',
        rejected: '#ef4444'
    };

    const labels = Object.keys(statusDistribution).map(key =>
        key.charAt(0).toUpperCase() + key.slice(1)
    );
    const data = Object.values(statusDistribution);
    const backgroundColors = Object.keys(statusDistribution).map(key => colors[key]);
    
    const hasData = data.some(v => v > 0);
    
    if (!hasData) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📊 No data available', canvas.width / 2, canvas.height / 2);
        return;
    }

    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 3,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: { size: 10 },
                        boxWidth: 12,
                        padding: 8,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    titleColor: '#1e293b',
                    bodyColor: '#475569',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

// ============================================
// TYPE CHART
// ============================================

function updateTypeChart(typeDistribution) {
    const canvas = document.getElementById('typeChart');
    if (!canvas) {
        console.warn('Type chart canvas not found');
        return;
    }
    const ctx = canvas.getContext('2d');

    if (typeChart) typeChart.destroy();

    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
        '#ef4444', '#ec4899', '#06b6d4', '#f97316'
    ];

    const entries = Object.entries(typeDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    const labels = entries.map(([key]) => key);
    const data = entries.map(([, value]) => value);
    
    const hasData = data.some(v => v > 0);
    
    if (!hasData) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📊 No data available', canvas.width / 2, canvas.height / 2);
        return;
    }

    typeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderRadius: 6,
                borderSkipped: false,
                maxBarThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    titleColor: '#1e293b',
                    bodyColor: '#475569',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 10
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: { size: 9 }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { size: 8 },
                        maxRotation: 45,
                        minRotation: 30
                    }
                }
            }
        }
    });
}

// ============================================
// TOP USERS LIST
// ============================================

function updateTopUsers(topUsers) {
    const container = document.getElementById('topUsersList');
    if (!container) return;

    if (!topUsers || topUsers.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 1rem; color: var(--gray-500);">
                <i class="fas fa-user-slash" style="font-size: 1.5rem;"></i>
                <p style="margin-top: 0.5rem; font-size: 0.8rem;">No user data available</p>
            </div>
        `;
        return;
    }

    const maxCount = topUsers[0]?.count || 1;

    container.innerHTML = topUsers.map((user, index) => {
        const percentage = Math.round((user.count / maxCount) * 100);
        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
        const medal = medals[index] || '';
        const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

        return `
            <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.4rem 0; border-bottom: 1px solid var(--gray-100);">
                <div style="width: 32px; text-align: center; font-size: 1.2rem;">${medal}</div>
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.75rem; font-weight: 500; color: var(--gray-700);">
                            ${escapeHtml(user.name)}
                        </span>
                        <span style="font-size: 0.6rem; font-weight: 600; color: var(--gray-500);">
                            ${user.count} comms
                        </span>
                    </div>
                    <div style="width: 100%; height: 4px; background: var(--gray-200); border-radius: 4px; margin-top: 2px; overflow: hidden;">
                        <div style="width: ${percentage}%; height: 100%; background: ${colors[index]}; border-radius: 4px; transition: width 0.8s ease;"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// SET CHART PERIOD
// ============================================

window.setChartPeriod = function(period) {
    currentChartPeriod = period;
    console.log(`📊 Chart period changed to: ${period}`);

    document.querySelectorAll('#analyticsView .btn-sm').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline');
    });

    const activeButton = document.querySelector(`#analyticsView .btn-sm[onclick*="${period}"]`);
    if (activeButton) {
        activeButton.classList.remove('btn-outline');
        activeButton.classList.add('btn-primary');
    }

    if (allCommunications && allCommunications.length > 0) {
        const data = calculateAnalyticsData(allCommunications);
        updateCharts(data, period);
    }
};

// ============================================
// SHOW EMPTY ANALYTICS
// ============================================

function showEmptyAnalytics() {
    console.log('📊 Showing empty analytics state');
    
    const stats = ['analyticsTotalComms', 'analyticsAvgTime', 'analyticsComplianceRate', 'analyticsActiveUsers'];
    stats.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '0';
    });

    const complianceStats = ['complianceOnTime', 'compliancePending', 'complianceLate', 'complianceOverdue'];
    complianceStats.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '0';
    });

    const chartIds = ['trendChart', 'statusChart', 'typeChart'];
    chartIds.forEach(id => {
        const canvas = document.getElementById(id);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('📊 No data available', canvas.width / 2, canvas.height / 2);
        }
    });

    const container = document.getElementById('topUsersList');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 1rem; color: var(--gray-500);">
                <i class="fas fa-inbox" style="font-size: 1.5rem;"></i>
                <p style="margin-top: 0.5rem; font-size: 0.8rem;">No user data available</p>
            </div>
        `;
    }
}

console.log('✅ Analytics.js loaded');