import { getDailyBalances } from './calculator.js';

let dailyBalanceChart = null;
let expenseBreakdownChart = null;
let timeToTargetChart = null;

export function renderCharts(transactions, settings, timeRange = 'this-month', includeFixedExpenses = true) {
    renderDailyBalanceChart(transactions, settings, timeRange, includeFixedExpenses);
    renderExpenseBreakdownChart(transactions, timeRange);
    renderTimeToTargetChart(transactions, settings);
}

function renderDailyBalanceChart(transactions, settings, timeRange, includeFixedExpenses) {
    const ctx = document.getElementById('daily-balance-chart').getContext('2d');
    const { labels, data } = getDailyBalances(transactions, settings, timeRange, includeFixedExpenses);

    if (dailyBalanceChart) dailyBalanceChart.destroy();

    // Create color array based on positive/negative values
    const backgroundColors = data.map(value =>
        value >= 0 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'
    );
    const borderColors = data.map(value =>
        value >= 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'
    );

    dailyBalanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Net Change',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            const value = context.parsed.y;
                            label += (value >= 0 ? '+' : '') + '$' + value.toFixed(2);
                            return label;
                        }
                    }
                }
            }
        }
    });
}

function renderExpenseBreakdownChart(transactions, timeRange) {
    const ctx = document.getElementById('expense-breakdown-chart').getContext('2d');
    const categories = {};

    // Filter transactions based on time range
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    transactions.forEach(t => {
        const [tY, tM, tD] = t.date.split('-').map(Number);
        let include = false;

        if (timeRange === 'this-month') {
            include = tY === currentYear && (tM - 1) === currentMonth;
        } else if (timeRange === 'last-month') {
            const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
            const lastMonth = lastMonthDate.getMonth();
            const lastMonthYear = lastMonthDate.getFullYear();
            include = tY === lastMonthYear && (tM - 1) === lastMonth;
        } else {
            include = true;
        }

        if (include && t.type === 'expense') {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        }
    });

    const labels = Object.keys(categories);
    const data = Object.values(categories);

    if (expenseBreakdownChart) expenseBreakdownChart.destroy();

    expenseBreakdownChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
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
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5
        }
    });

    // Render list
    const listDiv = document.getElementById('expense-breakdown-list');
    listDiv.innerHTML = '';
    labels.forEach((label, index) => {
        const div = document.createElement('div');
        div.className = 'small mb-1';
        div.innerHTML = `<strong>${label}:</strong> $${data[index].toFixed(2)}`;
        listDiv.appendChild(div);
    });
}

function renderTimeToTargetChart(transactions, settings) {
    // Simplified placeholder for now
    const ctx = document.getElementById('time-to-target-chart').getContext('2d');

    if (timeToTargetChart) timeToTargetChart.destroy();

    timeToTargetChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Now', 'Target'],
            datasets: [{
                label: 'Projected Balance',
                data: [settings.currentBalance, settings.targetCash],
                borderColor: 'rgba(153, 102, 255, 1)',
                borderDash: [5, 5]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2
        }
    });
}
