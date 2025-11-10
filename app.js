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
        transactionsArr: transactionsArr
    };
    localStorage.setItem('DB', JSON.stringify(data));
    console.log("DB saved to localStorage.");
}
function loadDB() {
    const storedData = localStorage.getItem('DB');
    if (storedData) {
        const data = JSON.parse(storedData);
        transactionsArr = data.transactionsArr || [];
        console.log("DB data loaded from localStorage.");
        calculateVars(); // Call calculateVars after loading data
    } else {
        console.log("DB  not found in localStorage. Variables remain at default values (0).");
    }
}
function clearDB() {
    localStorage.removeItem('DB');
    transactionsArr = []
    console.log("All in-memory variables removed.");
    console.log("Successfully removed 'DB' from localStorage.");
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

    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.className = 'btn btn-warning btn-sm';
    editButton.onclick = () => editTransaction(index);
    cell6.appendChild(editButton);
  });
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
}
window.onload = () => {
    setTimeout(() => {
    document.getElementById('amountInputBox').focus();
    console.log('done')
    }, 1000);
    renderTransactions();
    loadDB();

    document.getElementById('income-date-picker').addEventListener('change', calculateVars);
    document.getElementById('projection-date-picker').addEventListener('change', calculateVars);
};

function calculateVars() {
    const incomeDatePicker = document.getElementById('income-date-picker');
    const projectionDatePicker = document.getElementById('projection-date-picker');

    if (!incomeDatePicker.value || !projectionDatePicker.value) {
        console.log("Date pickers not set, skipping calculations.");
        return;
    }

    const incomeDate = new Date(incomeDatePicker.value);
    const projectionDate = new Date(projectionDatePicker.value);
    const today = new Date();
    const incomeMonth = incomeDate.getMonth();
    const incomeYear = incomeDate.getFullYear();
    const daysInMonth = new Date(incomeYear, incomeMonth + 1, 0).getDate();

    let currentBalance = 0;
    let spendToDateThisMonth = 0;
    let monthlyIncome = 0;
    let spendingToDateX = 0;
    let paychecksToDateX = 0;

    transactionsArr.forEach(t => {
        const transactionDate = new Date(t.date);
        if (t.type === 'ingreso') {
            currentBalance += parseFloat(t.amount);
            if (transactionDate.getMonth() === incomeMonth && transactionDate.getFullYear() === incomeYear) {
                monthlyIncome += parseFloat(t.amount);
            }
            if (transactionDate <= projectionDate) {
                paychecksToDateX += parseFloat(t.amount);
            }
        } else {
            currentBalance -= parseFloat(t.amount);
            if (transactionDate.getMonth() === incomeMonth && transactionDate.getFullYear() === incomeYear) {
                spendToDateThisMonth += parseFloat(t.amount);
            }
            if (transactionDate <= projectionDate) {
                spendingToDateX += parseFloat(t.amount);
            }
        }
    });

    const numberOfDaysPassed = today.getDate();
    const spentPerDay = spendToDateThisMonth / numberOfDaysPassed;
    const monthlySpentProjection = spentPerDay * daysInMonth;
    const netMonthlyProjection = monthlyIncome - monthlySpentProjection;

    const timeDiff = projectionDate.getTime() - today.getTime();
    const daysToProjection = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const projectedIncomeToDateX = monthlyIncome;
    const predictedCashBalanceToDateX = currentBalance + (monthlyIncome / daysInMonth * daysToProjection) - (spentPerDay * daysToProjection);

    document.getElementById('currentBalance').textContent = currentBalance.toFixed(2);
    document.getElementById('spendToDateThisMonth').textContent = spendToDateThisMonth.toFixed(2);
    document.getElementById('numberOfDaysPassed').textContent = numberOfDaysPassed;
    document.getElementById('spentPerDay').textContent = spentPerDay.toFixed(2);
    document.getElementById('monthlyIncome').textContent = monthlyIncome.toFixed(2);
    document.getElementById('monthlySpentProjection').textContent = monthlySpentProjection.toFixed(2);
    document.getElementById('netMonthlyProjection').textContent = netMonthlyProjection.toFixed(2);
    document.getElementById('spendingToDateX').textContent = spendingToDateX.toFixed(2);
    document.getElementById('paychecksToDateX').textContent = paychecksToDateX.toFixed(2);
    document.getElementById('projectedIncomeToDateX').textContent = projectedIncomeToDateX.toFixed(2);
    document.getElementById('predictedCashBalanceToDateX').textContent = predictedCashBalanceToDateX.toFixed(2);
}