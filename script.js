// Category mapping
const categoryMap = {
  "Food": ["Groceries", "Restaurants", "Snacks", "Beverages", "Fruits", "Vegetables"],
  "Transportation": ["Fuel", "Public Transport", "Taxi", "Maintenance"],
  "Utilities": ["Electricity", "Water", "Internet", "Mobile", "Identity Document"],
  "Entertainment": ["Movies", "Streaming", "Games", "Events", "Outings"],
  "Personal Care": ["Salon", "Cosmetics", "Clothing"],
  "Health Care": ["Doctor", "Medicine", "Insurance", "Hospital"],
  "Shopping": ["Electronics", "Fashion", "Home Goods"],
  "Gifts": ["Birthday", "Anniversary", "Donations"],
  "Savings": ["Investments", "Emergency Fund"],
  "Housing": ["Home Maintenance", "Home Improvement", "Housing Rent/EMI", "Tools", "Property Tax"]
};

// DOM elements
const form = document.getElementById("expenseForm");
const category1 = document.getElementById("category1");
const subcategoryContainer = document.getElementById("subcategoryContainer");
const tableBody = document.getElementById("tableBody");
const totalAmountElement = document.getElementById("totalAmount");
const searchInput = document.getElementById("searchInput");
const filterCategory = document.getElementById("filterCategory");
const filterSpecificDate = document.getElementById("filterSpecificDate");
const filterDateFrom = document.getElementById("filterDateFrom");
const filterDateTo = document.getElementById("filterDateTo");
const resetFilterBtn = document.getElementById("resetFilter");
const exportToCSVBtn = document.getElementById("exportToCSV");
const loadingScreen = document.getElementById("loadingScreen");
const mainContent = document.getElementById("mainContent");
const submitBtn = document.getElementById("submitBtn");

// Data
let expenseData = [];
let editingIndex = -1;
let isDataLoaded = false;

// Loading animation functions
function showLoadingScreen() {
  loadingScreen.classList.remove('hidden');
  mainContent.style.opacity = '0';
}

function hideLoadingScreen() {
  loadingScreen.classList.add('hidden');
  mainContent.style.opacity = '1';
}

function showTableLoading() {
  tableBody.innerHTML = `
    <tr>
      <td colspan="7">
        <div class="table-loading">
          <div class="table-loading-spinner"></div>
          <div class="table-loading-text">Loading expenses...</div>
        </div>
      </td>
    </tr>
  `;
}

