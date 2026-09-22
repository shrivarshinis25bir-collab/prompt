/* =========================================================
   NURSERY MANAGEMENT SYSTEM - CLIENT CONTROLLER
   PostgreSQL / Supabase REST Integration
   Modules: Plants, Stock, Customers, Orders, Payments, Users
========================================================= */

// State Cache
const state = {
    plants: [],
    customers: [],
    orders: [],
    payments: [],
    users: [],
    activeUser: 'Varshini',
    isSupabase: true
};

/* ================================
   PAGE NAVIGATION & ROUTING
================================ */

const pages = document.querySelectorAll(".page");
const navItems = document.querySelectorAll(".nav-item");
const pageTitle = document.getElementById("pageTitle");
const sidebar = document.querySelector(".sidebar");
const menuButton = document.querySelector("#mobileMenu, .mobile-menu, .menu-button");

const pageTitles = {
    dashboard: "Dashboard",
    plants: "Plant Management",
    stock: "Stock Management",
    customers: "Customer Management",
    orders: "Order Management",
    payments: "Payment Management",
    users: "User Management"
};

function navigateToPage(pageId) {
    if (!pageId) return;

    pages.forEach(function (page) {
        if (page.id === pageId) {
            page.classList.add("active");
        } else {
            page.classList.remove("active");
        }
    });

    navItems.forEach(function (item) {
        if (item.getAttribute("data-page") === pageId) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    if (pageTitle && pageTitles[pageId]) {
        pageTitle.textContent = pageTitles[pageId];
    }

    if (sidebar && sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
    }

    // Refresh module data on navigation
    if (pageId === 'plants') loadPlants();
    if (pageId === 'stock') loadStock();
    if (pageId === 'customers') loadCustomers();
    if (pageId === 'orders') loadOrders();
    if (pageId === 'payments') loadPayments();
    if (pageId === 'dashboard') loadDashboard();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Nav items click handler
navItems.forEach(function (item) {
    item.addEventListener("click", function () {
        const targetPage = item.getAttribute("data-page");
        navigateToPage(targetPage);
    });
});

// View buttons
document.querySelectorAll(".view-button[data-page], .summary-card[data-page]").forEach(function (btn) {
    btn.addEventListener("click", function () {
        const targetPage = btn.getAttribute("data-page");
        navigateToPage(targetPage);
    });
});

// Mobile Sidebar
if (menuButton) {
    menuButton.addEventListener("click", function () {
        sidebar.classList.toggle("open");
    });
}

document.addEventListener("click", function (event) {
    if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains("open")) {
        const isClickInside = sidebar.contains(event.target) || (menuButton && menuButton.contains(event.target));
        if (!isClickInside) {
            sidebar.classList.remove("open");
        }
    }
});

// Module Cards Quick Link
document.querySelectorAll(".module-card").forEach(function (card) {
    card.addEventListener("click", function () {
        document.querySelectorAll(".module-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        const targetPage = card.getAttribute("data-page");
        if (targetPage) navigateToPage(targetPage);
    });
});

/* ================================
   MODAL CONTROLLER
================================ */

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add("active");
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove("active");
    }
}

// Close modal on background click
document.querySelectorAll(".modal-overlay").forEach(function (overlay) {
    overlay.addEventListener("click", function (e) {
        if (e.target === overlay) {
            overlay.classList.remove("active");
        }
    });
});

/* ================================
   1. DASHBOARD CONTROLLER
================================ */

async function loadDashboard() {
    try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
            const data = await res.json();
            
            // Update summary cards
            const totalPlantsEl = document.getElementById('statTotalPlants');
            const availStockEl = document.getElementById('statAvailableStock');
            const totalCustEl = document.getElementById('statTotalCustomers');
            const totalOrdersEl = document.getElementById('statTotalOrders');

            if (totalPlantsEl) totalPlantsEl.textContent = data.totalPlants;
            if (availStockEl) availStockEl.textContent = data.availableStock;
            if (totalCustEl) totalCustEl.textContent = data.totalCustomers;
            if (totalOrdersEl) totalOrdersEl.textContent = data.totalOrders;

            // Render dashboard stock preview
            if (Array.isArray(data.plants)) {
                renderDashboardStock(data.plants);
            }
        }
    } catch (err) {
        console.warn('Dashboard load error:', err);
    }
}

