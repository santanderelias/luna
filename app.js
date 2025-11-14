const amountInputBox = document.getElementById('amountInputBox');
const transactionDate = document.getElementById('transaction-date');
const inputGroupSizingSm = document.getElementById('notesInputBox');
let transactionsArr = [];
let settings = {
    currentBalance: 0,
    paycheck1: 0,
    paycheck2: 0,
    targetCash: 0,
    fixedExpenses: []
};
let incomeExpenseChart, expenseBreakdownChart, timeToTargetChart;
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const localFormattedDate = `${year}-${month}-${day}`;
transactionDate.value = localFormattedDate;

function saveDB() {
    const data = {
        transactionsArr: transactionsArr,
        settings: settings
    };
    localStorage.setItem('DB', JSON.stringify(data));
    console.log("DB saved to localStorage.");
}

function loadDB() {
    const storedData = localStorage.getItem('DB');
    if (storedData) {
        const data = JSON.parse(storedData);
        transactionsArr = data.transactionsArr || [];
        settings = data.settings || { currentBalance: 0, paycheck1: 0, paycheck2: 0, targetCash: 0, fixedExpenses: [] };
        if (!settings.fixedExpenses) {
            settings.fixedExpenses = [];
        }
        document.getElementById('current-balance-input').value = settings.currentBalance;
        document.getElementById('paycheck1-input').value = settings.paycheck1;
        document.getElementById('paycheck2-input').value = settings.paycheck2;
        document.getElementById('target-cash-input').value = settings.targetCash;
        console.log("DB data loaded from localStorage.");
        renderFixedExpenses();
        calculateVars();
    } else {
        console.log("DB not found in localStorage. Variables remain at default values (0).");
    }
}

function clearDB() {
    localStorage.removeItem('DB');
    transactionsArr = [];
    settings = { currentBalance: 0, paycheck1: 0, paycheck2: 0, targetCash: 0, fixedExpenses: [] };
    document.getElementById('current-balance-input').value = 0;
    document.getElementById('paycheck1-input').value = 0;
    document.getElementById('paycheck2-input').value = 0;
    document.getElementById('target-cash-input').value = 0;
    console.log("All in-memory variables removed.");
    console.log("Successfully removed 'DB' from localStorage.");
    renderFixedExpenses();
    calculateVars();
}

function saveSettings() {
    settings.currentBalance = parseFloat(document.getElementById('current-balance-input').value);
    settings.paycheck1 = parseFloat(document.getElementById('paycheck1-input').value);
    settings.paycheck2 = parseFloat(document.getElementById('paycheck2-input').value);
    settings.targetCash = parseFloat(document.getElementById('target-cash-input').value);
    saveDB();
    calculateVars();
    showPage('statistics');
}

function renderFixedExpenses() {
    const fixedExpensesList = document.getElementById('fixed-expenses-list');
    fixedExpensesList.innerHTML = '';
    if (settings.fixedExpenses.length > 0) {
        const list = document.createElement('ul');
        list.className = 'list-group';
        settings.fixedExpenses.forEach((expense, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            listItem.innerHTML = `
                <span class="fixed-expense-tag">${expense.description} - ${expense.amount}</span>
                <button class="btn btn-danger btn-sm" onclick="deleteFixedExpense(${index})">Delete</button>
            `;
            list.appendChild(listItem);
        });
        fixedExpensesList.appendChild(list);
    }
}

function addFixedExpense() {
    const descriptionInput = document.getElementById('fixed-expense-description-input');
    const amountInput = document.getElementById('fixed-expense-amount-input');
    const description = descriptionInput.value;
    const amount = parseFloat(amountInput.value);

    if (description && amount > 0) {
        settings.fixedExpenses.push({ description, amount });
        saveDB();
        renderFixedExpenses();
        calculateVars();
        descriptionInput.value = '';
        amountInput.value = '';
    } else {
        alert('Please enter a valid description and amount.');
    }
}

function deleteFixedExpense(index) {
    if (confirm('Are you sure you want to delete this fixed expense?')) {
        settings.fixedExpenses.splice(index, 1);
        saveDB();
        renderFixedExpenses();
        calculateVars();
    }
}

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const page = document.getElementById(`page-${pageName}`);
    if (page) {
        page.classList.add('active');
    }

    document.querySelectorAll('.nav-button').forEach(button => {
        button.classList.remove('active');
    });
    const navButton = document.querySelector(`.nav-button[data-page="${pageName}"]`);
    if (navButton) {
        navButton.classList.add('active');
    }

    if (pageName === 'history') {
        renderTransactions();
    } else if (pageName === 'statistics') {
        renderStatisticsCharts();
    } else if (pageName === 'add-transaction') {
        amountInputBox.focus();
    }
}

