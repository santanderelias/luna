const amountInputBox = document.getElementById('amountInputBox');
const transactionDate = document.getElementById('transaction-date');
const inputGroupSizingSm = document.getElementById('notesInputBox');
let transactionsArr = [];
let settings = {
    currentBalance: 0,
    targetCash: 0,
    fixedExpenses: [],
    recurringIncomes: [],
    useThousandsSuffix: false // New setting
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
        settings = data.settings || { currentBalance: 0, targetCash: 0, fixedExpenses: [], recurringIncomes: [], useThousandsSuffix: false };

        // Backward compatibility for old settings
        if (settings.paycheck1 || settings.paycheck2) {
            settings.recurringIncomes = [
                { day: 15, amount: settings.paycheck1 || 0 },
                { day: 31, amount: settings.paycheck2 || 0 }
            ].filter(income => income.amount > 0);
            delete settings.paycheck1;
            delete settings.paycheck2;
        }
        if (!settings.recurringIncomes) {
            settings.recurringIncomes = [];
        }
        if (!settings.fixedExpenses) {
            settings.fixedExpenses = [];
        }
        // Set the toggle state
        document.getElementById('thousands-suffix-toggle').checked = settings.useThousandsSuffix;

        document.getElementById('current-balance-input').value = settings.currentBalance;
        document.getElementById('target-cash-input').value = settings.targetCash;
        console.log("DB data loaded from localStorage.");
        renderFixedExpenses();
        renderRecurringIncomes();
        calculateVars();
    } else {
        console.log("DB not found in localStorage. Variables remain at default values (0).");
    }
}

function showConfirmationModal(message, buttons) {
    const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    const modalBody = document.getElementById('confirmationModalBody');
    const modalFooter = document.getElementById('confirmationModalFooter');

    modalBody.innerHTML = message; // Use innerHTML to allow for bold/other formatting
    modalFooter.innerHTML = ''; // Clear existing buttons

    // Add cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.dataset.bsDismiss = 'modal';
    cancelBtn.textContent = 'Cancel';
    modalFooter.appendChild(cancelBtn);

    // Add custom buttons
    buttons.forEach(btnConfig => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `btn ${btnConfig.class}`;
        button.textContent = btnConfig.text;
        button.addEventListener('click', () => {
            btnConfig.callback();
            confirmationModal.hide();
        });
        modalFooter.appendChild(button);
    });

    confirmationModal.show();
}

function clearDB() {
    showConfirmationModal('Are you sure you want to reset the app? This will delete all your data.', [
        {
            text: 'Confirm',
            class: 'btn-danger',
            callback: () => {
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
        }
    ]);
}

function saveSettings() {
    settings.currentBalance = parseFloat(document.getElementById('current-balance-input').value);
    settings.targetCash = parseFloat(document.getElementById('target-cash-input').value);
    settings.useThousandsSuffix = document.getElementById('thousands-suffix-toggle').checked; // Save toggle state

    const recurringIncomeDays = document.querySelectorAll('.recurring-income-day');
    const recurringIncomeAmounts = document.querySelectorAll('.recurring-income-amount');
    settings.recurringIncomes = [];
    for (let i = 0; i < recurringIncomeDays.length; i++) {
        const day = parseInt(recurringIncomeDays[i].value);
        const amount = parseFloat(recurringIncomeAmounts[i].value);
        if (day > 0 && amount > 0) {
            settings.recurringIncomes.push({ day, amount });
        }
    }

    saveDB();
    calculateVars();
    showPage('statistics');
}

function exportToCSV() {
    const headers = 'date,type,amount,notes';
    const csvContent = [
        headers,
        ...transactionsArr.map(t => `${t.date},${t.type},${t.amount},"${(t.notes || '').replace(/"/g, '""')}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
        URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'luna_transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Transactions exported successfully!', 'success');
}

function importFromCSV(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const contents = e.target.result;
        const lines = contents.split('\n').slice(1); // Skip header
        const importedTransactions = lines.map(line => {
            const parts = line.split(',');
            if (parts.length < 4) return null;
            const [date, type, amount, ...notesParts] = parts;
            const notes = notesParts.join(',').replace(/"/g, '');
            return { date, type, amount: parseFloat(amount), notes };
        }).filter(t => t && t.date && t.type && !isNaN(t.amount));

        if (importedTransactions.length === 0) {
            showToast('No valid transactions found in the file.', 'warning');
            return;
        }

        showConfirmationModal(`Found ${importedTransactions.length} transactions. Do you want to replace existing transactions or merge with them?`, [
            {
                text: 'Replace',
                class: 'btn-danger',
                callback: () => {
                    transactionsArr = importedTransactions;
                    saveDB();
                    renderTransactions();
                    calculateVars();
                    renderStatisticsCharts();
                    showToast(`${importedTransactions.length} transactions imported (Replaced).`, 'success');
                }
            },
            {
                text: 'Merge',
                class: 'btn-primary',
                callback: () => {
                    transactionsArr.push(...importedTransactions);
                    saveDB();
                    renderTransactions();
                    calculateVars();
                    renderStatisticsCharts();
                    showToast(`${importedTransactions.length} transactions imported (Merged).`, 'success');
                }
            }
        ]);
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
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
                <button class="btn btn-danger btn-sm" onclick="deleteFixedExpense(${index})">🚫</button>
            `;
            list.appendChild(listItem);
        });
        fixedExpensesList.appendChild(list);
    }
}

