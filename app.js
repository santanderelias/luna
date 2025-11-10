const transactionHistoryVisibilitybtn = document.getElementById('transactionHistoryVisibilitybtn');
const transactionHistoryVisibilityTable = document.getElementById('transactionHistoryVisibilityTable');
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
    paycheck2: 0
};
//states
let transactionHistoryTableState = 0;
let varsTableState = 0;
let addTransactionTableState = 0;
let statsTableState = 0;
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
        settings = data.settings || { currentBalance: 0, paycheck1: 0, paycheck2: 0 };
        document.getElementById('current-balance-input').value = settings.currentBalance;
        document.getElementById('paycheck1-input').value = settings.paycheck1;
        document.getElementById('paycheck2-input').value = settings.paycheck2;
        console.log("DB data loaded from localStorage.");
        calculateVars(); // Call calculateVars after loading data
    } else {
        console.log("DB  not found in localStorage. Variables remain at default values (0).");
    }
}

function clearDB() {
    localStorage.removeItem('DB');
    transactionsArr = [];
    settings = { currentBalance: 0, paycheck1: 0, paycheck2: 0 };
    document.getElementById('current-balance-input').value = 0;
    document.getElementById('paycheck1-input').value = 0;
    document.getElementById('paycheck2-input').value = 0;
    console.log("All in-memory variables removed.");
    console.log("Successfully removed 'DB' from localStorage.");
    calculateVars();
}

function saveSettings() {
    settings.currentBalance = parseFloat(document.getElementById('current-balance-input').value);
    settings.paycheck1 = parseFloat(document.getElementById('paycheck1-input').value);
    settings.paycheck2 = parseFloat(document.getElementById('paycheck2-input').value);
    saveDB();
    calculateVars();
}
function logVars() {
    console.log("--- Current Financial Variables ---");
    console.log(transactionsArr)
    console.log("-----------------------------------");
}
function transactionHistoryVisibility() {
    if (transactionHistoryTableState == 0){
        transactionHistoryVisibilityTable.style.display = 'table';
        addTransactionTable.style.display = 'none';
        varsVisibilityTable.style.display = 'none';
        statsVisibilityTable.style.display = 'none';
        transactionHistoryTableState = 1;
        varsTableState = 0;
        addTransactionTableState = 0;
        statsTableState = 0;
        renderTransactions();
        console.log('ran 1')
    }
/*    else {
        transactionHistoryVisibilityTable.style.display = 'none';
        varsVisibilityTable.style.display = 'none';
        transactionHistoryTableState = 0;
        addTransactionTableState = 0;
        console.log('ran 2')
    } */
}
function varsVisibility() {
    if (varsTableState == 0){
        varsVisibilityTable.style.display = 'block';
        transactionHistoryVisibilityTable.style.display = 'none';
        addTransactionTable.style.display = 'none';
        statsVisibilityTable.style.display = 'none';
        varsTableState = 1;
        transactionHistoryTableState = 0;
        addTransactionTableState = 0;
        statsTableState = 0;
        console.log('ran 1')
    }
/*   else {
        transactionHistoryVisibilityTable.style.display = 'none';
        varsVisibilityTable.style.display = 'none';
        varsTableState = 0;
        console.log('ran 2')
    }*/
}
function statsVisibility() {
    if (statsTableState == 0){
        addTransactionTable.style.display = 'none';
        transactionHistoryVisibilityTable.style.display = 'none';
        varsVisibilityTable.style.display = 'none';
        statsVisibilityTable.style.display = 'table';
        statsTableState = 1;
        varsTableState = 0;
        transactionHistoryTableState = 0;
        addTransactionTableState = 0;
        console.log('ran 1')
    }
/*   else {
        transactionHistoryVisibilityTable.style.display = 'none';
        varsVisibilityTable.style.display = 'none';
        varsTableState = 0;
        console.log('ran 2')
    }*/
}
function newTransactionFormDisplay() {
    if (addTransactionTableState == 0){
        addTransactionTable.style.display = 'table';
        transactionHistoryVisibilityTable.style.display = 'none';
        varsVisibilityTable.style.display = 'none';
        statsVisibilityTable.style.display = 'none';
        addTransactionTableState = 1;
        transactionHistoryTableState = 0;
        varsTableState = 0;
        statsTableState = 0;
        console.log('ran 1')
        amountInputBox.focus();
    }
    else {
        amountInputBox.focus();
        console.log('ran 2')
    }
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
}
window.onload = () => {
    setTimeout(() => {
    document.getElementById('amountInputBox').focus();
    console.log('done')
    }, 1000);
    renderTransactions();
    loadDB();

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
    document.getElementById('currentBalance').textContent = currentBalance.toFixed(2);
    document.getElementById('spendToDateThisMonth').textContent = (-spendToDateThisMonth).toFixed(2);
    document.getElementById('spentPerDay').textContent = (-spentPerDay).toFixed(2);
    document.getElementById('monthlySpentProjection').textContent = (-monthlySpentProjection).toFixed(2);
    document.getElementById('netMonthlyProjection').textContent = netMonthlyProjection.toFixed(2);

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

        document.getElementById('spendingToDateX').textContent = (-spendingToDateX).toFixed(2);
        document.getElementById('paychecksToDateX').textContent = `${paycheckCount} paycheck(s)`;
        document.getElementById('projectedIncomeToDateX').textContent = projectedIncomeToDateX.toFixed(2);
        document.getElementById('predictedCashBalanceToDateX').textContent = predictedCashBalanceToDateX.toFixed(2);
    } else {
        // Clear projection fields if date is not valid
        document.getElementById('spendingToDateX').textContent = "0";
        document.getElementById('paychecksToDateX').textContent = "0";
        document.getElementById('projectedIncomeToDateX').textContent = "0";
        document.getElementById('predictedCashBalanceToDateX').textContent = "0";
    }
}