function renderStatisticsCharts() {
    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
    }
    if (expenseBreakdownChart) {
        expenseBreakdownChart.destroy();
    }
    if (timeToTargetChart) {
        timeToTargetChart.destroy();
    }

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const incomeExpenseCtx = document.getElementById('incomeExpenseChart').getContext('2d');
    let totalIncome = 0;
    let totalExpenses = 0;
    const expenseCategories = {};

    transactionsArr.forEach(t => {
        const transactionDate = new Date(t.date);
        if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
            const amount = parseFloat(t.amount);
            if (t.type === 'ingreso') {
                totalIncome += amount;
            } else if (t.type === 'gasto') {
                totalExpenses += amount;
                const category = t.notes || 'Uncategorized';
                expenseCategories[category] = (expenseCategories[category] || 0) + amount;
            }
        }
    });

    incomeExpenseChart = new Chart(incomeExpenseCtx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                label: 'Current Month',
                data: [totalIncome, totalExpenses],
                backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(255, 99, 132, 0.2)'],
                borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
                borderWidth: 1
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });

    const expenseBreakdownCtx = document.getElementById('expenseBreakdownChart').getContext('2d');
    const categoryLabels = Object.keys(expenseCategories);
    const categoryData = Object.values(expenseCategories);

    expenseBreakdownChart = new Chart(expenseBreakdownCtx, {
        type: 'pie',
        data: {
            labels: categoryLabels,
            datasets: [{
                label: 'Expense Breakdown',
                data: categoryData,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)', 'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        }
    });

    const timeToTargetCtx = document.getElementById('timeToTargetChart').getContext('2d');
    const netMonthlyProjectionText = document.getElementById('netMonthlyProjection').textContent;
    const netMonthlyProjection = parseFloat(netMonthlyProjectionText);
    const currentBalanceText = document.getElementById('currentBalance').textContent;
    let currentBalance = parseFloat(currentBalanceText);

    let labels = [];
    let data = [];

    if (settings.targetCash > 0 && netMonthlyProjection > 0 && currentBalance < settings.targetCash) {
        let months = 0;
        let projectedBalance = currentBalance;

        while (projectedBalance < settings.targetCash && months <= 24) {
            const monthLabel = new Date(today.getFullYear(), today.getMonth() + months, 1).toLocaleString('default', { month: 'short', year: '2-digit' });
            labels.push(monthLabel);
            data.push(projectedBalance);

            projectedBalance += netMonthlyProjection;
            months++;
        }
        labels.push(new Date(today.getFullYear(), today.getMonth() + months, 1).toLocaleString('default', { month: 'short', year: '2-digit' }));
        data.push(settings.targetCash);
    }

    timeToTargetChart = new Chart(timeToTargetCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Projected Balance',
                data: data,
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1
            }, {
                label: 'Target',
                data: Array(data.length).fill(settings.targetCash),
                borderColor: 'rgba(255, 99, 132, 1)',
                borderDash: [5, 5],
                fill: false
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

function saveTransaction() {
    if(inputGroupSizingSm.value == "" || undefined){
        inputGroupSizingSm.value = 'Sin Notas'
    }
    if(transactionDate.value == "" || undefined){
        transactionDate.value = localFormattedDate;
    }
       if(amountInputBox.value == "" || undefined){
        window.alert('Invalid amount');
        return;
    }
  const transaction = {
    amount: amountInputBox.value,
    date: transactionDate.value,
    type: 'gasto',
    notes: inputGroupSizingSm.value
  };
  transactionsArr.push(transaction);
  saveDB()
    amountInputBox.value = ''
    transactionDate.value = localFormattedDate;
    inputGroupSizingSm.value = ''
    calculateVars();
    showPage('history');
}

function addIncome() {
    const amountInput = document.getElementById('income-amount-input');
    const notesInput = document.getElementById('income-notes-input');
    const amount = parseFloat(amountInput.value);
    const notes = notesInput.value;

    if (amount > 0) {
        const transaction = {
            amount: amount,
            date: localFormattedDate,
            type: 'ingreso',
            notes: notes || 'Income'
        };
        transactionsArr.push(transaction);
        saveDB();
        renderTransactions();
        calculateVars();
        renderStatisticsCharts();
        amountInput.value = '';
        notesInput.value = '';
    } else {
        alert('Please enter a valid amount for income.');
    }
}

function getRelativeDateString(date) {
    const today = new Date();
    const transactionDate = new Date(date);

    today.setHours(0, 0, 0, 0);
    transactionDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - transactionDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return "Today";
    } else if (diffDays === 1) {
        return "Yesterday";
    } else if (diffDays <= 7) {
        return "This Week";
    } else if (diffDays <= 14) {
        return "Last Week";
    } else if (transactionDate.getMonth() === today.getMonth() && transactionDate.getFullYear() === today.getFullYear()) {
        return "This Month";
    } else {
        return transactionDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
}

function renderTransactions() {
  const tableBody = document.getElementById('transactionHistoryVisibilityTable').getElementsByTagName('tbody')[0];
  tableBody.innerHTML = '';

  const sortedTransactions = [...transactionsArr].sort((a, b) => new Date(b.date) - new Date(a.date));

  const groupedTransactions = sortedTransactions.reduce((groups, transaction) => {
    const relativeDate = getRelativeDateString(transaction.date);
    if (!groups[relativeDate]) {
      groups[relativeDate] = [];
    }
    groups[relativeDate].push(transaction);
    return groups;
  }, {});

  for (const groupName in groupedTransactions) {
    const headerRow = tableBody.insertRow();
    headerRow.className = 'date-group';
    const headerCell = headerRow.insertCell(0);
    headerCell.colSpan = 4;
    headerCell.innerHTML = `<span class="date-group-tag">${groupName}</span>`;

    groupedTransactions[groupName].forEach(transaction => {
      const newRow = tableBody.insertRow();
      newRow.className = 'transaction-row';

      if (transaction.type === 'ingreso') {
        newRow.classList.add('table-success');
      } else if (transaction.type === 'gasto') {
        newRow.classList.add('table-danger');
      }

      const cell1 = newRow.insertCell(0);
      const cell2 = newRow.insertCell(1);
      const cell3 = newRow.insertCell(2);
      const cell4 = newRow.insertCell(3);

      const originalIndex = transactionsArr.indexOf(transaction);

      cell1.innerHTML = transaction.date.substring(5);
      cell2.innerHTML = transaction.amount;
      cell2.classList.add('amount');
      cell3.innerHTML = transaction.notes;

      const editButton = document.createElement('span');
      editButton.textContent = '✏️';
      editButton.className = 'action-emoji';
      editButton.onclick = () => editTransaction(originalIndex);
      cell4.appendChild(editButton);

      const deleteButton = document.createElement('span');
      deleteButton.textContent = '🚫';
      deleteButton.className = 'action-emoji';
      deleteButton.onclick = () => deleteTransaction(originalIndex);
      cell4.appendChild(deleteButton);
    });
  }
}

function deleteTransaction(index) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactionsArr.splice(index, 1);
        saveDB();
        renderTransactions();
        calculateVars();
        renderStatisticsCharts();
    }
}

