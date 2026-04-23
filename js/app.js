// Initialize sileo if not already present
if (typeof window.sileo === 'undefined') {
    window.sileo = {
        success: (msg, title) => { console.log('✅', title, msg); alert(msg); },
        error: (msg, title) => { console.log('❌', title, msg); alert(msg); },
        warning: (msg, title) => { console.log('⚠️', title, msg); alert(msg); },
        info: (msg, title) => { console.log('ℹ️', title, msg); alert(msg); },
        loading: (msg, title) => ({ remove: () => { } })
    };
}
// Define toggleUserMenu FIRST
window.toggleUserMenu = function () {
    const dropdown = document.getElementById('userDropdown');
    if (!dropdown) return;

    if (dropdown.style.opacity === '1') {
        dropdown.style.opacity = '0';
        dropdown.style.visibility = 'hidden';
    } else {
        dropdown.style.opacity = '1';
        dropdown.style.visibility = 'visible';
    }
};

// Close user dropdown when clicking outside
document.addEventListener('click', function (event) {
    const userMenu = document.querySelector('.user-menu');
    const userDropdown = document.getElementById('userDropdown');

    if (userDropdown && userMenu && !userMenu.contains(event.target)) {
        userDropdown.style.opacity = '0';
        userDropdown.style.visibility = 'hidden';
    }
});

// js/app.js - FIXED VERSION (continued)
// Main Application Logic
// ... rest of your code
// Global variables - Use window object consistently
window.transactions = [];
window.budgetLimit = 0;
window.debtGoal = 0;
window.savingsGoal = 0;
window.goals = [];
window.bills = [];
window.currentUser = null;
window.currentCurrency = 'PHP';

let editIndex = -1;
let editGoalIndex = -1;
let editBillIndex = -1;

// ===== 30 EXPENSE CATEGORIES =====
const expenseCats = [
    "🍔 Food & Groceries",
    "🏠 Rent / Mortgage",
    "⚡ Electricity Bill",
    "💧 Water Bill",
    "🌐 Internet Bill",
    "💸 Loan to Friend",
    "🤝 Pautang (Credit)",
    "📱 Phone Bill",
    "🍱 School Allowance",
    "🚗 Gas / Fuel",
    "🚆 Public Transport",
    "👶 Baby Kaleb Needs",
    "💊 Health & Medicine",
    "📚 Education / School",
    "💸 Transfer to GCash",
    "📚 Student Needs",
    "🏦 Bank Transfer",
    "🛍️ Shopping",
    "🍽️ Dining Out",
    "☕ Coffee & Drinks",
    "💳 Credit Card Payment",
    "💰 Loan / Debt Payment",
    "📺 Streaming Subscriptions",
    "🎁 Gifts & Donations",
    "✈️ Travel / Vacation",
    "🏋️ Gym / Fitness",
    "🐶 Pet Supplies",
    "🧴 Personal Care",
    "👕 Clothing",
    "👟 Shoes",
    "💇 Haircut / Salon",
    "🎮 Entertainment / Games",
    "📖 Books / Hobbies",
    "🔧 Home Maintenance",
    "🚑 Emergency",
    "📦 Others / Miscellaneous"

];

// ===== 30 INCOME CATEGORIES =====
const incomeCats = [
    "💼 Monthly Salary",
    "📡 WiFi Sharing Business",
    "🛜 Piso Wifi Income",
    "🌐 Internet Service Income",
    "💰 Incentive pay",
    "🎄 13th Month Pay",
    "🏆 Bonus",
    "💵 Commission",
    "🏪 Business Income",
    "📈 Investment Income",
    "💻 Freelance / Online Job",
    "🚗 Grab / Angkas Driver",
    "📦 Delivery (Foodpanda/Grab)",
    "🏠 Rental Income",
    "🎁 Cash Gift",
    "🎂 Birthday Money",
    "🎄 Christmas Money",
    "💰 Allowance",
    "💸 Side Hustle",
    "🔄 Refund / Reimbursement",
    "🏦 Interest Income",
    "💎 Sold Item / Garage Sale",
    "📊 Stock Dividends",
    "🪙 Crypto Gains",
    "💹 Forex Trading",
    "🏧 ATM Withdrawal (Cash In)",
    "📝 Writing / Content",
    "🎨 Graphic Design",
    "💻 Programming / Web Dev",
    "📚 Tutorial / Teaching",
    "🚚 Delivery Service",
    "🧺 Laundry Service",
    "✨ Other Income"
];

// ===== 30 SAVINGS CATEGORIES =====
const savingsCats = [
    "🏦 Emergency Fund",
    "🎓 Education Fund",
    "🏡 House Downpayment",
    "🚗 Car Fund",
    "✈️ Travel Fund",
    "🎄 Christmas Fund",
    "🎂 Birthday Fund",
    "💍 Wedding Fund",
    "👶 Baby Kaleb Fund",
    "📈 Investment Fund",
    "🪙 Stocks / Crypto",
    "🏦 Pag-IBIG MP2",
    "⏰ Retirement Fund",
    "💼 Business Capital",
    "🏠 House Renovation",
    "📱 Gadget Fund",
    "🎁 Gift Fund",
    "🩺 Medical / Health Fund",
    "🐶 Pet Fund",
    "👕 Clothing Fund",
    "📚 Book Fund",
    "🎮 Gaming Fund",
    "🏋️ Fitness Fund",
    "🎵 Music Equipment",
    "📷 Camera / Photography",
    "🖥️ Computer / Laptop",
    "📺 TV / Entertainment",
    "🛋️ Furniture Fund",
    "🔧 Tool / Equipment",
    "💰 General Savings"
];
const chartColors = ['#2A9D8F', '#E76F51', '#E9C46A', '#4A90E2', '#9B87F5', '#F4A261', '#A8D5E5', '#C44569'];

// Utility functions
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
}

function formatAmount(amount) {
    if (isNaN(amount)) return '0.00';
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function parseAmount(amountString) {
    if (!amountString) return 0;
    const cleaned = amountString.replace(/,/g, '').replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}

function formatCurrency(amount) {
    if (isNaN(amount)) amount = 0;
    const symbols = { PHP: '₱', USD: '$', EUR: '€', JPY: '¥' };
    return `${symbols[window.currentCurrency] || '₱'} ${formatAmount(amount)}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function toggleInput(id) {
    const element = document.getElementById(id);
    if (element) element.classList.toggle('hidden');
}

async function loadUserData() {
    console.log('Loading data for user:', window.currentUser?.uid);

    if (!window.currentUser) return;

    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';

    const db = window.db;

    try {
        const doc = await db.collection('users').doc(window.currentUser.uid).get();

        if (doc.exists) {
            const data = doc.data();
            window.transactions = data.transactions || [];
            window.budgetLimit = data.monthlyBudget || 0;
            window.debtGoal = data.debtGoal || 0;
            window.savingsGoal = data.savingsGoal || 0;
            window.goals = data.goals || [];
            window.bills = data.bills || [];
            console.log(`✅ Loaded ${window.transactions.length} transactions from Firebase`);
        } else {
            console.log('No existing data for this user');
            window.transactions = [];
            window.goals = [];
            window.bills = [];
            window.budgetLimit = 0;
            window.debtGoal = 0;
            window.savingsGoal = 0;
        }

        // Save to cache
        localStorage.setItem('cajesData_' + window.currentUser.uid, JSON.stringify({
            transactions: window.transactions,
            budgetLimit: window.budgetLimit,
            debtGoal: window.debtGoal,
            savingsGoal: window.savingsGoal,
            goals: window.goals,
            bills: window.bills
        }));

        // Load avatar from cloud
        await loadUserAvatar();

        if (typeof initializeApp === 'function') initializeApp();
        if (typeof render === 'function') render();

        // ✅ ADD THIS - Update charts after data loads
        setTimeout(() => {
            if (typeof updateCategoryChart === 'function') {
                console.log('Updating category chart after data load');
                updateCategoryChart();
            }
            if (typeof updateTrendChart === 'function') {
                console.log('Updating trend chart after data load');
                updateTrendChart();
            }
            if (typeof initCharts === 'function') {
                initCharts();
            }
        }, 500);

        if (loader) loader.style.display = 'none';

    } catch (error) {
        console.error('Firestore error:', error);
        const cached = localStorage.getItem('cajesData_' + window.currentUser.uid);
        if (cached) {
            try {
                const data = JSON.parse(cached);
                window.transactions = data.transactions || [];
                window.budgetLimit = data.budgetLimit || 0;
                window.debtGoal = data.debtGoal || 0;
                window.savingsGoal = data.savingsGoal || 0;
                window.goals = data.goals || [];
                window.bills = data.bills || [];
                console.log(`✅ Loaded ${window.transactions.length} transactions from cache`);

                loadUserAvatar();

                if (typeof initializeApp === 'function') initializeApp();
                if (typeof render === 'function') render();

                // ✅ ADD THIS - Update charts from cache too
                setTimeout(() => {
                    if (typeof updateCategoryChart === 'function') {
                        updateCategoryChart();
                    }
                    if (typeof updateTrendChart === 'function') {
                        updateTrendChart();
                    }
                }, 500);
            } catch (e) { console.log('Cache error', e); }
        }
        if (loader) loader.style.display = 'none';
    }
}

// ===== REAL-TIME SYNC =====
let unsubscribeRealtime = null;
let isSyncing = false;

// Set up real-time listener for transactions
function setupRealtimeSync() {
    if (!window.currentUser || !window.db) {
        console.log('Cannot setup real-time sync: No user or db');
        return;
    }

    // Remove existing listener if any
    if (unsubscribeRealtime) {
        unsubscribeRealtime();
        unsubscribeRealtime = null;
    }

    console.log('🔄 Setting up real-time sync for user:', window.currentUser.uid);

    // Listen for real-time changes from Firebase
    unsubscribeRealtime = window.db.collection('users')
        .doc(window.currentUser.uid)
        .onSnapshot({
            includeMetadataChanges: true
        }, (doc) => {
            if (isSyncing) return; // Prevent loops

            if (doc.exists) {
                const data = doc.data();
                const serverTransactions = data.transactions || [];
                const localTransactions = window.transactions || [];

                // Check if data is different from local
                const serverHash = JSON.stringify(serverTransactions);
                const localHash = JSON.stringify(localTransactions);

                if (serverHash !== localHash) {
                    console.log('🔄 Real-time update detected! Syncing...');
                    isSyncing = true;

                    // Update local data with server data
                    window.transactions = serverTransactions;
                    window.budgetLimit = data.monthlyBudget || window.budgetLimit;
                    window.debtGoal = data.debtGoal || window.debtGoal;
                    window.savingsGoal = data.savingsGoal || window.savingsGoal;
                    window.goals = data.goals || window.goals;
                    window.bills = data.bills || window.bills;

                    // Save to localStorage cache
                    localStorage.setItem('cajesData_' + window.currentUser.uid, JSON.stringify({
                        transactions: window.transactions,
                        budgetLimit: window.budgetLimit,
                        debtGoal: window.debtGoal,
                        savingsGoal: window.savingsGoal,
                        goals: window.goals,
                        bills: window.bills,
                        lastSync: new Date().toISOString()
                    }));

                    // Re-render UI
                    if (typeof render === 'function') {
                        render();
                    }

                    // Show notification (optional)
                    // showRealtimeNotification();

                    setTimeout(() => {
                        isSyncing = false;
                    }, 500);
                }
            }
        }, (error) => {
            console.error('Real-time sync error:', error);
        });
}

// Show notification when real-time update happens
let lastNotificationTime = 0;

function showRealtimeNotification() {
    const now = Date.now();
    // Don't show more than once every 3 seconds
    if (now - lastNotificationTime < 3000) return;
    lastNotificationTime = now;

    // Create floating notification
    const notification = document.createElement('div');
    notification.className = 'realtime-notification';
    notification.innerHTML = `
        <i class="fas fa-sync-alt fa-spin"></i>
        <span>Synced from another device</span>
    `;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Remove after 2 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}

// Stop real-time listener (call on logout)
function stopRealtimeSync() {
    if (unsubscribeRealtime) {
        unsubscribeRealtime();
        unsubscribeRealtime = null;
        console.log('🔴 Real-time sync stopped');
    }
}

// Manual sync button (for troubleshooting)
async function manualSync() {
    if (!window.currentUser) {
        showToast('Please login first', 'warning');
        return;
    }

    showToast('🔄 Syncing...', 'info');

    try {
        const doc = await window.db.collection('users').doc(window.currentUser.uid).get();
        if (doc.exists) {
            const data = doc.data();
            const serverTransactions = data.transactions || [];
            const serverHash = JSON.stringify(serverTransactions);
            const localHash = JSON.stringify(window.transactions);

            if (serverHash !== localHash) {
                window.transactions = serverTransactions;
                window.budgetLimit = data.monthlyBudget || window.budgetLimit;
                window.debtGoal = data.debtGoal || window.debtGoal;
                window.savingsGoal = data.savingsGoal || window.savingsGoal;
                window.goals = data.goals || window.goals;
                window.bills = data.bills || window.bills;

                render();
                showToast('✅ Sync complete!', 'success');
            } else {
                showToast('Already in sync', 'info');
            }
        }
    } catch (error) {
        console.error('Manual sync error:', error);
        showToast('Sync failed', 'error');
    }
}

// Auto-save with real-time broadcast
const originalSaveToFirebase = saveToFirebase;
window.saveToFirebase = async function () {
    if (!window.currentUser) return false;

    const result = await originalSaveToFirebase();

    // Force a quick re-render to show changes immediately
    if (typeof render === 'function') {
        render();
    }

    return result;
};

async function saveToFirebase() {
    if (!window.currentUser) return false;

    const dataToSave = {
        transactions: window.transactions,
        monthlyBudget: window.budgetLimit,
        debtGoal: window.debtGoal,
        savingsGoal: window.savingsGoal,
        goals: window.goals,
        bills: window.bills,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };

    localStorage.setItem('cajesData_' + window.currentUser.uid, JSON.stringify({
        transactions: window.transactions,
        budgetLimit: window.budgetLimit,
        debtGoal: window.debtGoal,
        savingsGoal: window.savingsGoal,
        goals: window.goals,
        bills: window.bills
    }));
    await loadUserAvatar();
    if (!navigator.onLine) {
        if (window.sileo) window.sileo.warning('You are offline. Data saved locally.', 'Offline Mode');
        render();
        return true;
    }

    try {
        const db = window.db;
        await db.collection('users').doc(window.currentUser.uid).set(dataToSave, { merge: true });
        render();
        return true;
    } catch (error) {
        console.error('Save error:', error);
        if (window.sileo) window.sileo.error('Data saved locally only. Check your connection.', 'Sync Failed');
        render();
        return false;
    }
}

// Render functions
function render() {
    const tbody = document.getElementById('tbody');
    const searchInput = document.getElementById('searchBar');
    const search = searchInput ? searchInput.value.toLowerCase() : '';
    const monthFilter = document.getElementById('monthFilter')?.value || '';
    const typeFilter = document.getElementById('typeFilter')?.value || 'all';

    if (!tbody) return;
    tbody.innerHTML = '';

    let totalIncome = 0, totalExpense = 0, totalSavings = 0, cashOnHand = 0;
    let debtPaid = 0, todaySpent = 0, weekSpent = 0, monthSpent = 0;
    let monthIncome = 0, monthExpense = 0;
    let expenseByCat = {}, incomeByCat = {};

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Make sure window.transactions exists
    const transactions = window.transactions || [];
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log('Rendering transactions:', transactions.length); // Debug log

    sortedTransactions.forEach((t, idx) => {
        const amount = t.amount || 0;
        if (t.type === 'income') totalIncome += amount;
        else if (t.type === 'expense') {
            totalExpense += amount;
            if (t.category?.toLowerCase().includes('debt')) debtPaid += amount;
        }
        else if (t.type === 'savings') totalSavings += amount;

        if (t.type === 'expense' && t.date === today) todaySpent += amount;
        if (t.type === 'expense' && t.date >= weekAgo) weekSpent += amount;
        if (t.type === 'expense' && t.date?.startsWith(currentMonth)) monthSpent += amount;

        if (t.date?.startsWith(monthFilter)) {
            if (t.type === 'income') {
                monthIncome += amount;
                incomeByCat[t.category] = (incomeByCat[t.category] || 0) + amount;
            } else if (t.type === 'expense') {
                monthExpense += amount;
                expenseByCat[t.category] = (expenseByCat[t.category] || 0) + amount;
            }
        }

        // FIXED SEARCH LOGIC
        const searchTerm = search.toLowerCase();
        const categoryMatch = t.category?.toLowerCase().includes(searchTerm);
        const noteMatch = t.note?.toLowerCase().includes(searchTerm);
        const matchesSearch = search === '' || categoryMatch || noteMatch;

        const matchesMonth = t.date?.startsWith(monthFilter) || monthFilter === '';
        const matchesType = typeFilter === 'all' || t.type === typeFilter;

        if (matchesSearch && matchesMonth && matchesType) {
            tbody.innerHTML += `<tr onclick="openEditModal(${idx})" style="cursor: pointer;">
                <td class="category-cell">
                    <span style="font-weight:600;">${t.category || '-'}</span>
                    ${t.note ? `<span class="note">${escapeHtml(t.note)}</span>` : ''}
                </td>
                <td style="color: ${t.type === 'income' ? '#10b981' : t.type === 'savings' ? '#3b82f6' : '#ef4444'}; font-weight:600;">
                    ${formatCurrency(amount)}
                </td>
                <td>${formatDate(t.date)}</td>
                <td style="text-align: center;">
                    <div class="action-cell">
                        <button class="action-btn" onclick="event.stopPropagation(); openEditModal(${idx})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="event.stopPropagation(); deleteTransaction(${idx})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
        }
    });

    // Inside render() function, after calculating monthIncome and monthExpense
    // Add this code:

    // Calculate totals for the current filtered view
    let filteredTotalIncome = 0;
    let filteredTotalExpense = 0;
    let filteredTotalSavings = 0;

    // Loop through filtered transactions to get totals for current view
    sortedTransactions.forEach((t, idx) => {
        const amount = t.amount || 0;
        const searchTerm = search.toLowerCase();
        const categoryMatch = t.category?.toLowerCase().includes(searchTerm);
        const noteMatch = t.note?.toLowerCase().includes(searchTerm);
        const matchesSearch = search === '' || categoryMatch || noteMatch;
        const matchesMonth = t.date?.startsWith(monthFilter) || monthFilter === '';
        const matchesType = typeFilter === 'all' || t.type === typeFilter;

        if (matchesSearch && matchesMonth && matchesType) {
            if (t.type === 'income') filteredTotalIncome += amount;
            else if (t.type === 'expense') filteredTotalExpense += amount;
            else if (t.type === 'savings') filteredTotalSavings += amount;
        }
    });

    const filteredNet = filteredTotalIncome - filteredTotalExpense;

    // Create or update summary bar
    let summaryBar = document.getElementById('transactionsSummary');
    if (!summaryBar) {
        // Create summary bar if it doesn't exist
        summaryBar = document.createElement('div');
        summaryBar.id = 'transactionsSummary';
        summaryBar.className = 'transactions-summary';
        const transactionsHeader = document.querySelector('.transactions-header');
        if (transactionsHeader) {
            transactionsHeader.insertAdjacentElement('afterend', summaryBar);
        }
    }

    // Update summary bar HTML
    summaryBar.innerHTML = `
    <div class="summary-cards">
        <div class="summary-card income">
            <div class="summary-icon"><i class="fas fa-arrow-down"></i></div>
            <div class="summary-info">
                <span class="summary-label">Total Income</span>
                <span class="summary-value" style="color: #10b981;">${formatCurrency(filteredTotalIncome)}</span>
            </div>
        </div>
        <div class="summary-card expense">
            <div class="summary-icon"><i class="fas fa-arrow-up"></i></div>
            <div class="summary-info">
                <span class="summary-label">Total Expenses</span>
                <span class="summary-value" style="color: #ef4444;">${formatCurrency(filteredTotalExpense)}</span>
            </div>
        </div>
        <div class="summary-card net">
    <div class="summary-icon"><i class="fas fa-chart-line"></i></div>
    <div class="summary-info">
        <span class="summary-label">Net Balance</span>
        <span class="summary-value" style="color: #8b5cf6;">${formatCurrency(filteredNet)}</span>
        <span class="summary-trend" style="font-size: 11px; color: ${filteredNet >= 0 ? '#10b981' : '#ef4444'};">
            ${filteredNet >= 0 ? '▲ Surplus' : '▼ Deficit'}
        </span>
    </div>
</div>
    </div>
`;

    // Update UI elements
    cashOnHand = totalIncome - totalExpense;
    const remainingDebt = Math.max(window.debtGoal - debtPaid, 0);
    const netWorth = (totalIncome + totalSavings) - (totalExpense + remainingDebt);

    document.getElementById('netWorthVal') && (document.getElementById('netWorthVal').innerText = formatCurrency(netWorth));
    document.getElementById('netStatus') && (document.getElementById('netStatus').innerHTML = `<i class="fas fa-chart-line"></i> ${netWorth >= 0 ? 'Positive' : 'Debt Heavy'}`);
    document.getElementById('spentToday') && (document.getElementById('spentToday').innerText = formatCurrency(todaySpent));
    document.getElementById('spent7Days') && (document.getElementById('spent7Days').innerText = formatCurrency(weekSpent));
    document.getElementById('spentMonth') && (document.getElementById('spentMonth').innerText = formatCurrency(monthSpent));
    document.getElementById('cashOnHand') && (document.getElementById('cashOnHand').innerText = formatCurrency(cashOnHand));
    document.getElementById('balanceLabel') && (document.getElementById('balanceLabel').innerText = formatCurrency(monthIncome - monthExpense));

    // Budget Progress Bar
    if (document.getElementById('budgetBar') && document.getElementById('budgetText')) {
        if (window.budgetLimit > 0) {
            const percentage = Math.min((monthExpense / window.budgetLimit) * 100, 100);
            document.getElementById('budgetBar').style.width = percentage + '%';
            document.getElementById('budgetText').innerHTML = `${formatCurrency(monthExpense)} / ${formatCurrency(window.budgetLimit)}`;
        } else {
            document.getElementById('budgetBar').style.width = '0%';
            document.getElementById('budgetText').innerHTML = `${formatCurrency(monthExpense)} / No Limit`;
        }
    }

    // Debt Progress Bar
    if (document.getElementById('debtBar') && document.getElementById('debtRemainingVal')) {
        if (window.debtGoal > 0) {
            const debtPaid = calculateDebtPaid(); // You need this function
            const percentage = Math.min((debtPaid / window.debtGoal) * 100, 100);
            document.getElementById('debtBar').style.width = percentage + '%';
            document.getElementById('debtRemainingVal').innerHTML = `${formatCurrency(Math.max(window.debtGoal - debtPaid, 0))} Left`;
        } else {
            document.getElementById('debtBar').style.width = '0%';
            document.getElementById('debtRemainingVal').innerHTML = `No Debt Goal Set`;
        }
    }

    // Savings Progress Bar
    if (document.getElementById('savingsBar') && document.getElementById('savingsVal')) {
        if (window.savingsGoal > 0) {
            const totalSavings = calculateTotalSavings(); // You need this function
            const percentage = Math.min((totalSavings / window.savingsGoal) * 100, 100);
            document.getElementById('savingsBar').style.width = percentage + '%';
            document.getElementById('savingsVal').innerHTML = `${formatCurrency(totalSavings)} Saved`;
        } else {
            document.getElementById('savingsBar').style.width = '0%';
            document.getElementById('savingsVal').innerHTML = `No Savings Goal Set`;
        }
    }

    document.getElementById('expenseHistory') && (document.getElementById('expenseHistory').innerHTML = Object.entries(expenseByCat).map(([cat, amt]) => `<div class="breakdown-item"><span>${cat}</span><span class="amount negative">${formatCurrency(amt)}</span></div>`).join('') || '<div class="breakdown-item">No expenses</div>');
    document.getElementById('incomeHistory') && (document.getElementById('incomeHistory').innerHTML = Object.entries(incomeByCat).map(([cat, amt]) => `<div class="breakdown-item"><span>${cat}</span><span class="amount positive">${formatCurrency(amt)}</span></div>`).join('') || '<div class="breakdown-item">No income</div>');

    renderGoals();
    renderBills();
}

