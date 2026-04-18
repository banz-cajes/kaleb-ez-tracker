// js/analytics.js
// Analytics Dashboard Functions

let trendsChart = null;
let categoryBreakdownChart = null;
let comparisonChart = null;
let projectionChart = null;
let currentTrendView = 'daily';

window.updateAnalytics = function () {
    const period = document.getElementById('analyticsPeriod').value;
    updateMetrics(period);
    updateTrendsChart(period);
    updateCategoryBreakdown();
    updateSpendingHeatmap(period);
    updateInsights(period);
    updateComparisonChart(period);
    updateProjection();
};

function updateMetrics(period) {
    const filteredTransactions = filterTransactionsByPeriod(window.transactions || [], period);

    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const income = filteredTransactions.filter(t => t.type === 'income');

    const daysInPeriod = getDaysInPeriod(period);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const avgDailySpend = totalExpenses / daysInPeriod;
    const avgDailySpendElem = document.getElementById('avgDailySpend');
    if (avgDailySpendElem) avgDailySpendElem.innerText = formatCurrency(avgDailySpend);

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0;
    const savingsRateElem = document.getElementById('savingsRate');
    if (savingsRateElem) savingsRateElem.innerText = `${savingsRate}%`;

    const categorySpending = {};
    expenses.forEach(t => {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });
    const topCategory = Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
        const topCategoryElem = document.getElementById('topCategory');
        const topCategoryPercentElem = document.getElementById('topCategoryPercent');
        if (topCategoryElem) topCategoryElem.innerText = topCategory[0];
        if (topCategoryPercentElem) {
            const topPercent = (topCategory[1] / totalExpenses * 100).toFixed(1);
            topCategoryPercentElem.innerHTML = `${topPercent}% of expenses`;
        }
    }

    const dailySpending = {};
    expenses.forEach(t => {
        dailySpending[t.date] = (dailySpending[t.date] || 0) + t.amount;
    });
    const highestDay = Object.entries(dailySpending).sort((a, b) => b[1] - a[1])[0];
    if (highestDay) {
        const highestSpendDayElem = document.getElementById('highestSpendDay');
        const highestSpendAmountElem = document.getElementById('highestSpendAmount');
        if (highestSpendDayElem) {
            const date = new Date(highestDay[0]);
            highestSpendDayElem.innerText = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        if (highestSpendAmountElem) highestSpendAmountElem.innerHTML = formatCurrency(highestDay[1]);
    }
}

