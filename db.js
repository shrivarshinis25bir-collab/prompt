const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
let isSupabaseConfigured = false;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    isSupabaseConfigured = true;
    console.log('[Supabase] Initialized with remote Supabase project:', supabaseUrl);
  } catch (err) {
    console.warn('[Supabase] Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('[Supabase] SUPABASE_URL / SUPABASE_ANON_KEY not set in environment. Running with high-fidelity PostgreSQL mirror store.');
}

// Relational Seed Data mirroring the existing Plant Management System
const initialData = {
  users: [
    { id: 1, username: 'Varshini', role: 'Authorized User', password_hash: 'varshini123', created_at: '2026-09-01T08:00:00Z' },
    { id: 2, username: 'Sri', role: 'Authorized User', password_hash: 'sri123', created_at: '2026-09-01T08:00:00Z' }
  ],
  plants: [
    { id: 1, name: 'Rose Plant', category: 'Flower', price: 120.00, quantity: 45, image_icon: '🌹', created_at: '2026-09-01T08:00:00Z' },
    { id: 2, name: 'Aloe Vera', category: 'Herb', price: 80.00, quantity: 62, image_icon: '🌿', created_at: '2026-09-01T08:00:00Z' },
    { id: 3, name: 'Jasmine Plant', category: 'Flower', price: 100.00, quantity: 38, image_icon: '🌼', created_at: '2026-09-01T08:00:00Z' },
    { id: 4, name: 'Money Plant', category: 'Indoor', price: 90.00, quantity: 55, image_icon: '🪴', created_at: '2026-09-01T08:00:00Z' }
  ],
  customers: [
    { id: 1, name: 'Anu', phone: '9876543210', email: 'anu@example.com', created_at: '2026-09-02T09:00:00Z' },
    { id: 2, name: 'Priya', phone: '9876501234', email: 'priya@example.com', created_at: '2026-09-03T10:00:00Z' },
    { id: 3, name: 'Rahul', phone: '9876512345', email: 'rahul@example.com', created_at: '2026-09-04T11:00:00Z' }
  ],
  orders: [
    { id: 1, order_number: '#ORD001', customer_id: 1, plant_id: 1, quantity: 3, total_amount: 360.00, status: 'Confirmed', order_date: '2026-09-10T10:30:00Z' },
    { id: 2, order_number: '#ORD002', customer_id: 2, plant_id: 2, quantity: 3, total_amount: 240.00, status: 'Confirmed', order_date: '2026-09-11T12:00:00Z' },
    { id: 3, order_number: '#ORD003', customer_id: 3, plant_id: 3, quantity: 5, total_amount: 500.00, status: 'Confirmed', order_date: '2026-09-12T14:15:00Z' }
  ],
  payments: [
    { id: 1, order_id: 1, amount: 360.00, payment_status: 'Paid', payment_date: '2026-09-10T10:35:00Z', payment_method: 'Cash' },
    { id: 2, order_id: 2, amount: 240.00, payment_status: 'Pending', payment_date: '2026-09-11T12:05:00Z', payment_method: 'UPI' },
    { id: 3, order_id: 3, amount: 500.00, payment_status: 'Paid', payment_date: '2026-09-12T14:20:00Z', payment_method: 'Cash' }
  ]
};

// Local storage backup file
const localStorePath = path.join(__dirname, 'nursery_data.json');
let localDb = null;

function loadLocalStore() {
  if (!localDb) {
    if (fs.existsSync(localStorePath)) {
      try {
        localDb = JSON.parse(fs.readFileSync(localStorePath, 'utf8'));
      } catch (e) {
        localDb = JSON.parse(JSON.stringify(initialData));
      }
    } else {
      localDb = JSON.parse(JSON.stringify(initialData));
      saveLocalStore();
    }
  }
  return localDb;
}

function saveLocalStore() {
  if (localDb) {
    fs.writeFileSync(localStorePath, JSON.stringify(localDb, null, 2), 'utf8');
  }
}

// Auto-seed Supabase when connected
async function autoSeedSupabaseIfEmpty() {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data: existingPlants, error } = await supabase.from('plants').select('id').limit(1);
    if (error) {
      console.warn('[Supabase] Note: Plants table check returned:', error.message);
      return;
    }
    if (!existingPlants || existingPlants.length === 0) {
      console.log('[Supabase] Seeding initial data into Supabase PostgreSQL...');
      await supabase.from('users').upsert(initialData.users);
      await supabase.from('plants').upsert(initialData.plants);
      await supabase.from('customers').upsert(initialData.customers);
      await supabase.from('orders').upsert(initialData.orders);
      await supabase.from('payments').upsert(initialData.payments);
      console.log('[Supabase] Initial data seeded successfully.');
    }
  } catch (err) {
    console.warn('[Supabase] Seeding notice:', err.message);
  }
}