function calculateDebtPaid() {
    return (window.transactions || [])
        .filter(t => t.type === 'expense' && t.category && t.category.toLowerCase().includes('debt'))
        .reduce((sum, t) => sum + (t.amount || 0), 0);
}

function calculateTotalSavings() {
    return (window.transactions || [])
        .filter(t => t.type === 'savings')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
}

function renderGoals() {
    const goalsContainer = document.getElementById('goalsContainer');
    const goalsSection = document.getElementById('goalsSection');
    if (!goalsContainer) return;
    if (window.goals.length > 0 && goalsSection) {
        goalsSection.style.display = 'block';
        goalsContainer.innerHTML = window.goals.map((g, index) => {
            const progress = g.target > 0 ? (g.current / g.target) * 100 : 0;
            const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;

            // Determine deadline class
            let deadlineClass = '';
            let deadlineText = '';
            if (daysLeft !== null) {
                if (daysLeft < 0) {
                    deadlineClass = 'goal-deadline-overdue';
                    deadlineText = `⚠️ Overdue by ${Math.abs(daysLeft)} days`;
                } else if (daysLeft <= 7) {
                    deadlineClass = 'goal-deadline-soon';
                    deadlineText = `⏰ ${daysLeft} days left`;
                } else {
                    deadlineClass = 'goal-deadline-safe';
                    deadlineText = `📅 ${daysLeft} days left`;
                }
            }

            const isCompleted = g.current >= g.target;
            const completedClass = isCompleted ? 'completed' : '';

            return `<div class="goal-item ${completedClass}">
                <div class="goal-header">
                    <span class="goal-name"><i class="fas fa-bullseye"></i> ${g.name}</span>
                    <div class="goal-actions">
                        <button class="goal-action-btn" onclick="openEditGoalModal(${index})"><i class="fas fa-edit"></i></button>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span class="goal-progress-value">${progress.toFixed(1)}%</span>
                    <span>${formatCurrency(g.current)} / ${formatCurrency(g.target)}</span>
                </div>
                <div class="progress">
                    <div class="progress-bar primary" style="width:${Math.min(progress, 100)}%;"></div>
                </div>
                <div class="goal-stats">
                    <span><i class="fas fa-flag-checkered"></i> Target: ${formatCurrency(g.target)}</span>
                    ${daysLeft ? `<span class="${deadlineClass}"><i class="fas fa-clock"></i> ${deadlineText}</span>` : ''}
                </div>
                ${!isCompleted ? `
                <div class="add-funds">
                    <input type="text" id="addFunds_${index}" class="fmt-amount" placeholder="Amount to add">
                    <button onclick="addFundsToGoal(${index})">Add Funds</button>
                </div>` : `
                <div style="text-align: center; margin-top: 12px; color: #10b981;">
                    <i class="fas fa-check-circle"></i> Goal Achieved! 🎉
                </div>`}
            </div>`;
        }).join('');
    } else if (goalsSection) goalsSection.style.display = 'none';
}

function renderBills() {
    const billsContainer = document.getElementById('billsContainer');
    const billsSection = document.getElementById('billsSection');
    if (!billsContainer) return;

    if (window.bills.length > 0 && billsSection) {
        billsSection.style.display = 'block';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Sort bills: unpaid first, then paid
        const sortedBills = [...window.bills].sort((a, b) => {
            if (a.isPaid === b.isPaid) return 0;
            return a.isPaid ? 1 : -1;
        });

        billsContainer.innerHTML = sortedBills.map((b, idx) => {
            const originalIndex = window.bills.findIndex(bill => bill === b);

            const dueDate = new Date(b.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            const isOverdue = daysLeft < 0 && !b.isPaid;

            // Format date nicely
            const formattedDate = new Date(b.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            // MULTIPLE COLORS based on days left
            let statusColor, statusText, borderColor, bgOpacity;

            if (b.isPaid) {
                statusColor = '#10b981';      // Green for paid
                statusText = 'PAID';
                borderColor = '#10b981';
                bgOpacity = '0.1';
            } else if (isOverdue) {
                statusColor = '#ef4444';      // Red for overdue
                statusText = 'OVERDUE';
                borderColor = '#ef4444';
                bgOpacity = '0.1';
            } else if (daysLeft === 0) {
                statusColor = '#ef4444';      // Red for due today
                statusText = 'DUE TODAY';
                borderColor = '#ef4444';
                bgOpacity = '0.1';
            } else if (daysLeft <= 3) {
                statusColor = '#f59e0b';      // Orange/Yellow for 1-3 days left (urgent)
                statusText = 'URGENT';
                borderColor = '#f59e0b';
                bgOpacity = '0.1';
            } else if (daysLeft <= 7) {
                statusColor = '#8b5cf6';      // Purple for 4-7 days left
                statusText = 'SOON';
                borderColor = '#8b5cf6';
                bgOpacity = '0.1';
            } else if (daysLeft <= 14) {
                statusColor = '#3b82f6';      // Blue for 8-14 days left
                statusText = 'UPCOMING';
                borderColor = '#3b82f6';
                bgOpacity = '0.1';
            } else {
                statusColor = '#6b7280';      // Gray for 15+ days left (far away)
                statusText = 'FUTURE';
                borderColor = '#6b7280';
                bgOpacity = '0.1';
            }

            // Days left text
            let daysText = '';
            if (b.isPaid) {
                daysText = `Paid on ${b.paidDate ? new Date(b.paidDate).toLocaleDateString() : 'recently'}`;
            } else if (isOverdue) {
                daysText = `${Math.abs(daysLeft)} days overdue`;
            } else if (daysLeft === 0) {
                daysText = 'Due today';
            } else {
                daysText = `${daysLeft} days left`;
            }

            return `
                <div class="bill-card-modern" style="
                    background: var(--gray-50);
                    border-radius: 20px;
                    padding: 16px;
                    margin-bottom: 12px;
                    border: 1px solid var(--gray-200);
                    border-left: 4px solid ${borderColor};
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                    transition: all 0.2s ease;
                ">
                    <!-- Header: Name and Status -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3 style="margin: 0; font-size: 1rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-receipt" style="color: ${statusColor}; font-size: 14px;"></i>
                            ${escapeHtml(b.name)}
                            ${b.autoPaid ? '<span style="background: #8b5cf6; color: white; padding: 2px 8px; border-radius: 20px; font-size: 10px;"><i class="fas fa-sync-alt"></i> Auto</span>' : ''}
                        </h3>
                        <span style="
                            background: ${statusColor}20;
                            color: ${statusColor};
                            padding: 4px 10px;
                            border-radius: 20px;
                            font-size: 11px;
                            font-weight: 700;
                        ">
                            ${statusText}
                        </span>
                    </div>
                    
                    <!-- Due Date -->
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 8px; color: var(--gray-600); font-size: 12px;">
                            <i class="fas fa-calendar-alt" style="color: ${statusColor};"></i>
                            <span>Due: ${formattedDate}</span>
                            <span style="color: ${isOverdue ? '#ef4444' : statusColor}; font-weight: 600;">
                                (${daysText})
                            </span>
                        </div>
                    </div>
                    
                    <!-- Amount and Edit Button -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; flex-wrap: wrap; gap: 12px;">
                        <div style="font-size: 1.5rem; font-weight: 800; color: ${statusColor};">
                            ${formatCurrency(b.amount)}
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button onclick="openEditBillModal(${originalIndex})" style="
                                background: ${statusColor};
                                color: white;
                                border: none;
                                padding: 8px 20px;
                                border-radius: 40px;
                                font-size: 13px;
                                font-weight: 600;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                transition: all 0.2s;
                            " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } else if (billsSection) {
        billsContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-file-invoice" style="font-size: 48px; opacity: 0.5; margin-bottom: 16px; display: block;"></i>
                <h3 style="margin-bottom: 8px;">No Bills Yet</h3>
                <p style="color: var(--gray-500);">Click "Add Bill" to start tracking</p>
            </div>
        `;
    }
}

// Make sure these are globally accessible
window.markBillAsPaid = markBillAsPaid;
window.markBillAsUnpaid = markBillAsUnpaid;
window.renderBills = renderBills;

// ===== CHART VARIABLES =====
let categoryChart = null;
let trendChart = null;
let chartsInitialized = false;

// Update trend chart

function updateTrendChart() {
    const period = document.getElementById('trendPeriod')?.value || 'month';
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let labels = [], incomeData = [], expenseData = [];
    const today = new Date();
    const transactions = window.transactions || [];

    if (period === 'week') {
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            let income = 0, expense = 0;
            transactions.forEach(t => {
                if (t.date === dateStr) {
                    if (t.type === 'income') income += t.amount || 0;
                    if (t.type === 'expense') expense += t.amount || 0;
                }
            });
            incomeData.push(income);
            expenseData.push(expense);
        }
    } else if (period === 'month') {
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            labels.push(date.getDate().toString());
            let income = 0, expense = 0;
            transactions.forEach(t => {
                if (t.date === dateStr) {
                    if (t.type === 'income') income += t.amount || 0;
                    if (t.type === 'expense') expense += t.amount || 0;
                }
            });
            incomeData.push(income);
            expenseData.push(expense);
        }
    } else {
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(today.getMonth() - i);
            const monthStr = date.toISOString().slice(0, 7);
            labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
            let income = 0, expense = 0;
            transactions.forEach(t => {
                if (t.date && t.date.startsWith(monthStr)) {
                    if (t.type === 'income') income += t.amount || 0;
                    if (t.type === 'expense') expense += t.amount || 0;
                }
            });
            incomeData.push(income);
            expenseData.push(expense);
        }
    }

    // Destroy old chart
    if (trendChart) {
        try { trendChart.destroy(); } catch (e) { }
        trendChart = null;
    }

    // Create new chart
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16,185,129,0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: '#10b981'
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: '#ef4444'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 10 } },
                tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` } }
            },
            scales: { y: { beginAtZero: true, ticks: { callback: (v) => formatCurrency(v) } } }
        }
    });
}

// Update category chart
function updateCategoryChart() {
    const period = document.getElementById('categoryPeriod')?.value || 'month';
    const now = new Date();
    let startDate;

    if (period === 'week') {
        startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (period === 'month') {
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    } else {
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
    }

    const categoryData = {};
    (window.transactions || []).forEach(t => {
        if (t.type === 'expense' && new Date(t.date) >= startDate) {
            categoryData[t.category] = (categoryData[t.category] || 0) + (t.amount || 0);
        }
    });

    if (categoryChart) {
        try { categoryChart.destroy(); } catch (e) { }
        categoryChart = null;
    }

    const ctx = document.getElementById('categoryChart')?.getContext('2d');
    if (!ctx) return;

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec489a', '#06b6d4'];
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{ data: Object.values(categoryData), backgroundColor: colors.slice(0, Object.keys(categoryData).length), borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false } } }
    });

    const legendEl = document.getElementById('categoryLegend');
    if (legendEl) {
        if (Object.keys(categoryData).length === 0) {
            legendEl.innerHTML = '<div class="legend-item">No data</div>';
        } else {
            legendEl.innerHTML = Object.keys(categoryData).map((cat, i) => `
                <div class="legend-item">
                    <span class="legend-color" style="background: ${colors[i % colors.length]}"></span>
                    <span>${cat}</span>
                </div>
            `).join('');
        }
    }
}

// Initialize charts
function initCharts() {
    console.log('initCharts called - checking for chart canvases');

    // Check if canvases exist
    const categoryCanvas = document.getElementById('categoryChart');
    const trendCanvas = document.getElementById('trendChart');

    console.log('Category chart canvas exists:', !!categoryCanvas);
    console.log('Trend chart canvas exists:', !!trendCanvas);

    // Destroy existing charts if they exist
    if (categoryChart) {
        try { categoryChart.destroy(); } catch (e) { }
        categoryChart = null;
    }
    if (trendChart) {
        try { trendChart.destroy(); } catch (e) { }
        trendChart = null;
    }

    // Update charts
    if (typeof updateCategoryChart === 'function') {
        updateCategoryChart();
    } else {
        console.error('updateCategoryChart function not found!');
    }

    if (typeof updateTrendChart === 'function') {
        updateTrendChart();
    } else {
        console.error('updateTrendChart function not found!');
    }

    chartsInitialized = true;
    console.log('Charts initialized successfully');
}

// Transaction functions
function showAddTransactionModal() {
    const modal = document.getElementById('addTransactionModal');
    if (modal) { modal.style.display = 'flex'; document.body.classList.add('modal-open'); document.getElementById('modalDate').valueAsDate = new Date(); document.querySelectorAll('#addTransactionModal .type-btn').forEach(btn => { btn.classList.remove('active'); if (btn.dataset.type === 'expense') btn.classList.add('active'); }); updateModalCategories('expense'); }
}

function closeAddTransactionModal() {
    const modal = document.getElementById('addTransactionModal');
    if (modal) { modal.style.display = 'none'; document.body.classList.remove('modal-open'); }
}

function setTransactionType(type) {
    document.querySelectorAll('#addTransactionModal .type-btn').forEach(btn => { btn.classList.remove('active'); if (btn.dataset.type === type) btn.classList.add('active'); });
    updateModalCategories(type);
}

function updateModalCategories(type) {
    const select = document.getElementById('modalCategory');
    if (!select) return;
    const categories = type === 'expense' ? expenseCats : type === 'income' ? incomeCats : savingsCats;
    select.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

function saveNewTransaction() {
    console.log('📝 Saving new transaction...');
    const type = document.querySelector('#addTransactionModal .type-btn.active')?.dataset.type || 'expense';
    const category = document.getElementById('modalCategory').value;
    let amount = parseFloat(document.getElementById('modalAmount').value);
    const date = document.getElementById('modalDate').value;
    const note = document.getElementById('modalNote').value;

    if (!category) {
        if (window.sileo) window.sileo.error('Please select a category', 'Error');
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        if (window.sileo) window.sileo.error('Please enter a valid amount greater than 0', 'Error');
        return;
    }
    if (!date) {
        if (window.sileo) window.sileo.error('Please select a date', 'Error');
        return;
    }

    const transaction = {
        type,
        category,
        amount,
        date,
        note: note || '',
        createdAt: new Date().toISOString()
    };

    // Add to beginning of array
    window.transactions.unshift(transaction);

    console.log('Transaction saved. Total transactions:', window.transactions.length);
    console.log('Transaction:', transaction);

    // Save to Firebase
    saveToFirebase();

    // Close modal
    closeAddTransactionModal();

    // FORCE RENDER - This is the key fix
    if (typeof render === 'function') {
        render();
    } else {
        console.error('render function not found!');
    }

    // Also update charts
    if (typeof updateCharts === 'function') {
    }

    // Show success message
    if (window.sileo) {
        window.sileo.success(`${type === 'expense' ? 'Expense' : type === 'income' ? 'Income' : 'Savings'} added successfully!`, 'Success');
    }

    // Clear form
    document.getElementById('modalAmount').value = '';
    document.getElementById('modalNote').value = '';
}

// Check which view is active
function checkActiveView() {
    const views = ['dashboardView', 'transactionsView', 'analyticsView', 'goalsView', 'billsView', 'settingsView'];
    views.forEach(view => {
        const el = document.getElementById(view);
        if (el && el.classList.contains('active')) {
            console.log('Active view:', view);
        }
    });
}

// Call this after adding transaction
checkActiveView();

function openEditModal(index) {
    editIndex = index;
    const t = window.transactions[index];
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
        document.getElementById('mType').value = t.type;
        const cats = t.type === 'expense' ? expenseCats : t.type === 'income' ? incomeCats : savingsCats;
        document.getElementById('mCategory').innerHTML = cats.map(c => `<option value="${c}" ${c === t.category ? 'selected' : ''}>${c}</option>`).join('');
        document.getElementById('mAmount').value = t.amount.toFixed(2);
        document.getElementById('mDate').value = t.date;
        document.getElementById('mNote').value = t.note || '';
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) { modal.style.display = 'none'; document.body.classList.remove('modal-open'); }
}

function saveEdit() {
    const amount = parseAmount(document.getElementById('mAmount').value);
    if (amount <= 0) { if (window.sileo) window.sileo.error('Please enter a valid amount', 'Error'); return; }
    window.transactions[editIndex] = {
        type: document.getElementById('mType').value,
        category: document.getElementById('mCategory').value,
        amount: amount,
        date: document.getElementById('mDate').value,
        note: document.getElementById('mNote').value
    };
    closeModal();
    saveToFirebase();
    if (window.sileo) window.sileo.success('Transaction updated!', 'Success');
}

function deleteTransaction(index) {
    if (confirm('Delete this transaction?')) {
        window.transactions.splice(index, 1);
        saveToFirebase();
        if (window.sileo) window.sileo.success('Transaction deleted!', 'Deleted');
    }
}

function deleteCurrentTransaction() {
    if (editIndex !== -1 && confirm('Are you sure you want to delete this transaction?')) {
        window.transactions.splice(editIndex, 1);
        saveToFirebase();
        closeModal();
        if (window.sileo) window.sileo.success('Transaction deleted successfully!', 'Deleted');
        editIndex = -1;
    }
}

// Helper function to update dashboard stats without full refresh
function updateDashboardStats() {
    // Update net worth
    const totalIncome = window.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExpense = window.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalSavings = window.transactions.filter(t => t.type === 'savings').reduce((sum, t) => sum + (t.amount || 0), 0);
    const netWorth = totalIncome + totalSavings - totalExpense;

    const netWorthVal = document.getElementById('netWorthVal');
    if (netWorthVal) netWorthVal.innerText = formatCurrency(netWorth);

    // Update cash on hand
    const cashOnHandElem = document.getElementById('cashOnHand');
    if (cashOnHandElem) cashOnHandElem.innerText = formatCurrency(totalIncome - totalExpense);
}

function quickAdd(type, category) {
    showAddTransactionModal();
    setTimeout(() => {
        setTransactionType(type);
        const select = document.getElementById('modalCategory');
        if (select) {
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].value === category) { select.selectedIndex = i; break; }
            }
        }
        const amountInput = document.getElementById('modalAmount');
        if (amountInput) {
            if (type === 'expense') amountInput.value = category === 'Food' ? 250 : category === 'Transport' ? 100 : 500;
            else if (type === 'income') amountInput.value = 5000;
            else amountInput.value = 1000;
        }
        document.getElementById('modalDate').valueAsDate = new Date();
        document.getElementById('modalNote').value = '';
    }, 100);
}

// Goal functions
function showGoalModal() {
    const modal = document.getElementById('goalModal');
    if (modal) { modal.style.display = 'flex'; document.body.classList.add('modal-open'); }
}

function closeGoalModal() {
    const modal = document.getElementById('goalModal');
    if (modal) { modal.style.display = 'none'; document.body.classList.remove('modal-open'); }
}

// Updated saveGoal function
function saveGoal() {
    const name = document.getElementById('goalName').value.trim();
    const target = parseFloat(document.getElementById('goalTarget').value);
    const current = parseFloat(document.getElementById('goalCurrent').value) || 0;
    const deadline = document.getElementById('goalDeadline').value || null;

    if (!name) { if (window.sileo) window.sileo.error('Please enter a goal name', 'Error'); return; }
    if (isNaN(target) || target <= 0) { if (window.sileo) window.sileo.error('Please enter a valid target amount', 'Error'); return; }

    window.goals.push({ name, target, current, deadline, createdAt: new Date().toISOString() });
    saveToFirebase();
    closeGoalModal();

    // Check if goal is already completed (current >= target)
    if (current >= target && target > 0) {
        showGoalCompletionNotification(name, target);
        if (window.sileo) {
            window.sileo.success(`🎉 Goal "${name}" created and already achieved! 🎉`, 'Goal Achieved!');
        }
    } else {
        if (window.sileo) window.sileo.success(`Goal "${name}" created successfully!`, 'Success');
    }

    document.getElementById('goalName').value = '';
    document.getElementById('goalTarget').value = '';
    document.getElementById('goalCurrent').value = '';
    document.getElementById('goalDeadline').value = '';
}

function openEditGoalModal(index) {
    const goal = window.goals[index];
    if (!goal) return;
    document.getElementById('editGoalId').value = index;
    document.getElementById('editGoalName').value = goal.name;
    document.getElementById('editGoalTarget').value = goal.target;
    document.getElementById('editGoalCurrent').value = goal.current;
    document.getElementById('editGoalDeadline').value = goal.deadline || '';
    const modal = document.getElementById('editGoalModal');
    if (modal) { modal.style.display = 'flex'; document.body.classList.add('modal-open'); }
}

function closeEditGoalModal() {
    const modal = document.getElementById('editGoalModal');
    if (modal) { modal.style.display = 'none'; document.body.classList.remove('modal-open'); }
}

// Updated updateGoal function
function updateGoal() {
    const index = parseInt(document.getElementById('editGoalId').value);
    const oldGoal = window.goals[index];
    const updatedGoal = {
        name: document.getElementById('editGoalName').value.trim(),
        target: parseFloat(document.getElementById('editGoalTarget').value),
        current: parseFloat(document.getElementById('editGoalCurrent').value) || 0,
        deadline: document.getElementById('editGoalDeadline').value || null
    };

    if (!updatedGoal.name || isNaN(updatedGoal.target) || updatedGoal.target <= 0) {
        if (window.sileo) window.sileo.error('Please fill all required fields', 'Error');
        return;
    }

    window.goals[index] = updatedGoal;
    saveToFirebase();
    closeEditGoalModal();

    // Check if goal was just completed via edit
    if (oldGoal.current < oldGoal.target && updatedGoal.current >= updatedGoal.target) {
        showGoalCompletionNotification(updatedGoal.name, updatedGoal.target);
        if (window.sileo) {
            window.sileo.success(`🎉 Congratulations! You reached your goal: "${updatedGoal.name}"! 🎉`, 'Goal Achieved!');
        }
    } else {
        if (window.sileo) window.sileo.success('Goal updated!', 'Success');
    }
}

function deleteGoal() {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    const index = parseInt(document.getElementById('editGoalId').value);
    window.goals.splice(index, 1);
    saveToFirebase();
    closeEditGoalModal();
    if (window.sileo) window.sileo.success('Goal deleted!', 'Deleted');
}

// Updated addFundsToGoal with notification
function addFundsToGoal(index) {
    const input = document.getElementById(`addFunds_${index}`);
    if (!input) return;
    const amount = parseAmount(input.value);
    if (amount <= 0) {
        if (window.sileo) window.sileo.error('Please enter a valid amount', 'Error');
        return;
    }
    if (window.goals[index]) {
        const oldCurrent = window.goals[index].current;
        const newCurrent = oldCurrent + amount;
        const target = window.goals[index].target;

        window.goals[index].current = newCurrent;
        saveToFirebase();
        input.value = '';

        // Check if goal was JUST completed
        if (oldCurrent < target && newCurrent >= target) {
            // Show notification
            showGoalCompletionNotification(window.goals[index].name, target);

            // Also show sileo message
            if (window.sileo) {
                window.sileo.success(`🎉 Congratulations! You reached your goal: "${window.goals[index].name}"!`, 'Goal Achieved!');
            }
        } else {
            if (window.sileo) window.sileo.success(`Added ${formatCurrency(amount)} to ${window.goals[index].name}!`, 'Success');
        }
    }
}


// Show goal completion notification
function showGoalCompletionNotification(goalName, targetAmount) {
    if (Notification.permission !== "granted") return;

    // Check if notifications are enabled
    if (localStorage.getItem('notifications_enabled') !== 'true') return;

    // Check if goal notifications are enabled
    const notifyGoals = localStorage.getItem('notify_goals') !== 'false';
    if (!notifyGoals) return;

    // Check if already notified for this goal
    const notifiedKey = `goal_notified_${goalName}`;
    if (localStorage.getItem(notifiedKey) === 'true') return;

    // Send notification
    const notification = new Notification("🎉 Goal Achieved! 🎉", {
        body: `Congratulations! You reached your goal: "${goalName}" for ${formatCurrency(targetAmount)}!`,
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%236366f1'/%3E%3Ctext x='50' y='68' text-anchor='middle' font-size='52' fill='white' font-family='Arial'%3E🎯%3C/text%3E%3C/svg%3E",
        requireInteraction: true,
        vibrate: [200, 100, 200, 500, 200]
    });

    // Mark as notified
    localStorage.setItem(notifiedKey, 'true');

    // Clear after some time (so future goals can be notified again)
    setTimeout(() => {
        localStorage.removeItem(notifiedKey);
    }, 86400000); // Clear after 24 hours

    // Open app when clicked
    notification.onclick = function () {
        window.focus();
        notification.close();
    };

    // Auto close after 15 seconds
    setTimeout(() => notification.close(), 15000);
}

// Bill functions
function showBillModal() {
    const modal = document.getElementById('billModal');
    if (modal) { modal.style.display = 'flex'; document.body.classList.add('modal-open'); }
}

function closeBillModal() {
    const modal = document.getElementById('billModal');
    if (modal) { modal.style.display = 'none'; document.body.classList.remove('modal-open'); }
}

function saveBill() {
    const name = document.getElementById('billName').value.trim();
    const amount = parseFloat(document.getElementById('billAmount').value);
    const dueDate = document.getElementById('billDueDate').value;
    const autoPaid = document.getElementById('billAutoPaid').checked;

    if (!name) { if (window.sileo) window.sileo.error('Please enter a bill name', 'Error'); return; }
    if (isNaN(amount) || amount <= 0) { if (window.sileo) window.sileo.error('Please enter a valid amount', 'Error'); return; }
    if (!dueDate) { if (window.sileo) window.sileo.error('Please select a due date', 'Error'); return; }

    // Add paid status to the bill
    window.bills.push({
        name,
        amount,
        dueDate,
        autoPaid,
        isPaid: false,           // NEW: Track if paid
        paidDate: null,          // NEW: When it was paid
        createdAt: new Date().toISOString()
    });

    saveToFirebase();
    closeBillModal();
    if (window.sileo) window.sileo.success(`Bill "${name}" added!`, 'Success');

    // Clear form
    document.getElementById('billName').value = '';
    document.getElementById('billAmount').value = '';
    document.getElementById('billDueDate').value = '';
    document.getElementById('billAutoPaid').checked = false;
}

function openEditBillModal(index) {
    const bill = window.bills[index];
    if (!bill) return;
    document.getElementById('editBillId').value = index;
    document.getElementById('editBillName').value = bill.name;
    document.getElementById('editBillAmount').value = bill.amount;
    document.getElementById('editBillDueDate').value = bill.dueDate;
    document.getElementById('editBillAutoPaid').checked = bill.autoPaid || false;
    document.getElementById('editBillPaid').checked = bill.isPaid || false;
    const modal = document.getElementById('editBillModal');
    if (modal) { modal.style.display = 'flex'; document.body.classList.add('modal-open'); }
}

function closeEditBillModal() {
    const modal = document.getElementById('editBillModal');
    if (modal) { modal.style.display = 'none'; document.body.classList.remove('modal-open'); }
}

// Replace your existing updateBill function:
function updateBill() {
    const index = parseInt(document.getElementById('editBillId').value);
    const updatedBill = {
        name: document.getElementById('editBillName').value.trim(),
        amount: parseFloat(document.getElementById('editBillAmount').value),
        dueDate: document.getElementById('editBillDueDate').value,
        autoPaid: document.getElementById('editBillAutoPaid').checked,
        isPaid: document.getElementById('editBillPaid').checked,  // NEW
        paidDate: document.getElementById('editBillPaid').checked ? new Date().toISOString() : null  // NEW
    };
    if (!updatedBill.name || isNaN(updatedBill.amount) || updatedBill.amount <= 0 || !updatedBill.dueDate) {
        if (window.sileo) window.sileo.error('Please fill all fields', 'Error');
        return;
    }
    window.bills[index] = updatedBill;
    saveToFirebase();
    closeEditBillModal();
    if (window.sileo) window.sileo.success('Bill updated!', 'Success');
}

function deleteBill() {
    if (!confirm('Delete this bill?')) return;
    const index = parseInt(document.getElementById('editBillId').value);
    window.bills.splice(index, 1);
    saveToFirebase();
    closeEditBillModal();
    if (window.sileo) window.sileo.success('Bill deleted!', 'Deleted');
}

// Budget functions
function updateBudget() {
    const amount = parseAmount(document.getElementById('setBudgetInput').value);

    // Allow 0 (no budget limit)
    if (isNaN(amount)) {
        if (window.sileo) window.sileo.error('Please enter a valid amount', 'Error');
        return;
    }

    if (amount < 0) {
        if (window.sileo) window.sileo.error('Amount cannot be negative', 'Error');
        return;
    }

    window.budgetLimit = amount;
    saveToFirebase();
    toggleInput('budgetGroup');

    if (amount === 0) {
        if (window.sileo) window.sileo.success('Budget limit removed', 'Success');
    } else {
        if (window.sileo) window.sileo.success(`Monthly budget set to ${formatCurrency(amount)}!`, 'Success');
    }
}

function updateDebtGoal() {
    const amount = parseAmount(document.getElementById('setDebtInput').value);

    // Allow 0 (no debt goal)
    if (isNaN(amount)) {
        if (window.sileo) window.sileo.error('Please enter a valid amount', 'Error');
        return;
    }

    if (amount < 0) {
        if (window.sileo) window.sileo.error('Amount cannot be negative', 'Error');
        return;
    }

    window.debtGoal = amount;
    saveToFirebase();
    toggleInput('debtGroup');

    if (amount === 0) {
        if (window.sileo) window.sileo.success('Debt goal removed', 'Success');
    } else {
        if (window.sileo) window.sileo.success(`Debt goal set to ${formatCurrency(amount)}!`, 'Success');
    }
}

function updateSavingsGoal() {
    const amount = parseAmount(document.getElementById('setSavingsInput').value);

    // Allow 0 (no savings goal)
    if (isNaN(amount)) {
        if (window.sileo) window.sileo.error('Please enter a valid amount', 'Error');
        return;
    }

    if (amount < 0) {
        if (window.sileo) window.sileo.error('Amount cannot be negative', 'Error');
        return;
    }

    window.savingsGoal = amount;
    saveToFirebase();
    toggleInput('savingsGroup');

    if (amount === 0) {
        if (window.sileo) window.sileo.success('Savings goal removed', 'Success');
    } else {
        if (window.sileo) window.sileo.success(`Savings goal set to ${formatCurrency(amount)}!`, 'Success');
    }
}

// Add this new function to mark bill as paid quickly
function markBillAsPaid(index) {
    if (!window.bills[index]) return;

    if (confirm(`Mark "${window.bills[index].name}" as paid?`)) {
        window.bills[index].isPaid = true;
        window.bills[index].paidDate = new Date().toISOString();
        saveToFirebase();

        if (window.sileo) {
            window.sileo.success(`✅ "${window.bills[index].name}" marked as paid!`, 'Bill Paid');
        }
    }
}

// Add this function to mark as unpaid (if needed)
function markBillAsUnpaid(index) {
    if (!window.bills[index]) return;

    if (confirm(`Mark "${window.bills[index].name}" as unpaid?`)) {
        window.bills[index].isPaid = false;
        window.bills[index].paidDate = null;
        saveToFirebase();

        if (window.sileo) {
            window.sileo.info(`"${window.bills[index].name}" marked as unpaid`, 'Bill Updated');
        }
    }
}

// Settings functions
function toggleTheme() {
    const html = document.documentElement;
    if (html.getAttribute('data-theme') === 'dark') {
        html.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
    if (categoryChart) categoryChart.update();
    if (trendChart) trendChart.update();
}

function changeCurrency(currency) {
    window.currentCurrency = currency;
    localStorage.setItem('preferredCurrency', currency);
    render();
}

function filterTransactions() { render(); }

// Export/Import functions
function exportData() {
    const data = { transactions: window.transactions, goals: window.goals, bills: window.bills, settings: { budgetLimit: window.budgetLimit, debtGoal: window.debtGoal, savingsGoal: window.savingsGoal, currency: window.currentCurrency }, exportDate: new Date().toISOString(), version: '2.0' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cajes_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (window.sileo) window.sileo.success('Data exported successfully!', 'Success');
}

function exportDataCSV() {
    if (!window.transactions || window.transactions.length === 0) { if (window.sileo) window.sileo.warning('No data to export', 'Warning'); return; }
    let csv = 'Type,Category,Amount,Date,Note\n';
    window.transactions.forEach(t => { csv += `"${t.type}","${t.category}",${t.amount},${t.date},"${(t.note || '').replace(/"/g, '""')}"\n`; });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cajes_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (window.sileo) window.sileo.success('Data exported as CSV successfully!', 'Success');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    window.transactions = data.transactions || [];
                    window.goals = data.goals || [];
                    window.bills = data.bills || [];
                    window.budgetLimit = data.settings?.budgetLimit || 0;
                    window.debtGoal = data.settings?.debtGoal || 0;
                    window.savingsGoal = data.settings?.savingsGoal || 0;
                    saveToFirebase();
                    if (window.sileo) window.sileo.success('Data imported successfully!', 'Success');
                } catch (error) {
                    if (window.sileo) window.sileo.error('Invalid file format', 'Error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function clearAllData() {
    if (confirm('Delete ALL data? This action cannot be undone!')) {
        window.transactions = [];
        window.goals = [];
        window.bills = [];
        window.budgetLimit = 0;
        window.debtGoal = 0;
        window.savingsGoal = 0;
        saveToFirebase();
        if (window.sileo) window.sileo.success('All data cleared!', 'Cleared');
    }
}

// Backup functions
function showBackupModal() {
    const modal = document.getElementById('backupModal');
    if (modal) { modal.style.display = 'flex'; document.body.classList.add('modal-open'); }
}

function closeBackupModal() {
    const modal = document.getElementById('backupModal');
    if (modal) { modal.style.display = 'none'; document.body.classList.remove('modal-open'); }
}

function backupToLocal() {
    const backupData = { transactions: window.transactions, budgetLimit: window.budgetLimit, debtGoal: window.debtGoal, savingsGoal: window.savingsGoal, goals: window.goals, bills: window.bills, backupDate: new Date().toISOString() };
    localStorage.setItem('cajesBackup', JSON.stringify(backupData));
    localStorage.setItem('lastBackup', new Date().toLocaleString());
    const lastBackupSpan = document.getElementById('lastBackup');
    if (lastBackupSpan) lastBackupSpan.innerText = `Last backup: ${new Date().toLocaleString()}`;
    if (window.sileo) window.sileo.success('Backup created successfully!', 'Success');
}

function restoreFromBackup() {
    const backup = localStorage.getItem('cajesBackup');
    if (!backup) { if (window.sileo) window.sileo.warning('No backup found', 'Warning'); return; }
    if (confirm('Restore from backup? Current data will be replaced.')) {
        try {
            const data = JSON.parse(backup);
            window.transactions = data.transactions || [];
            window.budgetLimit = data.budgetLimit || 0;
            window.debtGoal = data.debtGoal || 0;
            window.savingsGoal = data.savingsGoal || 0;
            window.goals = data.goals || [];
            window.bills = data.bills || [];
            saveToFirebase();
            closeBackupModal();
            if (window.sileo) window.sileo.success('Data restored from backup!', 'Success');
        } catch (e) { if (window.sileo) window.sileo.error('Invalid backup data', 'Error'); }
    }
}

function restoreFromFile(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            window.transactions = data.transactions || [];
            window.budgetLimit = data.budgetLimit || 0;
            window.debtGoal = data.debtGoal || 0;
            window.savingsGoal = data.savingsGoal || 0;
            window.goals = data.goals || [];
            window.bills = data.bills || [];
            saveToFirebase();
            closeBackupModal();
            if (window.sileo) window.sileo.success('Data imported successfully!', 'Success');
        } catch (err) { if (window.sileo) window.sileo.error('Invalid file format', 'Error'); }
    };
    reader.readAsText(file);
    input.value = '';
}

