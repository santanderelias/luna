import { formatCurrency } from './calculator.js';
import { loadDB } from './storage.js'; // Need settings for formatCurrency

const transactionList = document.querySelector('#history .list-group');

function getRelativeDateString(dateStr) {
    const today = new Date();
    const date = new Date(dateStr);

    // Reset time for accurate day comparison
    today.setHours(0, 0, 0, 0);
    const dateCopy = new Date(date);
    dateCopy.setHours(0, 0, 0, 0); // Assuming dateStr is YYYY-MM-DD, this might need adjustment if it has time

    // Fix: dateStr from input type="date" is YYYY-MM-DD. 
    // When creating new Date("YYYY-MM-DD"), it might be UTC. 
    // Let's just compare YYYY-MM-DD strings for simplicity if possible, 
    // but for relative terms like "Yesterday", we need math.

    // Better approach for "YYYY-MM-DD" strings:
    const todayStr = today.toISOString().split('T')[0];

    if (dateStr === todayStr) return "Today";

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === yesterdayStr) return "Yesterday";

    const diffTime = today.getTime() - new Date(dateStr).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) return "This Week";
    if (diffDays <= 14) return "Last Week";

    // Check for "This Month"
    if (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
        return "This Month";
    }

    return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
}

export function renderTransactions(transactions) {
    transactionList.innerHTML = '';

    if (transactions.length === 0) {
        transactionList.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-inbox"></i>
                <h6>No Transactions Yet</h6>
                <p>Start tracking your finances by adding your first transaction</p>
            </div>
        `;
        return;
    }

    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => {
        return new Date(b.date) - new Date(a.date) || b.id - a.id;
    });

    const grouped = sortedTransactions.reduce((groups, t) => {
        const dateGroup = getRelativeDateString(t.date);
        if (!groups[dateGroup]) groups[dateGroup] = [];
        groups[dateGroup].push(t);
        return groups;
    }, {});

    for (const [groupName, groupTransactions] of Object.entries(grouped)) {
        // Add Group Header
        const header = document.createElement('li');
        header.className = 'list-group-item list-group-item-secondary fw-bold';
        header.textContent = groupName;
        transactionList.appendChild(header);

        // Add Transactions
        groupTransactions.forEach(transaction => {
            const item = document.createElement('li');
            item.className = `list-group-item d-flex justify-content-between align-items-center ${transaction.type === 'income' ? 'list-group-item-success' : ''}`;
            item.dataset.id = transaction.id;

            // Format amount
            const amountClass = transaction.type === 'income' ? 'text-success' : 'text-danger';
            const sign = transaction.type === 'income' ? '+' : '-';

            item.innerHTML = `
                <div class="ms-2 me-auto">
                    <div class="fw-bold">${transaction.description}</div>
                    <small class="text-muted">${transaction.category}</small>
                </div>
                <div class="d-flex align-items-center">
                    <span class="badge rounded-pill ${transaction.type === 'income' ? 'bg-success' : 'bg-danger'} me-3">
                        ${sign}${formatCurrency(transaction.amount, loadDB().settings).replace('$', '')}
                    </span>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary edit-btn">✏️</button>
                        <button class="btn btn-outline-danger delete-btn">🗑️</button>
                    </div>
                </div>
            `;
            transactionList.appendChild(item);
        });
    }
}