function renderDashboardStock(plants) {
    const tbody = document.getElementById('dashboardStockBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    plants.forEach(plant => {
        const tr = document.createElement('tr');
        const icon = plant.icon || '🌱';
        tr.innerHTML = `
            <td>
                <div class="plant-cell">
                    <div class="plant-image">${icon}</div>
                    <strong>${plant.name}</strong>
                </div>
            </td>
            <td>₹${Number(plant.price).toFixed(2)}</td>
            <td>
                <span class="stock-number">${plant.quantity}</span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/* ================================
   2. PLANT MANAGEMENT CONTROLLER
================================ */

async function loadPlants() {
    try {
        const res = await fetch('/api/plants');
        if (res.ok) {
            state.plants = await res.json();
            renderPlantsTable();
        }
    } catch (err) {
        console.error('Error loading plants:', err);
    }
}

function renderPlantsTable() {
    const tbody = document.getElementById('plantsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (state.plants.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--muted);">No plants in database. Click "+ Add New Plant" to create one.</td></tr>`;
        return;
    }

    state.plants.forEach(plant => {
        const tr = document.createElement('tr');
        const icon = plant.icon || '🌱';
        tr.innerHTML = `
            <td>
                <div class="plant-cell">
                    <div class="plant-image">${icon}</div>
                    <strong>${plant.name}</strong>
                </div>
            </td>
            <td>${plant.category || 'Standard'}</td>
            <td><strong>₹${Number(plant.price).toFixed(2)}</strong></td>
            <td><span class="stock-number">${plant.quantity}</span></td>
            <td>
                <div class="actions-cell">
                    <button class="btn-secondary btn-sm" onclick="openEditPlantModal('${plant.id}')">Edit</button>
                    <button class="btn-danger btn-sm" onclick="deletePlant('${plant.id}', '${plant.name}')">Remove</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openAddPlantModal() {
    document.getElementById('plantModalTitle').textContent = 'Add New Plant';
    document.getElementById('plantId').value = '';
    document.getElementById('plantInputName').value = '';
    document.getElementById('plantInputCategory').value = 'Flower';
    document.getElementById('plantInputPrice').value = '';
    document.getElementById('plantInputQuantity').value = '10';
    document.getElementById('plantInputIcon').value = '🌱';
    openModal('plantModal');
}

window.openEditPlantModal = function (plantId) {
    const plant = state.plants.find(p => String(p.id) === String(plantId));
    if (!plant) return;

    document.getElementById('plantModalTitle').textContent = 'Edit Plant Details';
    document.getElementById('plantId').value = plant.id;
    document.getElementById('plantInputName').value = plant.name;
    document.getElementById('plantInputCategory').value = plant.category || 'Flower';
    document.getElementById('plantInputPrice').value = plant.price;
    document.getElementById('plantInputQuantity').value = plant.quantity;
    document.getElementById('plantInputIcon').value = plant.icon || '🌱';
    openModal('plantModal');
};

window.deletePlant = async function (plantId, plantName) {
    if (!confirm(`Are you sure you want to remove "${plantName}" from the plant management database?`)) return;

    try {
        const res = await fetch(`/api/plants/${plantId}`, { method: 'DELETE' });
        if (res.ok) {
            await loadPlants();
            loadDashboard();
        } else {
            alert('Failed to delete plant.');
        }
    } catch (err) {
        console.error('Delete plant error:', err);
    }
};

const plantForm = document.getElementById('plantForm');
if (plantForm) {
    plantForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const id = document.getElementById('plantId').value;
        const payload = {
            name: document.getElementById('plantInputName').value.trim(),
            category: document.getElementById('plantInputCategory').value,
            price: Number(document.getElementById('plantInputPrice').value),
            quantity: Number(document.getElementById('plantInputQuantity').value) || 0,
            icon: document.getElementById('plantInputIcon').value
        };

        try {
            let res;
            if (id) {
                res = await fetch(`/api/plants/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch('/api/plants', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                closeModal('plantModal');
                await loadPlants();
                loadDashboard();
            } else {
                alert('Could not save plant.');
            }
        } catch (err) {
            console.error('Save plant error:', err);
        }
    });
}

