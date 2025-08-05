// Category mapping
const categoryMap = {
  "Food": ["Groceries", "Restaurants", "Snacks", "Beverages"],
  "Transportation": ["Fuel", "Public Transport", "Taxi", "Maintenance"],
  "Utilities": ["Electricity", "Water", "Internet", "Mobile"],
  "Entertainment": ["Movies", "Streaming", "Games", "Events"],
  "Personal Care": ["Salon", "Cosmetics", "Clothing"],
  "Health Care": ["Doctor", "Medicine", "Insurance"],
  "Shopping": ["Electronics", "Fashion", "Home Goods"],
  "Gifts": ["Birthday", "Anniversary", "Donations"],
  "Rent": ["Home Rent", "Office Rent"],
  "Savings": ["Investments", "Emergency Fund"]
};

// DOM elements
const form = document.getElementById("expenseForm");
const category1 = document.getElementById("category1");
const subcategoryContainer = document.getElementById("subcategoryContainer");
const tableBody = document.getElementById("tableBody");
const totalAmountElement = document.getElementById("totalAmount");
const searchInput = document.getElementById("searchInput");
const filterSpecificDate = document.getElementById("filterSpecificDate");
const filterDateFrom = document.getElementById("filterDateFrom");
const filterDateTo = document.getElementById("filterDateTo");
const resetFilterBtn = document.getElementById("resetFilter");
const exportToCSVBtn = document.getElementById("exportToCSV");

// Data
let expenseData = JSON.parse(localStorage.getItem("expenseData")) || [];
let editingIndex = -1;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("date").value = today;
  filterDateFrom.value = today;
  filterDateTo.value = today;
  
  renderTable();
  
  // Event listeners
  category1.addEventListener("change", handleCategoryChange);
  form.addEventListener("submit", handleFormSubmit);
  searchInput.addEventListener("input", filterTable);
  filterSpecificDate.addEventListener("change", filterTable);
  filterDateFrom.addEventListener("change", filterTable);
  filterDateTo.addEventListener("change", filterTable);
  resetFilterBtn.addEventListener("click", resetFilters);
  exportToCSVBtn.addEventListener("click", exportToCSV);
});

function handleCategoryChange() {
  const selectedCategory = category1.value;
  
  // Clear previous subcategory
  subcategoryContainer.innerHTML = `
    <label class="block text-sm font-medium text-gray-700 mb-1">${selectedCategory === "Other" ? "Custom Category" : "Subcategory"}</label>
  `;
  
  if (selectedCategory === "Other") {
    // Create input field for custom category
    const input = document.createElement("input");
    input.type = "text";
    input.id = "customCategory";
    input.placeholder = "Enter custom category";
    input.className = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500";
    subcategoryContainer.appendChild(input);
  } else {
    // Create select dropdown for subcategories
    const select = document.createElement("select");
    select.id = "category2";
    select.className = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500";
    
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Subcategory";
    select.appendChild(defaultOption);
    
    if (selectedCategory && categoryMap[selectedCategory]) {
      categoryMap[selectedCategory].forEach(item => {
        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
      });
    }
    
    subcategoryContainer.appendChild(select);
  }
}

function handleFormSubmit(e) {
  e.preventDefault();
  
  const subcategoryValue = category1.value === "Other" 
    ? document.getElementById("customCategory").value || "-"
    : document.getElementById("category2").value || "-";
  
  const entry = {
    date: document.getElementById("date").value,
    category1: category1.value,
    category2: subcategoryValue,
    description: document.getElementById("description").value || "-",
    payment: document.getElementById("payment").value,
    amount: parseFloat(document.getElementById("amount").value).toFixed(2),
    timestamp: new Date(document.getElementById("date").value).getTime()
  };

  if (editingIndex >= 0) {
    expenseData[editingIndex] = entry;
    editingIndex = -1;
    form.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save mr-2"></i> Save Expense';
  } else {
    expenseData.push(entry);
  }

  localStorage.setItem("expenseData", JSON.stringify(expenseData));
  form.reset();
  
  // Reset date to today and category dropdowns
  document.getElementById("date").value = new Date().toISOString().split('T')[0];
  handleCategoryChange();
  
  renderTable();
}

