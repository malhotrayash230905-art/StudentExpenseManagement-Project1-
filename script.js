
let budgets = [];
let expenses = [];
let alerts = [];
let upcomingAlerts = [];
let monthlyBudgets = [];
let currentUser = null;
let userProfile = null;

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedBudgetForRemoval = null;
let selectedExpensesToRemove = [];
let categoryToDelete = null;

// Chart instances
let pieChart = null;
let barChart = null;
let wormChart = null;

// Selected months for bar chart
let selectedBarMonths = [];

// DOM Elements
const sidebarOptions = document.querySelectorAll('.sidebar-option');
const contentSections = document.querySelectorAll('.content-section');
const budgetsGridContainer = document.getElementById('budgets-grid-container');
const createBudgetExpenseBtn = document.getElementById('create-budget-expense-btn');
const budgetCategoryInput = document.getElementById('budget-category');
const budgetAmountInput = document.getElementById('budget-amount');
const expenseAmountInput = document.getElementById('expense-amount');
const alertThresholdSlider = document.getElementById('alert-threshold');
const thresholdValue = document.getElementById('threshold-value');
const expenseDateInput = document.getElementById('expense-date');
const expenseTimeInput = document.getElementById('expense-time');
const expenseDescriptionInput = document.getElementById('expense-description');
const expenseTableBody = document.getElementById('expense-table-body');
const alertsContainerFull = document.getElementById('alerts-container-full');
const alertCountFull = document.getElementById('alert-count-full');
const calendarElement = document.getElementById('calendar');
const currentMonthElement = document.getElementById('current-month');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const monthlyTotalElement = document.getElementById('monthly-total');
const recentExpensesContainer = document.getElementById('recent-expenses');
const dashboardAlertsContainer = document.getElementById('dashboard-alerts');
const welcomeUserDiv = document.getElementById('welcome-user');
const usernameDisplay = document.getElementById('username-display');

// Analytics Elements
const pieMonthSelect = document.getElementById('pie-month-select');
const wormMonthSelect = document.getElementById('worm-month-select');
const barMonthButtons = document.getElementById('bar-month-buttons');
const pieNoData = document.getElementById('pie-no-data');
const barNoData = document.getElementById('bar-no-data');
const wormNoData = document.getElementById('worm-no-data');
const wormSummary = document.getElementById('worm-summary');

// Modal Elements
const loginModal = document.getElementById('login-modal');
const budgetRemovalModal = document.getElementById('budget-removal-modal');
const deleteCategoryModal = document.getElementById('delete-category-modal');
const loginBtn = document.getElementById('login-btn');
const loginText = document.getElementById('login-text');
const closeLoginModal = document.getElementById('close-login-modal');
const closeBudgetRemovalModal = document.getElementById('close-budget-removal-modal');
const closeDeleteCategoryModal = document.getElementById('close-delete-category-modal');
const cancelBudgetRemovalBtn = document.getElementById('cancel-budget-removal');
const confirmBudgetRemovalBtn = document.getElementById('confirm-budget-removal');
const cancelCategoryDeleteBtn = document.getElementById('cancel-category-delete');
const confirmCategoryDeleteBtn = document.getElementById('confirm-category-delete');
const budgetExpensesList = document.getElementById('budget-expenses-list');
const budgetRemovalMessage = document.getElementById('budget-removal-message');
const deleteCategoryMessage = document.getElementById('delete-category-message');
const googleLoginBtn = document.getElementById('google-login');
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const rememberMeCheckbox = document.getElementById('remember-me');
const logoutBtn = document.getElementById('logout-btn');

// ==================== SUPABASE FUNCTIONS ====================

// Check if user is logged in on page load
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        await loadUserData();
        updateLoginUI();
    }
    updateBudgetsGrid();
    updateExpenseTable();
    updateAllAlerts();
    updateDashboard();
    generateCalendar();
    initializeAnalytics();
}

// Load user data from Supabase
async function loadUserData() {
    if (!currentUser) return;

    try {
        // Load budgets
        const { data: budgetsData } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', currentUser.id);
        if (budgetsData) budgets = budgetsData;

        // Load expenses
        const { data: expensesData } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', currentUser.id);
        if (expensesData) expenses = expensesData;

        // Load alerts
        const { data: alertsData } = await supabase
            .from('alerts')
            .select('*')
            .eq('user_id', currentUser.id);
        if (alertsData) alerts = alertsData;

        // Load monthly budgets
        const { data: monthlyBudgetsData } = await supabase
            .from('monthly_budgets')
            .select('*')
            .eq('user_id', currentUser.id);
        if (monthlyBudgetsData) monthlyBudgets = monthlyBudgetsData;

        // Load upcoming alerts from localStorage (temporary)
        upcomingAlerts = JSON.parse(localStorage.getItem('collegeCentsUpcomingAlerts')) || [];

        // Load User Profile
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', currentUser.id);
        if (profileData && profileData.length > 0) {
            userProfile = profileData[0];
        } else {
            userProfile = null;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Save budget to Supabase
async function saveBudgetToSupabase(budget) {
    if (!currentUser) return null;

    const { data, error } = await supabase
        .from('budgets')
        .insert([{ ...budget, user_id: currentUser.id }])
        .select();

    if (error) {
        console.error('Error saving budget:', error);
        showNotification('Database error: ' + error.message, 'error');
        return null;
    }
    return data[0];
}

// Update budget in Supabase
async function updateBudgetInSupabase(budget) {
    if (!currentUser) return;

    const { error } = await supabase
        .from('budgets')
        .update({ amount: budget.amount, spent: budget.spent, threshold: budget.threshold })
        .eq('id', budget.id)
        .eq('user_id', currentUser.id);

    if (error) console.error('Error updating budget:', error);
}

// Delete budget from Supabase
async function deleteBudgetFromSupabase(budgetId) {
    if (!currentUser) return;

    const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId)
        .eq('user_id', currentUser.id);

    if (error) console.error('Error deleting budget:', error);
}

// Save expense to Supabase
async function saveExpenseToSupabase(expense) {
    if (!currentUser) return null;

    const { data, error } = await supabase
        .from('expenses')
        .insert([{ ...expense, user_id: currentUser.id }])
        .select();

    if (error) {
        console.error('Error saving expense:', error);
        return null;
    }
    return data[0];
}

// Delete expense from Supabase
async function deleteExpenseFromSupabase(expenseId) {
    if (!currentUser) return;

    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', currentUser.id);

    if (error) console.error('Error deleting expense:', error);
}

// Save alert to Supabase
async function saveAlertToSupabase(alert) {
    if (!currentUser) return null;

    const { data, error } = await supabase
        .from('alerts')
        .insert([{ ...alert, user_id: currentUser.id }])
        .select();

    if (error) {
        console.error('Error saving alert:', error);
        return null;
    }
    return data[0];
}

// Delete alert from Supabase
async function deleteAlertFromSupabase(alertId) {
    if (!currentUser) return;

    const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId)
        .eq('user_id', currentUser.id);

    if (error) console.error('Error deleting alert:', error);
}

// Save monthly budget to Supabase
async function saveMonthlyBudgetToSupabase(monthlyBudget) {
    if (!currentUser) return null;

    const { data, error } = await supabase
        .from('monthly_budgets')
        .upsert([{ ...monthlyBudget, user_id: currentUser.id }], { onConflict: 'user_id, year, month' })
        .select();

    if (error) {
        console.error('Error saving monthly budget:', error);
        showNotification('Database error: ' + error.message, 'error');
        return null;
    }
    return data[0];
}

// Delete monthly budget from Supabase
async function deleteMonthlyBudgetFromSupabase(monthlyBudgetId) {
    if (!currentUser) return;

    const { error } = await supabase
        .from('monthly_budgets')
        .delete()
        .eq('id', monthlyBudgetId)
        .eq('user_id', currentUser.id);

    if (error) console.error('Error deleting monthly budget:', error);
}

// ==================== AUTHENTICATION FUNCTIONS ====================

// Submit Auth (Strict Login Flow)
async function submitAuth(email, password, username) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        if (error.message.includes('Invalid login credentials')) {
            showNotification('Invalid email or password', 'error');
        } else {
            showNotification(error.message, 'error');
        }
        return false;
    }

    currentUser = data.user;
    if (username && currentUser.user_metadata?.username !== username) {
        await supabase.auth.updateUser({ data: { username: username } });
        currentUser.user_metadata = { ...currentUser.user_metadata, username: username };
    }
    showNotification(`Welcome back, ${currentUser.user_metadata?.username || 'User'}!`, 'success');

    await loadUserData();
    updateLoginUI();
    loginModal.classList.add('hidden');

    // Refresh all data
    updateAllAlerts();
    updateBudgetsGrid();
    updateExpenseTable();
    updateDashboard();
    generateCalendar();
    initializeAnalytics();
    return true;
}

