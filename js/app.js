import { saveDB, loadDB } from './storage.js';
import { renderTransactions } from './ui.js';
import { renderCharts } from './charts.js';
import { calculateBalance, calculateProjections, formatCurrency } from './calculator.js';

// Global state
let state = {
    transactions: [],
    settings: {
        currentBalance: 0
    },
    timeRange: 'this-month',
    includeFixedExpenses: true
};

// Elements object - initialized in init()
let elements = {};

// Toast Notification Helper
function showToast(message, type = 'success') {
    const toastEl = document.getElementById('notification-toast');
    const toastBody = document.getElementById('toast-message');

    // Set message
    toastBody.textContent = message;

    // Remove previous type classes
    toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info');

    // Add appropriate class based on type
    if (type === 'success') {
        toastEl.classList.add('bg-success');
    } else if (type === 'error') {
        toastEl.classList.add('bg-danger');
    } else if (type === 'warning') {
        toastEl.classList.add('bg-warning');
    } else if (type === 'info') {
        toastEl.classList.add('bg-info');
    }

    // Show toast
    const toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 3000
    });
    toast.show();
}


// Swipe Gesture Support
let touchStartX = 0;
let touchEndX = 0;
const SWIPE_THRESHOLD = 50; // Minimum distance for swipe

function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;

    if (Math.abs(swipeDistance) < SWIPE_THRESHOLD) return;

    const tabs = ['tab-home', 'tab-stats', 'tab-add', 'tab-settings'];
    const currentTab = tabs.find(tab => !document.getElementById(tab).classList.contains('d-none'));
    const currentIndex = tabs.indexOf(currentTab);

    if (swipeDistance > 0 && currentIndex > 0) {
        // Swipe right - go to previous tab
        switchTab(tabs[currentIndex - 1]);
    } else if (swipeDistance < 0 && currentIndex < tabs.length - 1) {
        // Swipe left - go to next tab
        switchTab(tabs[currentIndex + 1]);
    }
}

// Initialize Elements
function initializeElements() {
    const getEl = (id) => document.getElementById(id);
    const getModal = (id) => {
        const el = document.getElementById(id);
        if (!el) {
            console.warn(`Modal element #${id} not found!`);
            return null;
        }
        return new bootstrap.Modal(el);
    };

    elements = {
        addExpenseBtn: getEl('add-expense-btn'),
        addIncomeBtn: getEl('add-income-btn'),
        amountInput: getEl('amount'),
        dateInput: getEl('transaction-date'),
        descriptionInput: getEl('description'),
        categoryInput: getEl('category'),
        transactionList: document.querySelector('#history .list-group'),
        saveNotesBtn: getEl('save-notes-btn'),
        currentBalanceInput: getEl('current-balance'),
        targetCashInput: getEl('target-cash'),
        thousandsSuffixToggle: getEl('thousands-suffix-toggle'),
        recurringIncomesList: getEl('recurring-incomes-list'),
        addRecurringIncomeBtn: getEl('add-recurring-income-btn'),
        recurringIncomeDay: getEl('recurring-income-day'),
        recurringIncomeAmount: getEl('recurring-income-amount'),
        fixedExpensesList: getEl('fixed-expenses-list'),
        addFixedExpenseBtn: getEl('add-fixed-expense-btn'),
        fixedExpenseDesc: getEl('fixed-expense-desc'),
        fixedExpenseAmount: getEl('fixed-expense-amount'),
        exportCsvBtn: getEl('export-csv-btn'),
        importCsvInput: getEl('import-csv-input'),
        balanceDisplay: getEl('current-balance-display'),
        fieldTestNotes: getEl('field-test-notes'),
        // Nav Elements
        navLinks: document.querySelectorAll('.nav-link'),
        tabContents: document.querySelectorAll('.tab-content'),

        // Edit Modal Elements
        editModal: getModal('editTransactionModal'),
        editIdInput: getEl('edit-id'),
        editDateInput: getEl('edit-date'),
        editAmountInput: getEl('edit-amount'),
        editDescriptionInput: getEl('edit-description'),
        editCategoryInput: getEl('edit-category'),
        saveEditBtn: getEl('save-edit-btn'),

        // Edit Recurring Income Modal
        editIncomeModal: getModal('editRecurringIncomeModal'),
        editIncomeIndexInput: getEl('edit-income-index'),
        editIncomeDayInput: getEl('edit-income-day'),
        editIncomeAmountInput: getEl('edit-income-amount'),
        saveEditIncomeBtn: getEl('save-edit-income-btn'),

        // Edit Fixed Expense Modal
        editExpenseModal: getModal('editFixedExpenseModal'),
        editExpenseIndexInput: getEl('edit-expense-index'),
        editExpenseDescInput: getEl('edit-expense-desc'),
        editExpenseAmountInput: getEl('edit-expense-amount'),
        saveEditExpenseBtn: getEl('save-edit-expense-btn'),

        // New Elements
        targetDateInput: getEl('target-date'),
        searchInput: getEl('search-input'),
        filterCategory: getEl('filter-category'),
        customCategoryInput: getEl('custom-category'),
        editCustomCategoryInput: getEl('edit-custom-category')
    };

    console.log('Elements initialized:', elements);
}