// Stats functions
function showDetailedStats(period) {
    const modal = document.getElementById('statsModal');
    const title = document.getElementById('statsModalTitle');
    const content = document.getElementById('statsModalContent');
    if (!modal || !title || !content) return;

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);
    let stats = [];

    if (period === 'today') {
        title.innerText = "📊 Today's Spending Details";
        const todayTx = window.transactions.filter(t => t.date === today);
        const expenses = todayTx.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
        const income = todayTx.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
        const savings = todayTx.filter(t => t.type === 'savings').reduce((s, t) => s + (t.amount || 0), 0);
        stats = [
            { label: '💰 Total Expenses', value: expenses, color: '#ef4444' },
            { label: '💵 Total Income', value: income, color: '#10b981' },
            { label: '🏦 Savings Added', value: savings, color: '#3b82f6' },
            { label: '📈 Net Cash Flow', value: income - expenses, color: (income - expenses) >= 0 ? '#10b981' : '#ef4444' },
            { label: '📝 Transactions Count', value: todayTx.length, color: '#6366f1', isNumber: true }
        ];
    } else if (period === 'week') {
        title.innerText = "📅 This Week's Spending Details";
        const weekTx = window.transactions.filter(t => t.date >= weekAgo);
        const expenses = weekTx.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
        const income = weekTx.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
        const dailyAvg = expenses / 7;
        stats = [
            { label: '💰 Total Expenses', value: expenses, color: '#ef4444' },
            { label: '💵 Total Income', value: income, color: '#10b981' },
            { label: '📊 Daily Average Spend', value: dailyAvg, color: '#f59e0b' },
            { label: '📈 Net Cash Flow', value: income - expenses, color: (income - expenses) >= 0 ? '#10b981' : '#ef4444' },
            { label: '📝 Transactions', value: weekTx.length, color: '#6366f1', isNumber: true }
        ];
    } else if (period === 'month') {
        title.innerText = "📆 This Month's Spending Details";
        const monthTx = window.transactions.filter(t => t.date && t.date.startsWith(currentMonth));
        const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
        const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
        const budgetLeft = Math.max(window.budgetLimit - expenses, 0);
        const percentUsed = window.budgetLimit > 0 ? (expenses / window.budgetLimit * 100).toFixed(1) : 0;
        stats = [
            { label: '💰 Total Expenses', value: expenses, color: '#ef4444' },
            { label: '💵 Total Income', value: income, color: '#10b981' },
            { label: '🎯 Budget Limit', value: window.budgetLimit, color: '#6366f1' },
            { label: '✅ Budget Remaining', value: budgetLeft, color: budgetLeft >= 0 ? '#10b981' : '#ef4444' },
            { label: '📊 Budget Used', value: `${percentUsed}%`, color: '#f59e0b', isString: true },
            { label: '📈 Net Cash Flow', value: income - expenses, color: (income - expenses) >= 0 ? '#10b981' : '#ef4444' }
        ];
    } else if (period === 'cash') {
        title.innerText = "💰 Cash on Hand Analysis";
        const totalIncome = window.transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
        const totalExpense = window.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
        const totalSavings = window.transactions.filter(t => t.type === 'savings').reduce((s, t) => s + (t.amount || 0), 0);
        const cashAvailable = totalIncome - totalExpense;
        const monthlyTx = window.transactions.filter(t => t.date && t.date.startsWith(currentMonth));
        const monthlyIncome = monthlyTx.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
        const monthlyExpense = monthlyTx.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
        stats = [
            { label: '💵 Total Income (All Time)', value: totalIncome, color: '#10b981' },
            { label: '💰 Total Expenses (All Time)', value: totalExpense, color: '#ef4444' },
            { label: '🏦 Total Savings', value: totalSavings, color: '#3b82f6' },
            { label: '💎 Cash on Hand', value: cashAvailable, color: cashAvailable >= 0 ? '#10b981' : '#ef4444' },
            { label: '--- This Month ---', value: '', color: '#6b7280', isSeparator: true },
            { label: '  Monthly Income', value: monthlyIncome, color: '#10b981' },
            { label: '  Monthly Expenses', value: monthlyExpense, color: '#ef4444' },
            { label: '  Monthly Net', value: monthlyIncome - monthlyExpense, color: (monthlyIncome - monthlyExpense) >= 0 ? '#10b981' : '#ef4444' }
        ];
    }

    content.innerHTML = stats.map(s => {
        if (s.isSeparator) return `<div style="padding: 8px 0; margin-top: 8px; border-top: 1px solid var(--gray-200); font-weight: 600; color: var(--gray-600);">${s.label}</div>`;
        let valueDisplay = s.isNumber ? s.value : s.isString ? s.value : typeof s.value === 'number' ? formatCurrency(s.value) : s.value;
        return `<div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--gray-200);"><span style="font-weight: 500;">${s.label}</span><span style="color: ${s.color}; font-weight: 700; font-size: 1.1rem;">${valueDisplay}</span></div>`;
    }).join('');
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
}

function closeStatsModal() {
    const modal = document.getElementById('statsModal');
    if (modal) { modal.style.display = 'none'; document.body.classList.remove('modal-open'); }
}

// Password management functions
function showChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) { modal.style.display = 'flex'; document.body.classList.add('modal-open'); }
}

function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) { modal.style.display = 'none'; document.body.classList.remove('modal-open'); }
}

async function updatePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword) { if (window.sileo) window.sileo.error('Please enter your current password', 'Error'); return; }
    if (!newPassword) { if (window.sileo) window.sileo.error('Please enter a new password', 'Error'); return; }
    if (newPassword.length < 6) { if (window.sileo) window.sileo.error('Password must be at least 6 characters', 'Error'); return; }
    if (newPassword !== confirmPassword) { if (window.sileo) window.sileo.error('New passwords do not match', 'Error'); return; }

    const user = window.auth.currentUser;
    try {
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newPassword);
        if (window.sileo) window.sileo.success('Password updated successfully!', 'Success');
        closeChangePasswordModal();
    } catch (error) {
        let errorMessage = 'Failed to update password. ';
        if (error.code === 'auth/wrong-password') errorMessage = 'Current password is incorrect';
        else if (error.code === 'auth/weak-password') errorMessage = 'New password is too weak';
        else errorMessage += error.message;
        if (window.sileo) window.sileo.error(errorMessage, 'Error');
    }
}

async function sendEmailVerification() {
    const user = window.auth.currentUser;
    if (!user) return;
    if (user.emailVerified) { if (window.sileo) window.sileo.info('Email already verified!', 'Info'); return; }
    try {
        await user.sendEmailVerification();
        if (window.sileo) window.sileo.success('Verification email sent! Check your inbox.', 'Success');
    } catch (error) {
        if (window.sileo) window.sileo.error('Failed to send verification email', 'Error');
    }
}

// Initialize app
function initializeApp() {
    console.log('Initializing app...');

    initializeMonthFilter();

    const monthFilter = document.getElementById('monthFilter');
    if (monthFilter) monthFilter.addEventListener('change', () => render());

    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency) {
        window.currentCurrency = savedCurrency;
        const selector = document.getElementById('currencySelector');
        if (selector) selector.value = savedCurrency;
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }

    // ✅ IMPORTANT - Initialize charts immediately
    if (typeof initCharts === 'function') {
        console.log('Initializing charts...');
        initCharts();
    } else {
        // Fallback: call individual chart functions
        setTimeout(() => {
            if (typeof updateCategoryChart === 'function') {
                console.log('Updating category chart from init');
                updateCategoryChart();
            }
            if (typeof updateTrendChart === 'function') {
                console.log('Updating trend chart from init');
                updateTrendChart();
            }
        }, 100);
    }

    if (window.loadPrivacySettings) window.loadPrivacySettings();
    if (typeof initNotifications === 'function') {
        initNotifications();
    }
}

function initializeMonthFilter() {
    const monthFilter = document.getElementById('monthFilter');
    if (!monthFilter) return;
    monthFilter.innerHTML = '';
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    for (let year = currentYear - 3; year <= currentYear + 2; year++) {
        for (let month = 1; month <= 12; month++) {
            const value = `${year}-${month.toString().padStart(2, '0')}`;
            const option = document.createElement('option');
            option.value = value;
            option.textContent = `${new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' })} ${year}`;
            if (year === currentYear && month === currentMonth) option.selected = true;
            monthFilter.appendChild(option);
        }
    }
}

// Recovery function
window.recoverFromFirebase = async function () {
    if (!window.currentUser) {
        if (window.sileo) window.sileo.error('Please login first', 'Error');
        return;
    }

    if (window.sileo) window.sileo.info('Attempting to recover data from cloud...', 'Recovery');

    try {
        const doc = await window.db.collection('users').doc(window.currentUser.uid).get();
        if (doc.exists) {
            const data = doc.data();
            window.transactions = data.transactions || [];
            window.goals = data.goals || [];
            window.bills = data.bills || [];
            window.budgetLimit = data.monthlyBudget || 0;
            window.debtGoal = data.debtGoal || 0;
            window.savingsGoal = data.savingsGoal || 0;

            localStorage.setItem('cajesData_' + window.currentUser.uid, JSON.stringify(data));
            render();

            if (window.sileo) window.sileo.success(`Recovered ${window.transactions.length} transactions!`, 'Data Restored');
        } else {
            if (window.sileo) window.sileo.warning('No data found in cloud', 'Empty');
        }
    } catch (error) {
        console.error('Recovery error:', error);
        if (window.sileo) window.sileo.error('Failed to recover data', 'Error');
    }
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const monthFilter = document.getElementById('monthFilter');
    if (monthFilter) monthFilter.value = new Date().toISOString().slice(0, 7);
    document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
    document.querySelectorAll('.theme-option').forEach(opt => opt.addEventListener('click', () => {
        const theme = opt.dataset.theme;
        if (theme === 'system') {
            const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        localStorage.setItem('theme', theme);
        document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
    }));
    const savedTheme = localStorage.getItem('theme') || 'system';
    const themeOption = document.querySelector(`.theme-option[data-theme="${savedTheme}"]`);
    if (themeOption) themeOption.click();
});