function showTableSkeleton() {
  tableBody.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const row = document.createElement('tr');
    row.className = 'skeleton-row';
    row.innerHTML = `
      <td colspan="7">
        <div class="flex items-center space-x-4">
          <div class="skeleton-cell"></div>
          <div class="skeleton-cell"></div>
          <div class="skeleton-cell"></div>
          <div class="skeleton-cell"></div>
          <div class="skeleton-cell"></div>
          <div class="skeleton-cell"></div>
          <div class="skeleton-cell"></div>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  }
}

function showFormLoading() {
  const formContainer = document.getElementById('expenseFormContainer');
  formContainer.classList.add('form-loading');
  
  // Add loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.innerHTML = `
    <div class="spinner"></div>
    <span>Saving expense...</span>
  `;
  formContainer.appendChild(loadingIndicator);
}

function hideFormLoading() {
  const formContainer = document.getElementById('expenseFormContainer');
  formContainer.classList.remove('form-loading');
  
  // Remove loading indicator
  const loadingIndicator = formContainer.querySelector('.loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

function showButtonLoading(button) {
  const btnText = button.querySelector('.btn-text');
  const btnSpinner = button.querySelector('.btn-spinner');
  
  button.classList.add('btn-loading');
  btnText.style.opacity = '0';
  btnSpinner.style.display = 'block';
}

function hideButtonLoading(button) {
  const btnText = button.querySelector('.btn-text');
  const btnSpinner = button.querySelector('.btn-spinner');
  
  button.classList.remove('btn-loading');
  btnText.style.opacity = '1';
  btnSpinner.style.display = 'none';
}

function addRowAnimation(row) {
  row.classList.add('table-row-enter');
  setTimeout(() => {
    row.classList.remove('table-row-enter');
  }, 300);
}

function highlightUpdatedRow(row) {
  row.classList.add('table-row-update');
  setTimeout(() => {
    row.classList.remove('table-row-update');
  }, 500);
}

// Firebase functions
async function loadExpensesFromFirebase() {
  try {
    // Show table loading
    showTableSkeleton();
    
    // Check if Firebase is initialized
    if (!window.db) {
      console.log("Firebase not initialized, using localStorage fallback");
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading time
      expenseData = JSON.parse(localStorage.getItem("expenseData")) || [];
      isDataLoaded = true;
      renderTable();
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
    
    isDataLoaded = true;
    renderTable();
    console.log("Loaded", expenseData.length, "expenses from Firebase");
  } catch (error) {
    console.error("Error loading expenses:", error);
    // Fallback to localStorage if Firebase fails
    expenseData = JSON.parse(localStorage.getItem("expenseData")) || [];
    isDataLoaded = true;
    renderTable();
  }
}

async function saveExpenseToFirebase(expense) {
  try {
    // Check if Firebase is initialized
    if (!window.db) {
      console.log("Firebase not initialized, using localStorage fallback");
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate saving time
      expenseData.push(expense);
      localStorage.setItem("expenseData", JSON.stringify(expenseData));
      return "localStorage";
    }

    const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js');
    const expensesRef = collection(window.db, 'expenses');
    const docRef = await addDoc(expensesRef, expense);
    console.log("Expense saved to Firebase with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error saving expense:", error);
    // Fallback to localStorage
    expenseData.push(expense);
    localStorage.setItem("expenseData", JSON.stringify(expenseData));
    return "localStorage";
  }
}

async function updateExpenseInFirebase(expenseId, updatedExpense) {
  try {
    // Check if Firebase is initialized
    if (!window.db || expenseId === "localStorage") {
      console.log("Using localStorage for update");
      await new Promise(resolve => setTimeout(resolve, 600)); // Simulate update time
      localStorage.setItem("expenseData", JSON.stringify(expenseData));
      return true;
    }

    const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js');
    const expenseRef = doc(window.db, 'expenses', expenseId);
    await updateDoc(expenseRef, updatedExpense);
    console.log("Expense updated in Firebase");
    return true;
  } catch (error) {
    console.error("Error updating expense:", error);
    // Fallback to localStorage
    localStorage.setItem("expenseData", JSON.stringify(expenseData));
    return false;
  }
}

async function deleteExpenseFromFirebase(expenseId) {
  try {
    // Check if Firebase is initialized
    if (!window.db || expenseId === "localStorage") {
      console.log("Using localStorage for delete");
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delete time
      localStorage.setItem("expenseData", JSON.stringify(expenseData));
      return true;
    }

    const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js');
    const expenseRef = doc(window.db, 'expenses', expenseId);
    await deleteDoc(expenseRef);
    console.log("Expense deleted from Firebase");
    return true;
  } catch (error) {
    console.error("Error deleting expense:", error);
    // Fallback to localStorage
    localStorage.setItem("expenseData", JSON.stringify(expenseData));
    return false;
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
  // Show loading screen initially
  showLoadingScreen();
  
  // Simulate initial loading time
  await new Promise(resolve => setTimeout(resolve, 700));
  
  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("date").value = today;
  filterDateFrom.value = today;
  filterDateTo.value = today;
  
  // Load expenses from Firebase
  await loadExpensesFromFirebase();
  
  // Populate category filter
  populateCategoryFilter();
  
  // Hide loading screen and show main content
  hideLoadingScreen();
  
  // Event listeners
  category1.addEventListener("change", handleCategoryChange);
  form.addEventListener("submit", handleFormSubmit);
  searchInput.addEventListener("input", filterTable);
  filterCategory.addEventListener("change", filterTable);
  filterSpecificDate.addEventListener("change", filterTable);
  filterDateFrom.addEventListener("change", filterTable);
  filterDateTo.addEventListener("change", filterTable);
  resetFilterBtn.addEventListener("click", resetFilters);
  exportToCSVBtn.addEventListener("click", exportToCSV);
});

function populateCategoryFilter() {
  // Get unique categories from expense data
  const categories = [...new Set(expenseData.map(expense => expense.category1))].sort();
  
  // Clear existing options (except "All Categories")
  filterCategory.innerHTML = '<option value="">All Categories</option>';
  
  // Add category options
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    filterCategory.appendChild(option);
  });
  
  console.log(`Populated category filter with ${categories.length} categories`);
}

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

async function handleFormSubmit(e) {
  e.preventDefault();
  
  // Show loading states
  showButtonLoading(submitBtn);
  showFormLoading();
  
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

  try {
    if (editingIndex >= 0) {
      const success = await updateExpenseInFirebase(expenseData[editingIndex].id, entry);
      if (success) {
        expenseData[editingIndex] = { ...expenseData[editingIndex], ...entry };
        editingIndex = -1;
        submitBtn.querySelector('.btn-text').innerHTML = '<i class="fas fa-save mr-2"></i> Save Expense';
        // Show update success message
        showSuccessMessage("Expense updated successfully!");
      }
    } else {
      const id = await saveExpenseToFirebase(entry);
      if (id) {
        entry.id = id;
        expenseData.unshift(entry); // Add to beginning for newest first
        // Show add success message
        showSuccessMessage("Expense added successfully!");
      }
    }

    form.reset();
    
    // Reset date to today and category dropdowns
    document.getElementById("date").value = new Date().toISOString().split('T')[0];
    handleCategoryChange();
    
    renderTable();
    
  } catch (error) {
    console.error("Error handling form submission:", error);
    showErrorMessage("Failed to save expense. Please try again.");
  } finally {
    // Hide loading states
    hideButtonLoading(submitBtn);
    hideFormLoading();
  }
}

function showSuccessMessage(message) {
  // Remove any existing popup
  const oldPopup = document.querySelector('.success-popup');
  if (oldPopup) oldPopup.remove();

  const notification = document.createElement('div');
  notification.className = 'success-popup';
  notification.innerHTML = `
    <span class="success-icon"><i class="fas fa-check-circle"></i></span>
    <span>${message}</span>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 2600);
}