function updateTrendsChart(period) {
    const ctx = document.getElementById('trendsChart');
    if (!ctx) return;

    const context = ctx.getContext('2d');
    let labels = [];
    let expenseData = [];
    let incomeData = [];

    const filteredTransactions = filterTransactionsByPeriod(window.transactions || [], period);

    if (currentTrendView === 'daily') {
        const days = getDaysArray(period);
        days.forEach(day => {
            const dayExpenses = filteredTransactions.filter(t => t.type === 'expense' && t.date === day).reduce((sum, t) => sum + t.amount, 0);
            const dayIncome = filteredTransactions.filter(t => t.type === 'income' && t.date === day).reduce((sum, t) => sum + t.amount, 0);
            labels.push(new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            expenseData.push(dayExpenses);
            incomeData.push(dayIncome);
        });
    } else if (currentTrendView === 'weekly') {
        const weeks = getWeeksArray(period);
        weeks.forEach(week => {
            const weekExpenses = filteredTransactions.filter(t => t.type === 'expense' && t.date >= week.start && t.date <= week.end).reduce((sum, t) => sum + t.amount, 0);
            const weekIncome = filteredTransactions.filter(t => t.type === 'income' && t.date >= week.start && t.date <= week.end).reduce((sum, t) => sum + t.amount, 0);
            labels.push(`Week ${week.weekNumber}`);
            expenseData.push(weekExpenses);
            incomeData.push(weekIncome);
        });
    } else {
        const months = getMonthsArray(period);
        months.forEach(month => {
            const monthExpenses = filteredTransactions.filter(t => t.type === 'expense' && t.date.startsWith(month)).reduce((sum, t) => sum + t.amount, 0);
            const monthIncome = filteredTransactions.filter(t => t.type === 'income' && t.date.startsWith(month)).reduce((sum, t) => sum + t.amount, 0);
            labels.push(new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
            expenseData.push(monthExpenses);
            incomeData.push(monthIncome);
        });
    }

    if (trendsChart) trendsChart.destroy();
    trendsChart = new Chart(context, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Expenses', data: expenseData, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: true, tension: 0.4 },
                { label: 'Income', data: incomeData, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}` } } },
            scales: { y: { ticks: { callback: (value) => formatCurrency(value) } } }
        }
    });
}

function updateCategoryBreakdown() {
    const type = document.getElementById('categoryBreakdownType').value;
    const period = document.getElementById('analyticsPeriod').value;
    const filteredTransactions = filterTransactionsByPeriod(window.transactions || [], period);
    const relevantTransactions = filteredTransactions.filter(t => t.type === type);

    const categoryData = {};
    relevantTransactions.forEach(t => {
        categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
    });

    const sortedCategories = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);
    const labels = sortedCategories.map(c => c[0]);
    const data = sortedCategories.map(c => c[1]);
    const colors = generateColors(labels.length);

    const ctx = document.getElementById('categoryBreakdownChart');
    if (!ctx) return;

    if (categoryBreakdownChart) categoryBreakdownChart.destroy();
    categoryBreakdownChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: { labels: labels, datasets: [{ data: data, backgroundColor: colors, borderWidth: 0 }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (context) => `${context.label}: ${formatCurrency(context.raw)} (${((context.raw / data.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%)` } }
            }
        }
    });

    const total = data.reduce((a, b) => a + b, 0);
    const listHtml = sortedCategories.map(([cat, amount], idx) => `
        <div class="category-item">
            <div class="category-name"><div class="category-color" style="background: ${colors[idx % colors.length]}"></div><span>${cat}</span></div>
            <div><span class="category-amount">${formatCurrency(amount)}</span><span class="category-percent">(${((amount / total) * 100).toFixed(1)}%)</span></div>
        </div>
    `).join('');
    const categoryBreakdownList = document.getElementById('categoryBreakdownList');
    if (categoryBreakdownList) categoryBreakdownList.innerHTML = listHtml || '<div class="category-item">No data available</div>';
}

function updateSpendingHeatmap(period) {
    const heatmapContainer = document.getElementById('spendingHeatmap');
    if (!heatmapContainer) return;

    const dailySpending = {};
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const daySpending = (window.transactions || []).filter(t => t.type === 'expense' && t.date === dateStr).reduce((sum, t) => sum + t.amount, 0);
        dailySpending[dateStr] = daySpending;
    }

    const maxSpending = Math.max(...Object.values(dailySpending), 1);
    let heatmapHtml = '';
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const spending = dailySpending[dateStr] || 0;
        const intensity = Math.min(5, Math.floor((spending / maxSpending) * 5));
        heatmapHtml += `<div class="heatmap-day" data-intensity="${intensity}" onclick="window.showDayDetails && window.showDayDetails('${dateStr}')" title="${date.toLocaleDateString()}: ${formatCurrency(spending)}"></div>`;
    }
    heatmapContainer.innerHTML = heatmapHtml;
}

function updateInsights(period) {
    const filteredTransactions = filterTransactionsByPeriod(window.transactions || [], period);
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const income = filteredTransactions.filter(t => t.type === 'income');
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

    const insights = [];
    const avgDailySpend = totalExpenses / getDaysInPeriod(period);
    if (avgDailySpend > 1000) {
        insights.push({ type: 'warning', icon: 'fas fa-chart-line', title: 'High Daily Spending', description: `Your average daily spend is ${formatCurrency(avgDailySpend)}. Consider setting daily spending limits.` });
    }

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;
    if (savingsRate < 20) {
        insights.push({ type: 'warning', icon: 'fas fa-piggy-bank', title: 'Low Savings Rate', description: `Your savings rate is ${savingsRate.toFixed(1)}%. Aim for at least 20% to build wealth.` });
    } else if (savingsRate > 30) {
        insights.push({ type: 'success', icon: 'fas fa-trophy', title: 'Excellent Savings!', description: `Great job! You're saving ${savingsRate.toFixed(1)}% of your income. Keep it up!` });
    }

    const categorySpending = {};
    expenses.forEach(t => { categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount; });
    const topCategory = Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0];
    if (topCategory && topCategory[1] > totalExpenses * 0.3) {
        insights.push({ type: 'info', icon: 'fas fa-chart-pie', title: 'Category Concentration', description: `${topCategory[0]} makes up ${((topCategory[1] / totalExpenses) * 100).toFixed(1)}% of your expenses. Consider diversifying.` });
    }

    const recentExpenses = expenses.filter(t => { const date = new Date(t.date); const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14); return date >= twoWeeksAgo; }).reduce((sum, t) => sum + t.amount, 0);
    const olderExpenses = expenses.filter(t => { const date = new Date(t.date); const fourWeeksAgo = new Date(); fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28); const threeWeeksAgo = new Date(); threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 14); return date >= fourWeeksAgo && date < threeWeeksAgo; }).reduce((sum, t) => sum + t.amount, 0);
    if (recentExpenses > olderExpenses * 1.2) {
        insights.push({ type: 'danger', icon: 'fas fa-chart-line', title: 'Rising Expenses', description: 'Your spending has increased by 20% compared to previous period. Review your recent transactions.' });
    }

    const insightsHtml = insights.map(insight => `<div class="insight-card ${insight.type}"><div class="insight-icon"><i class="${insight.icon}"></i></div><div class="insight-title">${insight.title}</div><div class="insight-description">${insight.description}</div></div>`).join('');
    const insightsContainer = document.getElementById('insightsContainer');
    if (insightsContainer) insightsContainer.innerHTML = insightsHtml || '<div class="insight-card">No insights available for this period. Add more transactions to get insights!</div>';
}

function updateComparisonChart(period) {
    const filteredTransactions = filterTransactionsByPeriod(window.transactions || [], period);
    const months = getLastMonths(6);
    const expenseData = [];
    const incomeData = [];

    months.forEach(month => {
        const monthExpenses = filteredTransactions.filter(t => t.type === 'expense' && t.date.startsWith(month)).reduce((sum, t) => sum + t.amount, 0);
        const monthIncome = filteredTransactions.filter(t => t.type === 'income' && t.date.startsWith(month)).reduce((sum, t) => sum + t.amount, 0);
        expenseData.push(monthExpenses);
        incomeData.push(monthIncome);
    });

    const ctx = document.getElementById('comparisonChart');
    if (!ctx) return;

    if (comparisonChart) comparisonChart.destroy();
    comparisonChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: months.map(m => new Date(m + '-01').toLocaleDateString('en-US', { month: 'short' })),
            datasets: [{ label: 'Expenses', data: expenseData, backgroundColor: 'rgba(239, 68, 68, 0.7)', borderRadius: 8 }, { label: 'Income', data: incomeData, backgroundColor: 'rgba(16, 185, 129, 0.7)', borderRadius: 8 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}` } } },
            scales: { y: { ticks: { callback: (value) => formatCurrency(value) } } }
        }
    });
}

function updateProjection() {
    const last3Months = getLastMonths(3);
    let totalNet = 0;
    last3Months.forEach(month => {
        const monthExpenses = (window.transactions || []).filter(t => t.type === 'expense' && t.date.startsWith(month)).reduce((sum, t) => sum + t.amount, 0);
        const monthIncome = (window.transactions || []).filter(t => t.type === 'income' && t.date.startsWith(month)).reduce((sum, t) => sum + t.amount, 0);
        totalNet += (monthIncome - monthExpenses);
    });

    const avgMonthlyNet = totalNet / 3;
    const currentBalance = getCurrentBalance();
    const projection3m = currentBalance + (avgMonthlyNet * 3);
    const projection6m = currentBalance + (avgMonthlyNet * 6);
    const projection12m = currentBalance + (avgMonthlyNet * 12);

    const projectedBalance3m = document.getElementById('projectedBalance3m');
    const projectedBalance6m = document.getElementById('projectedBalance6m');
    const projectedBalance12m = document.getElementById('projectedBalance12m');
    if (projectedBalance3m) projectedBalance3m.innerHTML = formatCurrency(projection3m);
    if (projectedBalance6m) projectedBalance6m.innerHTML = formatCurrency(projection6m);
    if (projectedBalance12m) projectedBalance12m.innerHTML = formatCurrency(projection12m);

    const months = ['Current', 'Month 3', 'Month 6', 'Month 12'];
    const projections = [currentBalance, projection3m, projection6m, projection12m];
    const ctx = document.getElementById('projectionChart');
    if (!ctx) return;

    if (projectionChart) projectionChart.destroy();
    projectionChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: { labels: months, datasets: [{ label: 'Projected Balance', data: projections, borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', fill: true, tension: 0.4 }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { tooltip: { callbacks: { label: (context) => `Balance: ${formatCurrency(context.raw)}` } } },
            scales: { y: { ticks: { callback: (value) => formatCurrency(value) } } }
        }
    });
}

window.showDayDetails = function (dateStr) {
    const dayTransactions = (window.transactions || []).filter(t => t.date === dateStr);
    const totalSpent = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const modal = document.getElementById('statsModal');
    const title = document.getElementById('statsModalTitle');
    const content = document.getElementById('statsModalContent');

    if (title) title.innerHTML = `📅 ${new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`;
    if (content) {
        const transactionsHtml = dayTransactions.map(t => `<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--gray-200);"><span>${t.category}${t.note ? `<br><small style="color: var(--gray-500);">${escapeHtml(t.note)}</small>` : ''}</span><span style="color: ${t.type === 'expense' ? '#ef4444' : '#10b981'}; font-weight: 600;">${formatCurrency(t.amount)}</span></div>`).join('');
        content.innerHTML = `<div style="margin-bottom: 16px;"><div style="display: flex; justify-content: space-between; padding: 12px; background: var(--gray-100); border-radius: var(--radius-lg); margin-bottom: 8px;"><span>💰 Total Spent</span><strong style="color: #ef4444;">${formatCurrency(totalSpent)}</strong></div><div style="display: flex; justify-content: space-between; padding: 12px; background: var(--gray-100); border-radius: var(--radius-lg);"><span>💵 Total Income</span><strong style="color: #10b981;">${formatCurrency(totalIncome)}</strong></div></div><div style="margin-top: 16px;"><h4 style="margin-bottom: 8px;">Transactions (${dayTransactions.length})</h4>${transactionsHtml || '<div style="text-align: center; padding: 20px;">No transactions for this day</div>'}</div>`;
    }
    if (modal) modal.style.display = 'flex';
    document.body.classList.add('modal-open');
};

window.toggleHeatmapView = function () {
    if (window.sileo) window.sileo.info('Year view coming soon!', 'Coming Soon');
};

window.refreshInsights = function () {
    updateInsights(document.getElementById('analyticsPeriod').value);
    if (window.sileo) window.sileo.success('Insights refreshed!', 'Updated');
};

window.exportAnalyticsReport = function () {
    const period = document.getElementById('analyticsPeriod').value;
    const reportData = generateReportData(period);
    const csv = convertToCSV(reportData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (window.sileo) window.sileo.success('Report exported successfully!', 'Export Complete');
};

// Helper functions
function filterTransactionsByPeriod(transactions, period) {
    const now = new Date();
    let startDate;
    switch (period) {
        case 'week': startDate = new Date(now.setDate(now.getDate() - 7)); break;
        case 'month': startDate = new Date(now.setDate(now.getDate() - 30)); break;
        case 'quarter': startDate = new Date(now.setMonth(now.getMonth() - 3)); break;
        case 'year': startDate = new Date(now.setFullYear(now.getFullYear() - 1)); break;
        default: return transactions;
    }
    return transactions.filter(t => new Date(t.date) >= startDate);
}

function getDaysInPeriod(period) {
    switch (period) {
        case 'week': return 7;
        case 'month': return 30;
        case 'quarter': return 90;
        case 'year': return 365;
        default: return 30;
    }
}

function getDaysArray(period) {
    const days = [];
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
        case 'week': startDate.setDate(startDate.getDate() - 7); break;
        case 'month': startDate.setDate(startDate.getDate() - 30); break;
        case 'quarter': startDate.setMonth(startDate.getMonth() - 3); break;
        case 'year': startDate.setFullYear(startDate.getFullYear() - 1); break;
    }
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        days.push(d.toISOString().split('T')[0]);
    }
    return days;
}