// Google Login Function
async function loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });

    if (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    }
}

// Logout
async function logoutUser() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        showNotification(error.message, 'error');
        return;
    }

    currentUser = null;
    budgets = [];
    expenses = [];
    alerts = [];
    monthlyBudgets = [];
    upcomingAlerts = [];

    updateLoginUI();
    showNotification('Successfully logged out!', 'success');

    // Clear dashboard
    updateBudgetsGrid();
    updateExpenseTable();
    updateAllAlerts();
    updateDashboard();
    generateCalendar();
    initializeAnalytics();

    // Switch to dashboard
    sidebarOptions.forEach(opt => opt.classList.remove('active'));
    document.querySelector('[data-section="dashboard"]').classList.add('active');

    contentSections.forEach(section => {
        if (section.id === 'dashboard') {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });
}

// Update login UI
function updateLoginUI() {
    if (currentUser) {
        welcomeUserDiv.classList.remove('hidden');
        const username = currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || 'User';
        usernameDisplay.textContent = username;
        loginText.textContent = 'Login';
        logoutBtn.style.display = 'flex';
    } else {
        welcomeUserDiv.classList.add('hidden');
        loginText.textContent = 'Login';
        logoutBtn.style.display = 'none';
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    // Set current date and time for expense form
    const today = new Date().toISOString().split('T')[0];
    expenseDateInput.value = today;

    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    expenseTimeInput.value = currentTime;

    // Set threshold slider values
    alertThresholdSlider.addEventListener('input', function () {
        thresholdValue.textContent = this.value + '%';
    });

    // Check authentication
    checkAuth();
});

// Initialize Analytics
function initializeAnalytics() {
    populateMonthSelectors();

    if (pieMonthSelect) {
        pieMonthSelect.addEventListener('change', function () {
            updatePieChart(this.value);
        });
    }

    if (wormMonthSelect) {
        wormMonthSelect.addEventListener('change', function () {
            updateWormChart(this.value);
        });
    }
}

// Populate month selectors with available months from expenses
function populateMonthSelectors() {
    if (!pieMonthSelect || !wormMonthSelect || !barMonthButtons) return;

    const monthsSet = new Set();
    expenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        monthsSet.add(JSON.stringify({ key: monthKey, name: monthName, year: date.getFullYear(), month: date.getMonth() }));
    });

    monthlyBudgets.forEach(mb => {
        const monthKey = `${mb.year}-${mb.month}`;
        const date = new Date(mb.year, mb.month);
        const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        monthsSet.add(JSON.stringify({ key: monthKey, name: monthName, year: mb.year, month: mb.month }));
    });

    const months = Array.from(monthsSet).map(item => JSON.parse(item));
    months.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
    });

    pieMonthSelect.innerHTML = '';
    wormMonthSelect.innerHTML = '';
    barMonthButtons.innerHTML = '';

    if (months.length === 0) {
        pieMonthSelect.innerHTML = '<option value="">No data yet</option>';
        wormMonthSelect.innerHTML = '<option value="">No data yet</option>';
        barMonthButtons.innerHTML = '<div class="no-data-message">No data yet</div>';
        return;
    }

    pieMonthSelect.innerHTML = '<option value="">Select a month</option>';
    wormMonthSelect.innerHTML = '<option value="">Select a month</option>';

    months.forEach(month => {
        const option = document.createElement('option');
        option.value = `${month.year}-${month.month}`;
        option.textContent = month.name;
        pieMonthSelect.appendChild(option);
        wormMonthSelect.appendChild(option.cloneNode(true));

        const button = document.createElement('button');
        button.className = 'month-button';
        button.dataset.year = month.year;
        button.dataset.month = month.month;
        button.dataset.monthName = month.name;
        button.textContent = month.name.split(' ')[0];
        button.addEventListener('click', function () {
            this.classList.toggle('selected');
            const monthKey = `${month.year}-${month.month}`;
            if (this.classList.contains('selected')) {
                if (!selectedBarMonths.includes(monthKey)) {
                    selectedBarMonths.push(monthKey);
                }
            } else {
                selectedBarMonths = selectedBarMonths.filter(m => m !== monthKey);
            }
            updateBarChart();
        });
        barMonthButtons.appendChild(button);
    });
}

// Update Pie Chart for selected month
function updatePieChart(monthKey) {
    if (!monthKey) {
        if (pieNoData) pieNoData.classList.remove('hidden');
        if (pieChart) {
            pieChart.destroy();
            pieChart = null;
        }
        return;
    }

    const [year, month] = monthKey.split('-').map(Number);

    const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
    });

    if (monthExpenses.length === 0) {
        if (pieNoData) pieNoData.classList.remove('hidden');
        if (pieChart) {
            pieChart.destroy();
            pieChart = null;
        }
        return;
    }

    const categoryMap = new Map();
    monthExpenses.forEach(expense => {
        const current = categoryMap.get(expense.category) || 0;
        categoryMap.set(expense.category, current + expense.amount);
    });

    const categories = Array.from(categoryMap.keys());
    const amounts = Array.from(categoryMap.values());

    const colors = [
        '#4a90e2', '#e24a4a', '#4ae24a', '#9b4ae2', '#e29b4a',
        '#e24a9b', '#4ae2e2', '#e2e24a', '#4a4ae2', '#e24ae2'
    ];

    const pieCtx = document.getElementById('pie-chart').getContext('2d');
    if (pieChart) pieChart.destroy();

    pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: colors.slice(0, categories.length),
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.9)',
                        font: { size: 12 },
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'rgba(255, 255, 255, 0.9)',
                    bodyColor: 'rgba(255, 255, 255, 0.9)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1
                }
            }
        }
    });

    if (pieNoData) pieNoData.classList.add('hidden');
}

