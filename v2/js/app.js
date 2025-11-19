import { saveDB, loadDB } from './storage.js';
import { renderTransactions } from './ui.js';
import { renderIncomeExpenseChart } from './charts.js';
import { calculateBalance } from './calculator.js';

const elements = {
    addExpenseBtn: document.getElementById('add-expense-btn'),
    addIncomeBtn: document.getElementById('add-income-btn'),
    amountInput: document.getElementById('amount'),
    descriptionInput: document.getElementById('description'),
    categoryInput: document.getElementById('category'),
    transactionList: document.querySelector('#history .list-group'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsPanel: document.getElementById('settings'),
    saveSettingsBtn: document.getElementById('save-settings-btn'),
    currentBalanceInput: document.getElementById('current-balance'),
    statsBtn: document.getElementById('stats-btn'),
    statsPanel: document.getElementById('statistics'),
    balanceDisplay: document.getElementById('current-balance-display')
};

let state = {
    transactions: [],
    settings: {
        currentBalance: 0
    }
};

function updateBalance() {
    const balance = calculateBalance(state.transactions) + state.settings.currentBalance;
    elements.balanceDisplay.textContent = `$${balance.toFixed(2)}`;
}

function addTransaction(type) {
    const amount = parseFloat(elements.amountInput.value);
    const description = elements.descriptionInput.value;
    const category = elements.categoryInput.value;

    if (!amount || !description || category === 'Choose...') {
        alert('Please fill out all fields.');
        return;
    }

    const transaction = {
        id: Date.now(),
        type,
        amount,
        description,
        category
    };

    state.transactions.push(transaction);
    saveDB(state);
    renderTransactions(state.transactions);
    updateBalance();

    elements.amountInput.value = '';
    elements.descriptionInput.value = '';
    elements.categoryInput.value = 'Choose...';
}

function deleteTransaction(id) {
    state.transactions = state.transactions.filter(t => t.id !== id);
    saveDB(state);
    renderTransactions(state.transactions);
    updateBalance();
}

function editTransaction(id) {
    const transaction = state.transactions.find(t => t.id === id);
    if (!transaction) return;

    const newDescription = prompt('Enter new description:', transaction.description);
    const newAmount = parseFloat(prompt('Enter new amount:', transaction.amount));

    if (newDescription) transaction.description = newDescription;
    if (!isNaN(newAmount)) transaction.amount = newAmount;

    saveDB(state);
    renderTransactions(state.transactions);
    updateBalance();
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

function toggleSettings() {
    elements.settingsPanel.classList.toggle('d-none');
}

function toggleStats() {
    elements.statsPanel.classList.toggle('d-none');
    if (!elements.statsPanel.classList.contains('d-none')) {
        renderIncomeExpenseChart(state.transactions);
    }
}

function saveSettings() {
    const newBalance = parseFloat(elements.currentBalanceInput.value);
    if (!isNaN(newBalance)) {
        state.settings.currentBalance = newBalance;
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
}

function init() {
    const db = loadDB();
    const defaultSettings = { currentBalance: 0 };
    state.transactions = db.transactions || [];
    state.settings = { ...defaultSettings, ...(db.settings || {}) };

    renderTransactions(state.transactions);
    loadSettings();
    updateBalance();

    elements.addExpenseBtn.addEventListener('click', () => addTransaction('expense'));
    elements.addIncomeBtn.addEventListener('click', () => addTransaction('income'));
    elements.transactionList.addEventListener('click', handleTransactionActions);
    elements.settingsBtn.addEventListener('click', toggleSettings);
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
    elements.statsBtn.addEventListener('click', toggleStats);
}

init();