function getWeeksArray(period) {
    const weeks = [];
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
        case 'month': startDate.setDate(startDate.getDate() - 30); break;
        case 'quarter': startDate.setMonth(startDate.getMonth() - 3); break;
        case 'year': startDate.setFullYear(startDate.getFullYear() - 1); break;
        default: startDate.setDate(startDate.getDate() - 30);
    }
    let weekNumber = 1;
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
        const weekEnd = new Date(d);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weeks.push({ weekNumber: weekNumber++, start: d.toISOString().split('T')[0], end: weekEnd.toISOString().split('T')[0] });
    }
    return weeks;
}

function getMonthsArray(period) {
    const months = [];
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
        case 'quarter': startDate.setMonth(startDate.getMonth() - 3); break;
        case 'year': startDate.setFullYear(startDate.getFullYear() - 1); break;
        default: startDate.setMonth(startDate.getMonth() - 6);
    }
    for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
        months.push(d.toISOString().slice(0, 7));
    }
    return months;
}

function getLastMonths(count) {
    const months = [];
    const today = new Date();
    for (let i = count - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(today.getMonth() - i);
        months.push(date.toISOString().slice(0, 7));
    }
    return months;
}

function getCurrentBalance() {
    const totalIncome = (window.transactions || []).filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = (window.transactions || []).filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return totalIncome - totalExpense;
}

