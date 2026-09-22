const { GoogleGenAI } = require('@google/genai');

let genAiClient = null;

function getGenAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAiClient) {
    try {
      genAiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    } catch (err) {
      console.warn('[AI Service] Failed to initialize Gemini client:', err.message);
      return null;
    }
  }
  return genAiClient;
}

/**
 * Intelligent ground-truth fallback answer generator when Gemini API is not configured or offline.
 */
function generateFallbackAnswer(userMessage, context) {
  const msg = (userMessage || '').toLowerCase();
  const { plants = [], customers = [], orders = [], payments = [], stats = {} } = context;

  // Stock / Low stock query
  if (msg.includes('low stock') || msg.includes('shortage') || msg.includes('out of stock')) {
    const lowStockPlants = plants.filter(p => Number(p.quantity) <= 10);
    if (lowStockPlants.length === 0) {
      return `Good news! All plants currently have healthy inventory levels above the threshold (10 units). Total available units across all varieties: **${stats.availableStock || 0}**.`;
    }
    const list = lowStockPlants
      .map(p => `• **${p.name}** (${p.category}): only **${p.quantity} units** remaining (Unit Price: ₹${p.price})`)
      .join('\n');
    return `⚠️ **Low Stock Alert (${lowStockPlants.length} varieties need restocking):**\n\n${list}\n\nYou can replenish units using the Stock Management module.`;
  }

  // Stock quantity query
  if (msg.includes('stock') || msg.includes('inventory') || msg.includes('available plant')) {
    const list = plants
      .map(p => `• **${p.name}** [${p.category}]: **${p.quantity} in stock** @ ₹${p.price}`)
      .join('\n');
    return `🌱 **Current Nursery Stock Summary:**\n\n${list}\n\n• **Total Varieties:** ${plants.length}\n• **Total Available Units:** ${stats.availableStock || 0}`;
  }

  // Plant price / catalog query
  if (msg.includes('price') || msg.includes('cost') || msg.includes('rate') || msg.includes('catalog') || msg.includes('plants')) {
    const matching = plants.filter(p => msg.includes(p.name.toLowerCase()));
    if (matching.length > 0) {
      return matching
        .map(p => `🌿 **${p.name}** (${p.category}): Price is **₹${Number(p.price).toFixed(2)}** per plant with **${p.quantity} units** available.`)
        .join('\n');
    }
    const list = plants
      .map(p => `• **${p.name}**: ₹${Number(p.price).toFixed(2)} (${p.quantity} units)`)
      .join('\n');
    return `🌿 **Plant Catalog & Pricing:**\n\n${list}\n\nAsk about any specific variety to get detailed stock information.`;
  }

  // Orders query
  if (msg.includes('order') || msg.includes('sales')) {
    if (orders.length === 0) {
      return `There are currently no customer orders logged in the database.`;
    }
    const list = orders
      .slice(0, 5)
      .map(o => {
        const custName = o.customer_name || (o.customers && o.customers.name) || 'Customer';
        const plant = o.plant_name || (o.plants && o.plants.name) || 'Plants';
        return `• **${o.order_number || ('#ORD00' + o.id)}**: ${custName} — ${plant} (Qty: ${o.quantity}) for **₹${Number(o.total_amount).toFixed(2)}** [${o.status || 'Confirmed'}]`;
      })
      .join('\n');
    return `📦 **Recent Customer Orders (${orders.length} total orders):**\n\n${list}`;
  }

  // Payments / Revenue query
  if (msg.includes('payment') || msg.includes('revenue') || msg.includes('paid') || msg.includes('pending') || msg.includes('money')) {
    const paidPayments = payments.filter(p => (p.payment_status || '').toLowerCase() === 'paid');
    const pendingPayments = payments.filter(p => (p.payment_status || '').toLowerCase() === 'pending');
    const paidSum = paidPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const pendingSum = pendingPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    return `💰 **Nursery Financial & Payment Overview:**\n\n• **Confirmed Paid Revenue:** ₹${paidSum.toFixed(2)} (${paidPayments.length} transactions)\n• **Pending Settlement:** ₹${pendingSum.toFixed(2)} (${pendingPayments.length} transactions)\n• **Total Transactions Logged:** ${payments.length}\n\nYou can toggle payment statuses in the Payment Management module.`;
  }

  // Customers query
  if (msg.includes('customer') || msg.includes('client') || msg.includes('phone') || msg.includes('contact')) {
    if (customers.length === 0) {
      return `There are no customers currently registered in the database.`;
    }
    const list = customers
      .map(c => `• **${c.name}**: 📞 ${c.phone || 'N/A'}${c.email ? ` | ✉️ ${c.email}` : ''}`)
      .join('\n');
    return `👥 **Registered Customer Directory (${customers.length} total):**\n\n${list}`;
  }

  // User / Operator query
  if (msg.includes('varshini') || msg.includes('sri') || msg.includes('user') || msg.includes('login') || msg.includes('admin')) {
    return `👤 **Authorized Operators:**\n• **Varshini**: Authorized Administrator\n• **Sri**: Authorized Administrator\n\nBoth operators possess full access rights to manage plant catalogs, reorder stock, dispatch orders, and reconcile payments.`;
  }

  // General summary / greeting
  return `👋 Hello! I am your **Nursery AI Assistant**.\n\nHere is a quick snapshot of the system:\n• **Plants in Catalog:** ${plants.length} varieties\n• **Total Stock Units:** ${stats.availableStock || 0} units\n• **Registered Customers:** ${customers.length}\n• **Total Orders:** ${orders.length}\n• **Active Managers:** Varshini & Sri\n\nFeel free to ask me about stock quantities, low-stock warnings, plant prices, recent orders, or payment statuses!`;
}