function editTransaction(index) {
  const transaction = transactionsArr[index];

  document.getElementById('edit-transaction-index').value = index;
  document.getElementById('edit-transaction-date').value = transaction.date;
  document.getElementById('edit-transaction-amount').value = transaction.amount;
  document.getElementById('edit-transaction-notes').value = transaction.notes;

  document.querySelector(`input[name="editTransactionType"][value="${transaction.type}"]`).checked = true;

  const editModal = new bootstrap.Modal(document.getElementById('editTransactionModal'));
  editModal.show();
}

function saveEditedTransaction() {
    const index = document.getElementById('edit-transaction-index').value;
    const newDate = document.getElementById('edit-transaction-date').value;
    const newType = document.querySelector('input[name="editTransactionType"]:checked').value;
    const newAmount = document.getElementById('edit-transaction-amount').value;
    const newNotes = document.getElementById('edit-transaction-notes').value;

    if (newAmount === "" || isNaN(newAmount)) {
        window.alert('Invalid amount');
        return;
    }

    transactionsArr[index].date = newDate;
    transactionsArr[index].type = newType;
    transactionsArr[index].amount = newAmount;
    transactionsArr[index].notes = newNotes;

    saveDB();
    renderTransactions();
    calculateVars();
    renderStatisticsCharts();

    const editModal = bootstrap.Modal.getInstance(document.getElementById('editTransactionModal'));
    editModal.hide();
}