function generateColors(count) {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec489a', '#14b8a6', '#f97316', '#84cc16', '#06b6d4'];
    while (colors.length < count) colors.push(colors[colors.length % colors.length]);
    return colors.slice(0, count);
}

function generateReportData(period) {
    const filteredTransactions = filterTransactionsByPeriod(window.transactions || [], period);
    return {
        period: period, generated: new Date().toISOString(), transactions: filteredTransactions,
        summary: {
            totalIncome: filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
            totalExpenses: filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
            totalSavings: filteredTransactions.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0),
            transactionCount: filteredTransactions.length
        }
    };
}

function convertToCSV(data) {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Note'];
    const rows = data.transactions.map(t => [t.date, t.type, t.category, t.amount, t.note || '']);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatCurrency(amount) {
    const currency = window.currentCurrency || 'PHP';
    const symbols = { PHP: '₱', USD: '$', EUR: '€', JPY: '¥' };
    const symbol = symbols[currency] || '₱';
    if (isNaN(amount)) amount = 0;
    return `${symbol} ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

// Initialize trend buttons
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.trend-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.trend-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTrendView = btn.dataset.trend;
            updateTrendsChart(document.getElementById('analyticsPeriod').value);
        });
    });
});

window.updateCategoryChart = window.updateCategoryChart || function () {
    if (typeof window.updateCategoryChartOriginal === 'function') {
        window.updateCategoryChartOriginal();
    } else {
        console.warn('updateCategoryChart not available - using fallback');
        const ctx = document.getElementById('categoryChart');
        if (ctx && window.categoryChart) {
            window.categoryChart.update();
        }
    }
};

window.updateTrendChart = window.updateTrendChart || function () {
    if (typeof window.updateTrendChartOriginal === 'function') {
        window.updateTrendChartOriginal();
    } else {
        console.warn('updateTrendChart not available - using fallback');
        const ctx = document.getElementById('trendChart');
        if (ctx && window.trendChart) {
            window.trendChart.update();
        }
    }
};