// Dashboard JavaScript for Expense Analytics
let expenseData = [];
let filteredData = [];
let charts = {};

// DOM elements
const totalAmountElement = document.getElementById("totalAmount");
const todaySpendingElement = document.getElementById("todaySpending");
const weekSpendingElement = document.getElementById("weekSpending");
const monthSpendingElement = document.getElementById("monthSpending");
const avgDailyElement = document.getElementById("avgDaily");
const dashboardDateFrom = document.getElementById("dashboardDateFrom");
const dashboardDateTo = document.getElementById("dashboardDateTo");
const insightsContainer = document.getElementById("insightsContainer");
const topCategoriesTable = document.getElementById("topCategoriesTable");

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', async () => {
  // Set default date range (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  dashboardDateFrom.value = thirtyDaysAgo.toISOString().split('T')[0];
  dashboardDateTo.value = today.toISOString().split('T')[0];
  
  // Load data and initialize dashboard
  await loadExpensesFromFirebase();
  initializeEventListeners();
  updateDashboard();
});

// Firebase functions (same as main app)
async function loadExpensesFromFirebase() {
  try {
    if (!window.db) {
      console.log("Firebase not initialized, using localStorage fallback");
      expenseData = JSON.parse(localStorage.getItem("expenseData")) || [];
      return;
    }

    const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js');
    const expensesRef = collection(window.db, 'expenses');
    const q = query(expensesRef, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    
    expenseData = [];
    querySnapshot.forEach((doc) => {
      expenseData.push({ id: doc.id, ...doc.data() });
    });
    
    console.log("Loaded", expenseData.length, "expenses for dashboard");
  } catch (error) {
    console.error("Error loading expenses:", error);
    expenseData = JSON.parse(localStorage.getItem("expenseData")) || [];
  }
}

function initializeEventListeners() {
  // Date range filters
  dashboardDateFrom.addEventListener("change", updateDashboard);
  dashboardDateTo.addEventListener("change", updateDashboard);
  
  // Quick date buttons
  document.getElementById("last7Days").addEventListener("click", () => setDateRange(7));
  document.getElementById("last30Days").addEventListener("click", () => setDateRange(30));
  document.getElementById("last3Months").addEventListener("click", () => setDateRange(90));
  
  // Export and print buttons
  document.getElementById("exportDashboard").addEventListener("click", exportDashboard);
  document.getElementById("printDashboard").addEventListener("click", printDashboard);
}

function setDateRange(days) {
  const today = new Date();
  const startDate = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));
  
  dashboardDateFrom.value = startDate.toISOString().split('T')[0];
  dashboardDateTo.value = today.toISOString().split('T')[0];
  
  updateDashboard();
}

function updateDashboard() {
  filterDataByDateRange();
  updateQuickStats();
  updateCharts();
  updateInsights();
  updateTopCategoriesTable();
}

function filterDataByDateRange() {
  const fromDate = new Date(dashboardDateFrom.value);
  const toDate = new Date(dashboardDateTo.value);
  
  filteredData = expenseData.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= fromDate && expenseDate <= toDate;
  });
  
  console.log(`Filtered ${filteredData.length} expenses for date range`);
}

function updateQuickStats() {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const weekStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Calculate totals
  const totalAmount = filteredData.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const todaySpending = expenseData
    .filter(expense => expense.date === today)
    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const weekSpending = expenseData
    .filter(expense => new Date(expense.date) >= weekStart)
    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const monthSpending = expenseData
    .filter(expense => new Date(expense.date) >= monthStart)
    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  
  // Calculate average daily spending
  const daysInRange = Math.max(1, Math.ceil((new Date(dashboardDateTo.value) - new Date(dashboardDateFrom.value)) / (1000 * 60 * 60 * 24)));
  const avgDaily = totalAmount / daysInRange;
  
  // Update UI
  totalAmountElement.textContent = totalAmount.toFixed(2);
  todaySpendingElement.textContent = todaySpending.toFixed(2);
  weekSpendingElement.textContent = weekSpending.toFixed(2);
  monthSpendingElement.textContent = monthSpending.toFixed(2);
  avgDailyElement.textContent = avgDaily.toFixed(2);
}

function updateCharts() {
  updateExpenseTrendChart();
  updateCategoryChart();
  updatePaymentChart();
  updateDailyPatternChart();
}

function updateExpenseTrendChart() {
  const ctx = document.getElementById('expenseTrendChart').getContext('2d');
  
  // Group expenses by date
  const dailyExpenses = {};
  filteredData.forEach(expense => {
    const date = expense.date;
    if (!dailyExpenses[date]) {
      dailyExpenses[date] = 0;
    }
    dailyExpenses[date] += parseFloat(expense.amount);
  });
  
  // Sort dates and prepare data
  const sortedDates = Object.keys(dailyExpenses).sort();
  const labels = sortedDates.map(date => formatDate(date));
  const data = sortedDates.map(date => dailyExpenses[date]);
  
  if (charts.expenseTrend) {
    charts.expenseTrend.destroy();
  }
  
  charts.expenseTrend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Daily Expenses',
        data: data,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₹' + value.toFixed(0);
            }
          }
        }
      }
    }
  });
}

