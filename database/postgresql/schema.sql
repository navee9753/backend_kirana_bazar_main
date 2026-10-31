CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    brand VARCHAR(255),
    category VARCHAR(255),
    current_stock INT NOT NULL DEFAULT 0,
    min_stock_alert INT NOT NULL DEFAULT 0,
    purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    mrp DECIMAL(10,2) NOT NULL DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS khata_ledger (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    outstanding_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