// Expose functions globally
window.loadUserData = loadUserData;
window.saveToFirebase = saveToFirebase;
window.render = render;
window.initializeApp = initializeApp;
//window.updateCharts = updateCharts;
window.showAddTransactionModal = showAddTransactionModal;
window.closeAddTransactionModal = closeAddTransactionModal;
window.setTransactionType = setTransactionType;
window.saveNewTransaction = saveNewTransaction;
window.openEditModal = openEditModal;
window.closeModal = closeModal;
window.saveEdit = saveEdit;
window.deleteTransaction = deleteTransaction;
window.deleteCurrentTransaction = deleteCurrentTransaction;
window.quickAdd = quickAdd;
window.showGoalModal = showGoalModal;
window.closeGoalModal = closeGoalModal;
window.saveGoal = saveGoal;
window.openEditGoalModal = openEditGoalModal;
window.closeEditGoalModal = closeEditGoalModal;
window.updateGoal = updateGoal;
window.deleteGoal = deleteGoal;
window.addFundsToGoal = addFundsToGoal;
window.showBillModal = showBillModal;
window.closeBillModal = closeBillModal;
window.saveBill = saveBill;
window.openEditBillModal = openEditBillModal;
window.closeEditBillModal = closeEditBillModal;
window.updateBill = updateBill;
window.deleteBill = deleteBill;
window.updateBudget = updateBudget;
window.updateDebtGoal = updateDebtGoal;
window.updateSavingsGoal = updateSavingsGoal;
window.toggleTheme = toggleTheme;
window.changeCurrency = changeCurrency;
window.filterTransactions = filterTransactions;
window.updateCategoryChart = updateCategoryChart;
window.updateTrendChart = updateTrendChart;
window.exportData = exportData;
window.exportDataCSV = exportDataCSV;
window.importData = importData;
window.clearAllData = clearAllData;
window.showBackupModal = showBackupModal;
window.closeBackupModal = closeBackupModal;
window.backupToLocal = backupToLocal;
window.restoreFromBackup = restoreFromBackup;
window.restoreFromFile = restoreFromFile;
window.showDetailedStats = showDetailedStats;
window.closeStatsModal = closeStatsModal;
window.showChangePasswordModal = showChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;
window.updatePassword = updatePassword;
window.sendEmailVerification = sendEmailVerification;
window.switchView = switchView;

// Add this function for edit modal categories
function updateEditCategories() {
    const type = document.getElementById('mType').value;
    const categorySelect = document.getElementById('mCategory');
    let categories = [];

    if (type === 'expense') categories = expenseCats;
    else if (type === 'income') categories = incomeCats;
    else categories = savingsCats;

    const currentValue = categorySelect.value;
    categorySelect.innerHTML = categories.map(c => `<option value="${c}" ${c === currentValue ? 'selected' : ''}>${c}</option>`).join('');
}

