import { saveDB, loadDB } from './storage.js';
import { renderTransactions } from './ui.js';
import { renderCharts } from './charts.js';
import { calculateBalance, calculateProjections, formatCurrency } from './calculator.js';

const elements = {
    addExpenseBtn: document.getElementById('add-expense-btn'),
    addIncomeBtn: document.getElementById('add-income-btn'),
    amountInput: document.getElementById('amount'),
    dateInput: document.getElementById('transaction-date'),
    descriptionInput: document.getElementById('description'),
    categoryInput: document.getElementById('category'),
    transactionList: document.querySelector('#history .list-group'),
    saveSettingsBtn: document.getElementById('save-settings-btn'),
    currentBalanceInput: document.getElementById('current-balance'),
    targetCashInput: document.getElementById('target-cash'),
    thousandsSuffixToggle: document.getElementById('thousands-suffix-toggle'),
    recurringIncomesList: document.getElementById('recurring-incomes-list'),
    addRecurringIncomeBtn: document.getElementById('add-recurring-income-btn'),
    recurringIncomeDay: document.getElementById('recurring-income-day'),
    recurringIncomeAmount: document.getElementById('recurring-income-amount'),
    fixedExpensesList: document.getElementById('fixed-expenses-list'),
    addFixedExpenseBtn: document.getElementById('add-fixed-expense-btn'),
    fixedExpenseDesc: document.getElementById('fixed-expense-desc'),
    fixedExpenseAmount: document.getElementById('fixed-expense-amount'),
    exportCsvBtn: document.getElementById('export-csv-btn'),
    importCsvInput: document.getElementById('import-csv-input'),
    balanceDisplay: document.getElementById('current-balance-display'),
    fieldTestNotes: document.getElementById('field-test-notes'),
    // Nav Elements
    navLinks: document.querySelectorAll('.nav-link'),
    tabContents: document.querySelectorAll('.tab-content'),

    // Edit Modal Elements
    editModal: new bootstrap.Modal(document.getElementById('editTransactionModal')),
    editIdInput: document.getElementById('edit-id'),
    editDateInput: document.getElementById('edit-date'),
    editAmountInput: document.getElementById('edit-amount'),
    editDescriptionInput: document.getElementById('edit-description'),
    editCategoryInput: document.getElementById('edit-category'),
    saveEditBtn: document.getElementById('save-edit-btn'),

    // Edit Recurring Income Modal
    editIncomeModal: new bootstrap.Modal(document.getElementById('editRecurringIncomeModal')),
    editIncomeIndexInput: document.getElementById('edit-income-index'),
    editIncomeDayInput: document.getElementById('edit-income-day'),
    editIncomeAmountInput: document.getElementById('edit-income-amount'),
    saveEditIncomeBtn: document.getElementById('save-edit-income-btn'),

    // Edit Fixed Expense Modal
    editExpenseModal: new bootstrap.Modal(document.getElementById('editFixedExpenseModal')),
    editExpenseIndexInput: document.getElementById('edit-expense-index'),
    editExpenseDescInput: document.getElementById('edit-expense-desc'),
    editExpenseAmountInput: document.getElementById('edit-expense-amount'),
    saveEditExpenseBtn: document.getElementById('save-edit-expense-btn'),

    // New Elements
    targetDateInput: document.getElementById('target-date'),
    searchInput: document.getElementById('search-input'),
    filterCategory: document.getElementById('filter-category'),
    customCategoryInput: document.getElementById('custom-category'),
    editCustomCategoryInput: document.getElementById('edit-custom-category')
};

let state = {
    transactions: [],
    settings: {
        currentBalance: 0
    },
    timeRange: 'this-month',
    includeFixedExpenses: true
};

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

    if (!amount || !description || !category || category === 'Choose...' || !date) {
        alert('Please fill out all fields.');
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
    // Update Nav Links
    elements.navLinks.forEach(link => {
        if (link.dataset.tab === tabId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Update Tab Content
    elements.tabContents.forEach(content => {
        if (content.id === tabId) {
            content.classList.remove('d-none');
        } else {
            content.classList.add('d-none');
        }
    });

    // Trigger specific renders if needed
    if (tabId === 'tab-stats') {
        renderCharts(state.transactions, state.settings, state.timeRange, state.includeFixedExpenses);
        updateProjections();
    } else if (tabId === 'tab-settings') {
        loadSettings();
    }
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

function saveSettings() {
    const newBalance = parseFloat(elements.currentBalanceInput.value);
    const targetCash = parseFloat(elements.targetCashInput.value);
    const targetDate = elements.targetDateInput.value;

    if (!isNaN(newBalance)) {
        state.settings.currentBalance = newBalance;
        state.settings.targetCash = isNaN(targetCash) ? 0 : targetCash;
        state.settings.targetDate = targetDate;
        state.settings.useThousandsSuffix = elements.thousandsSuffixToggle.checked;
        state.settings.fieldTestNotes = elements.fieldTestNotes.value;

        saveDB(state);
        updateBalance();
        alert('Settings saved!');
        toggleSettings();
    } else {
        alert('Invalid balance.');
    }
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
        alert('Invalid day or amount');
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
        alert('Invalid description or amount');
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
            saveDB(state);
            renderTransactions(state.transactions);
            updateBalance();
            alert('Import successful!');
        };
        reader.readAsText(file);
    }
}

function init() {
    const db = loadDB();
    state.transactions = db.transactions || [];
    state.settings = db.settings;

    // Set default date to today
    elements.dateInput.value = new Date().toISOString().split('T')[0];

    renderTransactions(state.transactions);
    loadSettings();
    updateBalance();
    updateCategoryOptions();

    elements.addExpenseBtn.addEventListener('click', () => addTransaction('expense'));
    elements.addIncomeBtn.addEventListener('click', () => addTransaction('income'));
    elements.transactionList.addEventListener('click', handleTransactionActions);
    elements.addRecurringIncomeBtn.addEventListener('click', addRecurringIncome);
    elements.addFixedExpenseBtn.addEventListener('click', addFixedExpense);
    elements.exportCsvBtn.addEventListener('click', exportCSV);
    elements.importCsvInput.addEventListener('change', importCSV);
    elements.saveEditBtn.addEventListener('click', saveEditedTransaction);
    elements.saveEditIncomeBtn.addEventListener('click', saveEditedRecurringIncome);
    elements.saveEditExpenseBtn.addEventListener('click', saveEditedFixedExpense);

    // Search and Filter
    elements.searchInput.addEventListener('input', filterAndRenderTransactions);
    elements.filterCategory.addEventListener('change', filterAndRenderTransactions);

    // Dynamic Categories
    elements.categoryInput.addEventListener('change', handleCategoryChange);
    elements.editCategoryInput.addEventListener('change', handleCategoryChange);

    // Tab Navigation
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.dataset.tab;
            switchTab(tabId);
        });
    });

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
    document.getElementById('includeFixedExpenses').addEventListener('change', (e) => {
        state.includeFixedExpenses = e.target.checked;
        renderCharts(state.transactions, state.settings, state.timeRange, state.includeFixedExpenses);
        updateProjections();
    });
}

init();