function updateCategoryChart() {
  const ctx = document.getElementById('categoryChart').getContext('2d');
  
  // Group expenses by category
  const categoryTotals = {};
  filteredData.forEach(expense => {
    const category = expense.category1;
    if (!categoryTotals[category]) {
      categoryTotals[category] = 0;
    }
    categoryTotals[category] += parseFloat(expense.amount);
  });
  
  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);
  const colors = generateColors(labels.length);
  
  if (charts.category) {
    charts.category.destroy();
  }
  
  charts.category = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return context.label + ': ₹' + context.parsed.toFixed(2) + ' (' + percentage + '%)';
            }
          }
        }
      }
    }
  });
}

function updatePaymentChart() {
  const ctx = document.getElementById('paymentChart').getContext('2d');
  
  // Group expenses by payment method
  const paymentTotals = {};
  filteredData.forEach(expense => {
    const payment = expense.payment;
    if (!paymentTotals[payment]) {
      paymentTotals[payment] = 0;
    }
    paymentTotals[payment] += parseFloat(expense.amount);
  });
  
  const labels = Object.keys(paymentTotals);
  const data = Object.values(paymentTotals);
  const colors = generateColors(labels.length);
  
  if (charts.payment) {
    charts.payment.destroy();
  }
  
  charts.payment = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Amount',
        data: data,
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.8', '1')),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₹' + value.toFixed(0);
            }
          }
        }
      }
    }
  });
}

function updateDailyPatternChart() {
  const ctx = document.getElementById('dailyPatternChart').getContext('2d');
  
  // Group expenses by day of week
  const dayOfWeekTotals = {
    'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0,
    'Thursday': 0, 'Friday': 0, 'Saturday': 0
  };
  
  filteredData.forEach(expense => {
    const dayOfWeek = new Date(expense.date).toLocaleDateString('en-US', { weekday: 'long' });
    dayOfWeekTotals[dayOfWeek] += parseFloat(expense.amount);
  });
  
  const labels = Object.keys(dayOfWeekTotals);
  const data = Object.values(dayOfWeekTotals);
  
  if (charts.dailyPattern) {
    charts.dailyPattern.destroy();
  }
  
  charts.dailyPattern = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Spending by Day',
        data: data,
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.2)',
        pointBackgroundColor: 'rgb(147, 51, 234)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(147, 51, 234)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₹' + value.toFixed(0);
            }
          }
        }
      }
    }
  });
}

