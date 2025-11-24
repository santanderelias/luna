const amountInputBox = document.getElementById('amountInputBox');
const transactionDate = document.getElementById('transaction-date');
const notesSelectBox = document.getElementById('notesSelectBox');
const manualNotesInputGroup = document.getElementById('manualNotesInputGroup');
const notesManualInputBox = document.getElementById('notesManualInputBox');
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
        // document.getElementById('thousands-suffix-toggle').checked = settings.useThousandsSuffix; // Removed this line

        // document.getElementById('current-balance-input').value = settings.currentBalance; // Removed
        // document.getElementById('target-cash-input').value = settings.targetCash; // Removed
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

function saveGeneralSetting(settingName) {
    if (settingName === 'currentBalance') {
        settings.currentBalance = parseFloat(document.getElementById('editCurrentBalanceInput').value);
    } else if (settingName === 'targetCash') {
        settings.targetCash = parseFloat(document.getElementById('editTargetCashInput').value);
    }

    saveDB();
    calculateVars();
    renderStatisticsCharts();
    renderTransactions();
    toggleGeneralSettingEditMode(settingName, false); // Switch back to display mode
    showToast(`${settingName} saved!`, 'success');
}

function toggleGeneralSettingEditMode(settingName, isEditMode) {
    const displayGroup = document.getElementById(`${settingName}DisplayGroup`);
    const editGroup = document.getElementById(`${settingName}EditGroup`);
    const displaySpan = document.getElementById(`display${settingName.charAt(0).toUpperCase() + settingName.slice(1)}`);
    const editInput = document.getElementById(`edit${settingName.charAt(0).toUpperCase() + settingName.slice(1)}Input`);

    if (isEditMode) {
        // Switch to edit mode
        displayGroup.style.display = 'none';
        editGroup.style.display = 'flex';
        editInput.value = settings[settingName]; // Populate input with current value
        editInput.focus();
    } else {
        // Switch to display mode (or cancel edit)
        displayGroup.style.display = 'flex';
        editGroup.style.display = 'none';
        displaySpan.textContent = formatNumber(settings[settingName]); // Update display with current value
    }
}

function toggleRecurringIncomeEditMode(index, isEditMode) {
    const displayDiv = document.getElementById(`recurring-income-display-${index}`);
    const editDiv = document.getElementById(`recurring-income-edit-${index}`);

    if (isEditMode) {
        displayDiv.style.display = 'none';
        editDiv.style.display = 'flex';
    } else {
        displayDiv.style.display = 'flex';
        editDiv.style.display = 'none';
        // Re-render the list to ensure values are reset if cancelled
        renderRecurringIncomes();
    }
}

function addRecurringIncome() {
    const dayInput = document.getElementById('recurring-income-day-input');
    const amountInput = document.getElementById('recurring-income-amount-input');
    const day = parseInt(dayInput.value);
    const amount = parseFloat(amountInput.value);

    if (day > 0 && day <= 31 && amount > 0) {
        settings.recurringIncomes.push({ day, amount });
        saveDB(); // Save the new item
        renderRecurringIncomes(); // Re-render to show the new item
        calculateVars();
        renderStatisticsCharts();
        renderTransactions();
        dayInput.value = '';
        amountInput.value = '';
        showToast('Recurring income added!', 'success');
    } else {
        showToast('Please enter a valid day (1-31) and amount.', 'warning');
    }
}

