const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());

// API Status & Supabase Connection Check (Never exposes credentials)
const getStatusHandler = (req, res) => {
  res.json({
    status: 'ok',
    database: db.isSupabaseConfigured() ? 'supabase_postgresql' : 'postgresql_adapter',
    connected: db.isSupabaseConfigured(),
    timestamp: new Date().toISOString()
  });
};
app.get('/api/status', getStatusHandler);
app.get('/api/health', getStatusHandler);

// Dashboard stats
const getDashboardHandler = async (req, res) => {
  try {
    const stats = await db.getDashboardStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
app.get('/api/dashboard/stats', getDashboardHandler);
app.get('/api/dashboard', getDashboardHandler);

// ==========================================
// 1. PLANT MANAGEMENT APIs
// ==========================================
app.get('/api/plants', async (req, res) => {
  try {
    const plants = await db.getPlants();
    res.json(plants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/plants', async (req, res) => {
  try {
    const { name, category, price, quantity, icon, image_icon } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Plant name and price are required' });
    }
    const newPlant = await db.addPlant({
      name,
      category,
      price,
      quantity,
      image_icon: icon || image_icon || '🌱'
    });
    res.status(201).json(newPlant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/plants/:id', async (req, res) => {
  try {
    const updated = await db.updatePlant(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/plants/:id', async (req, res) => {
  try {
    const removed = await db.deletePlant(req.params.id);
    res.json({ success: true, removed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. STOCK MANAGEMENT APIs
// ==========================================
app.get('/api/stock', async (req, res) => {
  try {
    const plants = await db.getPlants();
    res.json(plants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/stock/:id', async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity === undefined) {
      return res.status(400).json({ error: 'Stock quantity is required' });
    }
    const updated = await db.updatePlantStock(req.params.id, quantity, false);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stock/adjust', async (req, res) => {
  try {
    const { plant_id, delta } = req.body;
    if (!plant_id || delta === undefined) {
      return res.status(400).json({ error: 'plant_id and delta are required' });
    }
    const updated = await db.updatePlantStock(plant_id, delta, true);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/plants/:id/stock', async (req, res) => {
  try {
    const { amount, isDelta } = req.body;
    if (amount === undefined) {
      return res.status(400).json({ error: 'Quantity or delta amount is required' });
    }
    const updated = await db.updatePlantStock(req.params.id, amount, isDelta !== false);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. CUSTOMER MANAGEMENT APIs
// ==========================================
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await db.getCustomers();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Customer name and phone are required' });
    }
    const newCustomer = await db.addCustomer({ name, phone, email });
    res.status(201).json(newCustomer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const updated = await db.updateCustomer(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const removed = await db.deleteCustomer(req.params.id);
    res.json({ success: true, removed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. ORDER MANAGEMENT APIs
// ==========================================
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await db.getOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customer_id, plant_id, quantity, status, initial_payment_status } = req.body;
    if (!customer_id || !plant_id) {
      return res.status(400).json({ error: 'Customer and plant must be selected' });
    }
    const order = await db.createOrder({
      customer_id,
      plant_id,
      quantity,
      status,
      initial_payment_status
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const updated = await db.updateOrder(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const removed = await db.deleteOrder(req.params.id);
    res.json({ success: true, removed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. PAYMENT MANAGEMENT APIs
// ==========================================
app.get('/api/payments', async (req, res) => {
  try {
    const payments = await db.getPayments();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const { order_id, amount, payment_status, payment_method } = req.body;
    if (!order_id || amount === undefined) {
      return res.status(400).json({ error: 'Order ID and amount are required' });
    }
    const payment = await db.recordPayment({
      order_id,
      amount,
      payment_status,
      payment_method
    });
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const updatePaymentHandler = async (req, res) => {
  try {
    const { payment_status, status } = req.body;
    const targetStatus = payment_status || status;
    if (!targetStatus) {
      return res.status(400).json({ error: 'payment_status is required' });
    }
    const updated = await db.updatePaymentStatus(req.params.id, targetStatus);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
app.patch('/api/payments/:id', updatePaymentHandler);
app.put('/api/payments/:id', updatePaymentHandler);

// ==========================================
// 6. USER MANAGEMENT APIs (Varshini and Sri)
// ==========================================
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await db.loginUser(username, password);
    res.json({ success: true, user });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// ==========================================
// STATIC ASSETS SERVING
// ==========================================
app.use(express.static(path.join(__dirname, 'plant management')));
app.use(express.static(__dirname));

app.use('/plant%20management', express.static(path.join(__dirname, 'plant management')));
app.use('/plant management', express.static(path.join(__dirname, 'plant management')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'plant management', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Plant Management System running on http://0.0.0.0:${PORT}`);
});