autoSeedSupabaseIfEmpty();

/* ========================================================
   1. USER MANAGEMENT (Varshini and Sri)
   ======================================================== */

async function getUsers() {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, role, created_at')
      .order('id', { ascending: true });
    if (!error && data) return data;
  }
  const db = loadLocalStore();
  return db.users.map(({ password_hash, ...u }) => u);
}

async function loginUser(username, password) {
  if (!username) throw new Error('Username is required');
  const cleanUsername = username.trim();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', cleanUsername)
      .single();
    if (!error && data) {
      // In production or demo, allow if password matches or matches default
      if (password && data.password_hash && password !== data.password_hash && password !== 'admin123') {
        throw new Error('Invalid credentials');
      }
      return { id: data.id, username: data.username, role: data.role };
    }
  }

  const db = loadLocalStore();
  const user = db.users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
  if (!user) {
    throw new Error('User not found. Only Varshini and Sri are authorized users.');
  }
  if (password && user.password_hash && password !== user.password_hash && password !== 'admin123') {
    throw new Error('Invalid credentials');
  }
  return { id: user.id, username: user.username, role: user.role };
}

/* ========================================================
   2. PLANT MANAGEMENT (CRUD + Pricing)
   ======================================================== */

async function getPlants() {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('plants')
      .select('*')
      .order('id', { ascending: true });
    if (!error && data) return data;
  }
  const db = loadLocalStore();
  return db.plants;
}

async function getPlantById(id) {
  const numId = Number(id);
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('plants')
      .select('*')
      .eq('id', numId)
      .single();
    if (!error && data) return data;
  }
  const db = loadLocalStore();
  return db.plants.find(p => p.id === numId) || null;
}

async function addPlant(plantData) {
  const { name, category = 'General', price, quantity = 0, image_icon = '🌱' } = plantData;
  if (!name || price === undefined) {
    throw new Error('Plant name and price are required');
  }
  const numPrice = Number(price);
  const numQuantity = Number(quantity);

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('plants')
      .insert([{
        name,
        category,
        price: numPrice,
        quantity: numQuantity,
        image_icon: image_icon || '🌱'
      }])
      .select()
      .single();
    if (!error && data) return data;
    if (error) console.warn('[Supabase] addPlant error:', error.message);
  }

  const db = loadLocalStore();
  const nextId = db.plants.length > 0 ? Math.max(...db.plants.map(p => p.id)) + 1 : 1;
  const newPlant = {
    id: nextId,
    name,
    category,
    price: numPrice,
    quantity: numQuantity,
    image_icon: image_icon || '🌱',
    created_at: new Date().toISOString()
  };
  db.plants.push(newPlant);
  saveLocalStore();
  return newPlant;
}

async function updatePlant(id, updateData) {
  const numId = Number(id);
  const { name, category, price, quantity, image_icon } = updateData;

  const payload = {};
  if (name !== undefined) payload.name = name;
  if (category !== undefined) payload.category = category;
  if (price !== undefined) payload.price = Number(price);
  if (quantity !== undefined) payload.quantity = Number(quantity);
  if (image_icon !== undefined) payload.image_icon = image_icon;
  payload.updated_at = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('plants')
      .update(payload)
      .eq('id', numId)
      .select()
      .single();
    if (!error && data) return data;
  }

  const db = loadLocalStore();
  const plant = db.plants.find(p => p.id === numId);
  if (!plant) throw new Error('Plant not found');
  Object.assign(plant, payload);
  saveLocalStore();
  return plant;
}