function calculateVars() {
    const projectionDatePicker = document.getElementById('projection-date-picker');
    const projectionDate = projectionDatePicker.valueAsDate ? new Date(projectionDatePicker.valueAsDate.getTime() + projectionDatePicker.valueAsDate.getTimezoneOffset() * 60000) : null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const numberOfDaysPassed = today.getDate();

    let spendToDateThisMonth = 0;
    transactionsArr.forEach(t => {
        const transactionDate = new Date(t.date);
        if (t.type === 'gasto' && transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
            spendToDateThisMonth += parseFloat(t.amount);
        }
    });

    const spentPerDay = numberOfDaysPassed > 0 ? spendToDateThisMonth / numberOfDaysPassed : 0;
    const monthlyIncome = settings.paycheck1 + settings.paycheck2;
    const totalFixedExpenses = settings.fixedExpenses.reduce((total, expense) => total + expense.amount, 0);
    const monthlySpentProjection = (spentPerDay * daysInMonth) + totalFixedExpenses;
    const netMonthlyProjection = monthlyIncome - monthlySpentProjection;

    let currentBalance = settings.currentBalance;
    transactionsArr.forEach(t => {
        const amount = parseFloat(t.amount);
        if (t.type === 'ingreso') {
            currentBalance += amount;
        } else if (t.type === 'gasto') {
            currentBalance -= amount;
        }
    });

    document.getElementById('currentBalance').textContent = Math.trunc(currentBalance);
    document.getElementById('spendToDateThisMonth').textContent = Math.trunc(-spendToDateThisMonth);
    document.getElementById('spentPerDay').textContent = Math.trunc(-spentPerDay);
    document.getElementById('monthlySpentProjection').textContent = Math.trunc(-monthlySpentProjection);
    document.getElementById('netMonthlyProjection').textContent = Math.trunc(netMonthlyProjection);

    if (projectionDate && projectionDate >= today) {
        const daysToProjection = Math.ceil((projectionDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        const spendingToDateX = spentPerDay * daysToProjection;
        let projectedIncomeToDateX = 0;
        let paycheckCount = 0;
        let tempDate = new Date(today);
        while(tempDate <= projectionDate) {
            const dayOfMonth = tempDate.getDate();
            const lastDayOfMonth = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0).getDate();

            if (dayOfMonth === 15 && settings.paycheck1 > 0) {
                projectedIncomeToDateX += settings.paycheck1;
                paycheckCount++;
            }
            if (dayOfMonth === lastDayOfMonth && settings.paycheck2 > 0) {
                projectedIncomeToDateX += settings.paycheck2;
                paycheckCount++;
            }
            tempDate.setDate(tempDate.getDate() + 1);
        }

        const predictedCashBalanceToDateX = currentBalance - spendingToDateX + projectedIncomeToDateX;

        document.getElementById('spendingToDateX').textContent = Math.trunc(-spendingToDateX);
        document.getElementById('paychecksToDateX').textContent = `${paycheckCount} paycheck(s)`;
        document.getElementById('projectedIncomeToDateX').textContent = Math.trunc(projectedIncomeToDateX);
        document.getElementById('predictedCashBalanceToDateX').textContent = Math.trunc(predictedCashBalanceToDateX);
    } else {
        document.getElementById('spendingToDateX').textContent = "0";
        document.getElementById('paychecksToDateX').textContent = "0";
        document.getElementById('projectedIncomeToDateX').textContent = "0";
        document.getElementById('predictedCashBalanceToDateX').textContent = "0";
    }

    if (settings.targetCash > 0 && netMonthlyProjection > 0) {
        const monthsToTarget = (settings.targetCash - currentBalance) / netMonthlyProjection;
        document.getElementById('timeToReachTarget').textContent = `${Math.ceil(monthsToTarget)} months`;
    } else {
        document.getElementById('timeToReachTarget').textContent = "N/A";
    }
}

window.onload = () => {
    loadDB();
    showPage('add-transaction');

    document.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = button.getAttribute('data-page');
            showPage(pageName);
        });
    });

    document.getElementById('projection-date-picker').addEventListener('change', calculateVars);
};