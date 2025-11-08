const transactionHistoryVisibilitybtn = document.getElementById('transactionHistoryVisibilitybtn');
const transactionHistoryVisibilityTable = document.getElementById('transactionHistoryVisibilityTable');
const varsVisibilitybtn = document.getElementById('varsVisibilitybtn');
const varsVisibilityTable = document.getElementById('varsTable');
const addTransactionFormBtn = document.getElementById('addTransactionFormBtn');
const addTransactionTable = document.getElementById('addTransactionTable');
const amountInputBox = document.getElementById('amountInputBox');
const transactionDate = document.getElementById('transaction-date');
const inputGroupSelect01 = document.getElementById('inputGroupSelect01');
//const rangeValue = document.getElementById('rangeValue');
const inputGroupSizingSm = document.getElementById('notesInputBox');
let transactionsArr = [];
//states
let transactionHistoryTableState = 0;
let varsTableState = 0;
let addTransactionTableState = 0;
console.log('Todo \n1_.\n2_Fill transaction table with transactions.\n3_Develop settings section.\n4_CSV import/export.\n5_Projections logic.')
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
        transactionHistoryTableState = 1;
        varsTableState = 0;
        addTransactionTableState = 0;
        console.log('ran 1')
    }
    else {
        transactionHistoryVisibilityTable.style.display = 'none';
        varsVisibilityTable.style.display = 'none';
        transactionHistoryTableState = 0;
        addTransactionTableState = 0;
        console.log('ran 2')
    }
}
function varsVisibility() {
    if (varsTableState == 0){
        varsVisibilityTable.style.display = 'table';
        transactionHistoryVisibilityTable.style.display = 'none';
        addTransactionTable.style.display = 'none';
        varsTableState = 1;
        transactionHistoryTableState = 0;
        addTransactionTableState = 0;
        console.log('ran 1')
    }
    else {
        transactionHistoryVisibilityTable.style.display = 'none';
        varsVisibilityTable.style.display = 'none';
        varsTableState = 0;
        console.log('ran 2')
    }
}
function newTransactionFormDisplay() {
    if (addTransactionTableState == 0){
        addTransactionTable.style.display = 'table';
        transactionHistoryVisibilityTable.style.display = 'none';
        addTransactionTableState = 1;
        transactionHistoryTableState = 0;
        varsTableState = 0;
        console.log('ran 1')
    }
    else {
        addTransactionTable.style.display = 'none';
        transactionHistoryVisibilityTable.style.display = 'none';
        varsVisibilityTable.style.display = 'none';
        addTransactionTableState = 0;
        console.log('ran 2')
    }
}
function saveTransaction() {
    if(inputGroupSizingSm.value == "" || undefined){
        inputGroupSizingSm.value = 'Sin Notas'
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
    transactionDate.value = ''
    inputGroupSizingSm.value = ''
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
window.onload = () => {
    setTimeout(() => {
    document.getElementById('amountInputBox').focus();console.log('done')
    }, 1000);
};
loadDB();