// Update Bar Chart for selected months
function updateBarChart() {
    if (selectedBarMonths.length === 0) {
        if (barNoData) barNoData.classList.remove('hidden');
        if (barChart) {
            barChart.destroy();
            barChart = null;
        }
        return;
    }

    selectedBarMonths.sort((a, b) => {
        const [yearA, monthA] = a.split('-').map(Number);
        const [yearB, monthB] = b.split('-').map(Number);
        if (yearA !== yearB) return yearA - yearB;
        return monthA - monthB;
    });

    const monthLabels = [];
    const monthTotals = [];

    selectedBarMonths.forEach(monthKey => {
        const [year, month] = monthKey.split('-').map(Number);
        const date = new Date(year, month);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthLabels.push(monthName);

        const total = expenses
            .filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
            })
            .reduce((sum, expense) => sum + expense.amount, 0);

        monthTotals.push(total);
    });

    const maxValue = Math.max(...monthTotals, 1);
    let stepSize = 1;
    if (maxValue > 10000) stepSize = 2000;
    else if (maxValue > 5000) stepSize = 1000;
    else if (maxValue > 1000) stepSize = 200;
    else if (maxValue > 500) stepSize = 100;
    else if (maxValue > 100) stepSize = 20;
    else stepSize = 10;

    const barCtx = document.getElementById('bar-chart').getContext('2d');
    if (barChart) barChart.destroy();

    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [{
                label: 'Total Expenses ($)',
                data: monthTotals,
                backgroundColor: 'rgba(74, 144, 226, 0.7)',
                borderColor: 'rgba(74, 144, 226, 1)',
                borderWidth: 2,
                borderRadius: 6,
                hoverBackgroundColor: 'rgba(74, 144, 226, 0.9)',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        stepSize: stepSize,
                        callback: function (value) {
                            return '$' + value;
                        }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: { size: 12 }
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'rgba(255, 255, 255, 0.9)',
                    bodyColor: 'rgba(255, 255, 255, 0.9)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    callbacks: {
                        label: function (context) {
                            return 'Total: $' + context.raw;
                        }
                    }
                }
            },
            hover: {
                mode: 'index',
                intersect: false
            }
        }
    });

    if (barNoData) barNoData.classList.add('hidden');
}