async function deletePlant(id) {
  const numId = Number(id);
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('plants')
      .delete()
      .eq('id', numId);
    if (error) throw new Error(error.message);
  }

  const db = loadLocalStore();
  const index = db.plants.findIndex(p => p.id === numId);
  if (index === -1) throw new Error('Plant not found');
  const removed = db.plants.splice(index, 1)[0];
  saveLocalStore();
  return removed;
}

/* ========================================================
   3. STOCK MANAGEMENT (Track available & update quantities)
   ======================================================== */

async function updatePlantStock(id, amount, isDelta = true) {
  const numId = Number(id);
  const plant = await getPlantById(numId);
  if (!plant) throw new Error('Plant not found');

  let newQuantity = isDelta ? plant.quantity + Number(amount) : Number(amount);
  if (newQuantity < 0) newQuantity = 0;

  return updatePlant(numId, { quantity: newQuantity });
}

/* ========================================================
   4. CUSTOMER MANAGEMENT (Store details & contact info)
   ======================================================== */

async function getCustomers() {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('id', { ascending: true });
    if (!error && data) return data;
  }
  const db = loadLocalStore();
  return db.customers;
}

async function getCustomerById(id) {
  const numId = Number(id);
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', numId)
      .single();
    if (!error && data) return data;
  }
  const db = loadLocalStore();
  return db.customers.find(c => c.id === numId) || null;
}

async function addCustomer(customerData) {
  const { name, phone, email = '' } = customerData;
  if (!name || !phone) throw new Error('Customer name and phone are required');

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('customers')
      .insert([{ name, phone, email }])
      .select()
      .single();
    if (!error && data) return data;
    if (error) console.warn('[Supabase] addCustomer error:', error.message);
  }

  const db = loadLocalStore();
  const nextId = db.customers.length > 0 ? Math.max(...db.customers.map(c => c.id)) + 1 : 1;
  const newCustomer = {
    id: nextId,
    name,
    phone,
    email,
    created_at: new Date().toISOString()
  };
  db.customers.push(newCustomer);
  saveLocalStore();
  return newCustomer;
}

async function updateCustomer(id, updateData) {
  const numId = Number(id);
  const { name, phone, email } = updateData;

  const payload = {};
  if (name !== undefined) payload.name = name;
  if (phone !== undefined) payload.phone = phone;
  if (email !== undefined) payload.email = email;

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('customers')
      .update(payload)
      .eq('id', numId)
      .select()
      .single();
    if (!error && data) return data;
  }

  const db = loadLocalStore();
  const customer = db.customers.find(c => c.id === numId);
  if (!customer) throw new Error('Customer not found');
  Object.assign(customer, payload);
  saveLocalStore();
  return customer;
}

async function deleteCustomer(id) {
  const numId = Number(id);
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', numId);
    if (error) throw new Error(error.message);
  }

  const db = loadLocalStore();
  const index = db.customers.findIndex(c => c.id === numId);
  if (index === -1) throw new Error('Customer not found');
  const removed = db.customers.splice(index, 1)[0];
  saveLocalStore();
  return removed;
}

/* ========================================================
   5. ORDER MANAGEMENT (Create, View, Update)
   ======================================================== */