/**
 * Main AI answer generator
 */
async function answerNurseryQuestion(userMessage, conversationHistory = [], db) {
  // 1. Fetch live application context
  let plants = [];
  let customers = [];
  let orders = [];
  let payments = [];
  let users = [];
  let stats = {};

  try {
    [plants, customers, orders, payments, users, stats] = await Promise.all([
      db.getPlants(),
      db.getCustomers(),
      db.getOrders(),
      db.getPayments(),
      db.getUsers(),
      db.getDashboardStats()
    ]);
  } catch (err) {
    console.warn('[AI Service] Failed to load data snapshot:', err.message);
  }

  const contextData = { plants, customers, orders, payments, users, stats };

  // 2. Try Gemini API via @google/genai if key is present
  const client = getGenAiClient();
  if (client) {
    try {
      const systemInstruction = `You are the intelligent Nursery AI Assistant for the GreenLeaf Nursery Management System.
You assist the authorized managers, Varshini and Sri.
Answer the user's question clearly, concisely, and professionally using the live database snapshot below.
Always format currency in Indian Rupees (₹).
Use clean markdown bullet points, bold text for key numbers, and structured sections when listing data.
Do not hallucinate products or customers not in the database snapshot.

LIVE DATABASE SNAPSHOT:
- PLANTS (${plants.length}): ${JSON.stringify(plants.map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price, quantity: p.quantity })))}
- CUSTOMERS (${customers.length}): ${JSON.stringify(customers.map(c => ({ id: c.id, name: c.name, phone: c.phone, email: c.email })))}
- ORDERS (${orders.length}): ${JSON.stringify(orders.map(o => ({ order_number: o.order_number, customer: o.customer_name || (o.customers && o.customers.name), plant: o.plant_name || (o.plants && o.plants.name), quantity: o.quantity, total: o.total_amount, status: o.status })))}
- PAYMENTS (${payments.length}): ${JSON.stringify(payments.map(p => ({ id: p.id, order_id: p.order_id, amount: p.amount, status: p.payment_status, method: p.payment_method })))}
- AUTHORIZED USERS: Varshini, Sri (both authorized administrators)
- TOTAL AVAILABLE STOCK: ${stats.availableStock || 0}
`;

      const contents = [];
      if (Array.isArray(conversationHistory)) {
        for (const item of conversationHistory.slice(-6)) {
          if (item && item.content) {
            contents.push({
              role: item.role === 'user' ? 'user' : 'model',
              parts: [{ text: String(item.content) }]
            });
          }
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      // Try candidate models in order of current availability and speed
      const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

      for (const modelName of CANDIDATE_MODELS) {
        let timerId = null;
        try {
          const timeoutPromise = new Promise((_, reject) => {
            timerId = setTimeout(() => reject(new Error('Model timeout')), 4500);
          });

          const response = await Promise.race([
            client.models.generateContent({
              model: modelName,
              contents,
              config: {
                systemInstruction,
                temperature: 0.3
              }
            }),
            timeoutPromise
          ]);

          if (timerId) clearTimeout(timerId);

          if (response && response.text) {
            return {
              reply: response.text,
              source: 'gemini',
              model: modelName
            };
          }
        } catch (modelError) {
          if (timerId) clearTimeout(timerId);
          // If a model is experiencing high demand (503) or times out, try the next candidate model
          continue;
        }
      }
    } catch (clientErr) {
      // Gracefully continue to grounded data engine
    }
  }

  // 3. Fallback to grounded intelligent data engine
  const fallbackReply = generateFallbackAnswer(userMessage, contextData);
  return {
    reply: fallbackReply,
    source: 'grounded_data'
  };
}

module.exports = {
  answerNurseryQuestion,
  generateFallbackAnswer
};