// Add touch event listeners to content area
document.addEventListener('DOMContentLoaded', () => {
    const contentArea = document.getElementById('content-area');

    contentArea.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    contentArea.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
});


function updateBalance() {
    const balance = calculateBalance(state.transactions) + state.settings.currentBalance;
    elements.balanceDisplay.textContent = formatCurrency(balance, state.settings);
}

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'];

function getUniqueCategories() {
    const transactionCategories = new Set(state.transactions.map(t => t.category));
    const allCategories = new Set([...DEFAULT_CATEGORIES, ...transactionCategories]);
    return Array.from(allCategories).sort();
}

function updateCategoryOptions() {
    const categories = getUniqueCategories();

    // Helper to populate select
    const populate = (selectElement) => {
        const currentValue = selectElement.value;
        selectElement.innerHTML = '<option value="">Choose...</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            selectElement.appendChild(option);
        });
        // Add "Other" if not present (though it should be in defaults)
        if (!categories.includes('Other')) {
            const option = document.createElement('option');
            option.value = 'Other';
            option.textContent = 'Other';
            selectElement.appendChild(option);
        }

        // Restore value if possible
        if (categories.includes(currentValue) || currentValue === 'Other') {
            selectElement.value = currentValue;
        }
    };

    populate(elements.categoryInput);
    populate(elements.editCategoryInput);

    // Populate Filter
    const filterValue = elements.filterCategory.value;
    elements.filterCategory.innerHTML = '<option value="all">All</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        elements.filterCategory.appendChild(option);
    });
    elements.filterCategory.value = filterValue;
}

function handleCategoryChange(e) {
    const select = e.target;
    const isEdit = select.id === 'edit-category';
    const customInput = isEdit ? elements.editCustomCategoryInput : elements.customCategoryInput;

    if (select.value === 'Other') {
        customInput.classList.remove('d-none');
        customInput.focus();
    } else {
        customInput.classList.add('d-none');
    }
}

function addTransaction(type) {
    const amount = parseFloat(elements.amountInput.value);
    const description = elements.descriptionInput.value;
    let category = elements.categoryInput.value;
    const date = elements.dateInput.value;

    if (category === 'Other') {
        category = elements.customCategoryInput.value.trim();
    }

    if (!date || !amount || !description || !category) {
        showToast('Please fill out all fields', 'warning');
        return;
    }

    const transaction = {
        id: Date.now(),
        date,
        type,
        amount,
        description,
        category
    };

    state.transactions.push(transaction);
    saveDB(state);

    updateCategoryOptions(); // Update categories in case a new one was added
    filterAndRenderTransactions(); // Render with current filters
    updateBalance();

    elements.amountInput.value = '';
    elements.descriptionInput.value = '';
    elements.categoryInput.value = '';
    elements.customCategoryInput.value = '';
    elements.customCategoryInput.classList.add('d-none');
    // Keep date as is for convenience
}