function showDonationModal() {
    // Scroll to donation section
    const donationSection = document.querySelector('#settingsView .settings-card');
    if (donationSection) {
        // Switch to settings view first
        switchView('settings');
        setTimeout(() => {
            donationSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
}

// ===== AVATAR WITH CLOUD SYNC (Works across all devices) =====

let selectedAvatarColor = null;
let selectedAvatarFile = null;
let selectedAvatarData = null;

// Save avatar to Firebase Cloud
async function saveAvatarToCloud(imageData) {
    if (!window.currentUser) {
        console.log('No user logged in');
        return false;
    }

    try {
        const db = window.db;
        await db.collection('users').doc(window.currentUser.uid).update({
            avatar: imageData,
            avatarUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Avatar saved to cloud');
        return true;
    } catch (error) {
        console.error('Failed to save avatar to cloud:', error);
        return false;
    }
}

// Load avatar from Firebase Cloud
async function loadAvatarFromCloud() {
    if (!window.currentUser) {
        console.log('No user logged in');
        return null;
    }

    try {
        const db = window.db;
        const doc = await db.collection('users').doc(window.currentUser.uid).get();

        if (doc.exists && doc.data().avatar) {
            console.log('✅ Avatar loaded from cloud');
            return doc.data().avatar;
        }
    } catch (error) {
        console.error('Failed to load avatar from cloud:', error);
    }
    return null;
}

// Generate identicon (fallback)
function generateIdenticon(email, size = 40) {
    const canvas = document.getElementById('userAvatarCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const hash = hashCode(email || 'default');

    const hue1 = hash % 360;
    const hue2 = (hue1 + 40) % 360;
    const sat1 = 60 + (hash % 30);
    const sat2 = 50 + ((hash >> 8) % 30);

    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${hue1}, ${sat1}%, 50%)`;
    ctx.fill();

    const pattern = hash % 8;
    ctx.fillStyle = `hsl(${hue2}, ${sat2}%, 65%)`;

    for (let i = 0; i < 5; i++) {
        const x = (hash >> (i * 4)) % size;
        const y = (hash >> (i * 4 + 2)) % size;
        const w = 4 + ((hash >> (i * 4 + 4)) % 8);

        if (pattern < 4) {
            ctx.fillRect(x, y, w, w);
        } else {
            ctx.beginPath();
            ctx.arc(x, y, w / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const imageData = canvas.toDataURL();

    // Save to localStorage as backup
    localStorage.setItem(`avatar_${window.currentUser?.uid}`, imageData);

    return imageData;
}

// Load and display user avatar (syncs across devices)
async function loadUserAvatar() {
    if (!window.currentUser) return;

    const canvas = document.getElementById('userAvatarCanvas');
    if (!canvas) return;

    // Try to load from cloud first
    let avatarData = await loadAvatarFromCloud();

    // If no cloud avatar, try localStorage
    if (!avatarData) {
        avatarData = localStorage.getItem(`avatar_${window.currentUser.uid}`);
    }

    // If still no avatar, generate identicon
    if (!avatarData) {
        generateIdenticon(window.currentUser.email);
        return;
    }

    // Display the avatar
    const img = new Image();
    img.onload = () => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 40, 40);

        // Draw circular image
        ctx.save();
        ctx.beginPath();
        ctx.arc(20, 20, 20, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, 0, 0, 40, 40);
        ctx.restore();
    };
    img.src = avatarData;
}

// Show avatar selection modal
function showAvatarModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('avatarModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'avatarModal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="closeAvatarModal()"><i class="fas fa-times"></i></button>
            <h2><i class="fas fa-user-circle"></i> Choose Your Avatar</h2>
            
            <div class="avatar-preview">
                <canvas id="avatarPreviewCanvas" width="100" height="100" style="border-radius: 50%; border: 3px solid var(--primary);"></canvas>
            </div>
            
            <div class="avatar-grid" id="avatarGrid"></div>
            
            <div class="form-group">
                <label class="form-label">Upload Custom Image</label>
                <input type="file" id="avatarUpload" accept="image/*" class="form-control">
                <small style="color: var(--gray-500);">Recommended: Square image, max 2MB (Syncs across all devices)</small>
            </div>
            
            <button class="btn-primary" onclick="saveAvatar()" style="width:100%; margin-top: 16px;">
                <i class="fas fa-save"></i> Save Avatar (Sync to Cloud)
            </button>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.classList.add('modal-open');

    // Generate avatar options (color presets)
    const grid = document.getElementById('avatarGrid');
    grid.innerHTML = '';

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec489a', '#06b6d4', '#84cc16', '#f97316', '#14b8a6', '#d946ef', '#f43f5e'];

    colors.forEach(color => {
        const option = document.createElement('div');
        option.className = 'avatar-option';
        option.style.background = color;
        option.style.display = 'flex';
        option.style.alignItems = 'center';
        option.style.justifyContent = 'center';
        option.style.fontSize = '36px';
        option.style.fontWeight = 'bold';
        option.style.color = 'white';
        option.innerHTML = window.currentUser?.email?.charAt(0).toUpperCase() || 'U';
        option.onclick = () => selectAvatarOption(option, color);
        grid.appendChild(option);
    });

    // Preview current avatar
    const currentCanvas = document.getElementById('userAvatarCanvas');
    const previewCanvas = document.getElementById('avatarPreviewCanvas');
    if (currentCanvas && previewCanvas) {
        const previewCtx = previewCanvas.getContext('2d');
        previewCtx.clearRect(0, 0, 100, 100);
        previewCtx.drawImage(currentCanvas, 0, 0, 100, 100);
    }

    // Handle image upload
    const uploadInput = document.getElementById('avatarUpload');
    if (uploadInput) {
        uploadInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                if (file.size > 2 * 1024 * 1024) {
                    if (window.sileo) {
                        window.sileo.error('Image too large! Max 2MB', 'Error');
                    }
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const previewCanvas = document.getElementById('avatarPreviewCanvas');
                        const ctx = previewCanvas.getContext('2d');
                        ctx.clearRect(0, 0, 100, 100);

                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(50, 50, 50, 0, Math.PI * 2);
                        ctx.clip();
                        ctx.drawImage(img, 0, 0, 100, 100);
                        ctx.restore();

                        selectedAvatarData = event.target.result;
                        selectedAvatarColor = null;
                        selectedAvatarFile = file;
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
    }
}

function selectAvatarOption(element, color) {
    document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    selectedAvatarColor = color;
    selectedAvatarData = null;
    selectedAvatarFile = null;

    const previewCanvas = document.getElementById('avatarPreviewCanvas');
    if (previewCanvas) {
        const ctx = previewCanvas.getContext('2d');
        ctx.clearRect(0, 0, 100, 100);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(50, 50, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(window.currentUser?.email?.charAt(0).toUpperCase() || 'U', 50, 55);
    }
}

// Save avatar (syncs to cloud for all devices)
async function saveAvatar() {
    const canvas = document.getElementById('userAvatarCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let finalImageData = null;

    if (selectedAvatarData) {
        // Save uploaded image
        const img = new Image();
        img.onload = async () => {
            ctx.clearRect(0, 0, 40, 40);
            ctx.save();
            ctx.beginPath();
            ctx.arc(20, 20, 20, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, 0, 0, 40, 40);
            ctx.restore();

            finalImageData = canvas.toDataURL();
            await completeAvatarSave(finalImageData);
        };
        img.src = selectedAvatarData;
    } else if (selectedAvatarColor) {
        // Save color avatar with letter
        ctx.clearRect(0, 0, 40, 40);
        ctx.fillStyle = selectedAvatarColor;
        ctx.beginPath();
        ctx.arc(20, 20, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(window.currentUser?.email?.charAt(0).toUpperCase() || 'U', 20, 22);

        finalImageData = canvas.toDataURL();
        await completeAvatarSave(finalImageData);
    } else {
        // Generate new identicon
        finalImageData = generateIdenticon(window.currentUser?.email);
        await completeAvatarSave(finalImageData);
    }
}

async function completeAvatarSave(imageData) {
    // Save to localStorage (backup)
    localStorage.setItem(`avatar_${window.currentUser.uid}`, imageData);

    // Save to Firebase Cloud (syncs across all devices)
    const saved = await saveAvatarToCloud(imageData);

    closeAvatarModal();

    if (saved) {
        if (window.sileo) {
            window.sileo.success('Avatar saved and synced to all your devices!', 'Success');
        } else {
            alert('Avatar saved! It will appear on all your devices.');
        }
    } else {
        if (window.sileo) {
            window.sileo.warning('Avatar saved locally only. Check your connection for cloud sync.', 'Warning');
        }
    }
}

function closeAvatarModal() {
    const modal = document.getElementById('avatarModal');
    if (modal) {
        modal.remove();
        document.body.classList.remove('modal-open');
    }
    selectedAvatarColor = null;
    selectedAvatarData = null;
    selectedAvatarFile = null;
}

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

// Call this after login to load avatar from cloud
async function initUserAvatar() {
    await loadUserAvatar();
}

// Update this function to properly check verification status
async function updateAccountStatus() {
    const user = window.auth.currentUser;
    if (!user) return;

    const statusSpan = document.getElementById('emailVerifiedStatus');
    const verifyBtn = document.getElementById('verifyEmailBtn');
    const accountStatusDiv = document.getElementById('accountStatus');

    // Force refresh user data from Firebase
    await user.reload();
    const isVerified = user.emailVerified;

    if (isVerified) {
        if (statusSpan) {
            statusSpan.innerHTML = '<i class="fas fa-check-circle"></i> Verified';
            statusSpan.style.color = '#10b981';
        }
        if (accountStatusDiv) {
            accountStatusDiv.className = 'security-badge verified';
            accountStatusDiv.style.background = 'rgba(16, 185, 129, 0.1)';
            accountStatusDiv.style.color = '#10b981';
            accountStatusDiv.style.border = '1px solid rgba(16, 185, 129, 0.2)';
        }
        if (verifyBtn) {
            verifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verified ✓';
            verifyBtn.disabled = true;
            verifyBtn.style.opacity = '0.6';
            verifyBtn.style.cursor = 'not-allowed';
        }
    } else {
        if (statusSpan) {
            statusSpan.innerHTML = '<i class="fas fa-exclamation-circle"></i> Not Verified';
            statusSpan.style.color = '#f59e0b';
        }
        if (accountStatusDiv) {
            accountStatusDiv.className = 'security-badge unverified';
            accountStatusDiv.style.background = 'rgba(245, 158, 11, 0.1)';
            accountStatusDiv.style.color = '#f59e0b';
            accountStatusDiv.style.border = '1px solid rgba(245, 158, 11, 0.2)';
        }
        if (verifyBtn) {
            verifyBtn.innerHTML = '<i class="fas fa-envelope"></i> Verify Email';
            verifyBtn.disabled = false;
            verifyBtn.style.opacity = '1';
        }
    }
}

// Call this after login and periodically
async function refreshUserData() {
    if (window.auth.currentUser) {
        await window.auth.currentUser.reload();
        updateAccountStatus();
    }
}

// Call this when settings view is opened
function checkVerificationStatus() {
    if (window.auth.currentUser) {
        updateAccountStatus();
    }
}

// Add this to your switchView function
const originalSwitchView = switchView;
switchView = function (viewName) {
    originalSwitchView(viewName);
    if (viewName === 'settings') {
        setTimeout(() => {
            checkVerificationStatus();
        }, 100);
    }
};

// Auto-refresh every 10 seconds when on settings page
let verificationInterval = null;
function startVerificationCheck() {
    if (verificationInterval) clearInterval(verificationInterval);
    verificationInterval = setInterval(() => {
        const activeView = document.querySelector('.view.active');
        if (activeView && activeView.id === 'settingsView') {
            refreshUserData();
        }
    }, 10000);
}
startVerificationCheck();

// ===== SINGLE SWITCHVIEW FUNCTION (NO DUPLICATES) =====
function switchView(viewName) {
    // Save current scroll position
    const currentScroll = window.scrollY;

    closeMobileMenu();

    const views = ['dashboardView', 'transactionsView', 'analyticsView', 'goalsView', 'billsView', 'settingsView', 'householdView'];
    views.forEach(view => {
        const el = document.getElementById(view);
        if (el) el.classList.remove('active');
    });

    const activeView = document.getElementById(viewName + 'View');
    if (activeView) activeView.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === viewName) btn.classList.add('active');
    });

    if (viewName === 'analytics' && typeof window.updateAnalytics === 'function') {
        setTimeout(() => window.updateAnalytics(), 100);
    }

    if (viewName === 'household' && typeof loadHousehold === 'function') {
        setTimeout(() => loadHousehold(), 100);
    }

    // Restore scroll position
    setTimeout(() => {
        window.scrollTo(0, currentScroll);
    }, 10);
}

// ===== FIXED MOBILE MENU FUNCTIONS - NO SCROLL LOCK =====

function toggleMobileMenu() {
    console.log('Toggle menu called');
    const navMenu = document.getElementById('navMenu');
    const overlay = document.getElementById('menuOverlay');

    if (!navMenu) return;

    if (navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        // ✅ IMPORTANT: Re-enable scrolling
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
    } else {
        navMenu.classList.add('open');
        if (overlay) overlay.classList.add('active');
        // ✅ DO NOT lock scroll - let the main content scroll
        // Remove this line: document.body.style.overflow = 'hidden';
        // Keep body scrollable while menu is open
    }
}

function closeMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    const overlay = document.getElementById('menuOverlay');
    if (navMenu) navMenu.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    // ✅ Always re-enable scrolling
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
}


// ===== INITIALIZE NAV ITEMS =====
function initNavItems() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        // Remove old listeners
        btn.removeEventListener('click', btn._listener);
        // Add new listener
        const listener = function (e) {
            e.stopPropagation();
            const viewName = this.dataset.view;
            if (viewName) {
                switchView(viewName);
            }
        };
        btn.addEventListener('click', listener);
        btn._listener = listener;
    });
    console.log('Nav items initialized:', document.querySelectorAll('.nav-item').length);
}

// ===== DOM CONTENT LOADED =====
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing nav items');
    initNavItems();

    // Also set up month filter
    const monthFilter = document.getElementById('monthFilter');
    if (monthFilter) monthFilter.value = new Date().toISOString().slice(0, 7);

    // Theme options
    document.querySelectorAll('.theme-option').forEach(opt => opt.addEventListener('click', () => {
        const theme = opt.dataset.theme;
        if (theme === 'system') {
            const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        localStorage.setItem('theme', theme);
        document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
    }));

    const savedTheme = localStorage.getItem('theme') || 'system';
    const themeOption = document.querySelector(`.theme-option[data-theme="${savedTheme}"]`);
    if (themeOption) themeOption.click();

    // Ensure body is scrollable on Android
    document.body.style.overflow = 'auto';
    document.body.style.position = 'relative';
    document.body.style.height = 'auto';
});

// ===== CLOSE MENUS WHEN CLICKING OUTSIDE =====
document.addEventListener('click', function (event) {
    const navMenu = document.getElementById('navMenu');
    const menuToggle = document.getElementById('mobileMenuToggle');

    if (navMenu && navMenu.classList.contains('open')) {
        if (!navMenu.contains(event.target) && !menuToggle?.contains(event.target)) {
            closeMobileMenu();
        }
    }

    const userMenu = document.querySelector('.user-menu');
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown && userDropdown.style.opacity === '1') {
        if (!userMenu?.contains(event.target)) {
            userDropdown.style.opacity = '0';
            userDropdown.style.visibility = 'hidden';
        }
    }
});

// ===== EXPORT SWITCHVIEW GLOBALLY =====
window.switchView = switchView;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;


// ===== PUSH NOTIFICATIONS SYSTEM =====

// Request notification permission
async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.log("Browser doesn't support notifications");
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }

    return false;
}

// Show notification
function showNotification(title, body, tag = null) {
    if (Notification.permission !== "granted") return;

    // Check if notifications are enabled in settings
    if (localStorage.getItem('notifications_enabled') !== 'true') return;

    const options = {
        body: body,
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%236366f1'/%3E%3Ctext x='50' y='68' text-anchor='middle' font-size='52' fill='white' font-family='Arial'%3ECT%3C/text%3E%3C/svg%3E",
        badge: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%236366f1'/%3E%3C/svg%3E",
        vibrate: [200, 100, 200],
        silent: false,
        requireInteraction: true,
        tag: tag || Math.random().toString(),
        timestamp: Date.now()
    };

    const notification = new Notification(title, options);

    // Close after 10 seconds
    setTimeout(() => notification.close(), 10000);

    // Open app when clicked
    notification.onclick = function () {
        window.focus();
        notification.close();
    };

    return notification;
}

// Test notification
async function testNotification() {
    const granted = await requestNotificationPermission();
    if (granted) {
        showNotification(
            "✅ Notifications Working!",
            "You'll receive alerts for bills, budgets, and goals.",
            "test-notification"
        );
        if (window.sileo) window.sileo.success('Test notification sent!', 'Success');
    } else {
        if (window.sileo) window.sileo.error('Please allow notifications in browser settings', 'Permission Needed');
    }
}

// Check bill reminders
function checkBillReminders() {
    const notifyBills = document.getElementById('notifyBills')?.checked !== false;
    if (!notifyBills) return;

    const reminderDays = parseInt(localStorage.getItem('reminder_days') || '2');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    (window.bills || []).forEach(bill => {
        const dueDate = new Date(bill.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        // Check if already notified for this bill
        const notifiedKey = `notified_bill_${bill.name}_${bill.dueDate}`;
        const alreadyNotified = localStorage.getItem(notifiedKey) === 'true';

        if (daysUntilDue === reminderDays && !alreadyNotified) {
            showNotification(
                "💰 Bill Reminder",
                `${bill.name} is due in ${reminderDays} day${reminderDays > 1 ? 's' : ''}! Amount: ${formatCurrency(bill.amount)}`,
                `bill_${bill.name}`
            );
            localStorage.setItem(notifiedKey, 'true');
        } else if (daysUntilDue === 0 && !alreadyNotified) {
            showNotification(
                "🔴 Bill Due Today",
                `${bill.name} is due today! Amount: ${formatCurrency(bill.amount)}`,
                `bill_today_${bill.name}`
            );
            localStorage.setItem(notifiedKey, 'true');
        } else if (daysUntilDue < 0) {
            // Clear notification flag for past bills (will notify next cycle)
            localStorage.removeItem(notifiedKey);
        }
    });
}

// Check budget alerts
function checkBudgetAlerts() {
    const notifyBudget = document.getElementById('notifyBudget')?.checked !== false;
    if (!notifyBudget || !window.budgetLimit || window.budgetLimit <= 0) return;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthExpenses = (window.transactions || [])
        .filter(t => t.type === 'expense' && t.date && t.date.startsWith(currentMonth))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    const percentage = (monthExpenses / window.budgetLimit) * 100;
    const notifiedKey = `notified_budget_${currentMonth}_${Math.floor(percentage / 10) * 10}`;
    const alreadyNotified = localStorage.getItem(notifiedKey) === 'true';

    if (percentage >= 90 && percentage < 100 && !alreadyNotified) {
        const remaining = window.budgetLimit - monthExpenses;
        showNotification(
            "⚠️ Budget Alert",
            `You've used ${percentage.toFixed(0)}% of your monthly budget! ₱${formatAmount(remaining)} remaining.`,
            "budget_warning"
        );
        localStorage.setItem(notifiedKey, 'true');
    } else if (percentage >= 100 && !alreadyNotified) {
        const over = monthExpenses - window.budgetLimit;
        showNotification(
            "🔴 Budget Exceeded",
            `You've exceeded your budget by ${formatCurrency(over)}!`,
            "budget_exceeded"
        );
        localStorage.setItem(notifiedKey, 'true');
    }
}

// Check goal completion
function checkGoalCompletion() {
    const notifyGoals = document.getElementById('notifyGoals')?.checked !== false;
    if (!notifyGoals) return;

    (window.goals || []).forEach(goal => {
        const wasCompleted = localStorage.getItem(`goal_completed_${goal.name}`) === 'true';
        const isCompleted = goal.current >= goal.target;

        if (isCompleted && !wasCompleted && goal.target > 0) {
            const progress = (goal.current / goal.target * 100).toFixed(0);
            showNotification(
                "🎉 Goal Achieved! 🎉",
                `Congratulations! You reached ${progress}% of your goal: "${goal.name}"!`,
                `goal_${goal.name}`
            );
            localStorage.setItem(`goal_completed_${goal.name}`, 'true');
        } else if (!isCompleted) {
            localStorage.removeItem(`goal_completed_goal_${goal.name}`);
        }
    });
}

// Send weekly summary
function sendWeeklySummary() {
    const notifySummary = document.getElementById('notifySummary')?.checked !== false;
    if (!notifySummary) return;

    const lastSummary = localStorage.getItem('last_weekly_summary');
    const now = new Date();
    const daysSinceLast = lastSummary ? (now - new Date(lastSummary)) / (1000 * 60 * 60 * 24) : 7;

    // Send every 7 days
    if (daysSinceLast >= 7) {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];

        const weekTransactions = (window.transactions || []).filter(t => t.date >= weekAgoStr);
        const weekExpenses = weekTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
        const weekIncome = weekTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
        const weekSavings = weekIncome - weekExpenses;

        let trend = "";
        if (weekSavings > 0) trend = "📈 Positive cash flow!";
        else if (weekSavings < 0) trend = "📉 Negative cash flow this week";
        else trend = "📊 Balanced week";

        showNotification(
            "📊 Weekly Summary",
            `Income: ${formatCurrency(weekIncome)} | Expenses: ${formatCurrency(weekExpenses)} | Net: ${formatCurrency(weekSavings)}\n${trend}`,
            "weekly_summary"
        );

        localStorage.setItem('last_weekly_summary', now.toISOString());
    }
}

// Toggle notifications
async function toggleNotifications() {
    const toggle = document.getElementById('notificationToggle');
    const settings = document.getElementById('notificationSettings');

    if (toggle.checked) {
        const granted = await requestNotificationPermission();
        if (granted) {
            settings.style.display = 'block';
            localStorage.setItem('notifications_enabled', 'true');
            if (window.sileo) {
                window.sileo.success('Notifications enabled! You will receive alerts.', 'Success');
            }
            testNotification();
        } else {
            toggle.checked = false;
            if (window.sileo) {
                window.sileo.error('Please allow notifications in browser settings', 'Permission Needed');
            }
        }
    } else {
        settings.style.display = 'none';
        localStorage.setItem('notifications_enabled', 'false');
        if (window.sileo) {
            window.sileo.info('Notifications disabled', 'Settings');
        }
    }
}

// Save reminder days
function saveReminderDays() {
    const reminderSelect = document.getElementById('reminderTime');
    if (reminderSelect) {
        localStorage.setItem('reminder_days', reminderSelect.value);
    }
}

// Save notification preferences
function saveNotificationPrefs() {
    const notifyBills = document.getElementById('notifyBills')?.checked;
    const notifyBudget = document.getElementById('notifyBudget')?.checked;
    const notifyGoals = document.getElementById('notifyGoals')?.checked;
    const notifySummary = document.getElementById('notifySummary')?.checked;

    localStorage.setItem('notify_bills', notifyBills);
    localStorage.setItem('notify_budget', notifyBudget);
    localStorage.setItem('notify_goals', notifyGoals);
    localStorage.setItem('notify_summary', notifySummary);
}

// Load notification settings
function loadNotificationSettings() {
    const enabled = localStorage.getItem('notifications_enabled') === 'true';
    const toggle = document.getElementById('notificationToggle');
    const settings = document.getElementById('notificationSettings');

    if (toggle) {
        toggle.checked = enabled;
        if (settings) settings.style.display = enabled ? 'block' : 'none';
    }

    // Load preferences
    const notifyBills = document.getElementById('notifyBills');
    const notifyBudget = document.getElementById('notifyBudget');
    const notifyGoals = document.getElementById('notifyGoals');
    const notifySummary = document.getElementById('notifySummary');
    const reminderSelect = document.getElementById('reminderTime');

    if (notifyBills) notifyBills.checked = localStorage.getItem('notify_bills') !== 'false';
    if (notifyBudget) notifyBudget.checked = localStorage.getItem('notify_budget') !== 'false';
    if (notifyGoals) notifyGoals.checked = localStorage.getItem('notify_goals') !== 'false';
    if (notifySummary) notifySummary.checked = localStorage.getItem('notify_summary') !== 'false';
    if (reminderSelect) reminderSelect.value = localStorage.getItem('reminder_days') || '2';

    // Add event listeners
    if (reminderSelect) reminderSelect.addEventListener('change', saveReminderDays);
    if (notifyBills) notifyBills.addEventListener('change', saveNotificationPrefs);
    if (notifyBudget) notifyBudget.addEventListener('change', saveNotificationPrefs);
    if (notifyGoals) notifyGoals.addEventListener('change', saveNotificationPrefs);
    if (notifySummary) notifySummary.addEventListener('change', saveNotificationPrefs);
}

// Run all notification checks
function runNotificationChecks() {
    if (localStorage.getItem('notifications_enabled') !== 'true') return;
    if (Notification.permission !== "granted") return;

    checkBillReminders();
    checkBudgetAlerts();
    checkGoalCompletion();
}

// Run weekly summary check (different schedule)
function runWeeklySummaryCheck() {
    if (localStorage.getItem('notifications_enabled') !== 'true') return;
    if (Notification.permission !== "granted") return;

    sendWeeklySummary();
}

// Start notification checker (every hour for regular checks)
let notificationInterval = null;
let weeklySummaryInterval = null;

function startNotificationChecker() {
    if (notificationInterval) clearInterval(notificationInterval);
    if (weeklySummaryInterval) clearInterval(weeklySummaryInterval);

    // Check every hour for bills, budgets, goals
    notificationInterval = setInterval(() => {
        runNotificationChecks();
    }, 3600000); // 1 hour

    // Check weekly summary every 12 hours
    weeklySummaryInterval = setInterval(() => {
        runWeeklySummaryCheck();
    }, 43200000); // 12 hours

    // Run initial checks
    setTimeout(() => {
        runNotificationChecks();
        runWeeklySummaryCheck();
    }, 3000); // Wait 3 seconds after page load
}

// Call this after data loads
function initNotifications() {
    loadNotificationSettings();
    startNotificationChecker();
}

// Make functions global
window.toggleNotifications = toggleNotifications;
window.testNotification = testNotification;
window.initNotifications = initNotifications;


function copyGcashNumber() {
    const number = document.getElementById('gcashNumber').innerText;
    navigator.clipboard.writeText(number);

    if (window.sileo) {
        window.sileo.success('GCash number copied to clipboard!', 'Thank you!');
    } else {
        alert('GCash number copied: ' + number);
    }
}

function openGCashApp() {
    // Try to open GCash app directly
    window.location.href = 'gcash://';

    // Fallback: open GCash website
    setTimeout(() => {
        window.open('https://gcash.com', '_blank');
    }, 1000);
}

// ===== SHARED HOUSEHOLD BUDGET - WORKING VERSION =====

// Variables
window.currentHousehold = null;
window.householdMembers = [];

// Modal Functions
window.showCreateHouseholdModal = function () {
    const modal = document.getElementById('createHouseholdModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }
};

window.closeCreateHouseholdModal = function () {
    const modal = document.getElementById('createHouseholdModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
    const input = document.getElementById('householdName');
    if (input) input.value = '';
};

window.showJoinHouseholdModal = function () {
    const modal = document.getElementById('joinHouseholdModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }
};

window.closeJoinHouseholdModal = function () {
    const modal = document.getElementById('joinHouseholdModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
    const input = document.getElementById('householdCode');
    if (input) input.value = '';
};

// Cache for user names to avoid repeated Firestore calls
let userNameCache = {};

window.showAddSharedExpenseModal = function () {
    const modal = document.getElementById('addSharedExpenseModal');
    if (!modal) return;

    // Populate "Paid By" dropdown with member names
    const select = document.getElementById('sharedPaidBy');
    if (select && window.householdMembers && window.householdMembers.length > 0) {
        select.innerHTML = window.householdMembers.map(m =>
            `<option value="${m.id}" ${m.id === window.currentUser?.uid ? 'selected' : ''}>${escapeHtml(m.name)}</option>`
        ).join('');
    }

    // Populate split members list
    const membersList = document.getElementById('splitMembersList');
    if (membersList && window.householdMembers && window.householdMembers.length > 0) {
        membersList.innerHTML = window.householdMembers.map(m => `
            <label class="member-checkbox">
                <input type="checkbox" value="${m.id}" ${m.id === window.currentUser?.uid ? 'checked' : ''}>
                <span>${escapeHtml(m.name)}</span>
            </label>
        `).join('');
    }

    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
};

// Get user name with caching (FAST)
async function getUserName(userId) {
    // Check cache first
    if (userNameCache[userId]) {
        return userNameCache[userId];
    }

    // Check if it's current user
    if (window.currentUser && window.currentUser.uid === userId) {
        const name = window.currentUser.displayName || window.currentUser.email?.split('@')[0] || 'You';
        userNameCache[userId] = name;
        return name;
    }

    try {
        const db = window.db;
        const userDoc = await db.collection('users').doc(userId).get();
        let name = 'Member';

        if (userDoc.exists) {
            const userData = userDoc.data();
            // Try to get name from multiple possible fields
            name = userData.name || userData.displayName || userData.email?.split('@')[0] || 'Member';
        }

        userNameCache[userId] = name;
        return name;
    } catch (error) {
        console.error('Error getting user name for:', userId, error);
        return 'Member';
    }
}
//end
window.closeAddSharedExpenseModal = function () {
    const modal = document.getElementById('addSharedExpenseModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
    const desc = document.getElementById('sharedDesc');
    const amount = document.getElementById('sharedAmount');
    if (desc) desc.value = '';
    if (amount) amount.value = '';
};

window.selectSplitType = function (type) {
    const btns = document.querySelectorAll('.split-option-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.split-option-btn[data-split="${type}"]`);
    if (activeBtn) activeBtn.classList.add('active');
};

// Create Household
window.createHousehold = async function () {
    const nameInput = document.getElementById('householdName');
    const name = nameInput ? nameInput.value.trim() : '';

    if (!name) {
        if (window.sileo) window.sileo.error('Please enter a household name', 'Error');
        return;
    }

    const householdCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        const db = window.db;
        const currentUser = window.currentUser;

        if (!db || !currentUser) {
            if (window.sileo) window.sileo.error('Database not ready', 'Error');
            return;
        }

        // Get creator's name
        const creatorName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Admin';

        const household = {
            name: name,
            code: householdCode,
            createdBy: currentUser.uid,
            createdByName: creatorName,
            createdAt: new Date().toISOString(),
            members: [currentUser.uid],
            memberNames: [creatorName],  // ADD THIS
            memberEmails: [currentUser.email]
        };

        const docRef = await db.collection('households').add(household);

        await db.collection('household_members').doc(currentUser.uid).set({
            householdId: docRef.id,
            role: 'admin',
            name: creatorName,
            joinedAt: new Date().toISOString()
        });

        if (window.sileo) {
            window.sileo.success(`Household "${name}" created! Code: ${householdCode}`, 'Success');
        }

        window.closeCreateHouseholdModal();
        await window.loadHousehold();

    } catch (error) {
        console.error('Create household error:', error);
        if (window.sileo) window.sileo.error('Failed to create household: ' + error.message, 'Error');
    }
};

// Join Household
window.joinHousehold = async function () {
    const codeInput = document.getElementById('householdCode');
    const code = codeInput ? codeInput.value.trim() : '';

    if (!code) {
        if (window.sileo) window.sileo.error('Please enter a household code', 'Error');
        return;
    }

    try {
        const db = window.db;
        const currentUser = window.currentUser;

        if (!db || !currentUser) {
            if (window.sileo) window.sileo.error('Database not ready', 'Error');
            return;
        }

        const query = await db.collection('households').where('code', '==', code).get();

        if (query.empty) {
            if (window.sileo) window.sileo.error('Invalid household code', 'Error');
            return;
        }

        const householdDoc = query.docs[0];
        const household = householdDoc.data();

        // Check if already a member
        if (household.members && household.members.includes(currentUser.uid)) {
            if (window.sileo) window.sileo.info('You are already a member', 'Info');
            window.closeJoinHouseholdModal();
            await window.loadHousehold();
            return;
        }

        // Get joiner's name
        const joinerName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Member';

        // Update household with new member (prevent duplicates)
        const updatedMembers = [...new Set([...(household.members || []), currentUser.uid])];
        const updatedMemberNames = [...new Set([...(household.memberNames || []), joinerName])];
        const updatedEmails = [...new Set([...(household.memberEmails || []), currentUser.email])];

        await householdDoc.ref.update({
            members: updatedMembers,
            memberNames: updatedMemberNames,
            memberEmails: updatedEmails
        });

        await db.collection('household_members').doc(currentUser.uid).set({
            householdId: householdDoc.id,
            role: 'member',
            name: joinerName,
            joinedAt: new Date().toISOString()
        });

        // Clear cache
        userNameCache = {};

        window.closeJoinHouseholdModal();
        if (window.sileo) window.sileo.success(`Joined "${household.name}"!`, 'Welcome');
        await window.loadHousehold();

    } catch (error) {
        console.error('Join household error:', error);
        if (window.sileo) window.sileo.error('Failed to join household: ' + error.message, 'Error');
    }
};

window.loadHousehold = async function () {
    try {
        const db = window.db;
        const currentUser = window.currentUser;
        const container = document.getElementById('householdContainer');

        if (!db || !currentUser) {
            if (container) {
                container.innerHTML = `<div class="empty-state"><p>Please login first</p></div>`;
            }
            return;
        }

        // Show loading state
        if (container) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-spinner fa-spin" style="font-size: 32px;"></i><p>Loading household...</p></div>`;
        }

        const memberDoc = await db.collection('household_members').doc(currentUser.uid).get();

        if (!memberDoc.exists) {
            if (container) {
                container.innerHTML = `
                    <div class="empty-state empty-household">
                        <div class="empty-state-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="empty-state-title">No Household Yet</div>
                        <div class="empty-state-message">
                            Create or join a household to start sharing expenses with family!
                        </div>
                        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                        </div>
                    </div>
                `;
            }
            return;
        }

        const householdId = memberDoc.data().householdId;
        const householdDoc = await db.collection('households').doc(householdId).get();

        if (!householdDoc.exists) {
            if (container) {
                container.innerHTML = `<div class="empty-state"><p>Household not found.</p></div>`;
            }
            return;
        }

        window.currentHousehold = { id: householdId, ...householdDoc.data() };

        // Clear existing members
        window.householdMembers = [];

        // Get unique members from the members array (remove duplicates)
        const members = [...new Set(window.currentHousehold.members || [])];
        const memberNames = window.currentHousehold.memberNames || [];

        console.log('Raw members array:', members);
        console.log('Raw memberNames array:', memberNames);

        // Build members list without duplicates
        for (let i = 0; i < members.length; i++) {
            const memberId = members[i];
            // Get name from stored array or fetch from users collection
            let memberName = memberNames[i];

            if (!memberName || memberName === 'Member') {
                memberName = await getUserName(memberId);
            }

            // Check if member already exists in the list (prevent duplicates)
            const exists = window.householdMembers.some(m => m.id === memberId);
            if (!exists) {
                window.householdMembers.push({
                    id: memberId,
                    name: memberName,
                    role: memberId === window.currentHousehold.createdBy ? 'admin' : 'member'
                });
            }
        }

        console.log('Final household members:', window.householdMembers);

        // Load shared transactions
        let sharedTransactions = [];
        try {
            const transactionsSnap = await db.collection('shared_transactions')
                .where('householdId', '==', window.currentHousehold.id)
                .orderBy('date', 'desc')
                .limit(50)
                .get();

            transactionsSnap.forEach(doc => {
                sharedTransactions.push({ id: doc.id, ...doc.data() });
            });
        } catch (err) {
            console.error('Error loading transactions:', err);
        }

        // Load settlements
        let settlements = [];
        try {
            const settlementsSnap = await db.collection('settlements')
                .where('householdId', '==', window.currentHousehold.id)
                .where('status', '==', 'pending')
                .get();

            settlementsSnap.forEach(doc => {
                settlements.push({ id: doc.id, ...doc.data() });
            });
        } catch (err) {
            console.error('Error loading settlements:', err);
        }

        // Render UI
        await window.renderHouseholdUI(sharedTransactions, settlements);

    } catch (error) {
        console.error('Load household error:', error);
        const container = document.getElementById('householdContainer');
        if (container) {
            container.innerHTML = `<div class="empty-state"><p>Error loading household. Please refresh.</p><button class="btn-primary" onclick="window.loadHousehold()" style="margin-top: 16px;">Retry</button></div>`;
        }
    }
};

// Render Household UI


window.getMemberName = function (userId) {
    if (!window.householdMembers) return 'Member';
    const member = window.householdMembers.find(m => m.id === userId);
    if (member) {
        return member.name || member.email || 'Member';
    }
    return userId.substring(0, 8);
};

window.addSharedExpense = async function () {
    const description = document.getElementById('sharedDesc')?.value.trim();
    const amount = parseFloat(document.getElementById('sharedAmount')?.value || 0);
    const paidBy = document.getElementById('sharedPaidBy')?.value;  // This should get the selected person
    const splitType = document.querySelector('.split-option-btn.active')?.dataset.split || 'equal';

    const selectedMembers = Array.from(document.querySelectorAll('#splitMembersList input:checked'))
        .map(input => input.value);

    // Validation
    if (!description) {
        if (window.sileo) window.sileo.error('Please enter a description', 'Error');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        if (window.sileo) window.sileo.error('Please enter a valid amount', 'Error');
        return;
    }

    if (!paidBy) {
        if (window.sileo) window.sileo.error('Please select who paid', 'Error');
        return;
    }

    if (selectedMembers.length === 0) {
        if (window.sileo) window.sileo.error('Please select members to split with', 'Error');
        return;
    }

    // Calculate split amount
    const splitAmount = amount / selectedMembers.length;

    try {
        const expense = {
            householdId: window.currentHousehold.id,
            description: description,
            amount: amount,
            paidBy: paidBy,  // This is the person who paid
            splitType: splitType,
            splitAmount: splitAmount,
            participants: selectedMembers,
            date: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        await window.db.collection('shared_transactions').add(expense);

        // Create settlements for who owes whom
        for (const member of selectedMembers) {
            if (member !== paidBy) {
                await window.db.collection('settlements').add({
                    from_user: member,      // Who owes money
                    to_user: paidBy,        // Who is owed money
                    amount: splitAmount,
                    householdId: window.currentHousehold.id,
                    status: 'pending',
                    createdAt: new Date().toISOString()
                });
            }
        }

        window.closeAddSharedExpenseModal();
        if (window.sileo) window.sileo.success('Shared expense added!', 'Success');
        await window.loadHousehold();

    } catch (error) {
        console.error('Add shared expense error:', error);
        if (window.sileo) window.sileo.error('Failed to add expense', 'Error');
    }
};

window.markSettled = async function (settlementId) {
    try {
        await window.db.collection('settlements').doc(settlementId).update({
            status: 'settled',
            settledAt: new Date().toISOString()
        });

        if (window.sileo) window.sileo.success('Settlement marked as paid!', 'Success');
        await window.loadHousehold();
    } catch (error) {
        console.error('Settlement error:', error);
        if (window.sileo) window.sileo.error('Failed to mark settlement', 'Error');
    }
};
// Make sure all household functions are global
window.createHousehold = createHousehold;
window.joinHousehold = joinHousehold;
window.loadHousehold = loadHousehold;
window.showCreateHouseholdModal = showCreateHouseholdModal;
window.closeCreateHouseholdModal = closeCreateHouseholdModal;
window.showJoinHouseholdModal = showJoinHouseholdModal;
window.closeJoinHouseholdModal = closeJoinHouseholdModal;
window.showAddSharedExpenseModal = showAddSharedExpenseModal;
window.closeAddSharedExpenseModal = closeAddSharedExpenseModal;
window.addSharedExpense = addSharedExpense;
window.selectSplitType = selectSplitType;
window.markSettled = markSettled;

window.renderHouseholdUI = function (sharedTransactions, settlements) {
    const container = document.getElementById('householdContainer');
    if (!container) return;

    if (!window.currentHousehold) {
        container.innerHTML = `<div class="empty-state empty-household">
            <div class="empty-state-icon"><i class="fas fa-users"></i></div>
            <div class="empty-state-title">No Household Yet</div>
            <div class="empty-state-message">Create or join a household to start sharing expenses with family!</div>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <button class="btn-primary" onclick="window.showCreateHouseholdModal()" style="min-width: 140px;">
                    <i class="fas fa-plus"></i> Create Household
                </button>
                <button class="btn-secondary" onclick="window.showJoinHouseholdModal()" style="min-width: 140px;">
                    <i class="fas fa-sign-in-alt"></i> Join Household
                </button>
            </div>
        </div>`;
        return;
    }

    // If household exists, render the full UI
    const totalExpenses = (sharedTransactions || []).reduce((sum, t) => sum + (t.amount || 0), 0);
    const perPerson = window.householdMembers.length > 0 ? totalExpenses / window.householdMembers.length : 0;

    // Calculate balances
    const balances = {};
    window.householdMembers.forEach(m => balances[m.id] = 0);

    (settlements || []).forEach(s => {
        if (balances[s.from_user] !== undefined) balances[s.from_user] -= s.amount;
        if (balances[s.to_user] !== undefined) balances[s.to_user] += s.amount;
    });

    const currentUserBalance = balances[window.currentUser?.uid] || 0;

    container.innerHTML = `
        <div class="household-grid">
            <div class="household-card household-summary">
                <h3><i class="fas fa-home"></i> ${escapeHtml(window.currentHousehold.name)}</h3>
                <p><small>Code: ${window.currentHousehold.code}</small></p>
                
                <div class="members-list">
                    ${window.householdMembers.map(m => `
                        <div class="member-chip ${m.role === 'admin' ? 'admin' : ''}">
                            <i class="fas ${m.role === 'admin' ? 'fa-crown' : 'fa-user'}"></i>
                            <span>${escapeHtml(m.name)}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-top: 16px; flex-wrap: wrap; gap: 10px;">
                    <div><small>Total Shared</small><h4>${formatCurrency(totalExpenses)}</h4></div>
                    <div><small>Per Person</small><h4>${formatCurrency(perPerson)}</h4></div>
                    <div><small>Your Balance</small><h4 style="color: ${currentUserBalance >= 0 ? '#10b981' : '#ef4444'}">${currentUserBalance >= 0 ? '↗' : '↙'} ${formatCurrency(Math.abs(currentUserBalance))}</h4></div>
                </div>
                
                <div style="margin-top: 16px;">
                    <button class="btn-primary" onclick="window.showAddSharedExpenseModal()" style="width: 100%; margin-bottom: 10px;">
                        <i class="fas fa-plus"></i> Add Shared Expense
                    </button>
                    
                    <button class="btn-danger" onclick="window.deleteHousehold()" style="width: 100%; background: linear-gradient(135deg, #ef4444, #dc2626);">
                        <i class="fas fa-trash"></i> Delete Household
                    </button>
                </div>
            </div>
            
            <div class="household-card">
                <h3><i class="fas fa-receipt"></i> Shared Expenses</h3>
                ${sharedTransactions && sharedTransactions.length > 0 ? `
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${sharedTransactions.map(t => `
                            <div class="shared-transaction-item">
                                <div>
                                    <strong>${escapeHtml(t.description)}</strong>
                                    <div class="shared-paid-by">Paid by ${window.getMemberName(t.paidBy)}</div>
                                </div>
                                <div>
                                    <div class="shared-amount">${formatCurrency(t.amount)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p style="text-align: center; padding: 20px;">No shared expenses yet</p>'}
            </div>
            
            <div class="household-card">
                <h3><i class="fas fa-hand-holding-usd"></i> Settlements</h3>
                ${settlements && settlements.length > 0 ? `
                    <div>
                        ${settlements.map(s => `
                            <div class="shared-transaction-item">
                                <div>
                                    <strong>${window.getMemberName(s.from_user)}</strong> owes 
                                    <strong>${window.getMemberName(s.to_user)}</strong>
                                </div>
                                <div>
                                    <span class="settlement-badge owed">${formatCurrency(s.amount)}</span>
                                    <button class="btn-secondary btn-sm" onclick="window.markSettled('${s.id}')" style="margin-left: 10px; padding: 4px 12px;">Settle</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p style="text-align: center; padding: 20px;">All settled up!</p>'}
            </div>
        </div>
    `;
};

// ===== DELETE HOUSEHOLD FUNCTION =====
window.deleteHousehold = async function () {
    const householdName = window.currentHousehold?.name || 'this household';

    if (!confirm(`⚠️ WARNING: Are you sure you want to delete "${householdName}"?\n\nThis will permanently delete all shared expenses, settlements, and member associations.\n\nThis action cannot be undone!`)) {
        return;
    }

    const confirmation = prompt(`Type "${householdName}" to confirm deletion:`);
    if (confirmation !== householdName) {
        if (window.sileo) window.sileo.error('Confirmation text does not match', 'Cancelled');
        return;
    }

    try {
        const db = window.db;
        const household = window.currentHousehold;

        if (!household || !household.id) {
            if (window.sileo) window.sileo.error('No household found to delete', 'Error');
            return;
        }

        // 1. Delete all shared transactions
        const transactionsSnap = await db.collection('shared_transactions')
            .where('householdId', '==', household.id)
            .get();

        for (const doc of transactionsSnap.docs) {
            await doc.ref.delete();
        }

        // 2. Delete all settlements
        const settlementsSnap = await db.collection('settlements')
            .where('householdId', '==', household.id)
            .get();

        for (const doc of settlementsSnap.docs) {
            await doc.ref.delete();
        }

        // 3. Delete all household members
        const members = household.members || [];
        for (const memberId of members) {
            await db.collection('household_members').doc(memberId).delete();
        }

        // 4. Delete the household itself
        await db.collection('households').doc(household.id).delete();

        // Clear current household data
        window.currentHousehold = null;
        window.householdMembers = [];

        if (window.sileo) window.sileo.success('Household deleted successfully!', 'Deleted');

        // Reload to show empty state
        await window.loadHousehold();

    } catch (error) {
        console.error('Delete household error:', error);
        if (window.sileo) window.sileo.error('Failed to delete household: ' + error.message, 'Error');
    }
};

// Helper to remove loading notification
let currentLoadingNotif = null;

function showLoading(message, title) {
    if (currentLoadingNotif) {
        currentLoadingNotif.remove();
    }
    currentLoadingNotif = window.sileo.loading(message, title);
    return currentLoadingNotif;
}

function hideLoading() {
    if (currentLoadingNotif) {
        currentLoadingNotif.remove();
        currentLoadingNotif = null;
    }
}

// Make sure all functions are globally accessible
window.loadUserData = loadUserData;
window.saveToFirebase = saveToFirebase;
window.render = render;
window.switchView = switchView;
window.deleteHousehold = deleteHousehold;

// Add this to your console to test
function testAddTransaction() {
    const testTx = {
        type: 'expense',
        category: 'Test',
        amount: 100,
        date: new Date().toISOString().split('T')[0],
        note: 'Test transaction',
        createdAt: new Date().toISOString()
    };
    window.transactions.push(testTx);
    console.log('Test transaction added:', window.transactions);
    render();
    saveToFirebase();
}

// ===== FIX FOR SEARCH FUNCTIONALITY =====
// Make sure search is working properly
(function fixSearch() {
    const searchBar = document.getElementById('searchBar');
    if (searchBar) {
        // Remove existing listeners to avoid duplicates
        const newSearchBar = searchBar.cloneNode(true);
        searchBar.parentNode.replaceChild(newSearchBar, searchBar);

        newSearchBar.addEventListener('input', function () {
            console.log('Searching for:', this.value);
            if (typeof render === 'function') {
                render();
            }
        });
    }
})();

// ===== FIX FOR TYPE FILTER =====
(function fixTypeFilter() {
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        const newTypeFilter = typeFilter.cloneNode(true);
        typeFilter.parentNode.replaceChild(newTypeFilter, typeFilter);

        newTypeFilter.addEventListener('change', function () {
            console.log('Filter changed to:', this.value);
            if (typeof render === 'function') {
                render();
            }
        });
    }
})();

// ===== FIX FOR MONTH FILTER =====
(function fixMonthFilter() {
    const monthFilter = document.getElementById('monthFilter');
    if (monthFilter) {
        const newMonthFilter = monthFilter.cloneNode(true);
        monthFilter.parentNode.replaceChild(newMonthFilter, monthFilter);

        newMonthFilter.addEventListener('change', function () {
            console.log('Month changed to:', this.value);
            if (typeof render === 'function') {
                render();
            }
        });
    }
})();

// ===== ENSURE render FUNCTION USES CORRECT VARIABLES =====
if (typeof render === 'function') {
    const originalRender = render;
    window.render = function () {
        console.log('🎯 Enhanced render called');
        console.log('Transactions count:', window.transactions?.length);
        originalRender();
    };
}

// ===== ADD MISSING deleteHousehold FUNCTION =====
window.deleteHousehold = async function () {
    if (!window.currentHousehold) {
        if (window.sileo) window.sileo.error('No household found', 'Error');
        return;
    }

    const householdName = window.currentHousehold.name;
    if (!confirm(`⚠️ Delete "${householdName}"? This cannot be undone!`)) return;

    try {
        const db = window.db;
        const household = window.currentHousehold;

        // Delete all shared transactions
        const transactionsSnap = await db.collection('shared_transactions')
            .where('householdId', '==', household.id).get();
        for (const doc of transactionsSnap.docs) await doc.ref.delete();

        // Delete all settlements
        const settlementsSnap = await db.collection('settlements')
            .where('householdId', '==', household.id).get();
        for (const doc of settlementsSnap.docs) await doc.ref.delete();

        // Delete all household members
        for (const memberId of (household.members || [])) {
            await db.collection('household_members').doc(memberId).delete();
        }

        // Delete household
        await db.collection('households').doc(household.id).delete();

        window.currentHousehold = null;
        window.householdMembers = [];

        if (window.sileo) window.sileo.success('Household deleted!', 'Success');
        if (typeof loadHousehold === 'function') await loadHousehold();

    } catch (error) {
        console.error('Delete error:', error);
        if (window.sileo) window.sileo.error('Failed to delete', 'Error');
    }
};

// ===== FIX FOR ADD TRANSACTION - ENSURE RENDER IS CALLED =====
if (typeof saveNewTransaction === 'function') {
    const originalSaveNewTransaction = saveNewTransaction;
    window.saveNewTransaction = function () {
        console.log('📝 Saving transaction...');
        originalSaveNewTransaction();
        // Force render after a short delay
        setTimeout(() => {
            if (typeof render === 'function') {
                console.log('🔄 Forcing render after save');
                render();
            }
        }, 100);
    };
}

// ===== DIAGNOSTIC FUNCTION - Run in console to test =====
window.testApp = function () {
    console.log('=== APP DIAGNOSTIC ===');
    console.log('1. Transactions count:', window.transactions?.length);
    console.log('2. Current user:', window.currentUser?.uid);
    console.log('3. Render function:', typeof render);
    console.log('4. Save function:', typeof saveNewTransaction);
    console.log('5. Search bar:', !!document.getElementById('searchBar'));
    console.log('6. Tbody:', !!document.getElementById('tbody'));

    // Add a test transaction
    const testTx = {
        type: 'expense',
        category: 'Test',
        amount: 100,
        date: new Date().toISOString().split('T')[0],
        note: 'Test transaction',
        createdAt: new Date().toISOString()
    };
    window.transactions.push(testTx);
    console.log('✅ Test transaction added');

    if (typeof render === 'function') {
        render();
        console.log('✅ Render called');
    }

    return 'Test complete. Check your Transactions tab!';
};

// ===== FIX LOGOUT FUNCTIONALITY =====

// Make sure logout function is globally available
window.handleLogout = function () {
    if (confirm('Are you sure you want to logout?')) {
        firebase.auth().signOut().then(() => {
            // Clear local data
            localStorage.removeItem('cajesData_' + window.currentUser?.uid);
            // Redirect to login
            window.location.href = 'login.html';
        }).catch(error => {
            console.error('Logout error:', error);
            if (window.sileo) {
                window.sileo.error('Failed to logout. Please try again.', 'Error');
            }
        });
    }
};

// Initialize logout buttons
function initLogoutButtons() {
    // Logout button in nav menu
    const logoutNavBtn = document.getElementById('logoutNavBtn');
    if (logoutNavBtn) {
        logoutNavBtn.onclick = function (e) {
            e.stopPropagation();
            window.handleLogout();
        };
    }

    // Original logout button (if visible)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = function (e) {
            e.stopPropagation();
            window.handleLogout();
        };
    }
}

// Call this when app initializes
document.addEventListener('DOMContentLoaded', function () {
    initLogoutButtons();
});

// ===== PRIVACY & SECURITY SYSTEM =====

// Variables
let pinCode = localStorage.getItem('app_pin');
let privacyModeEnabled = localStorage.getItem('privacy_mode') === 'true';
let hideAmountsEnabled = localStorage.getItem('hide_amounts') === 'true';
let failedPinAttempts = 0;
let pinLockoutUntil = localStorage.getItem('pin_lockout_until') ? parseInt(localStorage.getItem('pin_lockout_until')) : null;
let autoLockTimer = null;
let lastActivity = Date.now();
let pinEnabled = localStorage.getItem('pin_enabled') === 'true';
let autoLockTimeoutMinutes = parseInt(localStorage.getItem('auto_lock_timeout') || '10');
let lockoutChecker = null;
let countdownInterval = null;
let activityTrackingSetup = false;


// SINGLE SOURCE OF TRUTH for lock state
let appIsLocked = localStorage.getItem('app_is_locked') === 'true';

// Helper function to check if PIN is locked out
function isPinLockedOut() {
    if (!pinLockoutUntil) return false;
    return Date.now() < pinLockoutUntil;
}

// Save all privacy settings
function saveAllPrivacySettings() {
    localStorage.setItem('pin_enabled', pinEnabled);
    localStorage.setItem('app_pin', pinCode || '');
    localStorage.setItem('privacy_mode', privacyModeEnabled);
    localStorage.setItem('hide_amounts', hideAmountsEnabled);
    localStorage.setItem('auto_lock_timeout', autoLockTimeoutMinutes);
    localStorage.setItem('app_is_locked', appIsLocked);
    if (pinLockoutUntil) {
        localStorage.setItem('pin_lockout_until', pinLockoutUntil);
    } else {
        localStorage.removeItem('pin_lockout_until');
    }
    console.log('Privacy settings saved - appIsLocked:', appIsLocked);
}

// Apply lock state (blur + blocking overlay)
function applyLockState() {
    const mainApp = document.getElementById('mainApp');

    if (appIsLocked) {
        // App should be locked
        if (mainApp) {
            mainApp.style.filter = 'blur(8px)';
            mainApp.style.pointerEvents = 'none';
        }
        showBlockingOverlay();
        console.log('🔒 App is LOCKED - appIsLocked:', appIsLocked);
    } else {
        // App should be unlocked
        if (mainApp) {
            mainApp.style.filter = 'none';
            mainApp.style.pointerEvents = 'auto';
        }
        hideBlockingOverlay();
        console.log('🔓 App is UNLOCKED - appIsLocked:', appIsLocked);
    }
}

// Load privacy settings
function loadPrivacySettings() {
    pinEnabled = localStorage.getItem('pin_enabled') === 'true';
    pinCode = localStorage.getItem('app_pin');
    privacyModeEnabled = localStorage.getItem('privacy_mode') === 'true';
    hideAmountsEnabled = localStorage.getItem('hide_amounts') === 'true';
    autoLockTimeoutMinutes = parseInt(localStorage.getItem('auto_lock_timeout') || '10');
    appIsLocked = localStorage.getItem('app_is_locked') === 'true';
    pinLockoutUntil = localStorage.getItem('pin_lockout_until') ? parseInt(localStorage.getItem('pin_lockout_until')) : null;

    updatePrivacyUI();
    applyPrivacySettings();
    applyLockState();

    if (pinEnabled && pinCode && appIsLocked) {
        console.log('App is locked, showing PIN modal');
        setTimeout(() => showPinModal('unlock'), 100);
    } else {
        console.log('App is unlocked on load');
    }
}

// Update UI elements
function updatePrivacyUI() {
    const pinToggle = document.getElementById('pinLockToggle');
    if (pinToggle) pinToggle.checked = pinEnabled && !!pinCode;
    const privacyModeCheckbox = document.getElementById('privacyMode');
    if (privacyModeCheckbox) privacyModeCheckbox.checked = privacyModeEnabled;
    const hideAmountsCheckbox = document.getElementById('hideAmounts');
    if (hideAmountsCheckbox) hideAmountsCheckbox.checked = hideAmountsEnabled;
    const timeoutSelect = document.getElementById('autoLockTimeout');
    if (timeoutSelect) timeoutSelect.value = autoLockTimeoutMinutes;
}

// Create blocking overlay
let blockingOverlay = null;

function showBlockingOverlay() {
    if (blockingOverlay) return;

    blockingOverlay = document.createElement('div');
    blockingOverlay.id = 'blockingOverlay';
    blockingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: transparent;
        z-index: 9999;
        cursor: not-allowed;
    `;
    document.body.appendChild(blockingOverlay);

    blockingOverlay.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    blockingOverlay.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });
}

function hideBlockingOverlay() {
    if (blockingOverlay) {
        blockingOverlay.remove();
        blockingOverlay = null;
    }
}

// Apply privacy settings
function applyPrivacySettings() {
    if (hideAmountsEnabled) {
        hideAllAmounts();
    } else {
        showAllAmounts();
    }
    if (privacyModeEnabled) {
        enablePrivacyBlur();
    } else {
        disablePrivacyBlur();
    }
}

// Hide all amount displays
function hideAllAmounts() {
    const amountSelectors = [
        '.stat-value', '.net-worth-value', '.current-amount', '.total-amount',
        '.bill-amount', '.shared-amount', '.metric-value', '.projection-item strong',
        '#netWorthVal', '#cashOnHand', '#spentToday', '#spent7Days', '#spentMonth',
        '#balanceLabel', '#debtRemainingVal', '#savingsVal', '#budgetText',
        '#avgDailySpend', '#projectedBalance3m', '#projectedBalance6m', '#projectedBalance12m'
    ];
    amountSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (!el.hasAttribute('data-original-text') && el.innerText && el.innerText.trim() !== '') {
                el.setAttribute('data-original-text', el.innerHTML);
                el.innerHTML = '•••••';
                el.classList.add('hidden-amount');
                el.style.cursor = 'pointer';
                el.onclick = function (e) {
                    e.stopPropagation();
                    toggleAmountVisibility(this);
                };
            }
        });
    });
}

function showAllAmounts() {
    const hiddenElements = document.querySelectorAll('[data-original-text]');
    hiddenElements.forEach(el => {
        const original = el.getAttribute('data-original-text');
        if (original) {
            el.innerHTML = original;
            el.removeAttribute('data-original-text');
            el.classList.remove('hidden-amount');
            el.onclick = null;
        }
    });
}

function toggleAmountVisibility(element) {
    if (!hideAmountsEnabled) return;
    if (element.classList.contains('hidden-amount')) {
        const original = element.getAttribute('data-original-text');
        if (original) {
            element.innerHTML = original;
            element.classList.remove('hidden-amount');
            setTimeout(() => {
                if (hideAmountsEnabled && document.body.contains(element)) {
                    const currentOriginal = element.getAttribute('data-original-text');
                    if (currentOriginal) {
                        element.innerHTML = '•••••';
                        element.classList.add('hidden-amount');
                    }
                }
            }, 3000);
        }
    }
}

function enablePrivacyBlur() {
    const appContainer = document.getElementById('mainApp') || document.body;
    const blurHandler = () => {
        if (!appIsLocked) {
            appContainer.style.filter = 'blur(10px)';
        }
    };
    const focusHandler = () => {
        if (!appIsLocked) {
            appContainer.style.filter = 'none';
        }
    };
    if (window._privacyHandlers) {
        document.removeEventListener('visibilitychange', window._privacyHandlers.blurHandler);
        window.removeEventListener('blur', window._privacyHandlers.blurHandler);
        window.removeEventListener('focus', window._privacyHandlers.focusHandler);
    }
    window._privacyHandlers = { blurHandler, focusHandler };
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) blurHandler();
        else focusHandler();
    });
    window.addEventListener('blur', blurHandler);
    window.addEventListener('focus', focusHandler);
}

function disablePrivacyBlur() {
    const appContainer = document.getElementById('mainApp') || document.body;
    if (!appIsLocked) {
        appContainer.style.filter = 'none';
    }
    if (window._privacyHandlers) {
        document.removeEventListener('visibilitychange', window._privacyHandlers.blurHandler);
        window.removeEventListener('blur', window._privacyHandlers.blurHandler);
        window.removeEventListener('focus', window._privacyHandlers.focusHandler);
        window._privacyHandlers = null;
    }
}

function toggleHideAmounts() {
    const checkbox = document.getElementById('hideAmounts');
    if (!checkbox) return;
    hideAmountsEnabled = checkbox.checked;
    saveAllPrivacySettings();
    applyPrivacySettings();
}

function togglePrivacyMode() {
    const checkbox = document.getElementById('privacyMode');
    if (!checkbox) return;
    privacyModeEnabled = checkbox.checked;
    saveAllPrivacySettings();
    applyPrivacySettings();
}

function changeAutoLockTimeout() {
    const select = document.getElementById('autoLockTimeout');
    if (select) {
        autoLockTimeoutMinutes = parseInt(select.value);
        saveAllPrivacySettings();
        resetInactivityTimer();
    }
}

function loadAutoLockTimeout() {
    const select = document.getElementById('autoLockTimeout');
    if (select) select.value = autoLockTimeoutMinutes;
}

// Auto-lock timer functions
function startAutoLockTimer() {
    if (autoLockTimer) clearTimeout(autoLockTimer);
    // Use appIsLocked consistently
    if (pinEnabled && pinCode && !appIsLocked && !isPinLockedOut()) {
        autoLockTimer = setTimeout(() => {
            console.log('Auto-lock timeout triggered after', autoLockTimeoutMinutes, 'minutes of inactivity');
            autoLock();
        }, autoLockTimeoutMinutes * 60 * 1000);
        console.log('Timer started - will lock after', autoLockTimeoutMinutes, 'minutes');
    }
}

function resetInactivityTimer() {
    // Update last activity timestamp
    lastActivity = Date.now();

    // Clear existing timer
    if (autoLockTimer) {
        clearTimeout(autoLockTimer);
        autoLockTimer = null;
    }

    // Only start new timer if PIN is enabled and app is not locked
    if (pinEnabled && pinCode && !appIsLocked && !isPinLockedOut()) {
        const timeoutMs = autoLockTimeoutMinutes * 60 * 1000;
        autoLockTimer = setTimeout(() => {
            console.log('Auto-lock timeout triggered after', autoLockTimeoutMinutes, 'minutes of inactivity');
            autoLock();
        }, timeoutMs);
        console.log('Activity timer reset - will lock after', autoLockTimeoutMinutes, 'minutes');
        console.log('Timer set for:', new Date(Date.now() + timeoutMs).toLocaleTimeString());
    }
}

function setupActivityTracking() {
    console.log('Setting up activity tracking...');

    // Clear any existing timer
    if (autoLockTimer) {
        clearTimeout(autoLockTimer);
        autoLockTimer = null;
    }

    const handleUserActivity = () => {
        // Only reset if app is not locked
        if (appIsLocked) return;

        const now = Date.now();
        const oldLastActivity = lastActivity;
        lastActivity = now;

        console.log('🖱️ Activity detected - resetting timer', {
            oldActivity: new Date(oldLastActivity).toLocaleTimeString(),
            newActivity: new Date(now).toLocaleTimeString()
        });

        // Clear existing timer
        if (autoLockTimer) {
            clearTimeout(autoLockTimer);
            autoLockTimer = null;
        }

        // Start new timer if PIN is enabled
        if (pinEnabled && pinCode && !appIsLocked && !isPinLockedOut()) {
            const timeoutMs = autoLockTimeoutMinutes * 60 * 1000;
            autoLockTimer = setTimeout(() => {
                console.log('⏰ Auto-lock timeout reached after', autoLockTimeoutMinutes, 'minutes');
                autoLock();
            }, timeoutMs);
            console.log('✅ Timer reset - will lock at:', new Date(Date.now() + timeoutMs).toLocaleTimeString());
        }
    };

    // Add event listeners for all user interactions
    const events = ['click', 'mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove', 'touchmove'];
    events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
        document.addEventListener(event, handleUserActivity);
    });

    // Also handle when page becomes visible again
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    function handleVisibilityChange() {
        if (!document.hidden && !appIsLocked) {
            console.log('👁️ Page became visible - resetting timer');
            handleUserActivity();
        }
    }

    console.log('✅ Activity tracking active for events:', events.join(', '));

    // Initialize timer on page load
    if (pinEnabled && pinCode && !appIsLocked && !isPinLockedOut()) {
        const timeoutMs = autoLockTimeoutMinutes * 60 * 1000;
        autoLockTimer = setTimeout(() => {
            console.log('⏰ Initial auto-lock timer');
            autoLock();
        }, timeoutMs);
        console.log('✅ Initial timer set - will lock at:', new Date(Date.now() + timeoutMs).toLocaleTimeString());
    }
}