const openAddPlantBtn = document.getElementById('openAddPlantBtn');
if (openAddPlantBtn) openAddPlantBtn.addEventListener('click', openAddPlantModal);

/* ================================
   3. STOCK MANAGEMENT CONTROLLER
================================ */

async function loadStock() {
    try {
        const res = await fetch('/api/stock');
        if (res.ok) {
            state.plants = await res.json();
            renderStockTable();
        }
    } catch (err) {
        console.error('Error loading stock:', err);
    }
}

function renderStockTable() {
    const tbody = document.getElementById('stockTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (state.plants.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--muted);">No plant stock records found.</td></tr>`;
        return;
    }

    state.plants.forEach(plant => {
        const tr = document.createElement('tr');
        const icon = plant.icon || '🌱';
        const qty = Number(plant.quantity) || 0;
        const isLow = qty <= 10;
        const statusClass = isLow ? 'low-stock' : 'available';
        const statusLabel = isLow ? 'Low Stock' : 'In Stock';

        tr.innerHTML = `
            <td>
                <div class="plant-cell">
                    <div class="plant-image">${icon}</div>
                    <strong>${plant.name}</strong>
                </div>
            </td>
            <td>${plant.category || 'General'}</td>
            <td>
                <strong style="font-size: 13px;">${qty}</strong> units
            </td>
            <td>
                <span class="status-badge ${statusClass}">${statusLabel}</span>
            </td>
            <td>
                <div class="stock-stepper">
                    <button class="qty-btn" onclick="stepStock('${plant.id}', -1)" title="Decrease Stock by 1">-</button>
                    <button class="qty-btn" onclick="stepStock('${plant.id}', 1)" title="Increase Stock by 1">+</button>
                    <button class="btn-secondary btn-sm" onclick="openAdjustStockModal('${plant.id}')" style="margin-left: 6px;">Set Qty</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.stepStock = async function (plantId, delta) {
    const plant = state.plants.find(p => String(p.id) === String(plantId));
    if (!plant) return;

    const newQty = Math.max(0, (Number(plant.quantity) || 0) + delta);
    try {
        const res = await fetch(`/api/stock/${plantId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: newQty })
        });
        if (res.ok) {
            plant.quantity = newQty;
            renderStockTable();
            loadDashboard();
        }
    } catch (err) {
        console.error('Stock step error:', err);
    }
};

window.openAdjustStockModal = function (plantId) {
    const plant = state.plants.find(p => String(p.id) === String(plantId));
    if (!plant) return;

    document.getElementById('stockPlantId').value = plant.id;
    document.getElementById('stockPlantNameDisplay').value = plant.name;
    document.getElementById('stockNewQuantity').value = plant.quantity;
    openModal('stockModal');
};

