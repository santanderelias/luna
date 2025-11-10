const transactionHistoryVisibilitybtn = document.getElementById('transactionHistoryVisibilitybtn');
const transactionHistoryContainer = document.getElementById('transactionHistoryContainer');
const varsVisibilitybtn = document.getElementById('varsVisibilitybtn');
const varsVisibilityTable = document.getElementById('varsTable');
const addTransactionFormBtn = document.getElementById('addTransactionFormBtn');
const addTransactionTable = document.getElementById('addTransactionTable');
const amountInputBox = document.getElementById('amountInputBox');
const statsVisibilityTable = document.getElementById('statisticsTable')
const transactionDate = document.getElementById('transaction-date');
const inputGroupSelect01 = document.getElementById('inputGroupSelect01');
//const rangeValue = document.getElementById('rangeValue');
const inputGroupSizingSm = document.getElementById('notesInputBox');
let transactionsArr = [];
let settings = {
    currentBalance: 0,
    paycheck1: 0,
    paycheck2: 0,
    targetCash: 0
};
//states
let transactionHistoryTableState = 0;
let varsTableState = 0;
let addTransactionTableState = 0;
let statsTableState = 0;
let incomeExpenseChart, expenseBreakdownChart, timeToTargetChart;
const now = new Date();
// --- Ensures the date is based on the local Buenos Aires time ---
const year = now.getFullYear();
// .getMonth() is 0-indexed, so add 1 (January=0, December=11)
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const localFormattedDate = `${year}-${month}-${day}`;
// Output will be: "2025-11-09" (Guaranteed to be the local day in Buenos Aires)
console.log(`setting date to ${localFormattedDate}`);
// Output will be today's date in YYYY-MM-DD format (e.g., "2025-11-09") 
//set default date
transactionDate.value = localFormattedDate;
// based on UTC time.
console.log('Todo \n1_Prevent empty values or prevent the process on transaction.\n2_Fill tables with transactions.\n3_Develop settings section.\n4_CSV import/export.\n5_Projections logic.')
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
        settings = data.settings || { currentBalance: 0, paycheck1: 0, paycheck2: 0, targetCash: 0 };
        document.getElementById('current-balance-input').value = settings.currentBalance;
        document.getElementById('paycheck1-input').value = settings.paycheck1;
        document.getElementById('paycheck2-input').value = settings.paycheck2;
        document.getElementById('target-cash-input').value = settings.targetCash;
        console.log("DB data loaded from localStorage.");
        calculateVars(); // Call calculateVars after loading data
    } else {
        console.log("DB  not found in localStorage. Variables remain at default values (0).");
    }
}

function clearDB() {
    localStorage.removeItem('DB');
    transactionsArr = [];
    settings = { currentBalance: 0, paycheck1: 0, paycheck2: 0, targetCash: 0 };
    document.getElementById('current-balance-input').value = 0;
    document.getElementById('paycheck1-input').value = 0;
    document.getElementById('paycheck2-input').value = 0;
    document.getElementById('target-cash-input').value = 0;
    console.log("All in-memory variables removed.");
    console.log("Successfully removed 'DB' from localStorage.");
    calculateVars();
}

function saveSettings() {
    settings.currentBalance = parseFloat(document.getElementById('current-balance-input').value);
    settings.paycheck1 = parseFloat(document.getElementById('paycheck1-input').value);
    settings.paycheck2 = parseFloat(document.getElementById('paycheck2-input').value);
    settings.targetCash = parseFloat(document.getElementById('target-cash-input').value);
    saveDB();
    calculateVars();
}
function logVars() {
    console.log("--- Current Financial Variables ---");
    console.log(transactionsArr)
    console.log("-----------------------------------");
}
function showSection(sectionId) {
    // Hide all sections
    statsVisibilityTable.style.display = 'none';
    varsVisibilityTable.style.display = 'none';
    transactionHistoryContainer.style.display = 'none';
    addTransactionTable.style.display = 'none';

    // Show the requested section
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
    }

    // Call render functions if necessary
    if (sectionId === 'transactionHistoryContainer') {
        renderTransactions();
    } else if (sectionId === 'statisticsTable') {
        renderStatisticsCharts();
    }
}

