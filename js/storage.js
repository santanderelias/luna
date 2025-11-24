const DB_KEY = 'luna-v2-db';

export function saveDB(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

export function loadDB() {
    const data = localStorage.getItem(DB_KEY);
    const parsedData = data ? JSON.parse(data) : {};
    
    // Ensure defaults
    if (!parsedData.transactions) parsedData.transactions = [];
    if (!parsedData.settings) parsedData.settings = {};
    
    const defaultSettings = {
        currentBalance: 0,
        targetCash: 0,
        fixedExpenses: [],
        recurringIncomes: [],
        useThousandsSuffix: false
    };

    parsedData.settings = { ...defaultSettings, ...parsedData.settings };

    return parsedData;
}