const stockForm = document.getElementById('stockForm');
if (stockForm) {
    stockForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const plantId = document.getElementById('stockPlantId').value;
        const newQty = Number(document.getElementById('stockNewQuantity').value);

        try {
            const res = await fetch(`/api/stock/${plantId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: newQty })
            });
            if (res.ok) {
                closeModal('stockModal');
                await loadStock();
                loadDashboard();
            }
        } catch (err) {
            console.error('Stock update error:', err);
        }
    });
}

const refreshStockBtn = document.getElementById('refreshStockBtn');
if (refreshStockBtn) refreshStockBtn.addEventListener('click', loadStock);

/* ================================
   4. CUSTOMER MANAGEMENT CONTROLLER
================================ */

async function loadCustomers() {
    try {
        const res = await fetch('/api/customers');
        if (res.ok) {
            state.customers = await res.json();
            renderCustomersTable();
        }
    } catch (err) {
        console.error('Error loading customers:', err);
    }
}

function renderCustomersTable() {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (state.customers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--muted);">No registered customers yet. Click "+ Add Customer" to register one.</td></tr>`;
        return;
    }

    state.customers.forEach(cust => {
        const tr = document.createElement('tr');
        const regDate = cust.created_at ? new Date(cust.created_at).toLocaleDateString() : 'Active Customer';
        tr.innerHTML = `
            <td>
                <strong>${cust.name}</strong>
            </td>
            <td>${cust.phone || 'N/A'}</td>
            <td>${cust.email || 'N/A'}</td>
            <td>${regDate}</td>
            <td>
                <div class="actions-cell">
                    <button class="btn-secondary btn-sm" onclick="openEditCustomerModal('${cust.id}')">Edit</button>
                    <button class="btn-danger btn-sm" onclick="deleteCustomer('${cust.id}', '${cust.name}')">Remove</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openAddCustomerModal() {
    document.getElementById('customerModalTitle').textContent = 'Add New Customer';
    document.getElementById('customerId').value = '';
    document.getElementById('customerInputName').value = '';
    document.getElementById('customerInputPhone').value = '';
    document.getElementById('customerInputEmail').value = '';
    openModal('customerModal');
}

window.openEditCustomerModal = function (custId) {
    const cust = state.customers.find(c => String(c.id) === String(custId));
    if (!cust) return;

    document.getElementById('customerModalTitle').textContent = 'Edit Customer Details';
    document.getElementById('customerId').value = cust.id;
    document.getElementById('customerInputName').value = cust.name;
    document.getElementById('customerInputPhone').value = cust.phone;
    document.getElementById('customerInputEmail').value = cust.email || '';
    openModal('customerModal');
};

window.deleteCustomer = async function (custId, custName) {
    if (!confirm(`Are you sure you want to remove customer "${custName}"?`)) return;

    try {
        const res = await fetch(`/api/customers/${custId}`, { method: 'DELETE' });
        if (res.ok) {
            await loadCustomers();
            loadDashboard();
        }
    } catch (err) {
        console.error('Delete customer error:', err);
    }
};

const customerForm = document.getElementById('customerForm');
if (customerForm) {
    customerForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const id = document.getElementById('customerId').value;
        const payload = {
            name: document.getElementById('customerInputName').value.trim(),
            phone: document.getElementById('customerInputPhone').value.trim(),
            email: document.getElementById('customerInputEmail').value.trim()
        };

        try {
            let res;
            if (id) {
                res = await fetch(`/api/customers/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch('/api/customers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                closeModal('customerModal');
                await loadCustomers();
                loadDashboard();
            }
        } catch (err) {
            console.error('Save customer error:', err);
        }
    });
}

const openAddCustomerBtn = document.getElementById('openAddCustomerBtn');
if (openAddCustomerBtn) openAddCustomerBtn.addEventListener('click', openAddCustomerModal);

/* ================================
   5. ORDER MANAGEMENT CONTROLLER
================================ */

async function loadOrders() {
    try {
        const [ordersRes, custRes, plantRes] = await Promise.all([
            fetch('/api/orders'),
            fetch('/api/customers'),
            fetch('/api/plants')
        ]);

        if (ordersRes.ok) state.orders = await ordersRes.json();
        if (custRes.ok) state.customers = await custRes.json();
        if (plantRes.ok) state.plants = await plantRes.json();

        renderOrdersTable();
    } catch (err) {
        console.error('Error loading orders:', err);
    }
}