function deleteTransaction(id) {
    state.transactions = state.transactions.filter(t => t.id !== id);
    saveDB(state);
    updateCategoryOptions();
    filterAndRenderTransactions();
    updateBalance();
}

function editTransaction(id) {
    const transaction = state.transactions.find(t => t.id === id);
    if (!transaction) return;

    elements.editIdInput.value = transaction.id;
    elements.editDateInput.value = transaction.date || new Date().toISOString().split('T')[0];
    elements.editAmountInput.value = transaction.amount;
    elements.editDescriptionInput.value = transaction.description;

    // Handle Category
    updateCategoryOptions(); // Ensure options are up to date
    const categories = getUniqueCategories();
    if (categories.includes(transaction.category)) {
        elements.editCategoryInput.value = transaction.category;
        elements.editCustomCategoryInput.classList.add('d-none');
    } else {
        elements.editCategoryInput.value = 'Other';
        elements.editCustomCategoryInput.value = transaction.category;
        elements.editCustomCategoryInput.classList.remove('d-none');
    }

    elements.editModal.show();
}

function saveEditedTransaction() {
    const id = parseInt(elements.editIdInput.value, 10);
    const transaction = state.transactions.find(t => t.id === id);
    if (!transaction) return;

    transaction.date = elements.editDateInput.value;
    transaction.amount = parseFloat(elements.editAmountInput.value);
    transaction.description = elements.editDescriptionInput.value;

    let category = elements.editCategoryInput.value;
    if (category === 'Other') {
        category = elements.editCustomCategoryInput.value.trim();
    }
    transaction.category = category;

    saveDB(state);
    updateCategoryOptions();
    filterAndRenderTransactions();
    updateBalance();
    elements.editModal.hide();
}

function filterAndRenderTransactions() {
    const query = elements.searchInput.value.toLowerCase();
    const categoryFilter = elements.filterCategory.value;

    const filtered = state.transactions.filter(t => {
        const matchesQuery = t.description.toLowerCase().includes(query) ||
            t.category.toLowerCase().includes(query) ||
            t.amount.toString().includes(query);
        const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

        return matchesQuery && matchesCategory;
    });

    renderTransactions(filtered);
}

function handleTransactionActions(e) {
    const target = e.target;
    const listItem = target.closest('li');
    if (!listItem) return;

    const transactionId = parseInt(listItem.dataset.id, 10);

    if (target.classList.contains('delete-btn')) {
        deleteTransaction(transactionId);
    } else if (target.classList.contains('edit-btn')) {
        editTransaction(transactionId);
    }
}

