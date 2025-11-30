export function formatCurrency(amount, settings) {
    if (settings.useThousandsSuffix && Math.abs(amount) >= 1000) {
        return '$' + (amount / 1000).toFixed(1) + 'k';
    }
    return '$' + amount.toFixed(2);
}

export function calculateBalance(transactions) {
    return transactions.reduce((total, t) => {
        return t.type === 'income' ? total + t.amount : total - t.amount;
    }, 0);
}

/**
 * Calculates "Smart Stats" for a given time range.
 * Focuses on Cash Flow, Burn Rate, and Savings Rate.
 */
export function calculateSmartStats(transactions, settings, timeRange = 'this-month', includeFixedExpenses = true) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();

    // Filter transactions for the period
    const filteredTransactions = transactions.filter(t => {
        const [tY, tM, tD] = t.date.split('-').map(Number);
        if (timeRange === 'this-month') {
            return tY === currentYear && (tM - 1) === currentMonth;
        }
        // Add other ranges if needed, but focusing on 'this-month' for smart stats usually makes most sense for "Burn Rate"
        return true;
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    filteredTransactions.forEach(t => {
        if (t.type === 'income') {
            totalIncome += t.amount;
        } else {
            totalExpenses += t.amount;
        }
    });

    // Determine "Active Period" start date
    // If the user's first ever transaction was AFTER the start of this month, 
    // we should use that as the start date for averaging to avoid skewing stats.
    let startDate = 1; // Default to 1st of month

    if (transactions.length > 0) {
        // Find earliest transaction date
        const sortedDates = transactions.map(t => new Date(t.date)).sort((a, b) => a - b);
        const firstTransactionDate = sortedDates[0];

        // Check if first transaction is in the current month and year
        if (firstTransactionDate.getFullYear() === currentYear && firstTransactionDate.getMonth() === currentMonth) {
            startDate = firstTransactionDate.getDate();
        }
    }

    // Define daysPassed
    // If timeRange is 'this-month', it's (Today - StartDate + 1)
    // But max is currentDay (can't go into future)
    // And min is 1
    const daysActive = (currentDay - startDate) + 1;
    const daysPassed = timeRange === 'this-month' ? Math.max(1, daysActive) : 1;

    // Add Fixed Expenses if requested
    let fixedExpensesTotal = 0;
    if (includeFixedExpenses && settings.fixedExpenses) {
        // ... (rest of logic remains similar, but we might want to adjust how we calculate the "daily" portion)
        // If we are using a shorter "active period", should we include the full monthly fixed expenses?
        // Probably not, we should probably scale it to the active period too for "Burn Rate".
        // But for "Cash Flow" (Net Position), we probably want the full fixed expenses if they are due.
        // Let's stick to the previous logic of "daily average * daysPassed" for consistency with the Burn Rate denominator.

        const monthlyFixed = settings.fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const dailyFixed = monthlyFixed / daysInMonth; // Daily cost spread over real month

        fixedExpensesTotal = dailyFixed * daysPassed;
    }

    totalExpenses += fixedExpensesTotal;

    const cashFlow = totalIncome - totalExpenses;

    // Savings Rate
    const savingsRate = totalIncome > 0 ? (cashFlow / totalIncome) * 100 : 0;

    // Burn Rate (Daily Spend)
    // For 'this-month', divide by days passed so far.
    const burnRate = totalExpenses / daysPassed;

    return {
        totalIncome,
        totalExpenses,
        cashFlow,
        savingsRate,
        burnRate,
        daysPassed
    };
}

/**
 * Predicts future financial state based on current trends.
 */
export function predictFuture(currentTotalBalance, stats, settings, includeFixedExpenses = true) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = daysInMonth - currentDay;

    // 1. Projected End-of-Month Balance
    // Start with current actual balance (wallet + bank etc)
    // Add remaining recurring income
    // Subtract projected spend (Burn Rate * Days Remaining)

    let remainingRecurringIncome = 0;
    if (settings.recurringIncomes) {
        settings.recurringIncomes.forEach(inc => {
            if (inc.day > currentDay) {
                remainingRecurringIncome += inc.amount;
            }
        });
    }

    // We assume fixed expenses are included in the "Burn Rate" if they happen daily/regularly,
    // OR we should subtract specific remaining fixed expenses if we knew their dates.
    // Since we don't have dates for fixed expenses, let's rely on the Burn Rate to approximate "spending momentum".
    // However, Burn Rate might be low if a big rent payment hasn't happened yet.
    // This is a limitation of the current data model.
    // IMPROVEMENT: Let's assume Burn Rate covers "variable" spend, and we might miss "lumpy" fixed expenses.
    // For now, simple projection:

    // Projected Spend
    // If includeFixedExpenses is true, stats.burnRate ALREADY includes the daily portion of fixed expenses.
    // So (burnRate * daysRemaining) will project the remaining variable AND fixed expenses.
    // This assumes fixed expenses are spread out evenly.
    // If includeFixedExpenses is false, stats.burnRate is just variable spend.
    // So (burnRate * daysRemaining) is just remaining variable spend.
    // This seems consistent with what the user wants: "Show me stats with/without fixed expenses".

    const projectedSpend = stats.burnRate * daysRemaining;
    const projectedEOMBalance = currentTotalBalance + remainingRecurringIncome - projectedSpend;

    // 2. Realistic Time-to-Target
    // Use the projected monthly savings (Net Position at EOM) to estimate.
    // Projected Monthly Savings = Projected EOM Balance - Start of Month Balance?
    // Actually, simpler: Projected Monthly Net = (Total Income + Remaining Recurring) - (Total Expenses + Projected Spend)
    // Wait, Total Income includes recurring that already happened.

    const projectedMonthlyIncome = stats.totalIncome + remainingRecurringIncome;
    const projectedMonthlyExpenses = stats.totalExpenses + projectedSpend;
    const projectedMonthlyNet = projectedMonthlyIncome - projectedMonthlyExpenses;

    let timeToTarget = 'N/A';
    let monthsToTarget = Infinity;

    if (settings.targetCash > currentTotalBalance) {
        if (projectedMonthlyNet > 0) {
            const remainingAmount = settings.targetCash - currentTotalBalance;
            monthsToTarget = remainingAmount / projectedMonthlyNet;

            if (monthsToTarget < 1) {
                timeToTarget = '< 1 Month';
            } else {
                timeToTarget = Math.ceil(monthsToTarget) + ' Months';
            }
        } else {
            timeToTarget = 'Never (Negative Flow)';
        }
    } else if (settings.targetCash > 0 && currentTotalBalance >= settings.targetCash) {
        timeToTarget = 'Goal Reached! 🎉';
    }

    return {
        projectedEOMBalance,
        projectedMonthlyNet,
        timeToTarget,
        daysRemaining
    };
}