function updateInsights() {
  const insights = generateInsights();
  insightsContainer.innerHTML = '';
  
  insights.forEach(insight => {
    const insightCard = document.createElement('div');
    insightCard.className = 'bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border-l-4 border-indigo-400';
    insightCard.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <i class="fas ${insight.icon} text-indigo-600 text-lg"></i>
        </div>
        <div class="ml-3">
          <h4 class="text-sm font-medium text-gray-900">${insight.title}</h4>
          <p class="text-sm text-gray-600 mt-1">${insight.description}</p>
        </div>
      </div>
    `;
    insightsContainer.appendChild(insightCard);
  });
}

function generateInsights() {
  const insights = [];
  
  if (filteredData.length === 0) {
    insights.push({
      icon: 'fa-info-circle',
      title: 'No Data Available',
      description: 'No expenses found for the selected date range. Try adjusting the date filter.'
    });
    return insights;
  }
  
  // Top spending category
  const categoryTotals = {};
  filteredData.forEach(expense => {
    const category = expense.category1;
    if (!categoryTotals[category]) {
      categoryTotals[category] = 0;
    }
    categoryTotals[category] += parseFloat(expense.amount);
  });
  
  const topCategory = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (topCategory) {
    insights.push({
      icon: 'fa-chart-pie',
      title: 'Top Spending Category',
      description: `${topCategory[0]} accounts for ₹${topCategory[1].toFixed(2)} of your total spending.`
    });
  }
  
  // Average daily spending
  const totalAmount = filteredData.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const daysInRange = Math.max(1, Math.ceil((new Date(dashboardDateTo.value) - new Date(dashboardDateFrom.value)) / (1000 * 60 * 60 * 24)));
  const avgDaily = totalAmount / daysInRange;
  
  insights.push({
    icon: 'fa-calculator',
    title: 'Daily Average',
    description: `You spend an average of ₹${avgDaily.toFixed(2)} per day during this period.`
  });
  
  // Most expensive day
  const dailyExpenses = {};
  filteredData.forEach(expense => {
    const date = expense.date;
    if (!dailyExpenses[date]) {
      dailyExpenses[date] = 0;
    }
    dailyExpenses[date] += parseFloat(expense.amount);
  });
  
  const mostExpensiveDay = Object.entries(dailyExpenses)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (mostExpensiveDay) {
    insights.push({
      icon: 'fa-calendar-day',
      title: 'Highest Spending Day',
      description: `${formatDate(mostExpensiveDay[0])} was your most expensive day with ₹${mostExpensiveDay[1].toFixed(2)}.`
    });
  }
  
  // Payment method preference
  const paymentTotals = {};
  filteredData.forEach(expense => {
    const payment = expense.payment;
    if (!paymentTotals[payment]) {
      paymentTotals[payment] = 0;
    }
    paymentTotals[payment] += parseFloat(expense.amount);
  });
  
  const preferredPayment = Object.entries(paymentTotals)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (preferredPayment) {
    insights.push({
      icon: 'fa-credit-card',
      title: 'Preferred Payment Method',
      description: `You prefer ${preferredPayment[0]} for payments (₹${preferredPayment[1].toFixed(2)}).`
    });
  }
  
  // Spending trend
  const sortedDates = Object.keys(dailyExpenses).sort();
  if (sortedDates.length >= 2) {
    const firstHalf = sortedDates.slice(0, Math.floor(sortedDates.length / 2));
    const secondHalf = sortedDates.slice(Math.floor(sortedDates.length / 2));
    
    const firstHalfTotal = firstHalf.reduce((sum, date) => sum + dailyExpenses[date], 0);
    const secondHalfTotal = secondHalf.reduce((sum, date) => sum + dailyExpenses[date], 0);
    
    const trend = secondHalfTotal > firstHalfTotal ? 'increasing' : 'decreasing';
    insights.push({
      icon: trend === 'increasing' ? 'fa-arrow-up' : 'fa-arrow-down',
      title: 'Spending Trend',
      description: `Your spending is ${trend} over this period.`
    });
  }
  
  return insights;
}

function updateTopCategoriesTable() {
  // Group expenses by category
  const categoryStats = {};
  filteredData.forEach(expense => {
    const category = expense.category1;
    if (!categoryStats[category]) {
      categoryStats[category] = {
        total: 0,
        count: 0
      };
    }
    categoryStats[category].total += parseFloat(expense.amount);
    categoryStats[category].count += 1;
  });
  
  // Sort by total amount
  const sortedCategories = Object.entries(categoryStats)
    .sort(([,a], [,b]) => b.total - a.total);
  
  const totalAmount = filteredData.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  
  topCategoriesTable.innerHTML = '';
  
  if (sortedCategories.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td colspan="5" class="px-6 py-4 text-center text-gray-500">
        No expenses found for the selected date range.
      </td>
    `;
    topCategoriesTable.appendChild(row);
    return;
  }
  
  sortedCategories.forEach(([category, stats], index) => {
    const percentage = totalAmount > 0 ? ((stats.total / totalAmount) * 100).toFixed(1) : 0;
    
    const row = document.createElement('tr');
    row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${index + 1}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${category}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹${stats.total.toFixed(2)}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${percentage}%</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${stats.count}</td>
    `;
    topCategoriesTable.appendChild(row);
  });
}

// Utility functions
function formatDate(dateString) {
  const options = { month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

function generateColors(count) {
  const colors = [
    'rgba(99, 102, 241, 0.8)',   // Indigo
    'rgba(147, 51, 234, 0.8)',   // Purple
    'rgba(236, 72, 153, 0.8)',   // Pink
    'rgba(239, 68, 68, 0.8)',    // Red
    'rgba(245, 101, 101, 0.8)',  // Light Red
    'rgba(251, 146, 60, 0.8)',   // Orange
    'rgba(251, 191, 36, 0.8)',   // Yellow
    'rgba(34, 197, 94, 0.8)',    // Green
    'rgba(6, 182, 212, 0.8)',    // Cyan
    'rgba(59, 130, 246, 0.8)'    // Blue
  ];
  
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
}

function exportDashboard() {
  const dashboardData = {
    dateRange: {
      from: dashboardDateFrom.value,
      to: dashboardDateTo.value
    },
    summary: {
      totalAmount: parseFloat(totalAmountElement.textContent),
      todaySpending: parseFloat(todaySpendingElement.textContent),
      weekSpending: parseFloat(weekSpendingElement.textContent),
      monthSpending: parseFloat(monthSpendingElement.textContent),
      avgDaily: parseFloat(avgDailyElement.textContent)
    },
    expenses: filteredData
  };
  
  const dataStr = JSON.stringify(dashboardData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `expense_dashboard_${new Date().toISOString().slice(0,10)}.json`;
  link.click();
}

function printDashboard() {
  window.print();
}

// Make functions available globally
window.updateDashboard = updateDashboard;
window.setDateRange = setDateRange; 