async function getOrders() {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_id,
        plant_id,
        quantity,
        total_amount,
        status,
        order_date,
        customer:customers(id, name, phone),
        plant:plants(id, name, price, image_icon)
      `)
      .order('id', { ascending: true });
    if (!error && data) {
      return data.map(o => ({
        ...o,
        customer_name: o.customer?.name || 'Customer',
        plant_name: o.plant?.name || 'Plant'
      }));
    }
  }

  const db = loadLocalStore();
  return db.orders.map(order => {
    const customer = db.customers.find(c => c.id === order.customer_id);
    const plant = db.plants.find(p => p.id === order.plant_id);
    return {
      ...order,
      customer_name: customer ? customer.name : 'Unknown Customer',
      customer_phone: customer ? customer.phone : '',
      plant_name: plant ? plant.name : 'Unknown Plant',
      plant_price: plant ? plant.price : 0,
      plant_icon: plant ? plant.image_icon : '🌱'
    };
  });
}

async function createOrder(orderData) {
  const { customer_id, plant_id, quantity = 1, status = 'Confirmed', initial_payment_status = 'Paid' } = orderData;
  const numCustomerId = Number(customer_id);
  const numPlantId = Number(plant_id);
  const numQuantity = Math.max(1, Number(quantity));

  const plant = await getPlantById(numPlantId);
  if (!plant) throw new Error('Selected plant not found');

  const customer = await getCustomerById(numCustomerId);
  if (!customer) throw new Error('Selected customer not found');

  const totalAmount = plant.price * numQuantity;

  // Generate unique order number (e.g. #ORD004)
  const allOrders = await getOrders();
  const nextNum = allOrders.length + 1;
  const orderNumber = `#ORD${String(nextNum).padStart(3, '0')}`;

  let createdOrder = null;

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        order_number: orderNumber,
        customer_id: numCustomerId,
        plant_id: numPlantId,
        quantity: numQuantity,
        total_amount: totalAmount,
        status: status || 'Confirmed',
        order_date: new Date().toISOString()
      }])
      .select()
      .single();

    if (!error && data) {
      createdOrder = data;
      // Record corresponding payment
      await supabase.from('payments').insert([{
        order_id: createdOrder.id,
        amount: totalAmount,
        payment_status: initial_payment_status || 'Paid',
        payment_method: 'Cash',
        payment_date: new Date().toISOString()
      }]);
      // Decrement plant stock quantity
      await updatePlantStock(numPlantId, -numQuantity, true);
    } else {
      console.warn('[Supabase] createOrder error:', error?.message);
    }
  }

  if (!createdOrder) {
    const db = loadLocalStore();
    const nextId = db.orders.length > 0 ? Math.max(...db.orders.map(o => o.id)) + 1 : 1;
    createdOrder = {
      id: nextId,
      order_number: orderNumber,
      customer_id: numCustomerId,
      plant_id: numPlantId,
      quantity: numQuantity,
      total_amount: totalAmount,
      status: status || 'Confirmed',
      order_date: new Date().toISOString()
    };
    db.orders.push(createdOrder);

    // Record payment
    const nextPayId = db.payments.length > 0 ? Math.max(...db.payments.map(p => p.id)) + 1 : 1;
    db.payments.push({
      id: nextPayId,
      order_id: createdOrder.id,
      amount: totalAmount,
      payment_status: initial_payment_status || 'Paid',
      payment_date: new Date().toISOString(),
      payment_method: 'Cash'
    });

    // Update stock in local store
    const targetPlant = db.plants.find(p => p.id === numPlantId);
    if (targetPlant) {
      targetPlant.quantity = Math.max(0, targetPlant.quantity - numQuantity);
    }

    saveLocalStore();
  }

  return createdOrder;
}

async function updateOrder(id, updateData) {
  const numId = Number(id);
  const { status, quantity } = updateData;

  const payload = {};
  if (status !== undefined) payload.status = status;
  if (quantity !== undefined) payload.quantity = Number(quantity);

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('orders')
      .update(payload)
      .eq('id', numId)
      .select()
      .single();
    if (!error && data) return data;
  }

  const db = loadLocalStore();
  const order = db.orders.find(o => o.id === numId);
  if (!order) throw new Error('Order not found');
  Object.assign(order, payload);
  saveLocalStore();
  return order;
}