function renderStatisticsCharts() {
    // Destroy existing charts if they exist
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

    // --- Income vs. Expense Chart ---
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
            } else if (t.type === 'gasto' || t.type === 'gastoCo') {
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

    // --- Expense Breakdown Chart ---
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

    // --- Time to Target Chart ---
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

        while (projectedBalance < settings.targetCash && months <= 24) { // Limit to 2 years of projection
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
function newTransactionFormDisplay() {
    showSection('addTransactionTable');
    amountInputBox.focus();
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
        invalidAmount;
    }
  const transaction = {
    amount: amountInputBox.value,
    date: transactionDate.value,
    type: inputGroupSelect01.value,
    //rated: rangeValue.value,
    notes: inputGroupSizingSm.value
  };
  transactionsArr.push(transaction);
  console.log(transactionsArr);
  saveDB()
    amountInputBox.value = ''
    transactionDate.value = localFormattedDate;
    inputGroupSizingSm.value = ''
    renderTransactions();
    calculateVars();
    renderStatisticsCharts();
}
//import export CSV
function exportToCsv() {
  const header = Object.keys(transactionsArr[0]).join(',');
  const csv = transactionsArr.map(row => Object.values(row).join(',')).join('\n');
  return `${header}\n${csv}`;
}
function importFromCsv(csvContent) {
  const [header, ...rows] = csvContent.split('\n').map(row => row.split(','));
  transactionsArr = rows.map(row => {
    return {
      amount: row[0],
      date: row[1],
      type: row[2],
      //rated: row[3],
      notes: row[3]
    };
  });
  saveDB()
  console.log(transactionsArr);
}
//fin import/export
function renderTransactions() {
  const tableBody = document.getElementById('transactionHistoryVisibilityTable').getElementsByTagName('tbody')[0];
  tableBody.innerHTML = ''; // Clear existing rows

  transactionsArr.forEach((transaction, index) => {
    const newRow = tableBody.insertRow();

    const cell1 = newRow.insertCell(0);
    const cell2 = newRow.insertCell(1);
    const cell3 = newRow.insertCell(2);
    const cell4 = newRow.insertCell(3);
    const cell5 = newRow.insertCell(4);
    const cell6 = newRow.insertCell(5);

    cell1.innerHTML = index + 1;
    cell2.innerHTML = transaction.date;
    cell3.innerHTML = transaction.type;
    cell4.innerHTML = transaction.amount;
    cell5.innerHTML = transaction.notes;

    const editButton = document.createElement('span');
    editButton.textContent = '✏️';
    editButton.className = 'action-emoji';
    editButton.onclick = () => editTransaction(index);
    cell6.appendChild(editButton);

    const deleteButton = document.createElement('span');
    deleteButton.textContent = '🚫';
    deleteButton.className = 'action-emoji';
    deleteButton.onclick = () => deleteTransaction(index);
    cell6.appendChild(deleteButton);
  });
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
  const tableBody = document.getElementById('transactionHistoryVisibilityTable').getElementsByTagName('tbody')[0];
  const row = tableBody.rows[index];
  const transaction = transactionsArr[index];

  row.cells[1].innerHTML = `<input type="date" class="form-control" value="${transaction.date}">`;

  const typeCell = row.cells[2];
  const typeSelect = document.createElement('select');
  typeSelect.className = 'form-select';
  const options = ['gasto', 'gastoCo', 'ingreso'];
  options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt;
      option.textContent = opt;
      if (opt === transaction.type) {
          option.selected = true;
      }
      typeSelect.appendChild(option);
  });
  typeCell.innerHTML = '';
  typeCell.appendChild(typeSelect);

  row.cells[3].innerHTML = `<input type="number" class="form-control" value="${transaction.amount}">`;
  row.cells[4].innerHTML = `<input type="text" class="form-control" value="${transaction.notes}">`;

  const actionCell = row.cells[5];
  actionCell.innerHTML = '';
  const saveButton = document.createElement('button');
  saveButton.textContent = 'Save';
  saveButton.className = 'btn btn-success btn-sm';
  saveButton.onclick = () => saveEditedTransaction(index);
  actionCell.appendChild(saveButton);
}