// Call it to initialize
setupActivityTracking();

function handleVisibilityChange() {
    if (!document.hidden) {
        // Tab became visible again, reset timer
        console.log('Tab became visible, resetting activity timer');
        if (pinEnabled && pinCode && !appIsLocked && !isPinLockedOut()) {
            resetInactivityTimer();
        }
    }
}

// PIN Modal Functions
function showPinModal(mode) {
    const existingModal = document.getElementById('pinModal');
    if (existingModal) existingModal.remove();
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    // Ensure lock state is applied
    applyLockState();

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'pinModal';
    modal.style.display = 'flex';
    modal.style.zIndex = '10000';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.pointerEvents = 'auto';

    // In showPinModal function, update the 'create' section:
    if (mode === 'create') {
        modal.innerHTML = `
        <div class="modal-content" style="max-width:350px;text-align:center;">
            <button class="modal-close" onclick="cancelPinCreation()"><i class="fas fa-times"></i></button>
            <h2><i class="fas fa-lock"></i> Create New PIN</h2>
            <p style="margin-bottom:20px;">Set a new 4-digit PIN to secure your app</p>
            <div class="pin-input-container">
                <input type="password" id="pinInput1" class="pin-input" maxlength="1" pattern="\\d" inputmode="numeric">
                <input type="password" id="pinInput2" class="pin-input" maxlength="1" pattern="\\d" inputmode="numeric">
                <input type="password" id="pinInput3" class="pin-input" maxlength="1" pattern="\\d" inputmode="numeric">
                <input type="password" id="pinInput4" class="pin-input" maxlength="1" pattern="\\d" inputmode="numeric">
            </div>
            <div id="pinError" class="pin-error"></div>
            <div style="display:flex;gap:10px;margin-top:20px;">
                <button class="btn-secondary" onclick="cancelPinCreation()" style="flex:1">Cancel</button>
                <button class="btn-primary" onclick="createPin()" style="flex:1">Create PIN</button>
            </div>
        </div>
    `;
        document.body.appendChild(modal);
        setupPinInputs();
    }

    else if (mode === 'unlock') {
        if (isPinLockedOut()) {
            const remainingMs = pinLockoutUntil - Date.now();
            const minutesLeft = Math.floor(remainingMs / 60000);
            const secondsLeft = Math.floor((remainingMs % 60000) / 1000);

            modal.innerHTML = `
                <div class="modal-content" style="max-width:350px;text-align:center;">
                    <h2><i class="fas fa-clock"></i> Too Many Attempts</h2>
                    <p>Too many incorrect attempts.</p>
                    <div style="font-size:32px;font-weight:bold;color:var(--primary);margin:20px 0;" id="countdownTimer">
                        ${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}
                    </div>
                    <p>Please wait before trying again.</p>
                    <button class="btn-primary" id="lockoutOkBtn" style="width:100%;margin-top:20px;">OK</button>
                </div>
            `;
            document.body.appendChild(modal);

            countdownInterval = setInterval(() => {
                if (pinLockoutUntil) {
                    const remaining = pinLockoutUntil - Date.now();
                    if (remaining <= 0) {
                        clearInterval(countdownInterval);
                        countdownInterval = null;
                        modal.remove();
                        showPinModal('unlock');
                    } else {
                        const mins = Math.floor(remaining / 60000);
                        const secs = Math.floor((remaining % 60000) / 1000);
                        const timerEl = document.getElementById('countdownTimer');
                        if (timerEl) timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                    }
                }
            }, 1000);

            document.getElementById('lockoutOkBtn').onclick = () => {
                modal.remove();
                // CRITICAL: Re-apply lock state
                applyLockState();
                console.log('Lockout OK clicked, app remains LOCKED');
            };
        } else {
            modal.innerHTML = `
                <div class="modal-content" style="max-width:350px;text-align:center;">
                    <h2><i class="fas fa-lock"></i> App Locked</h2>
                    <p style="margin-bottom:20px;">Enter your PIN to continue</p>
                    <div class="pin-input-container">
                        <input type="password" id="pinInput1" class="pin-input" maxlength="1" pattern="\\d" inputmode="numeric">
                        <input type="password" id="pinInput2" class="pin-input" maxlength="1" pattern="\\d" inputmode="numeric">
                        <input type="password" id="pinInput3" class="pin-input" maxlength="1" pattern="\\d" inputmode="numeric">
                        <input type="password" id="pinInput4" class="pin-input" maxlength="1" pattern="\\d" inputmode="numeric">
                    </div>
                    <div id="pinError" class="pin-error"></div>
                    <div style="display:flex;gap:10px;margin-top:20px;">
                        <button class="btn-secondary" id="pinCancelBtn" style="flex:1">Cancel</button>
                        <button class="btn-primary" id="pinSubmitBtn" style="flex:1">Unlock</button>
                    </div>
                    <button onclick="resetPin()" style="background:none;border:none;color:var(--primary);margin-top:15px;cursor:pointer;">
    <i class="fas fa-key"></i> Forgot PIN? Reset PIN
</button>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('pinSubmitBtn').onclick = () => verifyPin();
            document.getElementById('pinCancelBtn').onclick = () => {
                const errorDiv = document.getElementById('pinError');
                if (errorDiv) {
                    errorDiv.textContent = 'PIN required to access the app';
                    errorDiv.style.display = 'block';
                }
                document.querySelectorAll('.pin-input').forEach(i => i.value = '');
            };
            setupPinInputs();
        }
    }
}

function setupPinInputs() {
    setTimeout(() => {
        const inputs = document.querySelectorAll('.pin-input');
        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });
        });
        if (inputs[0]) inputs[0].focus();
    }, 100);
}

function closePinModal() {
    const modal = document.getElementById('pinModal');
    if (modal) modal.remove();
    // Re-apply lock state to ensure consistency
    applyLockState();
}

async function createPin() {
    const inputs = document.querySelectorAll('.pin-input');
    const pin = Array.from(inputs).map(i => i.value).join('');
    const errorDiv = document.getElementById('pinError');

    if (pin.length !== 4) {
        errorDiv.textContent = 'Please enter a 4-digit PIN';
        errorDiv.style.display = 'block';
        if (window.sileo) window.sileo.error('Please enter a 4-digit PIN', 'Error');
        return;
    }
    if (!/^\d{4}$/.test(pin)) {
        errorDiv.textContent = 'PIN must contain only numbers';
        errorDiv.style.display = 'block';
        if (window.sileo) window.sileo.error('PIN must contain only numbers', 'Error');
        return;
    }

    pinCode = pin;
    pinEnabled = true;
    appIsLocked = false;  // IMPORTANT: Unlock after setting PIN
    failedPinAttempts = 0;
    pinLockoutUntil = null;
    await saveAllPrivacySettings();
    applyLockState();
    closePinModal();
    startAutoLockTimer();

    const pinToggle = document.getElementById('pinLockToggle');
    if (pinToggle) pinToggle.checked = true;

    if (window.sileo) {
        window.sileo.success('PIN created! App unlocked.', 'Success');
    }
}

function verifyPin() {
    const inputs = document.querySelectorAll('.pin-input');
    const enteredPin = Array.from(inputs).map(i => i.value).join('');
    const errorDiv = document.getElementById('pinError');

    if (enteredPin.length !== 4) {
        errorDiv.textContent = 'Please enter your 4-digit PIN';
        errorDiv.style.display = 'block';
        showPinErrorNotification('Please enter your 4-digit PIN');
        return;
    }

    if (enteredPin === pinCode) {
        // SUCCESS - unlock
        failedPinAttempts = 0;
        pinLockoutUntil = null;
        appIsLocked = false;  // This MUST be set to false
        saveAllPrivacySettings();
        applyLockState();     // This should remove blur
        closePinModal();
        startAutoLockTimer();

        // Also clear session flags
        sessionStorage.removeItem('manually_locked');
        sessionStorage.removeItem('pin_locked');

        if (lockoutChecker) {
            clearInterval(lockoutChecker);
            lockoutChecker = null;
        }
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }

        showPinSuccessNotification('App unlocked successfully! Welcome back.');

    } else {
        failedPinAttempts++;
        const remainingAttempts = 5 - failedPinAttempts;

        if (failedPinAttempts >= 5) {
            pinLockoutUntil = Date.now() + (5 * 60 * 1000);
            appIsLocked = true;
            saveAllPrivacySettings();
            applyLockState();

            errorDiv.textContent = 'Too many failed attempts. App locked for 5 minutes.';
            errorDiv.style.display = 'block';
            errorDiv.style.color = '#ef4444';
            inputs.forEach(i => i.value = '');

            showPinErrorNotification('Too many failed attempts! App locked for 5 minutes.');

            setTimeout(() => {
                closePinModal();
                scheduleNextLockoutCheck();
            }, 2000);
        } else {
            errorDiv.textContent = `Invalid PIN. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`;
            errorDiv.style.display = 'block';
            inputs.forEach(i => i.value = '');
            if (inputs[0]) inputs[0].focus();

            showPinErrorNotification(`Invalid PIN. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`);
        }
    }
}

function cancelPinCreation() {
    // Close the PIN creation modal
    closePinModal();

    // Check if we have a PIN set
    if (!pinCode || !pinEnabled) {
        // No PIN set - show the forgot PIN option again
        if (window.sileo) {
            window.sileo.warning('No PIN set. Please set a PIN to unlock the app.', 'PIN Required');
        }

        // Show a recovery modal
        const recoveryModal = document.createElement('div');
        recoveryModal.className = 'modal';
        recoveryModal.id = 'recoveryModal';
        recoveryModal.style.display = 'flex';
        recoveryModal.style.zIndex = '10001';
        recoveryModal.style.backgroundColor = 'rgba(0,0,0,0.7)';
        recoveryModal.innerHTML = `
            <div class="modal-content" style="max-width:350px;text-align:center;">
                <h2><i class="fas fa-exclamation-triangle"></i> PIN Required</h2>
                <p style="margin:20px 0;">You need to set a PIN to unlock the app.</p>
                <button class="btn-primary" id="createPinBtnRecovery" style="width:100%;margin-bottom:10px;">
                    <i class="fas fa-plus"></i> Create PIN
                </button>
                <button class="btn-secondary" id="forgotPinBtnRecovery" style="width:100%;">
                    <i class="fas fa-key"></i> Forgot PIN? Reset
                </button>
            </div>
        `;
        document.body.appendChild(recoveryModal);
        document.body.classList.add('modal-open');

        // Add event listeners directly
        document.getElementById('createPinBtnRecovery').onclick = function () {
            // Close recovery modal
            recoveryModal.remove();
            document.body.classList.remove('modal-open');
            // Show PIN creation modal again
            showPinModal('create');
        };

        document.getElementById('forgotPinBtnRecovery').onclick = function () {
            // Close recovery modal
            recoveryModal.remove();
            document.body.classList.remove('modal-open');
            // Call reset pin
            resetPin();
        };
    } else {
        // PIN exists, just stay locked
        applyLockState();
        if (window.sileo) {
            window.sileo.info('PIN creation cancelled. App remains locked.', 'Locked');
        }
    }
}

function retryPinCreation() {
    // Close recovery modal
    const recoveryModal = document.getElementById('recoveryModal');
    if (recoveryModal) {
        recoveryModal.remove();
        document.body.classList.remove('modal-open');
    }
    // Show PIN creation modal again
    showPinModal('create');
}

window.retryPinCreation = retryPinCreation;
window.cancelPinCreation = cancelPinCreation;

function scheduleNextLockoutCheck() {
    if (lockoutChecker) clearInterval(lockoutChecker);
    lockoutChecker = setInterval(() => {
        if (appIsLocked && pinLockoutUntil && Date.now() >= pinLockoutUntil) {
            console.log('Lockout period ended, showing PIN modal');
            clearInterval(lockoutChecker);
            lockoutChecker = null;
            pinLockoutUntil = null;
            failedPinAttempts = 0;
            saveAllPrivacySettings();
            showPinInfoNotification('Lockout period ended. You can now try again.');
            showPinModal('unlock');
        }
    }, 1000);
}

function togglePinLock() {
    const toggle = document.getElementById('pinLockToggle');
    if (!toggle) return;

    if (toggle.checked) {
        if (pinCode) {
            pinEnabled = true;
            saveAllPrivacySettings();
            startAutoLockTimer();
            showPinSuccessNotification('PIN lock enabled');
        } else {
            showPinInfoNotification('Please set up your PIN first');
            showPinModal('create');
            const checkInterval = setInterval(() => {
                if (!document.getElementById('pinModal')) {
                    clearInterval(checkInterval);
                    if (!pinCode) toggle.checked = false;
                    else {
                        pinEnabled = true;
                        saveAllPrivacySettings();
                        startAutoLockTimer();
                    }
                }
            }, 500);
        }
    } else {
        if (confirm('Disable PIN lock?')) {
            pinEnabled = false;
            appIsLocked = false;
            saveAllPrivacySettings();
            applyLockState();
            if (autoLockTimer) clearTimeout(autoLockTimer);
            if (lockoutChecker) clearInterval(lockoutChecker);
            showPinWarningNotification('PIN lock disabled');
        } else {
            toggle.checked = true;
        }
    }
}

function changePin() {
    if (!pinCode) {
        showPinInfoNotification('No PIN set. Please create a PIN.');
        showPinModal('create');
    } else {
        const currentPin = prompt('Enter your current PIN:');
        if (currentPin === pinCode) {
            showPinInfoNotification('Enter your new PIN');
            showPinModal('create');
        } else if (currentPin !== null) {
            showPinErrorNotification('Invalid PIN');
        }
    }
}

async function resetPin() {
    const user = window.auth.currentUser;
    if (!user) {
        if (window.sileo) window.sileo.error('Please login first', 'Error');
        return;
    }

    // Check if email is already verified
    await user.reload();
    if (user.emailVerified) {
        const confirmReset = confirm('⚠️ Your email is already verified.\n\nReset your PIN now?\n\nThis will clear your current PIN and allow you to set a new one.');

        if (confirmReset) {
            // Reset PIN
            pinCode = null;
            pinEnabled = false;
            appIsLocked = true;
            await saveAllPrivacySettings();
            applyLockState();
            closePinModal();

            // Close any recovery modal
            const recoveryModal = document.getElementById('recoveryModal');
            if (recoveryModal) {
                recoveryModal.remove();
                document.body.classList.remove('modal-open');
            }

            if (window.sileo) {
                window.sileo.success('PIN has been reset. Please set a new PIN.', 'PIN Reset');
            }

            setTimeout(() => {
                showPinModal('create');
            }, 500);
        }
        return;
    }

    // Email not verified - send verification
    const confirmReset = confirm('⚠️ FORGOT PIN?\n\nA verification link will be sent to your email.\n\nYou must click the link in the email to reset your PIN.\n\nContinue?');

    if (!confirmReset) return;

    try {
        // Send verification email
        await user.sendEmailVerification();

        if (window.sileo) {
            window.sileo.info('Verification email sent! Check your inbox.', 'Email Sent');
        }

        // Create wait modal
        const waitModal = document.createElement('div');
        waitModal.className = 'modal';
        waitModal.id = 'waitModal';
        waitModal.style.display = 'flex';
        waitModal.style.zIndex = '10001';
        waitModal.style.backgroundColor = 'rgba(0,0,0,0.7)';
        waitModal.innerHTML = `
            <div class="modal-content" style="max-width:350px;text-align:center;">
                <h2><i class="fas fa-envelope"></i> Verify Email</h2>
                <p style="margin:20px 0;">We sent a verification email to:</p>
                <p style="font-weight:bold;margin-bottom:20px;">${user.email}</p>
                <p style="margin-bottom:20px;">Please check your inbox and click the verification link.</p>
                <div id="verificationStatus" style="margin:10px 0;color:var(--warning);">Waiting for verification...</div>
                <button class="btn-secondary" id="resendEmailBtn" style="width:100%;margin-bottom:10px;">Resend Email</button>
                <button class="btn-primary" id="cancelWaitBtn" style="width:100%;">Cancel</button>
            </div>
        `;
        document.body.appendChild(waitModal);
        document.body.classList.add('modal-open');

        let isVerified = false;
        let checkInterval = null;
        let timeoutId = null;

        // Cleanup function
        const cleanup = () => {
            if (checkInterval) clearInterval(checkInterval);
            if (timeoutId) clearTimeout(timeoutId);
            if (waitModal && waitModal.parentNode) {
                waitModal.remove();
                document.body.classList.remove('modal-open');
            }
        };

        // Resend email button
        document.getElementById('resendEmailBtn').onclick = async () => {
            try {
                await user.sendEmailVerification();
                const statusDiv = document.getElementById('verificationStatus');
                if (statusDiv) {
                    statusDiv.innerHTML = '📧 Verification email resent! Check your inbox.';
                    statusDiv.style.color = '#10b981';
                    setTimeout(() => {
                        if (statusDiv) {
                            statusDiv.innerHTML = 'Waiting for verification...';
                            statusDiv.style.color = 'var(--warning)';
                        }
                    }, 3000);
                }
            } catch (error) {
                console.error('Error resending:', error);
            }
        };

        // Cancel button
        document.getElementById('cancelWaitBtn').onclick = () => {
            cleanup();
            if (window.sileo) {
                window.sileo.info('PIN reset cancelled', 'Cancelled');
            }
            // Re-apply lock state
            applyLockState();
        };

        // Check verification status
        let initialVerified = user.emailVerified;

        checkInterval = setInterval(async () => {
            await user.reload();
            const isNowVerified = user.emailVerified;

            // Only proceed if verification status CHANGED to true
            if (!initialVerified && isNowVerified && !isVerified) {
                isVerified = true;
                cleanup();

                // Confirm with user
                const resetConfirm = confirm('✅ Email verified!\n\nReset your PIN now?');
                if (resetConfirm) {
                    // Reset PIN
                    pinCode = null;
                    pinEnabled = false;
                    appIsLocked = true;
                    await saveAllPrivacySettings();
                    applyLockState();
                    closePinModal();

                    if (window.sileo) {
                        window.sileo.success('PIN has been reset. Please set a new PIN.', 'PIN Reset');
                    }

                    setTimeout(() => {
                        showPinModal('create');
                    }, 500);
                } else {
                    if (window.sileo) {
                        window.sileo.info('PIN reset cancelled', 'Cancelled');
                    }
                    applyLockState();
                }
            } else if (isNowVerified && !initialVerified) {
                // Update initialVerified to prevent re-triggering
                initialVerified = true;
            }
        }, 2000);

        // Timeout after 10 minutes
        timeoutId = setTimeout(() => {
            if (!isVerified) {
                cleanup();
                if (window.sileo) {
                    window.sileo.error('Verification timeout. Please try again.', 'Timeout');
                }
                applyLockState();
            }
        }, 600000); // 10 minutes

    } catch (error) {
        console.error('Error:', error);
        if (window.sileo) {
            window.sileo.error('Failed to send verification email. Please try again.', 'Error');
        }
    }
}

// Check if email is verified (useful for debugging)
async function checkEmailVerification() {
    const user = window.auth.currentUser;
    if (!user) return false;

    await user.reload();
    return user.emailVerified;
}
function initPrivacySettings() {
    console.log('Initializing privacy settings...');
    loadPrivacySettings();
    setupActivityTracking();

    // Only start timer if not locked
    if (!appIsLocked && pinEnabled && pinCode) {
        startAutoLockTimer();
    }
}

// Make functions global
window.togglePinLock = togglePinLock;
window.togglePrivacyMode = togglePrivacyMode;
window.toggleHideAmounts = toggleHideAmounts;
window.changePin = changePin;
window.resetPin = resetPin;
window.closePinModal = closePinModal;
window.createPin = createPin;
window.verifyPin = verifyPin;
window.showPinModal = showPinModal;
window.loadPrivacySettings = loadPrivacySettings;
window.initPrivacySettings = initPrivacySettings;
window.applyPrivacySettings = applyPrivacySettings;
window.changeAutoLockTimeout = changeAutoLockTimeout;
window.loadAutoLockTimeout = loadAutoLockTimeout;
window.checkLockState = function () {
    console.log('appIsLocked:', appIsLocked);
    console.log('pinEnabled:', pinEnabled);
    console.log('blockingOverlay:', !!blockingOverlay);
};

// Make retryPinCreation globally available
window.retryPinCreation = retryPinCreation;
window.cancelPinCreation = cancelPinCreation;

// Make function global
window.resetDeviceSettings = resetDeviceSettings;



// Debug function to check timer status
window.checkTimerStatus = function () {
    console.log('=== TIMER STATUS ===');
    console.log('pinEnabled:', pinEnabled);
    console.log('has pinCode:', !!pinCode);
    console.log('appIsLocked:', appIsLocked);
    console.log('isPinLockedOut:', isPinLockedOut());
    console.log('autoLockTimer exists:', !!autoLockTimer);
    console.log('lastActivity:', new Date(lastActivity).toLocaleTimeString());
    console.log('Time since last activity:', Math.floor((Date.now() - lastActivity) / 1000), 'seconds');
    console.log('Auto-lock timeout:', autoLockTimeoutMinutes, 'minutes');
};

// ===== NOTIFICATION FUNCTIONS FOR PIN LOCK =====

function showPinSuccessNotification(message) {
    if (window.sileo) {
        window.sileo.success(message, '🔒 PIN Lock');
    }
}

function showPinErrorNotification(message) {
    if (window.sileo) {
        window.sileo.error(message, '🔒 PIN Lock');
    }
}

function showPinInfoNotification(message) {
    if (window.sileo) {
        window.sileo.info(message, '🔒 PIN Lock');
    }
}

function showPinWarningNotification(message) {
    if (window.sileo) {
        window.sileo.warning(message, '🔒 PIN Lock');
    }
}

// Save lock state before page unload/refresh
window.addEventListener('beforeunload', function () {
    if (appIsLocked) {
        sessionStorage.setItem('manually_locked', 'true');
        localStorage.setItem('is_locked', 'true');
    } else {
        sessionStorage.removeItem('manually_locked');
        localStorage.removeItem('is_locked');
    }
});

// Ensure clean state on page load
document.addEventListener('DOMContentLoaded', function () {
    if (!pinEnabled || !pinCode) {
        sessionStorage.removeItem('manually_locked');
        localStorage.removeItem('is_locked');
        localStorage.removeItem('app_was_locked');
        appIsLocked = false;
        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.style.filter = 'none';
            mainApp.style.pointerEvents = 'auto';
        }
        hideBlockingOverlay();
    }
});

// Reset all device-wide privacy settings
function resetDeviceSettings() {
    if (confirm('⚠️ WARNING: This will reset ALL privacy settings on this device.\n\nThis includes:\n- PIN lock\n- Privacy mode\n- Hide amounts\n- Auto-lock timeout\n\nThis does NOT affect your financial data.\n\nContinue?')) {
        // Complete unlock - clear ALL lock-related storage
        localStorage.removeItem('app_pin');
        localStorage.removeItem('pin_enabled');
        localStorage.removeItem('app_is_locked');
        localStorage.removeItem('is_locked');
        localStorage.removeItem('pin_lockout_until');
        sessionStorage.removeItem('manually_locked');
        sessionStorage.removeItem('pin_locked');
        sessionStorage.removeItem('pin_locked_this_session');

        // Also remove any user-specific locks
        const userId = localStorage.getItem('userId'); // if exists
        if (userId) {
            localStorage.removeItem(`privacy_pin_enabled_${userId}`);
            localStorage.removeItem(`privacy_pin_${userId}`);
        }

        console.log('All locks cleared! Refreshing...');
        location.reload();

        pinCode = null;
        pinEnabled = false;
        privacyModeEnabled = false;
        hideAmountsEnabled = false;
        autoLockTimeoutMinutes = 10;
        appIsLocked = false;
        failedPinAttempts = 0;

        const pinToggle = document.getElementById('pinLockToggle');
        if (pinToggle) pinToggle.checked = false;
        const privacyModeCheckbox = document.getElementById('privacyMode');
        if (privacyModeCheckbox) privacyModeCheckbox.checked = false;
        const hideAmountsCheckbox = document.getElementById('hideAmounts');
        if (hideAmountsCheckbox) hideAmountsCheckbox.checked = false;
        const timeoutSelect = document.getElementById('autoLockTimeout');
        if (timeoutSelect) timeoutSelect.value = '10';

        const mainApp = document.getElementById('mainApp');
        if (mainApp) mainApp.style.filter = 'none';
        closePinModal();
        applyPrivacySettings();

        if (window.sileo) {
            window.sileo.success('All device settings have been reset!', 'Reset Complete');
        }
    }
}

// Auto-lock function
function autoLock() {
    const inactiveTime = Date.now() - lastActivity;
    const timeoutMs = autoLockTimeoutMinutes * 60 * 1000;

    console.log('Auto-lock check - Inactive time:', Math.floor(inactiveTime / 1000), 'seconds');
    console.log('Auto-lock check - Timeout:', autoLockTimeoutMinutes, 'minutes');
    console.log('Auto-lock check - appIsLocked:', appIsLocked);
    console.log('Auto-lock check - pinEnabled:', pinEnabled);
    console.log('Auto-lock check - hasPinCode:', !!pinCode);

    if (isPinLockedOut()) {
        console.log('Auto-lock skipped - app is in lockout period');
        return;
    }

    // Use appIsLocked consistently
    if (pinEnabled && pinCode && !appIsLocked && inactiveTime >= timeoutMs) {
        console.log(`🔒 Auto-locking due to ${autoLockTimeoutMinutes} minutes inactivity`);
        appIsLocked = true;
        saveAllPrivacySettings();
        applyLockState();
        if (window.sileo) {
            window.sileo.info(`App locked due to ${autoLockTimeoutMinutes} minutes of inactivity`, 'Auto-Lock');
        }
        showPinModal('unlock');
    } else {
        console.log('Auto-lock conditions not met');
    }
}

// Make function global
window.resetDeviceSettings = resetDeviceSettings;
window.changeAutoLockTimeout = changeAutoLockTimeout;
window.loadAutoLockTimeout = loadAutoLockTimeout;

// Save lock state before page unload/refresh
window.addEventListener('beforeunload', function () {
    if (isLocked) {
        sessionStorage.setItem('manually_locked', 'true');
        localStorage.setItem('is_locked', 'true');
    } else {
        // If not locked, ensure flags are cleared
        sessionStorage.removeItem('manually_locked');
        localStorage.removeItem('is_locked');
    }
});

// Ensure clean state on page load
document.addEventListener('DOMContentLoaded', function () {
    // Clear any stale lock flags if PIN is not enabled
    if (!pinEnabled || !pinCode) {
        sessionStorage.removeItem('manually_locked');
        localStorage.removeItem('is_locked');
        localStorage.removeItem('app_was_locked');
        isLocked = false;

        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.style.filter = 'none';
            mainApp.style.pointerEvents = 'auto';
        }
        hideBlockingOverlay();
    }
});

// Prevent scroll jumping on navigation clicks
function preventScrollJump(event) {
    // Don't prevent if it's a link with hash
    if (event.target.closest('a') && event.target.closest('a').hash) {
        return;
    }

    // Don't prevent if it's a form submit
    if (event.target.closest('form')) {
        return;
    }

    // For buttons and nav items, prevent default behavior that causes jump
    const target = event.target.closest('button, .nav-item, .action-btn, .quick-action-btn');
    if (target) {
        // Prevent any scroll that might happen
        const currentScroll = window.scrollY;

        // Use requestAnimationFrame to ensure scroll position is maintained
        requestAnimationFrame(() => {
            window.scrollTo(0, currentScroll);
        });
    }
}

// Add event listener for all clicks
document.addEventListener('click', preventScrollJump);

// Fix for modal opening/closing
const originalShowAddTransactionModal = window.showAddTransactionModal;
if (originalShowAddTransactionModal) {
    window.showAddTransactionModal = function () {
        const currentScroll = window.scrollY;
        originalShowAddTransactionModal();
        setTimeout(() => {
            window.scrollTo(0, currentScroll);
        }, 10);
    };
}

const originalCloseAddTransactionModal = window.closeAddTransactionModal;
if (originalCloseAddTransactionModal) {
    window.closeAddTransactionModal = function () {
        const currentScroll = window.scrollY;
        originalCloseAddTransactionModal();
        setTimeout(() => {
            window.scrollTo(0, currentScroll);
        }, 10);
    };
}

// Fix date input alignment across all browsers
function fixDateInputs() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        // Ensure the input has the date-wrapper parent
        if (!input.closest('.date-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'date-wrapper';
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);
        }

        // Set placeholder text for browsers that show empty
        if (!input.value) {
            const today = new Date().toISOString().split('T')[0];
            input.value = today;
        }
    });
}

const originalShowBillModal = window.showBillModal;
window.showBillModal = function () {
    originalShowBillModal();
    setTimeout(() => {
        fixDateInputs();
    }, 10);
};

const originalOpenEditModal = window.openEditModal;
window.openEditModal = function (index) {
    originalOpenEditModal(index);
    setTimeout(() => {
        fixDateInputs();
    }, 10);
};

const originalOpenEditBillModal = window.openEditBillModal;
window.openEditBillModal = function (index) {
    originalOpenEditBillModal(index);
    setTimeout(() => {
        fixDateInputs();
    }, 10);
};


// ===== CONFIRMATION DIALOGS FOR BILLS =====

// Mark bill as paid with confirmation
window.markBillAsPaid = async function (index) {
    if (!window.bills[index]) return;

    const bill = window.bills[index];

    const result = await Swal.fire({
        title: 'Mark as Paid?',
        html: `
            <div style="text-align: left;">
                <p><strong>Bill:</strong> ${escapeHtml(bill.name)}</p>
                <p><strong>Amount:</strong> ${formatCurrency(bill.amount)}</p>
                <p><strong>Due Date:</strong> ${formatDate(bill.dueDate)}</p>
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: '<i class="fas fa-check-circle"></i> Yes, Mark as Paid',
        cancelButtonText: '<i class="fas fa-times"></i> Cancel',
        reverseButtons: true
    });

    if (result.isConfirmed) {
        // Ask for payment date
        const { value: paymentDate } = await Swal.fire({
            title: 'Payment Date',
            html: `
                <p>When was this bill paid?</p>
                <input type="date" id="paymentDate" class="swal2-input" value="${new Date().toISOString().split('T')[0]}">
            `,
            confirmButtonText: 'Confirm Payment',
            showCancelButton: true,
            preConfirm: () => {
                const date = document.getElementById('paymentDate').value;
                if (!date) {
                    Swal.showValidationMessage('Please select a payment date');
                    return false;
                }
                return date;
            }
        });

        if (paymentDate) {
            window.bills[index].isPaid = true;
            window.bills[index].paidDate = paymentDate;
            saveToFirebase();

            Swal.fire({
                title: '✅ Paid!',
                text: `"${bill.name}" marked as paid on ${formatDate(paymentDate)}`,
                icon: 'success',
                confirmButtonColor: '#10b981',
                timer: 2000,
                showConfirmButton: true
            });
        }
    }
};