function renderTable(data = expenseData) {
  tableBody.innerHTML = "";
  let total = 0;
  
  if (data.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="7" class="px-3 sm:px-6 py-4 text-center text-gray-500">
        No expenses found. Add your first expense above.
      </td>
    `;
    tableBody.appendChild(row);
  } else {
    data.forEach((entry, i) => {
      const row = document.createElement("tr");
      row.className = i % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100';
      
      row.innerHTML = `
        <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${i + 1}</td>
        <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(entry.date)}</td>
        <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <span class="font-medium">${entry.category1}</span>
          ${entry.category2 !== '-' ? `<br><span class="text-xs text-gray-400">${entry.category2}</span>` : ''}
        </td>
        <td class="hidden sm:table-cell px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title="${entry.description}">${entry.description}</td>
        <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">${entry.payment}</td>
        <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹${entry.amount}</td>
        <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button onclick="editEntry(${i})" class="text-indigo-600 hover:text-indigo-900 mr-3" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteEntry(${i})" class="text-red-600 hover:text-red-900" title="Delete">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      `;
      
      tableBody.appendChild(row);
      total += parseFloat(entry.amount);
    });
  }
  
  totalAmountElement.textContent = total.toFixed(2);
}

function filterTable() {
  const searchTerm = searchInput.value.toLowerCase();
  const specificDate = filterSpecificDate.value;
  const fromDate = filterDateFrom.value;
  const toDate = filterDateTo.value;
  
  const filteredData = expenseData.filter(entry => {
    const entryDate = new Date(entry.date);
    
    // Specific date filter (takes priority over date range)
    if (specificDate) {
      const specificDateObj = new Date(specificDate);
      const specificDateMatch = entryDate.toDateString() === specificDateObj.toDateString();
      if (!specificDateMatch) return false;
    } else {
      // Date range filter (only if no specific date is selected)
      const fromDateObj = fromDate ? new Date(fromDate) : null;
      const toDateObj = toDate ? new Date(toDate) : null;
      
      const dateInRange = 
        (!fromDate || entryDate >= fromDateObj) && 
        (!toDate || entryDate <= toDateObj);
      
      if (!dateInRange) return false;
    }
    
    // Search term filter
    const matchesSearch = 
      entry.category1.toLowerCase().includes(searchTerm) ||
      (entry.category2 && entry.category2.toLowerCase().includes(searchTerm)) ||
      entry.description.toLowerCase().includes(searchTerm) ||
      entry.payment.toLowerCase().includes(searchTerm) ||
      entry.amount.includes(searchTerm);
    
    return matchesSearch;
  });
  
  renderTable(filteredData);
}

function resetFilters() {
  searchInput.value = "";
  filterSpecificDate.value = "";
  const today = new Date().toISOString().split('T')[0];
  filterDateFrom.value = today;
  filterDateTo.value = today;
  renderTable();
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

function deleteEntry(index) {
  if (confirm("Are you sure you want to delete this expense?")) {
    expenseData.splice(index, 1);
    localStorage.setItem("expenseData", JSON.stringify(expenseData));
    renderTable();
  }
}

function editEntry(index) {
  const entry = expenseData[index];
  
  // Fill the form with the entry data
  document.getElementById("date").value = entry.date;
  document.getElementById("description").value = entry.description === '-' ? '' : entry.description;
  document.getElementById("payment").value = entry.payment;
  document.getElementById("amount").value = entry.amount;
  
  // Handle categories
  category1.value = entry.category1;
  category1.dispatchEvent(new Event("change"));
  
  // Small delay to ensure category options are populated
  setTimeout(() => {
    if (entry.category1 === "Other") {
      document.getElementById("customCategory").value = entry.category2 === '-' ? '' : entry.category2;
    } else {
      document.getElementById("category2").value = entry.category2 === '-' ? '' : entry.category2;
    }
  }, 100);
  
  editingIndex = index;
  form.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-edit mr-2"></i> Update Expense';
  
  // Scroll to form
  form.scrollIntoView({ behavior: 'smooth' });
}

function exportToCSV() {
  if (expenseData.length === 0) {
    alert("No expenses to export!");
    return;
  }
  
  let csv = 'No.,Date,Category,Subcategory,Description,Payment Method,Amount\n';
  let total = 0;
  
  expenseData.forEach((entry, i) => {
    csv += `${i + 1},${entry.date},"${entry.category1}","${entry.category2}","${entry.description}",${entry.payment},${entry.amount}\n`;
    total += parseFloat(entry.amount);
  });
  
  // Add total row
  csv += `,,,,,Total,${total.toFixed(2)}\n`;
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `expenses_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Make functions available globally for inline event handlers
window.deleteEntry = deleteEntry;
window.editEntry = editEntry;