function saveEditedTransaction(index) {
    const tableBody = document.getElementById('transactionHistoryVisibilityTable').getElementsByTagName('tbody')[0];
    const row = tableBody.rows[index];

    const newDate = row.cells[1].getElementsByTagName('input')[0].value;
    const newType = row.cells[2].getElementsByTagName('select')[0].value;
    const newAmount = row.cells[3].getElementsByTagName('input')[0].value;
    const newNotes = row.cells[4].getElementsByTagName('input')[0].value;

    if (newAmount === "" || isNaN(newAmount)) {
        window.alert('Invalid amount');
        return;
    }

    transactionsArr[index] = {
        date: newDate,
        type: newType,
        amount: newAmount,
        notes: newNotes
    };

    saveDB();
    renderTransactions();
    calculateVars();
    renderStatisticsCharts();
}
window.onload = () => {
    setTimeout(() => {
    document.getElementById('amountInputBox').focus();
    console.log('done')
    }, 1000);
    loadDB();
    renderTransactions();
    renderStatisticsCharts();
    showSection('addTransactionTable');

    document.getElementById('projection-date-picker').addEventListener('change', calculateVars);
};

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
        if ((t.type === 'gasto' || t.type === 'gastoCo') && transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
            spendToDateThisMonth += parseFloat(t.amount);
        }
    });

    const spentPerDay = numberOfDaysPassed > 0 ? spendToDateThisMonth / numberOfDaysPassed : 0;
    const monthlyIncome = settings.paycheck1 + settings.paycheck2;
    const monthlySpentProjection = spentPerDay * daysInMonth;
    const netMonthlyProjection = monthlyIncome - monthlySpentProjection;

    let currentBalance = settings.currentBalance;
    transactionsArr.forEach(t => {
        const amount = parseFloat(t.amount);
        if (t.type === 'ingreso') {
            currentBalance += amount;
        } else if (t.type === 'gasto' || t.type === 'gastoCo') {
            currentBalance -= amount;
        }
    });

    // Update "Current Data" and "Projections" tables
    document.getElementById('currentBalance').textContent = Math.trunc(currentBalance);
    document.getElementById('spendToDateThisMonth').textContent = Math.trunc(-spendToDateThisMonth);
    document.getElementById('spentPerDay').textContent = Math.trunc(-spentPerDay);
    document.getElementById('monthlySpentProjection').textContent = Math.trunc(-monthlySpentProjection);
    document.getElementById('netMonthlyProjection').textContent = Math.trunc(netMonthlyProjection);

    // Handle "Set Projections"
    if (projectionDate && projectionDate >= today) {
        const daysToProjection = Math.ceil((projectionDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

        // Forward-projected spending
        const spendingToDateX = spentPerDay * daysToProjection;

        // Correctly calculate paychecks between today and projection date
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
        // Clear projection fields if date is not valid
        document.getElementById('spendingToDateX').textContent = "0";
        document.getElementById('paychecksToDateX').textContent = "0";
        document.getElementById('projectedIncomeToDateX').textContent = "0";
        document.getElementById('predictedCashBalanceToDateX').textContent = "0";
    }

    // Calculate time to reach target
    if (settings.targetCash > 0 && netMonthlyProjection > 0) {
        const monthsToTarget = (settings.targetCash - currentBalance) / netMonthlyProjection;
        document.getElementById('timeToReachTarget').textContent = `${Math.ceil(monthsToTarget)} months`;
    } else {
        document.getElementById('timeToReachTarget').textContent = "N/A";
    }
}