function showErrorMessage(message) {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 bounce-in';
  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-exclamation-circle mr-2"></i>
      <span>${message}</span>
    </div>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
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
      
      // Add animation to new rows
      if (!isDataLoaded) {
        addRowAnimation(row);
      }
      
      total += parseFloat(entry.amount);
    });
  }
  
  totalAmountElement.textContent = total.toFixed(2);
}

function filterTable() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedCategory = filterCategory.value;
  const specificDate = filterSpecificDate.value;
  const fromDate = filterDateFrom.value;
  const toDate = filterDateTo.value;
  
  const filteredData = expenseData.filter(entry => {
    const entryDate = new Date(entry.date);
    
    // Category filter
    const categoryMatch = !selectedCategory || entry.category1 === selectedCategory;
    if (!categoryMatch) return false;
    
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
  filterCategory.value = "";
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

function showDeleteConfirmDialog(message) {
  return new Promise((resolve) => {
    // Remove any existing modal
    const oldModal = document.getElementById('modalOverlay');
    if (oldModal) oldModal.remove();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modalOverlay';

    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog';
    dialog.innerHTML = `
      <h3><i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>Confirm Deletion</h3>
      <p>${message}</p>
      <div class="modal-actions">
        <button class="modal-btn confirm">Delete</button>
        <button class="modal-btn cancel">Cancel</button>
      </div>
    `;
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Focus the confirm button
    setTimeout(() => {
      dialog.querySelector('.confirm').focus();
    }, 50);

    // Button handlers
    dialog.querySelector('.confirm').onclick = () => {
      overlay.remove();
      resolve(true);
    };
    dialog.querySelector('.cancel').onclick = () => {
      overlay.remove();
      resolve(false);
    };
    // ESC key closes
    overlay.onkeydown = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        resolve(false);
      }
    };
    overlay.tabIndex = -1;
    overlay.focus();
  });
}

async function deleteEntry(index) {
  const confirmed = await showDeleteConfirmDialog('Do you want to delete this expense?');
  if (!confirmed) return;
  try {
    const entryToDelete = expenseData[index];
    const success = await deleteExpenseFromFirebase(entryToDelete.id);
    if (success) {
      expenseData.splice(index, 1);
      renderTable();
      showSuccessMessage("Expense deleted successfully!");
    }
  } catch (error) {
    console.error("Error deleting expense:", error);
    showErrorMessage("Failed to delete expense. Please try again.");
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
  submitBtn.querySelector('.btn-text').innerHTML = '<i class="fas fa-edit mr-2"></i> Update Expense';
  
  // Scroll to form
  form.scrollIntoView({ behavior: 'smooth' });
}

function exportToCSV() {
  if (expenseData.length === 0) {
    showErrorMessage("No expenses to export!");
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
  
  showSuccessMessage("CSV exported successfully!");
}

// Make functions available globally for inline event handlers
window.deleteEntry = deleteEntry;
window.editEntry = editEntry;