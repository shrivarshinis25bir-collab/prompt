-- Supabase PostgreSQL Schema for Plant Management System
-- Matches the 6 core SRS modules:
-- 1. Plant Management
-- 2. Stock Management
-- 3. Customer Management
-- 4. Order Management
-- 5. Payment Management
-- 6. User Management (Varshini & Sri)

-- 1. Users Table (Varshini and Sri)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Authorized User',
    password_hash VARCHAR(255) NOT NULL DEFAULT 'admin123',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Plants Table (Plant Details, Prices, and Stock)
CREATE TABLE IF NOT EXISTS plants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'General',
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    image_icon VARCHAR(20) DEFAULT '🌱',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Customers Table (Customer Details and Contact Information)
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Orders Table (Customer Orders)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE RESTRICT,
    plant_id INTEGER REFERENCES plants(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    order_date TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'Confirmed'
);

-- 5. Payments Table (Payment Details & Status)
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Paid',
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    payment_method VARCHAR(50) DEFAULT 'Cash'
);

-- Indexes for optimal relational query performance
CREATE INDEX IF NOT EXISTS idx_plants_name ON plants(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_plant_id ON orders(plant_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

-- Enable Row Level Security (RLS) and grant full access to authenticated / anon clients
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public access to users" ON users;
    CREATE POLICY "Public access to users" ON users FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public access to plants" ON plants;
    CREATE POLICY "Public access to plants" ON plants FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public access to customers" ON customers;
    CREATE POLICY "Public access to customers" ON customers FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public access to orders" ON orders;
    CREATE POLICY "Public access to orders" ON orders FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public access to payments" ON payments;
    CREATE POLICY "Public access to payments" ON payments FOR ALL USING (true) WITH CHECK (true);
END $$;

-- Seed Initial System Data (Varshini, Sri, Plants, Customers, Orders, Payments)
INSERT INTO users (username, role, password_hash)
VALUES 
    ('Varshini', 'Authorized User', 'varshini123'),
    ('Sri', 'Authorized User', 'sri123')
ON CONFLICT (username) DO UPDATE 
    SET role = EXCLUDED.role;

INSERT INTO plants (id, name, category, price, quantity, image_icon)
VALUES 
    (1, 'Rose Plant', 'Flower', 120.00, 45, '🌹'),
    (2, 'Aloe Vera', 'Herb', 80.00, 62, '🌿'),
    (3, 'Jasmine Plant', 'Flower', 100.00, 38, '🌼'),
    (4, 'Money Plant', 'Indoor', 90.00, 55, '🪴')
ON CONFLICT (id) DO UPDATE 
    SET name = EXCLUDED.name,
        category = EXCLUDED.category,
        price = EXCLUDED.price,
        quantity = EXCLUDED.quantity,
        image_icon = EXCLUDED.image_icon;

SELECT setval('plants_id_seq', (SELECT MAX(id) FROM plants));

INSERT INTO customers (id, name, phone, email)
VALUES 
    (1, 'Anu', '9876543210', 'anu@example.com'),
    (2, 'Priya', '9876501234', 'priya@example.com'),
    (3, 'Rahul', '9876512345', 'rahul@example.com')
ON CONFLICT (id) DO UPDATE 
    SET name = EXCLUDED.name,
        phone = EXCLUDED.phone;

SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));

INSERT INTO orders (id, order_number, customer_id, plant_id, quantity, total_amount, status)
VALUES 
    (1, '#ORD001', 1, 1, 3, 360.00, 'Confirmed'),
    (2, '#ORD002', 2, 2, 3, 240.00, 'Confirmed'),
    (3, '#ORD003', 3, 3, 5, 500.00, 'Confirmed')
ON CONFLICT (id) DO UPDATE 
    SET order_number = EXCLUDED.order_number,
        total_amount = EXCLUDED.total_amount;

SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));

INSERT INTO payments (id, order_id, amount, payment_status, payment_method)
VALUES 
    (1, 1, 360.00, 'Paid', 'Cash'),
    (2, 2, 240.00, 'Pending', 'UPI'),
    (3, 3, 500.00, 'Paid', 'Cash')
ON CONFLICT (id) DO UPDATE 
    SET payment_status = EXCLUDED.payment_status,
        amount = EXCLUDED.amount;

SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));