// Mark bill as unpaid with confirmation
window.markBillAsUnpaid = async function (index) {
    if (!window.bills[index]) return;

    const bill = window.bills[index];

    const result = await Swal.fire({
        title: 'Mark as Unpaid?',
        html: `
            <div style="text-align: left;">
                <p><strong>Bill:</strong> ${escapeHtml(bill.name)}</p>
                <p><strong>Amount:</strong> ${formatCurrency(bill.amount)}</p>
                <p><strong>Previously paid on:</strong> ${bill.paidDate ? formatDate(bill.paidDate) : 'Unknown'}</p>
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f59e0b',
        cancelButtonColor: '#6b7280',
        confirmButtonText: '<i class="fas fa-undo-alt"></i> Yes, Mark as Unpaid',
        cancelButtonText: '<i class="fas fa-times"></i> Cancel'
    });

    if (result.isConfirmed) {
        window.bills[index].isPaid = false;
        window.bills[index].paidDate = null;
        saveToFirebase();

        Swal.fire({
            title: '⏳ Marked as Unpaid',
            text: `"${bill.name}" is now marked as unpaid`,
            icon: 'info',
            confirmButtonColor: '#f59e0b',
            timer: 2000,
            showConfirmButton: true
        });
    }
};

// Delete bill with confirmation
window.deleteBill = async function () {
    const index = parseInt(document.getElementById('editBillId').value);
    const bill = window.bills[index];

    const result = await Swal.fire({
        title: 'Delete Bill?',
        html: `
            <div style="text-align: left;">
                <p><strong>Bill:</strong> ${escapeHtml(bill.name)}</p>
                <p><strong>Amount:</strong> ${formatCurrency(bill.amount)}</p>
                <p><strong>Due Date:</strong> ${formatDate(bill.dueDate)}</p>
            </div>
        `,
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: '<i class="fas fa-trash"></i> Yes, Delete',
        cancelButtonText: '<i class="fas fa-times"></i> Cancel'
    });

    if (result.isConfirmed) {
        window.bills.splice(index, 1);
        saveToFirebase();
        closeEditBillModal();

        Swal.fire({
            title: '🗑️ Deleted!',
            text: `"${bill.name}" has been removed`,
            icon: 'success',
            confirmButtonColor: '#10b981',
            timer: 2000,
            showConfirmButton: true
        });
    }
};

// Update bill with confirmation
window.updateBill = async function () {
    const index = parseInt(document.getElementById('editBillId').value);
    const oldBill = window.bills[index];

    const updatedBill = {
        name: document.getElementById('editBillName').value.trim(),
        amount: parseFloat(document.getElementById('editBillAmount').value),
        dueDate: document.getElementById('editBillDueDate').value,
        autoPaid: document.getElementById('editBillAutoPaid').checked,
        isPaid: document.getElementById('editBillPaid')?.checked || false,
        paidDate: document.getElementById('editBillPaid')?.checked ? new Date().toISOString() : null
    };

    if (!updatedBill.name || isNaN(updatedBill.amount) || updatedBill.amount <= 0 || !updatedBill.dueDate) {
        Swal.fire({
            title: 'Validation Error',
            text: 'Please fill all fields correctly',
            icon: 'error',
            confirmButtonColor: '#ef4444'
        });
        return;
    }

    // Show changes summary
    let changes = '';
    if (oldBill.name !== updatedBill.name) changes += `<li>Name: "${oldBill.name}" → "${updatedBill.name}"</li>`;
    if (oldBill.amount !== updatedBill.amount) changes += `<li>Amount: ${formatCurrency(oldBill.amount)} → ${formatCurrency(updatedBill.amount)}</li>`;
    if (oldBill.dueDate !== updatedBill.dueDate) changes += `<li>Due Date: ${formatDate(oldBill.dueDate)} → ${formatDate(updatedBill.dueDate)}</li>`;
    if (oldBill.isPaid !== updatedBill.isPaid) changes += `<li>Status: ${oldBill.isPaid ? 'Paid' : 'Unpaid'} → ${updatedBill.isPaid ? 'Paid' : 'Unpaid'}</li>`;

    const result = await Swal.fire({
        title: 'Update Bill?',
        html: `
            <div style="text-align: left;">
                <p>Are you sure you want to update this bill?</p>
                ${changes ? `<ul style="margin-top: 10px;">${changes}</ul>` : '<p style="color: gray;">No changes detected</p>'}
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#6366f1',
        cancelButtonColor: '#6b7280',
        confirmButtonText: '<i class="fas fa-save"></i> Yes, Update',
        cancelButtonText: '<i class="fas fa-times"></i> Cancel'
    });

    if (result.isConfirmed) {
        window.bills[index] = updatedBill;
        saveToFirebase();
        closeEditBillModal();

        Swal.fire({
            title: '✅ Updated!',
            text: `"${updatedBill.name}" has been updated`,
            icon: 'success',
            confirmButtonColor: '#10b981',
            timer: 2000,
            showConfirmButton: true
        });
    }
};