/**
 * Generates actionable insights and advice.
 */
export function generateInsights(stats, predictions, settings) {
    const insights = [];

    // 1. Cash Flow Alert
    if (stats.cashFlow < 0) {
        insights.push({
            type: 'danger',
            icon: 'bi-exclamation-triangle',
            text: `You are currently spending more than you earn (-$${Math.abs(stats.cashFlow).toFixed(0)}).`
        });
    } else {
        insights.push({
            type: 'success',
            icon: 'bi-graph-up-arrow',
            text: `Positive cash flow! You're up $${stats.cashFlow.toFixed(0)} this month.`
        });
    }

    // 2. Burn Rate Context
    // Compare burn rate to "Safe Burn Rate" (Income / Days in Month)?
    // If we assume total monthly income is roughly (Current Income + Remaining Recurring)
    // Safe Daily Spend = (Total Expected Income - Target Savings?) / Days in Month
    // Let's keep it simple:
    if (stats.burnRate > 100) { // Arbitrary threshold for now, or maybe based on income?
        // Let's make it relative to income if possible.
        if (stats.totalIncome > 0) {
            const dailyIncome = stats.totalIncome / stats.daysPassed;
            if (stats.burnRate > dailyIncome) {
                insights.push({
                    type: 'warning',
                    icon: 'bi-fire',
                    text: `High Burn Rate! You're spending $${stats.burnRate.toFixed(0)}/day, which is higher than your daily income.`
                });
            }
        }
    }

    // 3. EOM Projection
    if (predictions.projectedEOMBalance < 0) {
        insights.push({
            type: 'danger',
            icon: 'bi-wallet2',
            text: `Warning: At this rate, you might end the month with a negative balance ($${predictions.projectedEOMBalance.toFixed(0)}).`
        });
    }

    // 4. Savings Rate
    if (stats.savingsRate > 20) {
        insights.push({
            type: 'success',
            icon: 'bi-piggy-bank',
            text: `Great job! You're saving ${stats.savingsRate.toFixed(1)}% of your income.`
        });
    } else if (stats.savingsRate < 0) {
        // Already covered by cash flow negative usually
    } else if (stats.savingsRate < 5) {
        insights.push({
            type: 'info',
            icon: 'bi-lightbulb',
            text: `Tip: Try to increase your savings rate. Currently at ${stats.savingsRate.toFixed(1)}%.`
        });
    }

    return insights;
}