function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (state.orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color: var(--muted);">No customer orders found. Click "+ Create Order" to place one.</td></tr>`;
        return;
    }

    state.orders.forEach(order => {
        const tr = document.createElement('tr');
        const custName = order.customer_name || (order.customers && order.customers.name) || 'Customer';
        const plantName = order.plant_name || (order.plants && order.plants.name) || 'Plant';
        const statusClass = (order.status || 'pending').toLowerCase();

        tr.innerHTML = `
            <td><strong>${order.order_number || ('#ORD' + String(order.id).slice(-3))}</strong></td>
            <td>${custName}</td>
            <td>${plantName} &times; ${order.quantity}</td>
            <td><strong>₹${Number(order.total_amount).toFixed(2)}</strong></td>
            <td>
                <span class="status-badge ${statusClass}">${order.status || 'Confirmed'}</span>
            </td>
            <td>
                <div class="actions-cell">
                    <button class="btn-secondary btn-sm" onclick="toggleOrderStatus('${order.id}', '${order.status}')">Change Status</button>
                    <button class="btn-danger btn-sm" onclick="deleteOrder('${order.id}')">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.toggleOrderStatus = async function (orderId, currentStatus) {
    const nextStatus = currentStatus === 'Completed' ? 'Processing' : (currentStatus === 'Processing' ? 'Confirmed' : 'Completed');
    try {
        const res = await fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus })
        });
        if (res.ok) {
            await loadOrders();
        }
    } catch (err) {
        console.error('Order status toggle error:', err);
    }
};

window.deleteOrder = async function (orderId) {
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
        const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
        if (res.ok) {
            await loadOrders();
            loadDashboard();
        }
    } catch (err) {
        console.error('Delete order error:', err);
    }
};

function openCreateOrderModal() {
    // Populate customer dropdown
    const custSelect = document.getElementById('orderCustomerSelect');
    custSelect.innerHTML = state.customers.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('');

    // Populate plant dropdown
    const plantSelect = document.getElementById('orderPlantSelect');
    plantSelect.innerHTML = state.plants.map(p => `<option value="${p.id}" data-price="${p.price}">${p.name} - ₹${p.price}</option>`).join('');

    updateOrderPreviewTotal();
    openModal('orderModal');
}

function updateOrderPreviewTotal() {
    const plantSelect = document.getElementById('orderPlantSelect');
    const qtyInput = document.getElementById('orderQuantityInput');
    const preview = document.getElementById('orderTotalPreview');

    if (!plantSelect || !qtyInput || !preview) return;

    const selectedOption = plantSelect.options[plantSelect.selectedIndex];
    const unitPrice = selectedOption ? Number(selectedOption.dataset.price || 0) : 0;
    const qty = Number(qtyInput.value) || 1;
    const total = unitPrice * qty;

    preview.value = `₹${total.toFixed(2)}`;
}

document.getElementById('orderPlantSelect')?.addEventListener('change', updateOrderPreviewTotal);
document.getElementById('orderQuantityInput')?.addEventListener('input', updateOrderPreviewTotal);

const orderForm = document.getElementById('orderForm');
if (orderForm) {
    orderForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const customer_id = document.getElementById('orderCustomerSelect').value;
        const plant_id = document.getElementById('orderPlantSelect').value;
        const quantity = Number(document.getElementById('orderQuantityInput').value);
        const payment_status = document.getElementById('orderPaymentStatusSelect').value;

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_id,
                    plant_id,
                    quantity,
                    payment_status
                })
            });

            if (res.ok) {
                closeModal('orderModal');
                await loadOrders();
                loadDashboard();
            } else {
                alert('Could not place order.');
            }
        } catch (err) {
            console.error('Create order error:', err);
        }
    });
}

const openCreateOrderBtn = document.getElementById('openCreateOrderBtn');
if (openCreateOrderBtn) openCreateOrderBtn.addEventListener('click', openCreateOrderModal);

/* ================================
   6. PAYMENT MANAGEMENT CONTROLLER
================================ */

async function loadPayments() {
    try {
        const [payRes, ordersRes, custRes] = await Promise.all([
            fetch('/api/payments'),
            fetch('/api/orders'),
            fetch('/api/customers')
        ]);

        if (payRes.ok) state.payments = await payRes.json();
        if (ordersRes.ok) state.orders = await ordersRes.json();
        if (custRes.ok) state.customers = await custRes.json();

        renderPaymentsTable();
    } catch (err) {
        console.error('Error loading payments:', err);
    }
}

function renderPaymentsTable() {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (state.payments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 24px; color: var(--muted);">No payment records found. Click "+ Record Payment" to log one.</td></tr>`;
        return;
    }

    state.payments.forEach(pay => {
        const tr = document.createElement('tr');
        const custName = pay.customer_name || (pay.customers && pay.customers.name) || 'Customer';
        const orderNum = pay.order_number || (pay.orders && pay.orders.order_number) || `#ORD00${pay.order_id || 1}`;
        const isPaid = (pay.payment_status || pay.status || '').toLowerCase() === 'paid';
        const statusClass = isPaid ? 'paid' : 'pending';
        const statusLabel = isPaid ? 'Paid' : 'Pending';

        tr.innerHTML = `
            <td><strong>#PAY${String(pay.id).slice(-3)}</strong></td>
            <td>${orderNum}</td>
            <td>${custName}</td>
            <td><strong>₹${Number(pay.amount).toFixed(2)}</strong></td>
            <td>
                <span class="status-badge ${statusClass}" style="cursor: pointer;" onclick="togglePaymentStatus('${pay.id}', '${pay.payment_status || 'Pending'}')" title="Click to toggle Paid/Pending">
                    ● ${statusLabel}
                </span>
            </td>
            <td>${pay.payment_method || 'Cash'}</td>
            <td>
                <button class="btn-secondary btn-sm" onclick="togglePaymentStatus('${pay.id}', '${pay.payment_status || 'Pending'}')">
                    ${isPaid ? 'Mark Pending' : 'Confirm Paid'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.togglePaymentStatus = async function (payId, currentStatus) {
    const newStatus = (currentStatus || '').toLowerCase() === 'paid' ? 'Pending' : 'Paid';
    try {
        const res = await fetch(`/api/payments/${payId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_status: newStatus })
        });
        if (res.ok) {
            await loadPayments();
        }
    } catch (err) {
        console.error('Payment toggle error:', err);
    }
};

