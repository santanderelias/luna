const transactionList = document.querySelector('#history .list-group');

export function renderTransactions(transactions) {
    transactionList.innerHTML = '';
    transactions.forEach(transaction => {
        const item = document.createElement('li');
        item.className = `list-group-item d-flex justify-content-between align-items-center ${transaction.type === 'income' ? 'list-group-item-success' : 'list-group-item-danger'}`;
        item.dataset.id = transaction.id;
        item.innerHTML = `
            <div>
                <h6 class="my-0">${transaction.description}</h6>
                <small class="text-muted">${transaction.category}</small>
            </div>
            <div>
                <span class="me-3">${transaction.amount.toFixed(2)}</span>
                <button class="btn btn-sm btn-outline-secondary edit-btn">Edit</button>
                <button class="btn btn-sm btn-outline-danger delete-btn">Delete</button>
            </div>
        `;
        transactionList.appendChild(item);
    });
}
