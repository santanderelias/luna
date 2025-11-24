# 💰 Luna - Personal Finance Tracker

A modern, feature-rich personal finance tracker with beautiful visualizations and smart projections. All data stays private in your browser - no servers, no tracking, just you and your finances.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://santanderelias.github.io/luna/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## ✨ Features

### 📊 **Smart Financial Dashboard**
- **Daily Net Change Chart**: See exactly how much you gain or lose each day
  - Green bars for positive days, red for negative
  - Averaged fixed expenses and recurring income for accurate daily view
- **Expense Breakdown**: Interactive pie chart showing spending by category
- **Time to Target**: Visual projection of when you'll reach your savings goal
- **Carousel View**: Swipe through charts with smooth transitions

### 💸 **Transaction Management**
- Add, edit, and delete income and expense transactions
- Dynamic categories that grow with your spending habits
- Search and filter transactions by description, category, or amount
- Custom categories with "Other" option

### 🎯 **Goal Setting & Projections**
- Set target cash amount and target date
- Smart projections show if you're "On track" or "Late"
- Multiple time ranges: This Month, Last Month, All Time
- Active spending days calculation for accurate averages

### ⚙️ **Flexible Settings**
- **Recurring Income**: Set up monthly paychecks with specific days
- **Fixed Expenses**: Configure monthly bills (rent, subscriptions, etc.)
- **Toggle Fixed Expenses**: See projections with or without fixed costs
- **'k' Suffix**: Display large numbers as "10k" instead of "10,000"
- **Edit Everything**: Modal-based editing for all settings

### 🎨 **Modern UI/UX**
- Bottom navigation bar for easy mobile access
- Tab-based navigation (Home, Stats, Add, Settings)
- Sticky filters bar for quick access
- Smooth animations and transitions
- Glassmorphism effects
- Responsive design for all screen sizes

### 💾 **Data Management**
- Export transactions to CSV
- Import transactions from CSV
- All data stored locally in browser (localStorage)
- Offline support with Service Worker (PWA)

---

## 🚀 Quick Start

### Option 1: Use the Live Demo
Visit [https://santanderelias.github.io/luna/](https://santanderelias.github.io/luna/)

### Option 2: Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/santanderelias/luna.git
   cd luna
   ```

2. **Serve with a local HTTP server**
   ```bash
   # Using Python 3
   python3 -m http.server 8081
   
   # Or using Node.js
   npx http-server -p 8081
   ```

3. **Open in browser**
   Navigate to `http://localhost:8081`

> **Note**: Due to ES6 modules, you must use an HTTP server. Opening `index.html` directly with `file://` will cause CORS errors.

---

## 📁 Project Structure

```
luna/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker for offline support
├── css/
│   └── style.css          # Custom styles
├── js/
│   ├── app.js             # Main application logic
│   ├── calculator.js      # Financial calculations
│   ├── charts.js          # Chart rendering
│   ├── storage.js         # localStorage management
│   └── ui.js              # UI rendering functions
├── vendor/
│   ├── css/               # Bootstrap & Bootstrap Icons
│   ├── js/                # Bootstrap & Chart.js
│   └── fonts/             # Icon fonts
└── res/
    └── icon-*.png         # PWA icons
```

---

## 🎯 How It Works

### Daily Balance Calculation
Luna shows your **daily net change** - how much you gained or lost each day:

```
Daily Net Change = 
  (Averaged Recurring Income + Transaction Income)
  - (Averaged Fixed Expenses + Transaction Expenses)
```

**Example:**
- Monthly income: $6,000 → $200/day (averaged)
- Monthly fixed expenses: $1,500 → $50/day (averaged)
- Daily transaction: -$30 (coffee & lunch)
- **Net change: $200 - $50 - $30 = +$120** ✅

### Projections
- **Spent Per Day**: Based on active spending days (days with expenses > 0)
- **Monthly Projection**: Current spending rate × days in month + fixed expenses
- **Time to Target**: Calculates months needed to reach your savings goal

---

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6 Modules)
- **UI Framework**: Bootstrap 5
- **Charts**: Chart.js
- **Icons**: Bootstrap Icons
- **Storage**: localStorage API
- **PWA**: Service Worker for offline support

---

## 📱 Progressive Web App (PWA)

Luna can be installed as a Progressive Web App:

1. Visit the site in Chrome/Edge
2. Click the install icon in the address bar
3. Use Luna like a native app with offline support!

---

## 🎨 Screenshots

### Home - Transaction History
View all your transactions with search and filter capabilities.

### Stats - Interactive Charts
Swipe through beautiful visualizations of your financial data.

### Settings - Customize Everything
Configure recurring income, fixed expenses, and preferences.

---

## 🔒 Privacy & Security

- **100% Client-Side**: All data stays in your browser
- **No Server**: No data is ever sent to any server
- **No Tracking**: No analytics, no cookies, no tracking
- **Open Source**: Inspect the code yourself

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Bootstrap](https://getbootstrap.com/)
- Charts powered by [Chart.js](https://www.chartjs.org/)
- Icons from [Bootstrap Icons](https://icons.getbootstrap.com/)

---

**Made with ❤️ by [Elias Santander](https://github.com/santanderelias)**

*Last Updated: November 2025*