function renderRecurringIncomes() {
    const recurringIncomesList = document.getElementById('recurring-incomes-list');
    recurringIncomesList.innerHTML = '';
    if (settings.recurringIncomes.length > 0) {
        const list = document.createElement('ul');
        list.className = 'list-group mb-3';
        settings.recurringIncomes.forEach((income, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            listItem.innerHTML = `
                <div class="input-group">
                    <span class="input-group-text">🗓️</span>
                    <input type="number" class="form-control recurring-income-day" placeholder="Day" value="${income.day}" min="1" max="31">
                    <span class="input-group-text">💰</span>
                    <input type="number" class="form-control recurring-income-amount" placeholder="Amount" value="${income.amount}">
                    <button class="btn btn-danger" onclick="deleteRecurringIncome(${index})">🚫</button>
                </div>
            `;
            list.appendChild(listItem);
        });
        recurringIncomesList.appendChild(list);
    }
}

function addRecurringIncome() {
    settings.recurringIncomes.push({ day: 1, amount: 0 });
    renderRecurringIncomes();
}

function deleteRecurringIncome(index) {
    settings.recurringIncomes.splice(index, 1);
    renderRecurringIncomes();
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
    showConfirmationModal('Are you sure you want to delete this fixed expense?', [
        {
            text: 'Delete',
            class: 'btn-danger',
            callback: () => {
                settings.fixedExpenses.splice(index, 1);
                saveDB();
                renderFixedExpenses();
                calculateVars();
            }
        }
    ]);
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

    const monthlyRecurringIncome = settings.recurringIncomes.reduce((total, income) => total + income.amount, 0);

    const incomeExpenseCtx = document.getElementById('incomeExpenseChart').getContext('2d');
    let totalManualIncome = 0;
    let totalExpenses = 0;
    const expenseCategories = {};

    transactionsArr.forEach(t => {
        const transactionDate = new Date(t.date);
        if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
            const amount = parseFloat(t.amount);
            if (t.type === 'ingreso') {
                totalManualIncome += amount;
            } else if (t.type === 'gasto') {
                totalExpenses += amount;
                const category = t.notes || 'Uncategorized';
                expenseCategories[category] = (expenseCategories[category] || 0) + amount;
            }
        }
    });

    const totalIncome = monthlyRecurringIncome + totalManualIncome;

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

    // Render expense breakdown list
    const expenseBreakdownListDiv = document.getElementById('expense-breakdown-list');
    expenseBreakdownListDiv.innerHTML = ''; // Clear previous list

    if (categoryLabels.length > 0) {
        categoryLabels.forEach((label, index) => {
            const card = document.createElement('div');
            card.className = 'card mb-1'; // mb-1 for small margin between cards
            card.innerHTML = `
                <div class="card-body p-2">
                    <h6 class="card-title mb-0" style="font-size: 0.8rem;">${label}</h6>
                    <p class="card-text mb-0" style="font-size: 0.9rem; font-weight: bold;">$${formatNumber(categoryData[index])}</p>
                </div>
            `;
            expenseBreakdownListDiv.appendChild(card);
        });
    } else {
        expenseBreakdownListDiv.innerHTML = '<p class="text-muted text-center mt-3">No expenses this month.</p>';
    }

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
      cell2.innerHTML = formatNumber(transaction.amount);
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
    showConfirmationModal('Are you sure you want to delete this transaction?', [
        {
            text: 'Delete',
            class: 'btn-danger',
            callback: () => {
                transactionsArr.splice(index, 1);
                saveDB();
                renderTransactions();
                calculateVars();
                renderStatisticsCharts();
            }
        }
    ]);
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