function openRecordPaymentModal() {
    const orderSelect = document.getElementById('paymentOrderSelect');
    orderSelect.innerHTML = state.orders.map(o => {
        const cust = o.customer_name || (o.customers && o.customers.name) || 'Customer';
        return `<option value="${o.id}" data-amount="${o.total_amount}">${o.order_number || '#ORD'} - ${cust} (₹${o.total_amount})</option>`;
    }).join('');

    // Pre-fill amount
    if (state.orders.length > 0) {
        document.getElementById('paymentAmountInput').value = state.orders[0].total_amount;
    }

    orderSelect.onchange = function () {
        const selected = orderSelect.options[orderSelect.selectedIndex];
        if (selected) {
            document.getElementById('paymentAmountInput').value = selected.dataset.amount;
        }
    };

    openModal('paymentModal');
}

const paymentForm = document.getElementById('paymentForm');
if (paymentForm) {
    paymentForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const order_id = document.getElementById('paymentOrderSelect').value;
        const amount = Number(document.getElementById('paymentAmountInput').value);
        const payment_status = document.getElementById('paymentStatusSelect').value;
        const payment_method = document.getElementById('paymentMethodSelect').value;

        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id,
                    amount,
                    payment_status,
                    payment_method
                })
            });

            if (res.ok) {
                closeModal('paymentModal');
                await loadPayments();
                loadDashboard();
            }
        } catch (err) {
            console.error('Record payment error:', err);
        }
    });
}

const openRecordPaymentBtn = document.getElementById('openRecordPaymentBtn');
if (openRecordPaymentBtn) openRecordPaymentBtn.addEventListener('click', openRecordPaymentModal);