// ===== CALENDAR FUNCTIONS =====

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();

function calFormatDate(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function calGetTransactions(date) {
    let list = [];
    if (window.transactions) {
        window.transactions.forEach(t => {
            if (t.date === date) list.push({ type: t.type, name: t.category, amount: t.amount, note: t.note });
        });
    }
    if (window.bills) {
        window.bills.forEach(b => {
            if (b.dueDate === date && !b.isPaid) list.push({ type: 'bill', name: b.name, amount: b.amount });
        });
    }
    return list;
}

function calRender() {
    let firstDay = new Date(calYear, calMonth, 1).getDay();
    let daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    let prevDays = new Date(calYear, calMonth, 0).getDate();
    let today = calFormatDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    let monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    document.getElementById('calMonthYear').innerHTML = `${monthNames[calMonth]} ${calYear}`;

    let html = `<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 8px;">
        <div style="text-align: center; font-size: 11px; font-weight: 600; color: var(--gray-500);">S</div>
        <div style="text-align: center; font-size: 11px; font-weight: 600; color: var(--gray-500);">M</div>
        <div style="text-align: center; font-size: 11px; font-weight: 600; color: var(--gray-500);">T</div>
        <div style="text-align: center; font-size: 11px; font-weight: 600; color: var(--gray-500);">W</div>
        <div style="text-align: center; font-size: 11px; font-weight: 600; color: var(--gray-500);">T</div>
        <div style="text-align: center; font-size: 11px; font-weight: 600; color: var(--gray-500);">F</div>
        <div style="text-align: center; font-size: 11px; font-weight: 600; color: var(--gray-500);">S</div>
    </div><div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;">`;

    for (let i = 0; i < firstDay; i++) {
        let day = prevDays - firstDay + i + 1;
        html += `<div class="simple-cal-day other-month"><div class="simple-cal-day-num">${day}</div></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        let dateStr = calFormatDate(calYear, calMonth, d);
        let events = calGetTransactions(dateStr);
        let isToday = dateStr === today;
        let income = events.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
        let expense = events.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
        let net = income - expense;

        html += `<div class="simple-cal-day ${isToday ? 'today' : ''}" onclick="calShowDay('${dateStr}')">
            <div class="simple-cal-day-num">${d}</div>
            <div class="simple-cal-day-events">`;

        events.slice(0, 2).forEach(e => {
            let icon = e.type === 'income' ? '💰' : (e.type === 'expense' ? '💸' : '📌');
            html += `<div class="simple-cal-event ${e.type === 'bill' ? 'bill' : e.type}">${icon} ${Math.round(e.amount)}</div>`;
        });

        if (events.length > 2) {
            html += `<div class="simple-cal-event">+${events.length - 2}</div>`;
        }

        html += `</div>`;
        if (net !== 0) {
            html += `<div style="position: absolute; bottom: 4px; right: 4px; font-size: 9px; font-weight: 700; color: ${net > 0 ? '#10b981' : '#ef4444'}">${net > 0 ? '+' : ''}${Math.round(Math.abs(net))}</div>`;
        }
        html += `</div>`;
    }

    let totalCells = 42;
    let used = firstDay + daysInMonth;
    for (let i = 1; i <= totalCells - used; i++) {
        html += `<div class="simple-cal-day other-month"><div class="simple-cal-day-num">${i}</div></div>`;
    }

    html += `</div>`;
    document.getElementById('calendarGridSimple').innerHTML = html;
}

function calShowDay(dateStr) {
    let events = calGetTransactions(dateStr);
    let date = new Date(dateStr);
    let formatted = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    let totalIncome = events.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    let totalExpense = events.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    let totalBill = events.filter(e => e.type === 'bill').reduce((s, e) => s + e.amount, 0);
    let net = totalIncome - totalExpense;

    let bodyHtml = `
        <div style="text-align: center; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-around;">
                <div><span style="color: #10b981;">💰 Income</span><br><strong>${formatCurrency(totalIncome)}</strong></div>
                <div><span style="color: #ef4444;">💸 Expenses</span><br><strong>${formatCurrency(totalExpense)}</strong></div>
                <div><span style="color: #f59e0b;">📌 Bills</span><br><strong>${formatCurrency(totalBill)}</strong></div>
            </div>
            <div style="margin-top: 10px; padding: 8px; background: ${net >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; border-radius: 10px;">
                Net: <strong style="color: ${net >= 0 ? '#10b981' : '#ef4444'}">${net >= 0 ? '+' : ''}${formatCurrency(net)}</strong>
            </div>
        </div>
        <div style="max-height: 300px; overflow-y: auto;">
    `;

    if (events.length === 0) {
        bodyHtml += '<div style="text-align: center; padding: 20px; color: gray;">No transactions</div>';
    } else {
        events.forEach(e => {
            let color = e.type === 'income' ? '#10b981' : (e.type === 'expense' ? '#ef4444' : '#f59e0b');
            let sign = e.type === 'income' ? '+' : (e.type === 'expense' ? '-' : '');
            bodyHtml += `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <div><strong>${e.name}</strong>${e.note ? `<br><small>${e.note}</small>` : ''}</div>
                    <div style="color: ${color}">${sign}${formatCurrency(e.amount)}</div>
                </div>
            `;
        });
    }

    bodyHtml += `</div>
        <button class="btn-primary" onclick="calAddTransactionFromModal('${dateStr}')" style="width: 100%; margin-top: 15px; padding: 10px;">
            + Add Transaction
        </button>
    `;

    document.getElementById('simpleModalDate').innerHTML = formatted;
    document.getElementById('simpleModalBody').innerHTML = bodyHtml;
    document.getElementById('simpleDayModal').style.display = 'flex';
    document.body.classList.add('modal-open');
}

function closeSimpleModal() {
    document.getElementById('simpleDayModal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

function calAddTransactionFromModal(dateStr) {
    closeSimpleModal();
    showAddTransactionModal();
    setTimeout(() => {
        let inp = document.getElementById('modalDate');
        if (inp) inp.value = dateStr;
    }, 100);
}

function calPrev() { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } calRender(); }
function calNext() { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } calRender(); }
function calToday() { calYear = new Date().getFullYear(); calMonth = new Date().getMonth(); calRender(); }

// Initialize calendar
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('calendarGridSimple')) {
        calRender();
        const prevBtn = document.getElementById('calPrevBtn');
        const nextBtn = document.getElementById('calNextBtn');
        const todayBtn = document.getElementById('calTodayBtn');
        if (prevBtn) prevBtn.onclick = calPrev;
        if (nextBtn) nextBtn.onclick = calNext;
        if (todayBtn) todayBtn.onclick = calToday;
    }
});

// Make functions global
window.calShowDay = calShowDay;
window.closeSimpleModal = closeSimpleModal;
window.calAddTransactionFromModal = calAddTransactionFromModal;


// ===== DAILY SPENDING TIPS =====

// Collection of financial tips
const financialTips = [
    {
        tip: "Track every expense, no matter how small. Small purchases add up quickly!",
        category: "tracking"
    },
    {
        tip: "Follow the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
        category: "budgeting"
    },
    {
        tip: "Save ₱50 a day and you'll have ₱18,250 in a year!",
        category: "savings"
    },
    {
        tip: "Review your subscriptions monthly. Cancel unused ones.",
        category: "bills"
    },
    {
        tip: "Cook at home more often. It's healthier and saves money.",
        category: "food"
    },
    {
        tip: "Set automatic transfers to your savings account on payday.",
        category: "savings"
    },
    {
        tip: "Use cash for small purchases to avoid overspending.",
        category: "spending"
    },
    {
        tip: "Compare prices before buying big items. Wait 24 hours for impulse buys.",
        category: "shopping"
    },
    {
        tip: "Pay your credit card balance in full to avoid interest charges.",
        category: "debt"
    },
    {
        tip: "Create an emergency fund of 3-6 months of expenses.",
        category: "savings"
    },
    {
        tip: "Use public transportation when possible to save on gas and parking.",
        category: "transport"
    },
    {
        tip: "Bring your own coffee. ₱100/day saves ₱3,000/month!",
        category: "food"
    },
    {
        tip: "Shop with a list and stick to it. Avoid impulse purchases.",
        category: "shopping"
    },
    {
        tip: "Negotiate bills like internet and insurance annually.",
        category: "bills"
    },
    {
        tip: "Use energy-efficient appliances to lower electricity bills.",
        category: "utilities"
    },
    {
        tip: "Buy quality items that last longer instead of cheap replacements.",
        category: "shopping"
    },
    {
        tip: "Review your bank statements for errors or unauthorized charges.",
        category: "tracking"
    },
    {
        tip: "Set financial goals. Write them down and review monthly.",
        category: "goals"
    },
    {
        tip: "Use the envelope system for variable expenses like groceries.",
        category: "budgeting"
    },
    {
        tip: "Take advantage of sales and discounts, but only for needed items.",
        category: "shopping"
    },
    {
        tip: "Cancel gym memberships if you don't go. Exercise at home for free.",
        category: "bills"
    },
    {
        tip: "Borrow books from the library instead of buying them.",
        category: "entertainment"
    },
    {
        tip: "Use a water filter instead of buying bottled water.",
        category: "savings"
    },
    {
        tip: "Plan your meals for the week to reduce food waste.",
        category: "food"
    },
    {
        tip: "Buy generic brands. They often have the same quality as name brands.",
        category: "shopping"
    },
    {
        tip: "Use cashback apps and rewards programs for everyday purchases.",
        category: "savings"
    },
    {
        tip: "Do your own home repairs using YouTube tutorials.",
        category: "home"
    },
    {
        tip: "Sell items you no longer use. One person's trash is another's treasure.",
        category: "income"
    },
    {
        tip: "Use a programmable thermostat to save on heating and cooling.",
        category: "utilities"
    },
    {
        tip: "Pack lunch for work instead of eating out every day.",
        category: "food"
    },
    {
        tip: "Review your insurance policies annually to ensure you're not overpaying.",
        category: "bills"
    },
    {
        tip: "Use public parks for free entertainment instead of paid attractions.",
        category: "entertainment"
    },
    {
        tip: "Wait for sales before buying seasonal items like clothes and decorations.",
        category: "shopping"
    },
    {
        tip: "Use a reusable water bottle and coffee mug to save money.",
        category: "savings"
    },
    {
        tip: "Learn basic sewing to repair clothes instead of replacing them.",
        category: "savings"
    },
    {
        tip: "Carpool with coworkers to save on gas and parking.",
        category: "transport"
    },
    {
        tip: "Use price match guarantees at stores to get the best deal.",
        category: "shopping"
    },
    {
        tip: "Cancel unused streaming services. Rotate subscriptions monthly.",
        category: "bills"
    },
    {
        tip: "Use a budgeting app like this one to track every peso!",
        category: "tracking"
    },
    {
        tip: "Celebrate small financial wins. Every peso saved is progress!",
        category: "motivation"
    }
];

// Get today's tip (based on date for consistency)
function getDailyTip() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const tipIndex = dayOfYear % financialTips.length;
    return financialTips[tipIndex];
}

// Get random tip
function getRandomTip() {
    const randomIndex = Math.floor(Math.random() * financialTips.length);
    return financialTips[randomIndex];
}

// Update tip display
function updateDailyTip() {
    const tip = getDailyTip();
    const tipElement = document.getElementById('dailyTipText');
    if (tipElement) {
        tipElement.innerHTML = tip.tip;
    }
}

// Refresh tip (get new random tip)
function refreshDailyTip() {
    const tip = getRandomTip();
    const tipElement = document.getElementById('dailyTipText');
    if (tipElement) {
        // Add fade animation
        tipElement.style.opacity = '0';
        setTimeout(() => {
            tipElement.innerHTML = tip.tip;
            tipElement.style.opacity = '1';

            // Show success notification
            if (window.sileo) {
                window.sileo.success('New tip loaded! 💡', 'Daily Tip');
            }
        }, 150);
    }
}

// Share tip function
function shareTip() {
    const tipText = document.getElementById('dailyTipText')?.innerText || '';
    if (navigator.share) {
        navigator.share({
            title: 'Financial Tip from Kaleb Ez Tracker',
            text: tipText,
            url: window.location.href
        }).catch(() => {
            copyTipToClipboard(tipText);
        });
    } else {
        copyTipToClipboard(tipText);
    }
}

// Copy tip to clipboard
function copyTipToClipboard(tipText) {
    navigator.clipboard.writeText(tipText).then(() => {
        if (window.sileo) {
            window.sileo.success('Tip copied to clipboard! 📋', 'Shared');
        } else {
            alert('Tip copied: ' + tipText);
        }
    }).catch(() => {
        if (window.sileo) {
            window.sileo.error('Could not copy tip', 'Error');
        }
    });
}

// Get personalized tip based on user spending
function getPersonalizedTip() {
    if (!window.transactions || window.transactions.length === 0) {
        return getRandomTip();
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTransactions = window.transactions.filter(t => t.date?.startsWith(currentMonth));

    const foodExpenses = monthTransactions.filter(t =>
        t.type === 'expense' && t.category?.toLowerCase().includes('food')
    ).reduce((sum, t) => sum + t.amount, 0);

    const transportExpenses = monthTransactions.filter(t =>
        t.type === 'expense' && t.category?.toLowerCase().includes('transport')
    ).reduce((sum, t) => sum + t.amount, 0);

    const entertainmentExpenses = monthTransactions.filter(t =>
        t.type === 'expense' && (t.category?.toLowerCase().includes('entertainment') || t.category?.toLowerCase().includes('games'))
    ).reduce((sum, t) => sum + t.amount, 0);

    if (foodExpenses > 5000) {
        return { tip: "You're spending a lot on food this month. Try cooking at home more often!", category: "personalized" };
    }
    if (transportExpenses > 3000) {
        return { tip: "Consider carpooling or using public transport to reduce transportation costs.", category: "personalized" };
    }
    if (entertainmentExpenses > 2000) {
        return { tip: "Look for free entertainment options like parks, libraries, and community events.", category: "personalized" };
    }

    return getRandomTip();
}

// Initialize daily tip
function initDailyTip() {
    updateDailyTip();

    // Optional: Change tip every 24 hours (when page refreshes)
    // Store last tip date to show new tip on next day
    const lastTipDate = localStorage.getItem('lastTipDate');
    const today = new Date().toDateString();

    if (lastTipDate !== today) {
        localStorage.setItem('lastTipDate', today);
        // Tip already updated by getDailyTip which uses date
    }
}

// Call on dashboard view
function refreshDashboardTips() {
    if (document.getElementById('dashboardView')?.classList.contains('active')) {
        updateDailyTip();
    }
}

// Make functions global
window.refreshDailyTip = refreshDailyTip;
window.shareTip = shareTip;
window.initDailyTip = initDailyTip;

// Initialize when dashboard becomes active
const originalSwitchViewForTips = window.switchView;
if (originalSwitchViewForTips) {
    window.switchView = function (viewName) {
        originalSwitchViewForTips(viewName);
        if (viewName === 'dashboard') {
            setTimeout(updateDailyTip, 100);
        }
    };
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(initDailyTip, 500);
});

// Enable offline data persistence
if (window.db && firebase.firestore) {
    window.db.enablePersistence()
        .then(() => {
            console.log('Firestore persistence enabled - offline data available');
        })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.log('Persistence failed: Multiple tabs open');
            } else if (err.code === 'unimplemented') {
                console.log('Persistence not supported by browser');
            }
        });
}