function switchTab(tabId) {
    // Haptic feedback for mobile devices
    if ('vibrate' in navigator) {
        navigator.vibrate(10); // Short vibration (10ms)
    }

    // Update Nav Links
    elements.navLinks.forEach(link => {
        if (link.dataset.tab === tabId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Update Tab Content with fade effect
    elements.tabContents.forEach(content => {
        if (content.id === tabId) {
            content.classList.remove('d-none');
            // Trigger reflow to restart animation
            void content.offsetWidth;
            content.classList.add('fade-in');
        } else {
            content.classList.add('d-none');
        }
    });

    // Trigger specific renders if needed
    if (tabId === 'tab-stats') {
        renderCharts(state.transactions, state.settings, state.timeRange, state.includeFixedExpenses);
        updateProjections();
    }
    // Removed loadSettings() call - settings are now auto-saved
}

function updateProjections() {
    const projections = calculateProjections(state.transactions, state.settings, state.timeRange, state.includeFixedExpenses);

    // Add disclaimer for 'This Month'
    const spentPerDayLabel = document.querySelector('#spent-per-day').previousElementSibling;
    if (state.timeRange === 'this-month') {
        spentPerDayLabel.innerHTML = 'Spent Per Day <small class="text-muted" style="font-size: 0.6em;">*This Month</small>';
    } else {
        spentPerDayLabel.textContent = 'Spent Per Day';
    }

    document.getElementById('spend-to-date').textContent = formatCurrency(projections.spendToDate, state.settings);
    document.getElementById('spent-per-day').textContent = formatCurrency(projections.spentPerDay, state.settings);

    // Only show monthly projections if 'this-month'
    if (state.timeRange === 'this-month') {
        document.getElementById('monthly-spent-projection').textContent = formatCurrency(projections.monthlySpentProjection, state.settings);
        document.getElementById('net-monthly-projection').textContent = formatCurrency(projections.netMonthlyProjection, state.settings);
        document.getElementById('time-to-reach-target').textContent = projections.timeToReachTarget;
    } else {
        document.getElementById('monthly-spent-projection').textContent = '-';
        document.getElementById('net-monthly-projection').textContent = '-';
        document.getElementById('time-to-reach-target').textContent = '-';
    }
}

function saveNotes() {
    state.settings.fieldTestNotes = elements.fieldTestNotes.value;
    saveDB(state);
    showToast('Notes saved successfully!', 'success');
}

function loadSettings() {
    elements.currentBalanceInput.value = state.settings.currentBalance || 0;
    elements.targetCashInput.value = state.settings.targetCash || 0;
    elements.targetDateInput.value = state.settings.targetDate || '';
    elements.thousandsSuffixToggle.checked = state.settings.useThousandsSuffix || false;
    elements.fieldTestNotes.value = state.settings.fieldTestNotes || '';
    renderRecurringIncomes();
    renderFixedExpenses();
}

function renderRecurringIncomes() {
    elements.recurringIncomesList.innerHTML = '';

    if (state.settings.recurringIncomes.length === 0) {
        elements.recurringIncomesList.innerHTML = `
            <div class="text-center text-muted py-3" style="font-size: 0.875rem;">
                <i class="bi bi-calendar-plus" style="font-size: 2rem; opacity: 0.3;"></i>
                <p class="mb-0 mt-2">No recurring incomes yet</p>
            </div>
        `;
        return;
    }

    state.settings.recurringIncomes.forEach((income, index) => {
        const div = document.createElement('div');
        div.className = 'input-group mb-2';
        div.innerHTML = `
            <span class="input-group-text">Day ${income.day}</span>
            <span class="input-group-text">$${income.amount}</span>
            <button class="btn btn-outline-primary btn-sm" onclick="window.editRecurringIncome(${index})">✏️</button>
            <button class="btn btn-outline-danger btn-sm" onclick="window.deleteRecurringIncome(${index})">🗑️</button>
        `;
        elements.recurringIncomesList.appendChild(div);
    });
}

function renderFixedExpenses() {
    elements.fixedExpensesList.innerHTML = '';

    if (state.settings.fixedExpenses.length === 0) {
        elements.fixedExpensesList.innerHTML = `
            <div class="text-center text-muted py-3" style="font-size: 0.875rem;">
                <i class="bi bi-receipt" style="font-size: 2rem; opacity: 0.3;"></i>
                <p class="mb-0 mt-2">No fixed expenses yet</p>
            </div>
        `;
        return;
    }

    state.settings.fixedExpenses.forEach((expense, index) => {
        const div = document.createElement('div');
        div.className = 'input-group mb-2';
        div.innerHTML = `
            <span class="input-group-text">${expense.description}</span>
            <span class="input-group-text">$${expense.amount}</span>
            <button class="btn btn-outline-primary btn-sm" onclick="window.editFixedExpense(${index})">✏️</button>
            <button class="btn btn-outline-danger btn-sm" onclick="window.deleteFixedExpense(${index})">🗑️</button>
        `;
        elements.fixedExpensesList.appendChild(div);
    });
}

// Expose delete functions to window for onclick access
window.deleteRecurringIncome = (index) => {
    state.settings.recurringIncomes.splice(index, 1);
    saveDB(state);
    renderRecurringIncomes();
};

window.deleteFixedExpense = (index) => {
    state.settings.fixedExpenses.splice(index, 1);
    saveDB(state);
    renderFixedExpenses();
};

// Edit functions for settings
window.editRecurringIncome = (index) => {
    const income = state.settings.recurringIncomes[index];
    elements.editIncomeIndexInput.value = index;
    elements.editIncomeDayInput.value = income.day;
    elements.editIncomeAmountInput.value = income.amount;
    elements.editIncomeModal.show();
};

window.editFixedExpense = (index) => {
    const expense = state.settings.fixedExpenses[index];
    elements.editExpenseIndexInput.value = index;
    elements.editExpenseDescInput.value = expense.description;
    elements.editExpenseAmountInput.value = expense.amount;
    elements.editExpenseModal.show();
};

function saveEditedRecurringIncome() {
    const index = parseInt(elements.editIncomeIndexInput.value);
    const day = parseInt(elements.editIncomeDayInput.value);
    const amount = parseFloat(elements.editIncomeAmountInput.value);

    if (day > 0 && day <= 31 && amount > 0) {
        state.settings.recurringIncomes[index] = { day, amount };
        saveDB(state);
        renderRecurringIncomes();
        elements.editIncomeModal.hide();
    } else {
        showToast('Invalid day or amount', 'error');
    }
}

function saveEditedFixedExpense() {
    const index = parseInt(elements.editExpenseIndexInput.value);
    const description = elements.editExpenseDescInput.value.trim();
    const amount = parseFloat(elements.editExpenseAmountInput.value);

    if (description && amount > 0) {
        state.settings.fixedExpenses[index] = { description, amount };
        saveDB(state);
        renderFixedExpenses();
        elements.editExpenseModal.hide();
    } else {
        showToast('Invalid description or amount', 'error');
    }
}

function addRecurringIncome() {
    const day = parseInt(elements.recurringIncomeDay.value);
    const amount = parseFloat(elements.recurringIncomeAmount.value);
    if (day > 0 && day <= 31 && amount > 0) {
        state.settings.recurringIncomes.push({ day, amount });
        saveDB(state);
        renderRecurringIncomes();
        elements.recurringIncomeDay.value = '';
        elements.recurringIncomeAmount.value = '';
    }
}

function addFixedExpense() {
    const description = elements.fixedExpenseDesc.value;
    const amount = parseFloat(elements.fixedExpenseAmount.value);
    if (description && amount > 0) {
        state.settings.fixedExpenses.push({ description, amount });
        saveDB(state);
        renderFixedExpenses();
        elements.fixedExpenseDesc.value = '';
        elements.fixedExpenseAmount.value = '';
    }
}

function exportCSV() {
    const rows = [['Date', 'Type', 'Category', 'Description', 'Amount']];
    state.transactions.forEach(t => {
        rows.push([t.date, t.type, t.category, t.description, t.amount]);
    });
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "luna_transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function importCSV(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const text = e.target.result;
                const rows = text.split('\n').slice(1); // Skip header
                rows.forEach(row => {
                    const cols = row.split(',');
                    if (cols.length >= 5) {
                        state.transactions.push({
                            id: Date.now() + Math.random(), // Ensure unique ID
                            date: cols[0],
                            type: cols[1],
                            category: cols[2],
                            description: cols[3],
                            amount: parseFloat(cols[4])
                        });
                    }
                });
                loadDB();
                renderTransactions(state.transactions);
                updateBalance();
                showToast('Data imported successfully!', 'success');
            } catch (error) {
                showToast('Import failed. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    initializeElements();

    const db = loadDB();
    state.transactions = db.transactions || [];
    state.settings = db.settings;

    // Set default date to today
    if (elements.dateInput) {
        elements.dateInput.value = new Date().toISOString().split('T')[0];
    }

    renderTransactions(state.transactions);
    loadSettings();
    updateBalance();
    updateCategoryOptions();

    // Initial Chart Render
    renderCharts(state.transactions, state.settings, state.timeRange, state.includeFixedExpenses);

    // Event Listeners
    if (elements.addExpenseBtn) elements.addExpenseBtn.addEventListener('click', () => addTransaction('expense'));
    if (elements.addIncomeBtn) elements.addIncomeBtn.addEventListener('click', () => addTransaction('income'));
    if (elements.transactionList) elements.transactionList.addEventListener('click', handleTransactionActions);
    if (elements.addRecurringIncomeBtn) elements.addRecurringIncomeBtn.addEventListener('click', addRecurringIncome);
    if (elements.addFixedExpenseBtn) elements.addFixedExpenseBtn.addEventListener('click', addFixedExpense);
    if (elements.exportCsvBtn) elements.exportCsvBtn.addEventListener('click', exportCSV);
    if (elements.importCsvInput) elements.importCsvInput.addEventListener('change', importCSV);
    if (elements.saveEditBtn) elements.saveEditBtn.addEventListener('click', saveEditedTransaction);
    if (elements.saveEditIncomeBtn) elements.saveEditIncomeBtn.addEventListener('click', saveEditedRecurringIncome);
    if (elements.saveEditExpenseBtn) elements.saveEditExpenseBtn.addEventListener('click', saveEditedFixedExpense);
    if (elements.saveNotesBtn) elements.saveNotesBtn.addEventListener('click', saveNotes);

    // Search and Filter
    if (elements.searchInput) elements.searchInput.addEventListener('input', filterAndRenderTransactions);
    if (elements.filterCategory) elements.filterCategory.addEventListener('change', filterAndRenderTransactions);

    // Dynamic Categories
    if (elements.categoryInput) elements.categoryInput.addEventListener('change', handleCategoryChange);
    if (elements.editCategoryInput) elements.editCategoryInput.addEventListener('change', handleCategoryChange);

    // Tab Navigation
    if (elements.navLinks) {
        elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = link.dataset.tab;
                switchTab(tabId);
            });
        });
    }

    // Initial Tab
    switchTab('tab-home');

    // Time Range Filter
    document.querySelectorAll('.dropdown-item[data-range]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            // Update active state
            document.querySelectorAll('.dropdown-item[data-range]').forEach(i => i.classList.remove('active'));
            e.target.classList.add('active');

            // Update state and re-render
            state.timeRange = e.target.dataset.range;
            renderCharts(state.transactions, state.settings, state.timeRange, state.includeFixedExpenses);
            updateProjections();
        });
    });

    // Fixed Expenses Toggle
    const fixedExpensesToggle = document.getElementById('includeFixedExpenses');
    if (fixedExpensesToggle) {
        fixedExpensesToggle.addEventListener('change', (e) => {
            state.includeFixedExpenses = e.target.checked;
            renderCharts(state.transactions, state.settings, state.timeRange, state.includeFixedExpenses);
            updateProjections();
        });
    }

    // Auto-save settings on change
    if (elements.currentBalanceInput) {
        elements.currentBalanceInput.addEventListener('blur', () => {
            const value = parseFloat(elements.currentBalanceInput.value);
            if (!isNaN(value)) {
                state.settings.currentBalance = value;
                saveDB(state);
                updateBalance();
            }
        });
    }

    if (elements.targetCashInput) {
        elements.targetCashInput.addEventListener('blur', () => {
            const value = parseFloat(elements.targetCashInput.value);
            if (!isNaN(value)) {
                state.settings.targetCash = value;
                saveDB(state);
            }
        });
    }

    if (elements.targetDateInput) {
        elements.targetDateInput.addEventListener('change', () => {
            state.settings.targetDate = elements.targetDateInput.value;
            saveDB(state);
        });
    }

    if (elements.thousandsSuffixToggle) {
        elements.thousandsSuffixToggle.addEventListener('change', () => {
            state.settings.useThousandsSuffix = elements.thousandsSuffixToggle.checked;
            saveDB(state);
            updateBalance(); // Refresh balance display with new format
        });
    }

    // Make functions global for HTML event handlers
    window.switchTab = switchTab;
    window.editRecurringIncome = editRecurringIncome;
    window.deleteRecurringIncome = deleteRecurringIncome;
    window.editFixedExpense = editFixedExpense;
    window.deleteFixedExpense = deleteFixedExpense;
    window.editTransaction = editTransaction;
    window.deleteTransaction = deleteTransaction;
}