// Update Worm Chart for selected month
function updateWormChart(monthKey) {
    if (!monthKey) {
        if (wormNoData) wormNoData.classList.remove('hidden');
        if (wormSummary) wormSummary.innerHTML = '';
        if (wormChart) {
            wormChart.destroy();
            wormChart = null;
        }
        return;
    }

    const [year, month] = monthKey.split('-').map(Number);

    // Get all expenses for this month
    const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
    });

    // Calculate total expenses and budget
    const totalExpenses = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    // Budget is active cross-month, so we just take the sum of all current categories
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);

    const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (totalBudget === 0 && totalExpenses === 0) {
        if (wormNoData) {
            wormNoData.innerHTML = 'No budget or expense data for this month';
            wormNoData.classList.remove('hidden');
        }
        if (wormSummary) wormSummary.innerHTML = '';
        if (wormChart) {
            wormChart.destroy();
            wormChart = null;
        }
        return;
    }

    // For worm graph: calculate days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayLabels = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Calculate cumulative expenses per day
    let cumulativeExpense = 0;
    const expenseData = [];
    const budgetData = Array(daysInMonth).fill(totalBudget); // Flat line for budget threshold

    // Sort expenses by date
    monthExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let day = 1; day <= daysInMonth; day++) {
        // Find expenses for this specific day
        const dayExpenses = monthExpenses.filter(e => new Date(e.date).getDate() === day);
        const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

        cumulativeExpense += dayTotal;
        expenseData.push(cumulativeExpense);
    }

    const maxValue = Math.max(totalBudget, totalExpenses, 1);
    const paddedMax = Math.ceil(maxValue * 1.1 / 100) * 100;

    const wormCtx = document.getElementById('worm-chart').getContext('2d');
    if (wormChart) wormChart.destroy();

    wormChart = new Chart(wormCtx, {
        type: 'line', // Changed to line graph
        data: {
            labels: dayLabels, // [1, 2, ..., 31]
            datasets: [
                {
                    label: 'Total Budget Limit',
                    data: budgetData,
                    borderColor: 'rgba(226, 74, 74, 0.8)',
                    borderWidth: 2,
                    borderDash: [5, 5], // Dashed line purely for budget target
                    pointRadius: 0,
                    fill: false,
                    tension: 0
                },
                {
                    label: 'Cumulative Expense (Worm)',
                    data: expenseData,
                    borderColor: 'rgba(74, 144, 226, 1)',
                    backgroundColor: 'rgba(74, 144, 226, 0.2)',
                    borderWidth: 3,
                    pointBackgroundColor: 'rgba(74, 144, 226, 1)',
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    fill: true, // Fill under the worm curve
                    tension: 0.3 // Smooth worm curve
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Day of Month',
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                },
                y: {
                    beginAtZero: true,
                    max: paddedMax,
                    title: {
                        display: true,
                        text: 'Amount ($)',
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        callback: function (value) { return '$' + value; }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: 'rgba(255, 255, 255, 0.9)', usePointStyle: true, font: { size: 12 } }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'rgba(255, 255, 255, 0.9)',
                    bodyColor: 'rgba(255, 255, 255, 0.9)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    callbacks: {
                        title: function (context) { return monthName + ' ' + context[0].label; },
                        label: function (context) { return context.dataset.label + ': $' + context.raw.toFixed(2); }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });

    const difference = totalBudget - totalExpenses;
    const differenceClass = difference >= 0 ? 'positive-diff' : 'negative-diff';
    const status = difference >= 0 ? 'Under Budget' : 'Over Budget';
    const differenceAmount = Math.abs(difference).toFixed(2);
    const differenceText = difference >= 0 ? 'surplus' : 'deficit';

    wormSummary.innerHTML = `
        <table class="summary-table">
            <thead>
                <tr><th>Category</th><th>Amount</th></tr>
            </thead>
            <tbody>
                <tr><td>Total Budget (${monthName})</td><td>$${totalBudget.toFixed(2)}</td></tr>
                <tr><td>Total Expenses (${monthName})</td><td>$${totalExpenses.toFixed(2)}</td></tr>
                <tr><td>Difference</td><td class="${differenceClass}">$${differenceAmount} ${differenceText}</td></tr>
                <tr><td>Status</td><td class="${differenceClass}">${status}</td></tr>
            </tbody>
        </table>
    `;

    if (wormNoData) wormNoData.classList.add('hidden');
}

// Update all alerts (both active and upcoming)
function updateAllAlerts() {
    updateActiveAlerts();
    updateUpcomingAlerts();
}

// Update active alerts (threshold reached or exceeded)
function updateActiveAlerts() {
    const newAlerts = [];

    budgets.forEach(budget => {
        const percentage = (budget.spent / budget.amount) * 100;

        if (percentage >= budget.threshold) {
            const existingAlert = alerts.find(a => a.category === budget.category);
            const existingUpcoming = upcomingAlerts.find(u => u.category === budget.category);

            if (existingUpcoming) {
                upcomingAlerts = upcomingAlerts.filter(u => u.category !== budget.category);
            }

            if (!existingAlert) {
                const newAlert = {
                    category: budget.category,
                    message: `${percentage.toFixed(1)}% of budget used`,
                    amount: budget.spent,
                    total: budget.amount,
                    date: new Date().toISOString().split('T')[0],
                    type: percentage >= 100 ? 'danger' : 'warning'
                };
                newAlerts.push(newAlert);
            }
        }
    });

    if (newAlerts.length > 0) {
        alerts = [...alerts, ...newAlerts];
        newAlerts.forEach(alert => saveAlertToSupabase(alert));
    }

    alerts = alerts.filter(alert => {
        const budget = budgets.find(b => b.category === alert.category);
        if (!budget) return false;
        const percentage = (budget.spent / budget.amount) * 100;
        return percentage >= budget.threshold;
    });

    if (alertsContainerFull) {
        alertsContainerFull.innerHTML = '';

        if (alerts.length === 0) {
            alertsContainerFull.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <p>No active alerts. All budgets are within limits!</p>
                </div>
            `;
            if (alertCountFull) alertCountFull.textContent = '0 alerts';
        } else {
            alerts.forEach(alert => {
                const alertCard = document.createElement('div');
                alertCard.className = `alert-card ${alert.type}`;
                const alertDate = new Date(alert.date).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                });
                alertCard.innerHTML = `
                    <div class="alert-info">
                        <div class="alert-category">${alert.category}</div>
                        <div class="alert-message">${alert.message}</div>
                        <div class="alert-date">${alertDate}</div>
                    </div>
                    <div class="alert-amount">$${alert.amount} / $${alert.total}</div>
                `;
                alertsContainerFull.appendChild(alertCard);
            });
            if (alertCountFull) alertCountFull.textContent = `${alerts.length} alerts`;
        }
    }
}

// Update upcoming alerts (within 5% of threshold)
function updateUpcomingAlerts() {
    const newUpcoming = [];

    budgets.forEach(budget => {
        const percentage = (budget.spent / budget.amount) * 100;
        const threshold = budget.threshold;
        const isActive = alerts.some(a => a.category === budget.category);

        if (percentage >= (threshold - 5) && percentage < threshold && !isActive) {
            const existingUpcoming = upcomingAlerts.find(u => u.category === budget.category);
            if (!existingUpcoming) {
                newUpcoming.push({
                    category: budget.category,
                    message: `${percentage.toFixed(1)}% of budget used (within 5% of limit)`,
                    amount: budget.spent,
                    total: budget.amount,
                    threshold: threshold,
                    percentage: percentage
                });
            }
        }
    });

    if (newUpcoming.length > 0) {
        upcomingAlerts = [...upcomingAlerts, ...newUpcoming];
    }

    upcomingAlerts = upcomingAlerts.filter(upcoming => {
        const budget = budgets.find(b => b.category === upcoming.category);
        if (!budget) return false;
        const percentage = (budget.spent / budget.amount) * 100;
        const threshold = budget.threshold;
        const isActive = alerts.some(a => a.category === upcoming.category);
        return percentage >= (threshold - 5) && percentage < threshold && !isActive;
    });

    localStorage.setItem('collegeCentsUpcomingAlerts', JSON.stringify(upcomingAlerts));
}

// Update budgets grid
function updateBudgetsGrid() {
    budgetsGridContainer.innerHTML = '';

    if (budgets.length === 0) {
        budgetsGridContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-wallet"></i>
                <p>No budgets created yet. Create your first budget in "Create Budget"!</p>
            </div>
        `;
        return;
    }

    const sortedBudgets = [...budgets].sort((a, b) => a.category.localeCompare(b.category));

    sortedBudgets.forEach(budget => {
        const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;

        let progressClass = '';
        if (percentage >= budget.threshold) {
            progressClass = 'danger';
        } else if (percentage >= budget.threshold - 5) {
            progressClass = 'upcoming';
        } else if (percentage >= budget.threshold - 20) {
            progressClass = 'warning';
        }

        const categoryExpenses = expenses
            .filter(expense => expense.category === budget.category)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const budgetCard = document.createElement('div');
        budgetCard.className = 'budget-card';
        budgetCard.setAttribute('data-category', budget.category);

        let expensesHTML = '';
        if (categoryExpenses.length > 0) {
            expensesHTML = '<div class="budget-expenses"><h4>All Expenses:</h4>';
            categoryExpenses.forEach(expense => {
                const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric'
                });
                expensesHTML += `
                    <div class="expense-item">
                        <div class="expense-details">
                            <div class="expense-date">${formattedDate} ${expense.time}</div>
                            <div class="expense-desc">${expense.description}</div>
                        </div>
                        <div class="expense-amount">$${expense.amount}</div>
                    </div>
                `;
            });
            expensesHTML += '</div>';
        }

        budgetCard.innerHTML = `
            <div class="category-delete-btn" onclick="showDeleteCategoryModal('${budget.category}')">
                <i class="fas fa-times"></i>
            </div>
            <div class="category-header">
                <div class="category-title">${budget.category}</div>
                <div class="category-total">$${budget.spent} / $${budget.amount}</div>
            </div>
            <div class="budget-percentage">${percentage.toFixed(1)}% used</div>
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
            </div>
            
            ${expensesHTML}
            
            <div class="budget-actions">
                <button class="btn btn-small" onclick="addExpenseToBudget('${budget.category}')">
                    <i class="fas fa-plus"></i> Add Expense
                </button>
                <button class="btn btn-remove" onclick="showBudgetRemovalModal('${budget.category}')">
                    <i class="fas fa-trash"></i> Remove Budget
                </button>
            </div>
            <div class="slider-container">
                <label>Alert at: ${budget.threshold}%</label>
                <input type="range" class="slider" min="50" max="100" value="${budget.threshold}" 
                       onchange="updateBudgetThreshold('${budget.category}', this.value)">
            </div>
        `;
        budgetsGridContainer.appendChild(budgetCard);
    });
}

// Update expense table
function updateExpenseTable() {
    expenseTableBody.innerHTML = '';

    if (expenses.length === 0) {
        expenseTableBody.innerHTML = `
            <tr><td colspan="4" class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No expenses recorded yet. Add your first expense!</p>
            </td></tr>
        `;
        monthlyTotalElement.textContent = 'Total: $0';
        return;
    }

    let monthlyTotal = 0;
    const currentMonthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    currentMonthExpenses.forEach(expense => {
        monthlyTotal += expense.amount;
        const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formattedDate} ${expense.time}</td>
            <td>${expense.category}</td>
            <td>${expense.description}</td>
            <td>$${expense.amount}</td>
        `;
        expenseTableBody.appendChild(row);
    });

    monthlyTotalElement.textContent = `Total: $${monthlyTotal}`;
}

// Update dashboard
function updateDashboard() {
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const budgetAmountElement = document.querySelector('.dashboard-card:first-child .budget-amount');
    const spentElement = document.querySelector('.dashboard-card:first-child .progress-label span:first-child');
    const percentageElement = document.querySelector('.dashboard-card:first-child .progress-label span:last-child');
    const progressFillElement = document.querySelector('.dashboard-card:first-child .progress-fill');

    if (budgetAmountElement) budgetAmountElement.textContent = `$${totalBudget}`;
    if (spentElement) spentElement.textContent = `Spent: $${totalSpent}`;
    if (percentageElement) percentageElement.textContent = `${percentage.toFixed(1)}%`;
    if (progressFillElement) progressFillElement.style.width = `${Math.min(percentage, 100)}%`;

    updateRecentExpenses();
    updateDashboardAlerts();
}

// Update recent expenses
function updateRecentExpenses() {
    recentExpensesContainer.innerHTML = '';
    const recentExpenses = expenses.slice(-3).reverse();

    if (recentExpenses.length === 0) {
        recentExpensesContainer.innerHTML = `<div class="empty-state"><p>No expenses yet</p></div>`;
        return;
    }

    recentExpenses.forEach(expense => {
        const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric'
        });
        const expenseCard = document.createElement('div');
        expenseCard.className = 'budget-card';
        expenseCard.innerHTML = `
            <div class="budget-card-header">
                <div class="budget-name">${expense.category}</div>
                <div class="budget-amount">$${expense.amount}</div>
            </div>
            <div class="progress-container">
                <div class="progress-label">
                    <span>${formattedDate} ${expense.time}</span>
                </div>
            </div>
        `;
        recentExpensesContainer.appendChild(expenseCard);
    });
}

// Update dashboard alerts
function updateDashboardAlerts() {
    dashboardAlertsContainer.innerHTML = '';

    if (upcomingAlerts.length === 0) {
        dashboardAlertsContainer.innerHTML = `<div class="empty-state"><p>No categories nearing limit</p></div>`;
        return;
    }

    upcomingAlerts.slice(0, 3).forEach(alert => {
        const alertCard = document.createElement('div');
        alertCard.className = 'dashboard-alert';
        alertCard.innerHTML = `
            <div class="alert-info">
                <div class="alert-category">${alert.category}</div>
                <div class="alert-message">${alert.message}</div>
            </div>
            <div class="alert-amount">$${alert.amount} / $${alert.total}</div>
        `;
        dashboardAlertsContainer.appendChild(alertCard);
    });
}

// Generate calendar
function generateCalendar() {
    if (!calendarElement) return;
    calendarElement.innerHTML = '';

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    currentMonthElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        calendarElement.appendChild(header);
    });

    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day';
        emptyDay.style.cursor = 'default';
        emptyDay.style.opacity = '0.3';
        calendarElement.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayExpenses = expenses.filter(expense => expense.date === dateStr);

        if (dayExpenses.length > 0) {
            const totalExpenses = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
            dayElement.classList.add('has-expense');
            dayElement.innerHTML = `<div>${day}</div><div class="calendar-expense-amount">$${totalExpenses}</div>`;
            dayElement.addEventListener('click', () => showDayExpenses(dayExpenses, dateStr));
        } else {
            dayElement.style.cursor = 'default';
        }
        calendarElement.appendChild(dayElement);
    }
}

// Sidebar navigation
sidebarOptions.forEach(option => {
    option.addEventListener('click', function () {
        if (this.id === 'logout-btn') return;

        const targetSection = this.getAttribute('data-section');

        sidebarOptions.forEach(opt => opt.classList.remove('active'));
        this.classList.add('active');

        contentSections.forEach(section => {
            if (section.id === targetSection) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });

        if (targetSection === 'add-expense') {
            document.getElementById('form-section-title').innerHTML = '<i class="fas fa-plus-circle"></i> Create Budget';
            if(document.getElementById('expense-amount-row')) document.getElementById('expense-amount-row').classList.add('hidden');
            if(document.getElementById('expense-separator')) document.getElementById('expense-separator').classList.add('hidden');
            if (document.getElementById('budget-fields-row')) document.getElementById('budget-fields-row').classList.remove('hidden');
            budgetCategoryInput.value = '';
            budgetCategoryInput.readOnly = false;
        } else if (targetSection === 'category-spend') {
            updateBudgetsGrid();
        } else if (targetSection === 'monthly-statement') {
            updateExpenseTable();
            generateCalendar();
        } else if (targetSection === 'alerts') {
            updateActiveAlerts();
        } else if (targetSection === 'analytics') {
            populateMonthSelectors();
            selectedBarMonths = [];
            if (pieChart) { pieChart.destroy(); pieChart = null; }
            if (barChart) { barChart.destroy(); barChart = null; }
            if (wormChart) { wormChart.destroy(); wormChart = null; }
            if (pieNoData) pieNoData.classList.add('hidden');
            if (barNoData) barNoData.classList.remove('hidden');
            if (wormNoData) wormNoData.classList.add('hidden');
            if (wormSummary) wormSummary.innerHTML = '';
        }
    });
});

// Modes are now handled rigidly by UI logic via the sidebar vs Card button click

// Create new budget OR add expense based on visible mode
createBudgetExpenseBtn.addEventListener('click', async function () {
    if (!currentUser) {
        showNotification('Please login to continue.', 'error');
        loginModal.classList.remove('hidden');
        return;
    }

    const isCreateBudgetMode = !document.getElementById('budget-fields-row').classList.contains('hidden');
    
    const category = budgetCategoryInput.value.trim();
    if (!category) {
        showNotification('Please enter a valid budget category.', 'error');
        return;
    }

    const existingBudgetIndex = budgets.findIndex(b => b.category.toLowerCase() === category.toLowerCase());

    if (isCreateBudgetMode) {
        const budgetAmount = parseFloat(budgetAmountInput.value);
        const threshold = parseInt(alertThresholdSlider.value);

        if (!budgetAmount || budgetAmount <= 0) {
            showNotification('Please enter a valid Budget Amount.', 'error');
            return;
        }

        if (existingBudgetIndex !== -1) {
            showNotification('This category already exists!', 'error');
            return;
        }

        const newBudget = {
            category: category,
            amount: budgetAmount,
            spent: 0,
            threshold: threshold || 80
        };
        const savedBudget = await saveBudgetToSupabase(newBudget);
        if (savedBudget) budgets.push(savedBudget);

        // Apply this new budget limit to the current month's record
        const currentDate = new Date();
        const currentMonth = !expenseDateInput.value ? currentDate.getMonth() : new Date(expenseDateInput.value).getMonth();
        const currentYear = !expenseDateInput.value ? currentDate.getFullYear() : new Date(expenseDateInput.value).getFullYear();
        const existingMonthlyBudget = monthlyBudgets.find(mb => mb.year === currentYear && mb.month === currentMonth);
        
        if (existingMonthlyBudget) {
            existingMonthlyBudget.total += budgetAmount;
            await saveMonthlyBudgetToSupabase(existingMonthlyBudget);
        } else {
            const savedMonthlyBudget = await saveMonthlyBudgetToSupabase({
                year: currentYear,
                month: currentMonth,
                total: budgetAmount
            });
            if (savedMonthlyBudget) monthlyBudgets.push(savedMonthlyBudget);
        }

        budgetAmountInput.value = '';
        budgetCategoryInput.value = '';
        alertThresholdSlider.value = 80;
        thresholdValue.textContent = '80%';
        showNotification(`Budget category '${category}' created!`, 'success');

    } else { // Add Expense Mode
        const expenseAmount = parseFloat(expenseAmountInput.value);
        const date = expenseDateInput.value;
        const time = expenseTimeInput.value;
        const description = expenseDescriptionInput.value.trim() || 'No description';

        if (!expenseAmount || expenseAmount <= 0) {
            showNotification('Please enter a valid expense amount.', 'error');
            return;
        }
        if (!date || !time) {
            showNotification('Please select a date and time.', 'error');
            return;
        }

        if (existingBudgetIndex === -1) {
            showNotification('Critical Error: Could not link expense to budget!', 'error');
            return;
        }

        // Add expense
        const newExpense = {
            category: category,
            amount: expenseAmount,
            date: date,
            time: time,
            description: description
        };
        const savedExpense = await saveExpenseToSupabase(newExpense);
        if (savedExpense) expenses.push(savedExpense);

        // Update category spent progress
        budgets[existingBudgetIndex].spent += expenseAmount;
        await updateBudgetInSupabase(budgets[existingBudgetIndex]);

        expenseAmountInput.value = '';
        expenseDescriptionInput.value = '';
        // Do not erase category so they can add rapid-fire expenses easily
        showNotification(`Expense logged to '${category}'.`, 'success');
    }

    updateAllAlerts();
    updateBudgetsGrid();
    updateExpenseTable();
    updateDashboard();
    generateCalendar();
    initializeAnalytics();
});

// Calendar navigation
prevMonthBtn.addEventListener('click', function () {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    generateCalendar();
    updateExpenseTable();
});

nextMonthBtn.addEventListener('click', function () {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    generateCalendar();
    updateExpenseTable();
});

// Delete category
function showDeleteCategoryModal(category) {
    if (!currentUser) {
        showNotification('Please login to manage categories.', 'error');
        loginModal.classList.remove('hidden');
        return;
    }
    categoryToDelete = category;
    deleteCategoryMessage.textContent = `Are you sure you want to delete the "${category}" category? All expenses (${expenses.filter(e => e.category === category).length} items) will be permanently removed.`;
    deleteCategoryModal.classList.remove('hidden');
}

confirmCategoryDeleteBtn.addEventListener('click', async function () {
    if (categoryToDelete) {
        const expensesToDelete = expenses.filter(e => e.category === categoryToDelete);
        for (const expense of expensesToDelete) {
            await deleteExpenseFromSupabase(expense.id);
        }
        expenses = expenses.filter(expense => expense.category !== categoryToDelete);

        const budgetToDelete = budgets.find(b => b.category === categoryToDelete);
        if (budgetToDelete) {
            await deleteBudgetFromSupabase(budgetToDelete.id);
        }
        budgets = budgets.filter(budget => budget.category !== categoryToDelete);

        const alertsToDelete = alerts.filter(a => a.category === categoryToDelete);
        for (const alert of alertsToDelete) {
            await deleteAlertFromSupabase(alert.id);
        }
        alerts = alerts.filter(alert => alert.category !== categoryToDelete);

        upcomingAlerts = upcomingAlerts.filter(upcoming => upcoming.category !== categoryToDelete);

        updateBudgetsGrid();
        updateExpenseTable();
        updateAllAlerts();
        updateDashboard();
        generateCalendar();
        initializeAnalytics();

        deleteCategoryModal.classList.add('hidden');
        categoryToDelete = null;
    }
});

cancelCategoryDeleteBtn.addEventListener('click', function () {
    deleteCategoryModal.classList.add('hidden');
    categoryToDelete = null;
});

closeDeleteCategoryModal.addEventListener('click', function () {
    deleteCategoryModal.classList.add('hidden');
    categoryToDelete = null;
});

// Budget removal modal
function showBudgetRemovalModal(category) {
    if (!currentUser) {
        showNotification('Please login to manage budgets.', 'error');
        loginModal.classList.remove('hidden');
        return;
    }
    selectedBudgetForRemoval = category;
    const categoryExpenses = expenses.filter(expense => expense.category === category);

    if (categoryExpenses.length === 0) {
        showNotification(`No expenses found for ${category} category.`, 'info');
        return;
    }

    budgetRemovalMessage.textContent = `Select which expenses to remove from "${category}":`;
    budgetExpensesList.innerHTML = '';

    categoryExpenses.forEach(expense => {
        const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
        const expenseItem = document.createElement('div');
        expenseItem.className = 'expense-checkbox-item';
        expenseItem.innerHTML = `
            <input type="checkbox" id="expense-${expense.id}" value="${expense.id}" data-amount="${expense.amount}">
            <div class="expense-checkbox-details">
                <div>
                    <div class="expense-checkbox-category">$${expense.amount} - ${expense.description}</div>
                    <div class="expense-checkbox-date">${formattedDate} ${expense.time}</div>
                </div>
                <div class="expense-checkbox-amount">$${expense.amount}</div>
            </div>
        `;
        budgetExpensesList.appendChild(expenseItem);
    });
    budgetRemovalModal.classList.remove('hidden');
}

confirmBudgetRemovalBtn.addEventListener('click', async function () {
    const checkboxes = document.querySelectorAll('#budget-expenses-list input[type="checkbox"]:checked');
    const selectedIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    const totalRemovedAmount = Array.from(checkboxes).reduce((sum, cb) => sum + parseFloat(cb.getAttribute('data-amount')), 0);

    if (selectedIds.length === 0) {
        showNotification('Please select at least one expense to remove.', 'error');
        return;
    }

    for (const id of selectedIds) {
        await deleteExpenseFromSupabase(id);
    }
    expenses = expenses.filter(expense => !selectedIds.includes(expense.id));

    const budgetIndex = budgets.findIndex(b => b.category === selectedBudgetForRemoval);
    if (budgetIndex !== -1) {
        budgets[budgetIndex].spent -= totalRemovedAmount;
        if (budgets[budgetIndex].spent < 0) budgets[budgetIndex].spent = 0;
        await updateBudgetInSupabase(budgets[budgetIndex]);
    }

    updateAllAlerts();
    updateBudgetsGrid();
    updateExpenseTable();
    updateDashboard();
    generateCalendar();
    initializeAnalytics();

    budgetRemovalModal.classList.add('hidden');
    selectedBudgetForRemoval = null;
});

cancelBudgetRemovalBtn.addEventListener('click', function () {
    budgetRemovalModal.classList.add('hidden');
    selectedBudgetForRemoval = null;
});

closeBudgetRemovalModal.addEventListener('click', function () {
    budgetRemovalModal.classList.add('hidden');
    selectedBudgetForRemoval = null;
});

// Login and Register
loginBtn.addEventListener('click', function () {
    loginModal.classList.remove('hidden');
});

closeLoginModal.addEventListener('click', function () {
    loginModal.classList.add('hidden');
});

// Google Login / Registration
const googleRegisterBtn = document.getElementById('google-register');

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', function () {
        loginWithGoogle();
    });
}

if (googleRegisterBtn) {
    googleRegisterBtn.addEventListener('click', function () {
        loginWithGoogle();
    });
}

// Unified Form Login (Strictly Email/Password)
loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = loginEmailInput?.value.trim() || '';
    const password = loginPasswordInput?.value || '';

    if (!email || !password) {
        showNotification('Please provide both your email and password.', 'error');
        return;
    }

    const success = await submitAuth(email, password, null);

    if (success !== false) {
        if (loginEmailInput) loginEmailInput.value = '';
        if (loginPasswordInput) loginPasswordInput.value = '';
    }
});

// Profile button
document.getElementById('profile-btn').addEventListener('click', function () {
    if (currentUser) {
        showNotification(`Profile: ${currentUser.email}\nUser ID: ${currentUser.id}`, 'info');
    } else {
        showNotification('Please login to access your profile.', 'info');
        loginModal.classList.remove('hidden');
    }
});

// Modal Toggles for Register / Login
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const registerModal = document.getElementById('register-modal');
const closeRegisterModal = document.getElementById('close-register-modal');
const registerForm = document.getElementById('register-form');

if (showRegisterLink && registerModal) {
    showRegisterLink.addEventListener('click', function (e) {
        e.preventDefault();
        loginModal.classList.add('hidden');
        registerModal.classList.remove('hidden');
    });
}

if (showLoginLink && registerModal) {
    showLoginLink.addEventListener('click', function (e) {
        e.preventDefault();
        registerModal.classList.add('hidden');
        loginModal.classList.remove('hidden');
    });
}

if (closeRegisterModal) {
    closeRegisterModal.addEventListener('click', function () {
        registerModal.classList.add('hidden');
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('register-email')?.value.trim();
        const username = document.getElementById('register-username')?.value.trim();
        const password = document.getElementById('register-password')?.value;
        const confirmPassword = document.getElementById('register-confirm-password')?.value;

        if (password !== confirmPassword) {
            showNotification('Invalid credentials', 'error');
            return;
        }

        if (!email || !username || !password) {
            showNotification('Please fill in all required fields.', 'error');
            return;
        }

        const { data: regData, error: regError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: { data: { username: username } }
        });

        if (regError) {
            showNotification(regError.message, 'error');
            return;
        }

        if (!regData.session) {
            showNotification('SUPABASE LOCK: Your account is made, but it requires email verification! Check your actual email inbox to confirm the account, OR turn off "Confirm Email" in your Supabase dashboard!', 'error');
            registerModal.classList.add('hidden');
            loginModal.classList.remove('hidden');
            return;
        }

        currentUser = regData.user;
        showNotification(`Account created! Welcome, ${username}!`, 'success');

        if (username && currentUser.user_metadata?.username !== username) {
            await supabase.auth.updateUser({ data: { username: username } });
            currentUser.user_metadata = { ...currentUser.user_metadata, username: username };
        }

        await loadUserData();
        updateLoginUI();
        registerModal.classList.add('hidden');

        updateAllAlerts();
        updateBudgetsGrid();
        updateExpenseTable();
        updateDashboard();
        generateCalendar();
        initializeAnalytics();
    });
}

// Logout button
logoutBtn.addEventListener('click', function () {
    logoutUser();
});

// Close modals when clicking outside
window.addEventListener('click', function (event) {
    // Only auto-close specific modals that are meant to be light
    if (event.target === budgetRemovalModal) {
        budgetRemovalModal.classList.add('hidden');
        selectedBudgetForRemoval = null;
    }
    if (event.target === deleteCategoryModal) {
        deleteCategoryModal.classList.add('hidden');
        categoryToDelete = null;
    }
});

// Helper functions
function addExpenseToBudget(category) {
    if (!currentUser) return;
    
    sidebarOptions.forEach(opt => opt.classList.remove('active'));
    const expenseTab = document.querySelector('[data-section="add-expense"]');
    if (expenseTab) expenseTab.classList.remove('active'); // Keep it off so they know it's a sub-page of Category Spend
    
    contentSections.forEach(section => {
        if (section.id === 'add-expense') {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });
    
    document.getElementById('form-section-title').innerHTML = '<i class="fas fa-plus-circle"></i> Add Expense';
    if(document.getElementById('expense-amount-row')) document.getElementById('expense-amount-row').classList.remove('hidden');
    if (document.getElementById('expense-separator')) document.getElementById('expense-separator').classList.remove('hidden');
    if (document.getElementById('budget-fields-row')) document.getElementById('budget-fields-row').classList.add('hidden');

    budgetCategoryInput.value = category;
    budgetCategoryInput.readOnly = true;
    const event = new Event('input');
    budgetCategoryInput.dispatchEvent(event);
    expenseAmountInput.focus();
}

function updateBudgetThreshold(category, threshold) {
    const budget = budgets.find(b => b.category === category);
    if (budget) {
        budget.threshold = parseInt(threshold);
        updateAllAlerts();
        updateBudgetsGrid();
        updateDashboard();
        updateBudgetInSupabase(budget);
    }
}

function showDayExpenses(dayExpenses, date) {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    let message = `Expenses for ${formattedDate}:\n\n`;
    dayExpenses.forEach((expense, index) => {
        message += `${index + 1}. ${expense.category}: $${expense.amount}\n`;
        if (expense.description !== 'No description') message += `   ${expense.description}\n`;
        message += `   ${expense.time}\n\n`;
    });
    const total = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    message += `Total: $${total}`;
    alert(message);
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type || 'info'}`;
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    notification.innerHTML = `<i class="fas fa-${icon} notification-icon"></i><span>${message}</span>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4500); // Give them longer to read the error
}

// Toggle password visibility
document.querySelectorAll('.toggle-password').forEach(icon => {
    icon.addEventListener('click', function () {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (input) {
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        }
    });
});

// ==================== PROFILE SECTION LOGIC ====================
// DOM Elements
const profileFullNameInput = document.getElementById('profile-fullname');
const profileUsernameInput = document.getElementById('profile-username-input');
const profileEmailInput = document.getElementById('profile-email');
const profileUniversityInput = document.getElementById('profile-university');
const profileMajorInput = document.getElementById('profile-major');
const profileGradYearInput = document.getElementById('profile-grad-year');
const profileLivingSituation = document.getElementById('profile-living-situation');
const profileMonthlyIncomeInput = document.getElementById('profile-monthly-income');
const profileGoalNameInput = document.getElementById('profile-goal-name');
const profileGoalAmountInput = document.getElementById('profile-goal-amount');
const profileSemesterStartInput = document.getElementById('profile-semester-start');
const profileSemesterEndInput = document.getElementById('profile-semester-end');
const profileMonthCalculatorSelect = document.getElementById('profile-month-calculator-select');
const profileRemainderStatus = document.getElementById('profile-remainder-status');
const avatarUploadInput = document.getElementById('avatar-upload');
const profileAvatarPreview = document.getElementById('profile-avatar-preview');
const academicInfoForm = document.getElementById('academic-info-form');
const financialBaselinesForm = document.getElementById('financial-baselines-form');
const profileDisplayUsername = document.getElementById('profile-display-username');
const profileDisplayName = document.getElementById('profile-display-name');

// Load Profile Data into UI
async function loadUserProfile() {
    if (!currentUser) return;

    // Core Auth Info
    profileEmailInput.value = currentUser.email;

    if (userProfile) {
        profileFullNameInput.value = userProfile.full_name || '';
        profileUsernameInput.value = userProfile.username || currentUser.user_metadata?.username || '';
        profileUniversityInput.value = userProfile.university || '';
        profileMajorInput.value = userProfile.major || '';
        profileGradYearInput.value = userProfile.grad_year || '';
        profileLivingSituation.value = userProfile.living_situation || '';
        if (userProfile.monthly_income) profileMonthlyIncomeInput.value = userProfile.monthly_income;
        profileGoalNameInput.value = userProfile.savings_goal_name || '';
        if (userProfile.savings_goal_amount) profileGoalAmountInput.value = userProfile.savings_goal_amount;

        if (userProfile.semester_start) profileSemesterStartInput.value = userProfile.semester_start;
        if (userProfile.semester_end) profileSemesterEndInput.value = userProfile.semester_end;
        if (userProfile.avatar_url) profileAvatarPreview.src = userProfile.avatar_url;

        profileDisplayName.textContent = userProfile.full_name || 'Campus Student';
        profileDisplayUsername.textContent = userProfile.username || currentUser.user_metadata?.username || 'student';
    } else {
        profileUsernameInput.value = currentUser.user_metadata?.username || '';
        profileDisplayUsername.textContent = currentUser.user_metadata?.username || 'student';
    }

    populateProfileMonthCalculator();
}

// Ensure loadUserProfile is called when clicking Profile tab
const headerProfileBtn = document.getElementById('profile-btn');
if (headerProfileBtn) {
    headerProfileBtn.addEventListener('click', function () {
        if (!currentUser) {
            showNotification('Please login to view your profile.', 'error');
            loginModal.classList.remove('hidden');
            return;
        }

        // Deactivate all sidebar items visually
        sidebarOptions.forEach(opt => opt.classList.remove('active'));

        // Hide all active content views
        contentSections.forEach(section => {
            if (section.id === 'profile') {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });

        // Trigger the profile data load
        loadUserProfile();
    });
}

// Save Academic Data
academicInfoForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!currentUser) return;

    showNotification('Saving profile...', 'info');
    const newProfileData = {
        user_id: currentUser.id,
        full_name: profileFullNameInput.value,
        username: profileUsernameInput.value,
        university: profileUniversityInput.value,
        major: profileMajorInput.value,
        grad_year: profileGradYearInput.value ? parseInt(profileGradYearInput.value) : null,
        living_situation: profileLivingSituation.value
    };

    const { error } = await supabase.from('profiles').upsert([newProfileData], { onConflict: 'user_id' });

    if (error) {
        showNotification('Error saving profile: ' + error.message, 'error');
    } else {
        showNotification('Profile updated successfully!', 'success');
        userProfile = { ...userProfile, ...newProfileData };
        profileDisplayName.textContent = newProfileData.full_name || 'Campus Student';
        profileDisplayUsername.textContent = newProfileData.username || 'student';

        // Also update username in auth metadata natively so it reflects everywhere
        await supabase.auth.updateUser({ data: { username: newProfileData.username } });
    }
});

// Save Financial Data
financialBaselinesForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!currentUser) return;

    showNotification('Saving financials...', 'info');
    const newFinancialData = {
        user_id: currentUser.id,
        monthly_income: profileMonthlyIncomeInput.value ? parseFloat(profileMonthlyIncomeInput.value) : 0,
        savings_goal_name: profileGoalNameInput.value,
        savings_goal_amount: profileGoalAmountInput.value ? parseFloat(profileGoalAmountInput.value) : 0,
        semester_start: profileSemesterStartInput.value || null,
        semester_end: profileSemesterEndInput.value || null
    };

    const { error } = await supabase.from('profiles').upsert([newFinancialData], { onConflict: 'user_id' });

    if (error) {
        showNotification('Error saving financials: ' + error.message, 'error');
    } else {
        showNotification('Financial baselines updated!', 'success');
        userProfile = { ...userProfile, ...newFinancialData };
        populateProfileMonthCalculator(); // Recalculate based on new income
    }
});

// Avatar Image Base64 Upload
avatarUploadInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        showNotification('Image too large. Please select an image under 2MB.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (event) {
        const base64String = event.target.result;
        profileAvatarPreview.src = base64String;

        if (currentUser) {
            showNotification('Saving avatar...', 'info');
            const { error } = await supabase.from('profiles').upsert([{
                user_id: currentUser.id,
                avatar_url: base64String
            }]);

            if (error) {
                showNotification('Error saving avatar.', 'error');
            } else {
                showNotification('Avatar saved!', 'success');
                if (!userProfile) userProfile = {};
                userProfile.avatar_url = base64String;
            }
        }
    };
    reader.readAsDataURL(file);
});

// Populate Month Calculator & Determine Remainder
function populateProfileMonthCalculator() {
    if (!profileMonthCalculatorSelect) return;
    profileMonthCalculatorSelect.innerHTML = '<option value="" disabled selected>Select a month...</option>';

    const monthsSet = new Set();
    // Gather months from strictly expenses (spent money)
    expenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        monthsSet.add(JSON.stringify({ key: monthKey, name: monthName, year: date.getFullYear(), month: date.getMonth() }));
    });

    const months = Array.from(monthsSet).map(item => JSON.parse(item)).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year; // newest year first
        return b.month - a.month; // newest month first
    });

    months.forEach(m => {
        const option = document.createElement('option');
        option.value = m.key;
        option.textContent = m.name;
        profileMonthCalculatorSelect.appendChild(option);
    });
}

// Calculate Remainder perfectly on select
profileMonthCalculatorSelect.addEventListener('change', function () {
    const [yearStr, monthStr] = this.value.split('-');
    const targetYear = parseInt(yearStr);
    const targetMonth = parseInt(monthStr);

    // Calculate total spent strictly in this specific month
    const totalSpentInMonth = expenses
        .filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getFullYear() === targetYear && expenseDate.getMonth() === targetMonth;
        })
        .reduce((sum, e) => sum + e.amount, 0);

    const income = userProfile?.monthly_income ? parseFloat(userProfile.monthly_income) : 0;
    const remainder = income - totalSpentInMonth;

    if (remainder >= 0) {
        profileRemainderStatus.textContent = `+$${remainder.toFixed(2)} Remaining`;
        profileRemainderStatus.style.color = 'var(--success-green)';
    } else {
        profileRemainderStatus.textContent = `-$${Math.abs(remainder).toFixed(2)} Deficit`;
        profileRemainderStatus.style.color = 'rgba(226, 74, 74, 1)';
    }
});

// Initialize Flatpickr strictly for Profile dates natively linking project styling
if (typeof flatpickr !== 'undefined') {
    flatpickr(".flatpickr-no-time", {
        theme: "dark",
        dateFormat: "Y-m-d"
    });
}