function formatNumber(num) {
    if (settings.useThousandsSuffix && Math.abs(num) >= 10000) {
        return Math.trunc(num / 1000) + 'k';
    }
    return Math.trunc(num).toString();
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
    const monthlyIncome = settings.recurringIncomes.reduce((total, income) => total + income.amount, 0);
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

    document.getElementById('currentBalance').textContent = formatNumber(currentBalance);
    document.getElementById('spendToDateThisMonth').textContent = formatNumber(-spendToDateThisMonth);
    document.getElementById('spentPerDay').textContent = formatNumber(-spentPerDay);
    document.getElementById('monthlySpentProjection').textContent = formatNumber(-monthlySpentProjection);
    document.getElementById('netMonthlyProjection').textContent = formatNumber(netMonthlyProjection);

    if (projectionDate && projectionDate >= today) {
        const daysToProjection = Math.ceil((projectionDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        const spendingToDateX = spentPerDay * daysToProjection;
        let projectedIncomeToDateX = 0;
        let paycheckCount = 0;
        let tempDate = new Date(today);
        while(tempDate <= projectionDate) {
            const dayOfMonth = tempDate.getDate();
            const lastDayOfMonth = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0).getDate();

            settings.recurringIncomes.forEach(income => {
                let incomeDay = income.day;
                if (incomeDay > lastDayOfMonth) {
                    incomeDay = lastDayOfMonth;
                }
                if (dayOfMonth === incomeDay) {
                    projectedIncomeToDateX += income.amount;
                    paycheckCount++;
                }
            });
            tempDate.setDate(tempDate.getDate() + 1);
        }

        const predictedCashBalanceToDateX = currentBalance - spendingToDateX + projectedIncomeToDateX;

        document.getElementById('spendingToDateX').textContent = formatNumber(-spendingToDateX);
        document.getElementById('paychecksToDateX').textContent = `${paycheckCount} paycheck(s)`;
        document.getElementById('projectedIncomeToDateX').textContent = formatNumber(projectedIncomeToDateX);
        document.getElementById('predictedCashBalanceToDateX').textContent = formatNumber(predictedCashBalanceToDateX);
    } else {
        document.getElementById('spendingToDateX').textContent = formatNumber(0);
        document.getElementById('paychecksToDateX').textContent = "0";
        document.getElementById('projectedIncomeToDateX').textContent = formatNumber(0);
        document.getElementById('predictedCashBalanceToDateX').textContent = formatNumber(0);
    }

    if (settings.targetCash > 0 && netMonthlyProjection > 0) {
        const monthsToTarget = (settings.targetCash - currentBalance) / netMonthlyProjection;
        document.getElementById('timeToReachTarget').textContent = `${Math.ceil(monthsToTarget)} months`;
    } else {
        document.getElementById('timeToReachTarget').textContent = "N/A";
    }
}

function showToast(message, type = 'info', options = {}) {
    const toastContainer = document.querySelector('.toast-container');
    const toastTemplate = document.getElementById('toast-template');

    const toastEl = toastTemplate.content.cloneNode(true).firstElementChild;
    const toastBody = toastEl.querySelector('.toast-body');

    toastBody.innerHTML = message; // Use innerHTML to allow for buttons

    // Add color class
    const colorClasses = {
        success: 'bg-success text-white',
        info: 'bg-info text-dark',
        warning: 'bg-warning text-dark',
        danger: 'bg-danger text-white',
    };
    if (colorClasses[type]) {
        toastEl.classList.add(...colorClasses[type].split(' '));
    }

    toastContainer.appendChild(toastEl);

    const toast = new bootstrap.Toast(toastEl, {
        autohide: options.autohide !== false,
        delay: options.delay || 5000
    });

    toast.show();

    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });

    return toastEl;
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
    document.getElementById('export-csv-btn').addEventListener('click', exportToCSV);
    document.getElementById('import-csv-input').addEventListener('change', importFromCSV);
};