/* ================================
   7. USER MANAGEMENT (Varshini & Sri)
================================ */

function setupUserSwitching() {
    const userCards = document.querySelectorAll(".system-user");
    userCards.forEach(function (userCard) {
        userCard.style.cursor = "pointer";
        userCard.addEventListener("click", async function () {
            const userName = userCard.getAttribute("data-username") || userCard.querySelector("h2").textContent.trim();
            await switchActiveUser(userName);
        });
    });
}

async function switchActiveUser(userName) {
    state.activeUser = userName;
    const initial = userName.charAt(0).toUpperCase();

    // Visual indicators on user cards
    const cardVarshini = document.getElementById('userCardVarshini');
    const cardSri = document.getElementById('userCardSri');
    const badgeVarshini = document.getElementById('badgeVarshini');
    const badgeSri = document.getElementById('badgeSri');

    if (userName === 'Varshini') {
        if (cardVarshini) cardVarshini.classList.add('active-user-card');
        if (cardSri) cardSri.classList.remove('active-user-card');
        if (badgeVarshini) badgeVarshini.textContent = '● Active User';
        if (badgeSri) badgeSri.textContent = 'Authorized';
    } else {
        if (cardSri) cardSri.classList.add('active-user-card');
        if (cardVarshini) cardVarshini.classList.remove('active-user-card');
        if (badgeSri) badgeSri.textContent = '● Active User';
        if (badgeVarshini) badgeVarshini.textContent = 'Authorized';
    }

    // Update Header Avatar & Name
    const headerAvatar = document.querySelector(".header-avatar");
    const headerName = document.querySelector(".header-profile strong");
    if (headerAvatar) headerAvatar.textContent = initial;
    if (headerName) headerName.textContent = userName;

    // Update Sidebar Avatar & Name
    const sidebarAvatar = document.querySelector(".profile-avatar");
    const sidebarName = document.querySelector(".profile-details strong");
    if (sidebarAvatar) sidebarAvatar.childNodes[0].nodeValue = initial + " ";
    if (sidebarName) sidebarName.textContent = userName;

    // Update Hero Greeting
    const heroName = document.querySelector(".hero-content h1");
    if (heroName) heroName.textContent = userName;

    // Inform API of User Auth Session
    try {
        await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: userName })
        });
    } catch (err) {
        console.warn('User login broadcast error:', err);
    }
}

/* ================================
   HEALTH CHECK & INITIALIZATION
================================ */

async function checkDatabaseHealth() {
    try {
        const res = await fetch('/api/health');
        if (res.ok) {
            const data = await res.json();
            const badgeText = document.getElementById('dbStatusText');
            if (badgeText) {
                if (data.database === 'supabase_postgresql') {
                    badgeText.textContent = 'Supabase PostgreSQL (Live)';
                } else {
                    badgeText.textContent = 'PostgreSQL Adapter (Ready)';
                }
            }
        }
    } catch (err) {
        console.warn('API health check error:', err);
    }
}

// Video Fallback
const heroVideo = document.querySelector(".hero-video");
if (heroVideo) {
    heroVideo.addEventListener("error", () => { heroVideo.style.display = "none"; });
    const videoSource = heroVideo.querySelector("source");
    if (videoSource) {
        videoSource.addEventListener("error", () => { heroVideo.style.display = "none"; });
    }
    setTimeout(() => {
        if (heroVideo.networkState === HTMLMediaElement.NETWORK_NO_SOURCE || heroVideo.readyState === 0) {
            heroVideo.style.display = "none";
        }
    }, 1500);
}

/* ================================
   8. AI ASSISTANT CHATBOT CONTROLLER
================================ */

const aiChatHistory = [];

function formatAiMarkdown(text) {
    if (!text) return '';
    // Basic HTML escaping
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Bold text: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Bullet points starting with bullet or dash
    const lines = html.split('\n');
    const formattedLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
            const content = trimmed.replace(/^[•\-]\s*/, '');
            return `<div style="display: flex; gap: 6px; margin: 3px 0 3px 6px;"><span>🌱</span><span>${content}</span></div>`;
        }
        return line;
    });

    return formattedLines.join('<br>');
}

