export function calculateBalance(transactions) {
    return transactions.reduce((total, t) => {
        return t.type === 'income' ? total + t.amount : total - t.amount;
    }, 0);
}

export function formatCurrency(amount, settings) {
    if (settings.useThousandsSuffix && Math.abs(amount) >= 1000) {
        return '$' + (amount / 1000).toFixed(1) + 'k';
    }
    return '$' + amount.toFixed(2);
}

function getTransactionsInDateRange(transactions, timeRange) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    return transactions.filter(t => {
        const tDate = new Date(t.date);
        // Fix for local date parsing if needed, but assuming YYYY-MM-DD string comparison is safer for boundaries
        const [tY, tM, tD] = t.date.split('-').map(Number);

        if (timeRange === 'this-month') {
            return tY === currentYear && (tM - 1) === currentMonth;
        } else if (timeRange === 'last-month') {
            const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
            const lastMonth = lastMonthDate.getMonth();
            const lastMonthYear = lastMonthDate.getFullYear();
            return tY === lastMonthYear && (tM - 1) === lastMonth;
        } else if (timeRange === 'all-time') {
            return true;
        }
        return true;
    });
}

export function calculateProjections(transactions, settings, timeRange = 'this-month', includeFixedExpenses = true) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Filter transactions based on time range
    const filteredTransactions = getTransactionsInDateRange(transactions, timeRange);

    // 1. Spend to Date (in selected range)
    let spendToDate = 0;
    filteredTransactions.forEach(t => {
        if (t.type === 'expense') {
            spendToDate += t.amount;
        }
    });

    // 2. Spent Per Day (Active Spending Days)
    // Count days where at least one expense occurred
    const activeDays = new Set();
    filteredTransactions.forEach(t => {
        if (t.type === 'expense') {
            activeDays.add(t.date);
        }
    });

    const numberOfActiveDays = activeDays.size;
    const spentPerDay = numberOfActiveDays > 0 ? spendToDate / numberOfActiveDays : 0;

    // 3. Monthly Spent Projection (Only valid for 'this-month')
    let monthlySpentProjection = 0;
    let netMonthlyProjection = 0;
    let timeToReachTarget = 'N/A';

    if (timeRange === 'this-month') {
        const totalFixedExpenses = includeFixedExpenses ? settings.fixedExpenses.reduce((sum, e) => sum + e.amount, 0) : 0;
        // Projection based on active daily spend * remaining days? 
        // Or just average daily spend * total days?
        // Let's stick to average daily spend * total days for simplicity and consistency with previous logic,
        // but using the new "active" average might inflate it if they only spend on weekends.
        // User asked for "days passed minus days with no spent cash" -> active days.
        // "divided by amount used" -> actually amount / active days.
        // So spentPerDay is correct.

        // If we project using this "active" rate, we assume they will spend EVERY day remaining?
        // Or should we assume they will spend on the same proportion of days?
        // Let's keep it simple: Rate * Days in Month + Fixed.
        monthlySpentProjection = (spentPerDay * daysInMonth) + totalFixedExpenses;

        // 4. Net Monthly Projection
        const monthlyRecurringIncome = settings.recurringIncomes.reduce((sum, i) => sum + i.amount, 0);
        netMonthlyProjection = monthlyRecurringIncome - monthlySpentProjection;

        // 5. Time to Reach Target
        const currentBalance = settings.currentBalance + calculateBalance(transactions);

        if (settings.targetCash > 0 && netMonthlyProjection > 0 && currentBalance < settings.targetCash) {
            const months = (settings.targetCash - currentBalance) / netMonthlyProjection;
            timeToReachTarget = Math.ceil(months) + ' months';

            if (settings.targetDate) {
                const targetDateObj = new Date(settings.targetDate);
                const diffTime = targetDateObj - today;
                const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));

                if (diffMonths < months) {
                    timeToReachTarget += ` (Late by ${Math.ceil(months - diffMonths)} months)`;
                } else {
                    timeToReachTarget += ` (On track)`;
                }
            }
        }
    }

    return {
        spendToDate,
        spentPerDay,
        monthlySpentProjection,
        netMonthlyProjection,
        timeToReachTarget,
        numberOfActiveDays // Exported for potential UI use
    };
}

export function getDailyBalances(transactions, settings, timeRange = 'this-month', includeFixedExpenses = true) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let startDate, endDate;

    if (timeRange === 'this-month') {
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0);
    } else if (timeRange === 'last-month') {
        startDate = new Date(currentYear, currentMonth - 1, 1);
        endDate = new Date(currentYear, currentMonth, 0);
    } else {
        // All time: Start from first transaction or reasonable default
        if (transactions.length > 0) {
            const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
            startDate = new Date(sorted[0].date);
        } else {
            startDate = new Date(currentYear, currentMonth, 1);
        }
        endDate = today;
    }

    // Calculate total days in range
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Calculate daily average for fixed expenses
    const totalFixedExpenses = includeFixedExpenses ? settings.fixedExpenses.reduce((sum, e) => sum + e.amount, 0) : 0;
    const dailyFixedExpense = totalFixedExpenses / totalDays;

    // Calculate daily average for recurring incomes
    const totalRecurringIncome = settings.recurringIncomes.reduce((sum, i) => sum + i.amount, 0);
    const dailyRecurringIncome = totalRecurringIncome / totalDays;

    let dailyNetChanges = [];
    let labels = [];

    // Iterate from startDate to endDate
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const day = d.getDate();
        const month = d.getMonth();
        const year = d.getFullYear();
        const dateStr = d.toISOString().split('T')[0];

        let dayIncome = 0;
        let dayExpense = 0;

        // Add daily averaged recurring income
        dayIncome += dailyRecurringIncome;

        // Add daily averaged fixed expenses
        dayExpense += dailyFixedExpense;

        // Add transactions for this day
        transactions.forEach(t => {
            if (t.date === dateStr) {
                if (t.type === 'income') {
                    dayIncome += t.amount;
                } else {
                    dayExpense += t.amount;
                }
            }
        });

        // Calculate net change for the day (positive = gained money, negative = lost money)
        const netChange = dayIncome - dayExpense;

        dailyNetChanges.push(netChange);
        labels.push(`${month + 1}/${day}`);
    }

    return { labels, data: dailyNetChanges };
}
