const DB_KEY = 'luna-v2-db';

export function saveDB(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

export function loadDB() {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : { transactions: [], settings: {} };
}