function openAiAssistantModal() {
    openModal('aiModal');
    setTimeout(() => {
        const input = document.getElementById('aiChatInput');
        if (input) input.focus();
    }, 150);
}

function appendAiMessage(role, content) {
    const messagesContainer = document.getElementById('aiChatMessages');
    const chatBody = document.querySelector('.ai-chat-body');
    if (!messagesContainer) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-msg ${role === 'user' ? 'user-msg' : 'assistant-msg'}`;

    const avatarText = role === 'user' ? (state.activeUser ? state.activeUser.charAt(0) : 'U') : '🌿';
    const formattedContent = role === 'user' ? content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : formatAiMarkdown(content);

    msgDiv.innerHTML = `
        <div class="msg-avatar">${avatarText}</div>
        <div class="msg-bubble">${formattedContent}</div>
    `;

    messagesContainer.appendChild(msgDiv);
    if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
    }
}

async function handleAiChatSubmit(messageText) {
    const text = (messageText || '').trim();
    if (!text) return;

    const input = document.getElementById('aiChatInput');
    const sendBtn = document.getElementById('aiSendBtn');
    const typingIndicator = document.getElementById('aiTypingIndicator');
    const chatBody = document.querySelector('.ai-chat-body');
    const badge = document.getElementById('aiBadgeStatus');

    if (input) input.value = '';
    if (sendBtn) sendBtn.disabled = true;
    if (input) input.disabled = true;

    // Append user message
    appendAiMessage('user', text);
    aiChatHistory.push({ role: 'user', content: text });

    // Show typing
    if (typingIndicator) {
        typingIndicator.style.display = 'flex';
        if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
    }

    try {
        const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                history: aiChatHistory.slice(-6)
            })
        });

        if (typingIndicator) typingIndicator.style.display = 'none';

        if (res.ok) {
            const data = await res.json();
            const reply = data.reply || 'No response generated.';
            if (badge) {
                badge.textContent = data.source === 'gemini' ? 'Gemini 3.8 Flash' : 'PostgreSQL Grounded';
            }
            appendAiMessage('assistant', reply);
            aiChatHistory.push({ role: 'assistant', content: reply });
        } else {
            appendAiMessage('assistant', '⚠️ Sorry, I could not retrieve data from the nursery system right now. Please try asking again.');
        }
    } catch (err) {
        if (typingIndicator) typingIndicator.style.display = 'none';
        appendAiMessage('assistant', '⚠️ Connection error contacting the AI assistant service. Please check your network and try again.');
        console.error('AI chat error:', err);
    } finally {
        if (sendBtn) sendBtn.disabled = false;
        if (input) {
            input.disabled = false;
            input.focus();
        }
    }
}

function setupAiAssistant() {
    const openHeaderBtn = document.getElementById('openAiAssistantBtn');
    const openSidebarBtn = document.getElementById('sidebarAiNavBtn');
    const chatForm = document.getElementById('aiChatForm');
    const input = document.getElementById('aiChatInput');
    const chips = document.querySelectorAll('.ai-chip');

    if (openHeaderBtn) {
        openHeaderBtn.addEventListener('click', openAiAssistantModal);
    }

    if (openSidebarBtn) {
        openSidebarBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openAiAssistantModal();
        });
    }

    if (chatForm && input) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleAiChatSubmit(input.value);
        });
    }

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const prompt = chip.getAttribute('data-prompt');
            if (prompt) {
                handleAiChatSubmit(prompt);
            }
        });
    });
}

// Initial Boot
document.addEventListener('DOMContentLoaded', async () => {
    setupUserSwitching();
    setupAiAssistant();
    await checkDatabaseHealth();
    await loadDashboard();
    await loadPlants();
    await loadStock();
    await loadCustomers();
    await loadOrders();
    await loadPayments();
});