function deleteRecurringIncome(index) {
    settings.recurringIncomes.splice(index, 1);
    saveDB(); // Save after deleting
    renderRecurringIncomes(); // Re-render to reflect changes
    calculateVars();
    renderStatisticsCharts();
    renderTransactions();
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
    } else if (pageName === 'settings') { // New: Set toggle state when settings page is shown
        const thousandsSuffixToggle = document.getElementById('thousands-suffix-toggle');
        if (thousandsSuffixToggle) {
            thousandsSuffixToggle.checked = settings.useThousandsSuffix;
        }
        toggleGeneralSettingEditMode('currentBalance', false); // Initialize Current Balance in display mode
        toggleGeneralSettingEditMode('targetCash', false);     // Initialize Target Cash in display mode
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

    // Include fixed expenses in the breakdown for the current month
    settings.fixedExpenses.forEach(expense => {
        totalExpenses += expense.amount; // Add to total expenses for the month
        const category = expense.description || 'Fixed Expense';
        expenseCategories[category] = (expenseCategories[category] || 0) + expense.amount;
    });

    const totalIncome = monthlyRecurringIncome + totalManualIncome;

    // Replace incomeExpenseChart with Daily Balance Chart
    const dailyBalanceCtx = document.getElementById('incomeExpenseChart').getContext('2d');
    let dailyLabels = [];
    let dailyBalances = [];

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const numDaysInMonth = lastDayOfMonth.getDate();

    // Calculate balance up to the start of the current month
    let balanceBeforeMonth = settings.currentBalance;
    transactionsArr.forEach(t => {
        const transactionDate = new Date(t.date);
        if (transactionDate < firstDayOfMonth) {
            const amount = parseFloat(t.amount);
            if (t.type === 'ingreso') {
                balanceBeforeMonth += amount;
            } else if (t.type === 'gasto') {
                balanceBeforeMonth -= amount;
            }
        }
    });

    let currentDailyBalance = balanceBeforeMonth;

    for (let day = 1; day <= numDaysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        dailyLabels.push(date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));

        // Apply recurring incomes for this day
        settings.recurringIncomes.forEach(income => {
            if (income.day === day) {
                currentDailyBalance += income.amount;
            }
        });

        // Apply fixed expenses (e.g., on the 1st of the month)
        if (day === 1) {
            settings.fixedExpenses.forEach(expense => {
                currentDailyBalance -= expense.amount;
            });
        }

        // Apply manual transactions for this day
        transactionsArr.forEach(t => {
            const transactionDate = new Date(t.date);
            if (transactionDate.getFullYear() === currentYear &&
                transactionDate.getMonth() === currentMonth &&
                transactionDate.getDate() === day) {
                const amount = parseFloat(t.amount);
                if (t.type === 'ingreso') {
                    currentDailyBalance += amount;
                } else if (t.type === 'gasto') {
                    currentDailyBalance -= amount;
                }
            }
        });
        dailyBalances.push(currentDailyBalance);
    }

    incomeExpenseChart = new Chart(dailyBalanceCtx, {
        type: 'line',
        data: {
            labels: dailyLabels,
            datasets: [{
                label: 'Daily Balance',
                data: dailyBalances,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.1
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
                    <p class="card-text mb-0" style="font-size: 0.9rem; font-weight: bold;">${formatNumber(categoryData[index])}</p>
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
function handleNotesChange() { // Renamed from addNewDetalle
    if (notesSelectBox.value === 'Otro') { // Use notesSelectBox
        notesSelectBox.style.display = 'none';
        manualNotesInputGroup.style.display = 'flex'; // Show the manual input group
        notesManualInputBox.focus();
    } else {
        notesSelectBox.style.display = 'block'; // Ensure select is visible
        manualNotesInputGroup.style.display = 'none'; // Hide manual input
    }
}

function volverToSelect() {
    notesSelectBox.style.display = 'block'; // Show the select
    manualNotesInputGroup.style.display = 'none'; // Hide the manual input
    notesManualInputBox.value = ''; // Clear manual input
    notesSelectBox.value = 'Cigarros'; // Reset select to a default value, or 'Otro' if that's desired
}
function renderNotesSelectOptions() {
    notesSelectBox.innerHTML = ''; // Clear existing options

    const defaultOptions = ["Cigarros", "Comida"];
    let allNotes = new Set(defaultOptions);

    // Add notes from existing transactions
    transactionsArr.forEach(t => {
        if (t.notes && t.notes !== 'Sin Notas' && t.notes !== 'Otro') {
            allNotes.add(t.notes);
        }
    });

    // Convert Set to Array, sort, and add to select box
    const sortedNotes = Array.from(allNotes).sort();
    sortedNotes.forEach(note => {
        const option = document.createElement('option');
        option.value = note;
        option.textContent = note;
        notesSelectBox.appendChild(option);
    });

    // Add the "Otro" option last
    const otroOption = document.createElement('option');
    otroOption.value = 'Otro';
    otroOption.textContent = 'Otro';
    notesSelectBox.appendChild(otroOption);

    // Set default selected value if available, otherwise 'Cigarros'
    if (notesSelectBox.options.length > 0) {
        notesSelectBox.value = 'Cigarros'; // Or whatever default you prefer
    }
}

function saveTransaction() {
    let transactionNotes;
    if (manualNotesInputGroup.style.display === 'flex') { // If manual input is visible
        transactionNotes = notesManualInputBox.value.trim();
        if (transactionNotes === '') {
            transactionNotes = 'Sin Notas'; // Default if manual input is empty
        }
    } else { // If select box is visible
        transactionNotes = notesSelectBox.value;
        if (transactionNotes === '' || transactionNotes === 'Otro') { // Handle case where 'Otro' might be selected but no manual input was given
            transactionNotes = 'Sin Notas';
        }
    }

    if (transactionDate.value === "" || undefined) {
        transactionDate.value = localFormattedDate;
    }
    if (amountInputBox.value === "" || undefined) {
        window.alert('Invalid amount');
        return;
    }
    const transaction = {
        amount: amountInputBox.value,
        date: transactionDate.value,
        type: 'gasto',
        notes: transactionNotes
    };
    transactionsArr.push(transaction);

    saveDB();
    amountInputBox.value = '';
    transactionDate.value = localFormattedDate;
    volverToSelect();
    renderNotesSelectOptions(); // Re-render options after saving
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
                renderNotesSelectOptions(); // Update notes select box
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
    renderNotesSelectOptions(); // Update notes select box

    const editModal = bootstrap.Modal.getInstance(document.getElementById('editTransactionModal'));
    editModal.hide();
}

function formatNumber(num) {
    if (settings.useThousandsSuffix && Math.abs(num) >= 1000) { // Changed threshold from 10000 to 1000
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
        while (tempDate <= projectionDate) {
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
    renderNotesSelectOptions(); // Call to populate notes select box after DB is loaded and DOM is ready
    showPage('add-transaction');

    // Ensure initial state of notes input is correct
    notesSelectBox.style.display = 'block';
    manualNotesInputGroup.style.display = 'none';

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

function saveEditedRecurringIncome(index) {
    const dayInput = document.querySelector(`#recurring-income-edit-${index} .edit-recurring-income-day`);
    const amountInput = document.querySelector(`#recurring-income-edit-${index} .edit-recurring-income-amount`);

    const newDay = parseInt(dayInput.value);
    const newAmount = parseFloat(amountInput.value);

    if (newDay > 0 && newAmount > 0) {
        settings.recurringIncomes[index].day = newDay;
        settings.recurringIncomes[index].amount = newAmount;
        saveDB(); // Save the updated item
        renderRecurringIncomes(); // Re-render to reflect saved state and revert to display mode
        calculateVars();
        renderStatisticsCharts();
        renderTransactions();
        showToast('Recurring income updated!', 'success');
    } else {
        showToast('Please enter valid day and amount for recurring income.', 'warning');
    }
}

function toggleFixedExpenseEditMode(index, isEditMode) {
    const displayDiv = document.getElementById(`fixed-expense-display-${index}`);
    const editDiv = document.getElementById(`fixed-expense-edit-${index}`);

    if (isEditMode) {
        displayDiv.style.display = 'none';
        editDiv.style.display = 'flex';
    } else {
        displayDiv.style.display = 'flex';
        editDiv.style.display = 'none';
        // Re-render the list to ensure values are reset if cancelled
        renderFixedExpenses();
    }
}

function addFixedExpense() {
    const descriptionInput = document.getElementById('fixed-expense-description-input');
    const amountInput = document.getElementById('fixed-expense-amount-input');
    const description = descriptionInput.value;
    const amount = parseFloat(amountInput.value);

    if (description && amount > 0) {
        settings.fixedExpenses.push({ description, amount });
        saveDB(); // Save the new empty item
        descriptionInput.value = ''; // Clear input fields
        amountInput.value = '';
        renderFixedExpenses(); // Re-render to show the new item
        const newIndex = settings.fixedExpenses.length - 1;
        toggleFixedExpenseEditMode(newIndex, true); // Immediately enter edit mode for the new item
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
                saveDB(); // Save after deleting
                renderFixedExpenses(); // Re-render to reflect changes
                calculateVars();
                renderStatisticsCharts();
                renderTransactions();
            }
        }
    ]);
}

function saveEditedFixedExpense(index) {
    const descriptionInput = document.querySelector(`#fixed-expense-edit-${index} .edit-fixed-expense-description`);
    const amountInput = document.querySelector(`#fixed-expense-edit-${index} .edit-fixed-expense-amount`);

    const newDescription = descriptionInput.value.trim();
    const newAmount = parseFloat(amountInput.value);

    if (newDescription && newAmount > 0) {
        settings.fixedExpenses[index].description = newDescription;
        settings.fixedExpenses[index].amount = newAmount;
        saveDB(); // Save the updated item
        renderFixedExpenses(); // Re-render to reflect saved state and revert to display mode
        calculateVars();
        renderStatisticsCharts();
        renderTransactions();
        showToast('Fixed expense updated!', 'success');
    } else {
        showToast('Please enter valid description and amount for fixed expense.', 'warning');
    }
}

// Event listener for accordion collapse to cancel edits for Fixed Expenses
document.addEventListener('DOMContentLoaded', () => {
    const collapseFixedExpenses = document.getElementById('collapseFixedExpenses');
    if (collapseFixedExpenses) {
        collapseFixedExpenses.addEventListener('hide.bs.collapse', () => {
            settings.fixedExpenses.forEach((_, index) => {
                const editDiv = document.getElementById(`fixed-expense-edit-${index}`);
                if (editDiv && editDiv.style.display !== 'none') {
                    toggleFixedExpenseEditMode(index, false); // Cancel edit mode
                }
            });
        });
    }
});





function handleThousandsSuffixToggle() {
    settings.useThousandsSuffix = document.getElementById('thousands-suffix-toggle').checked;
    saveDB();
    calculateVars();
    renderStatisticsCharts();
    renderTransactions();
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
    reader.onload = function (e) {
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
            listItem.id = `fixed-expense-item-${index}`; // Add ID for easy access

            listItem.innerHTML = `
                <div id="fixed-expense-display-${index}">
                    <div class="d-flex justify-content-between align-items-center w-100">
                        <span>${expense.description} - ${formatNumber(expense.amount)}</span>
                        <span class="action-emoji" onclick="toggleFixedExpenseEditMode(${index}, true)">✏️</span>
                    </div>
                </div>
                <div id="fixed-expense-edit-${index}" style="display: none;" class="mt-2">
                    <div class="input-group input-group-sm mb-2">
                        <input type="text" class="form-control edit-fixed-expense-description" value="${expense.description}" data-index="${index}">
                        <span class="input-group-text">$</span>
                        <input type="number" class="form-control edit-fixed-expense-amount" value="${expense.amount}" data-index="${index}">
                    </div>
                    <div class="d-flex justify-content-end">
                        <span class="action-emoji me-2" onclick="saveEditedFixedExpense(${index})">💾</span>
                        <span class="action-emoji me-2" onclick="deleteFixedExpense(${index})">🚫</span>
                        <span class="action-emoji" onclick="toggleFixedExpenseEditMode(${index}, false)">❌</span>
                    </div>
                </div>
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
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            listItem.id = `recurring-income-item-${index}`; // Add ID for easy access

            listItem.innerHTML = `
                <div id="recurring-income-display-${index}">
                    <div class="d-flex justify-content-between align-items-center w-100">
                        <span>🗓️ Day ${income.day} - 💰 ${formatNumber(income.amount)}</span>
                        <span class="action-emoji" onclick="toggleRecurringIncomeEditMode(${index}, true)">✏️</span>
                    </div>
                </div>
                <div id="recurring-income-edit-${index}" style="display: none;" class="mt-2">
                    <div class="input-group input-group-sm mb-2">
                        <span class="input-group-text">🗓️</span>
                        <input type="number" class="form-control edit-recurring-income-day" value="${income.day}" min="1" max="31" data-index="${index}">
                        <span class="input-group-text">💰</span>
                        <input type="number" class="form-control edit-recurring-income-amount" value="${income.amount}" data-index="${index}">
                    </div>
                    <div class="d-flex justify-content-end">
                        <span class="action-emoji me-2" onclick="saveEditedRecurringIncome(${index})">💾</span>
                        <span class="action-emoji me-2" onclick="deleteRecurringIncome(${index})">🚫</span>
                        <span class="action-emoji" onclick="toggleRecurringIncomeEditMode(${index}, false)">❌</span>
                    </div>
                </div>
            `;
            list.appendChild(listItem);
        });
        recurringIncomesList.appendChild(list);
    }
}