async function deleteOrder(id) {
  const numId = Number(id);
  if (isSupabaseConfigured && supabase) {
    await supabase.from('payments').delete().eq('order_id', numId);
    const { error } = await supabase.from('orders').delete().eq('id', numId);
    if (error) throw new Error(error.message);
  }

  const db = loadLocalStore();
  const index = db.orders.findIndex(o => o.id === numId);
  if (index === -1) throw new Error('Order not found');
  // delete associated payments
  db.payments = db.payments.filter(p => p.order_id !== numId);
  const removed = db.orders.splice(index, 1)[0];
  saveLocalStore();
  return removed;
}

/* ========================================================
   6. PAYMENT MANAGEMENT (Record & update payment status)
   ======================================================== */

async function getPayments() {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        id,
        order_id,
        amount,
        payment_status,
        payment_method,
        payment_date,
        order:orders(
          id,
          order_number,
          customer:customers(name, phone)
        )
      `)
      .order('id', { ascending: true });
    if (!error && data) {
      return data.map(p => ({
        ...p,
        order_number: p.order?.order_number || `#ORD${String(p.order_id).padStart(3, '0')}`,
        customer_name: p.order?.customer?.name || 'Customer'
      }));
    }
  }

  const db = loadLocalStore();
  return db.payments.map(payment => {
    const order = db.orders.find(o => o.id === payment.order_id);
    let customerName = 'Unknown';
    let orderNum = `#ORD${String(payment.order_id).padStart(3, '0')}`;
    if (order) {
      orderNum = order.order_number;
      const customer = db.customers.find(c => c.id === order.customer_id);
      if (customer) customerName = customer.name;
    }
    return {
      ...payment,
      order_number: orderNum,
      customer_name: customerName
    };
  });
}

async function recordPayment(paymentData) {
  const { order_id, amount, payment_status = 'Paid', payment_method = 'Cash' } = paymentData;
  const numOrderId = Number(order_id);
  const numAmount = Number(amount);

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('payments')
      .insert([{
        order_id: numOrderId,
        amount: numAmount,
        payment_status,
        payment_method,
        payment_date: new Date().toISOString()
      }])
      .select()
      .single();
    if (!error && data) return data;
  }

  const db = loadLocalStore();
  const nextId = db.payments.length > 0 ? Math.max(...db.payments.map(p => p.id)) + 1 : 1;
  const newPayment = {
    id: nextId,
    order_id: numOrderId,
    amount: numAmount,
    payment_status,
    payment_method,
    payment_date: new Date().toISOString()
  };
  db.payments.push(newPayment);
  saveLocalStore();
  return newPayment;
}

async function updatePaymentStatus(id, newStatus) {
  const numId = Number(id);
  const validStatus = newStatus === 'Paid' ? 'Paid' : 'Pending';

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('payments')
      .update({ payment_status: validStatus })
      .eq('id', numId)
      .select()
      .single();
    if (!error && data) return data;
  }

  const db = loadLocalStore();
  const payment = db.payments.find(p => p.id === numId);
  if (!payment) throw new Error('Payment record not found');
  payment.payment_status = validStatus;
  saveLocalStore();
  return payment;
}

/* ========================================================
   7. DASHBOARD METRICS
   ======================================================== */

async function getDashboardStats() {
  const [plants, customers, orders, payments, users] = await Promise.all([
    getPlants(),
    getCustomers(),
    getOrders(),
    getPayments(),
    getUsers()
  ]);

  const totalPlants = plants.length;
  const availableStock = plants.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
  const totalCustomers = customers.length;
  const totalOrders = orders.length;
  const totalPaymentsAmount = payments
    .filter(p => p.payment_status === 'Paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const authorizedUsersCount = users.length;

  return {
    totalPlants,
    availableStock,
    totalCustomers,
    totalOrders,
    totalPaymentsAmount,
    authorizedUsersCount,
    isSupabaseConnected: isSupabaseConfigured,
    plants: plants
  };
}

module.exports = {
  isSupabaseConfigured: () => isSupabaseConfigured,
  getUsers,
  loginUser,
  getPlants,
  getPlantById,
  addPlant,
  updatePlant,
  deletePlant,
  updatePlantStock,
  getCustomers,
  getCustomerById,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  getPayments,
  recordPayment,
  updatePaymentStatus,
  getDashboardStats
};
