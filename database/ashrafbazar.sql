CREATE DATABASE IF NOT EXISTS ashrafbazar
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE ashrafbazar;

-- =========================================
-- USERS
-- =========================================
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NULL UNIQUE,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer','admin','staff') NOT NULL DEFAULT 'customer',
    status ENUM('active','inactive','blocked') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================
-- CATEGORIES
-- =========================================
CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    image VARCHAR(255) NULL,
    icon VARCHAR(100) NULL,
    description TEXT NULL,
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================
-- PRODUCTS
-- =========================================
CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    short_description VARCHAR(500) NULL,

    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    old_price DECIMAL(10,2) NULL,

    stock INT NOT NULL DEFAULT 0,
    low_stock_limit INT NOT NULL DEFAULT 5,

    image VARCHAR(255) NULL,

    rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    review_count INT NOT NULL DEFAULT 0,

    status ENUM('active','inactive','out_of_stock') NOT NULL DEFAULT 'active',
    featured TINYINT(1) NOT NULL DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================================
-- PRODUCT IMAGES
-- =========================================
CREATE TABLE product_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    image VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================
-- ADDRESSES
-- =========================================
CREATE TABLE addresses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,

    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    address_line TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL DEFAULT 'Bihar',
    pincode VARCHAR(10) NOT NULL,

    address_type ENUM('home','work','other') DEFAULT 'home',
    is_default TINYINT(1) NOT NULL DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================
-- ORDERS
-- =========================================
CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    order_number VARCHAR(30) NOT NULL UNIQUE,

    user_id BIGINT UNSIGNED NULL,

    customer_name VARCHAR(100) NOT NULL,
    customer_mobile VARCHAR(15) NOT NULL,
    customer_email VARCHAR(150) NULL,

    address_line TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL DEFAULT 'Bihar',
    pincode VARCHAR(10) NOT NULL,

    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    delivery_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    payment_method ENUM(
        'cod',
        'razorpay',
        'phonepe',
        'paytm'
    ) NOT NULL DEFAULT 'cod',

    payment_status ENUM(
        'pending',
        'paid',
        'failed',
        'refunded'
    ) NOT NULL DEFAULT 'pending',

    order_status ENUM(
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'returned'
    ) NOT NULL DEFAULT 'pending',

    notes TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================
-- ORDER ITEMS
-- =========================================
CREATE TABLE order_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    order_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NULL,

    product_name VARCHAR(200) NOT NULL,
    sku VARCHAR(100) NULL,

    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================
-- PAYMENTS
-- =========================================
CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    order_id BIGINT UNSIGNED NOT NULL,

    transaction_id VARCHAR(150) NULL,
    gateway VARCHAR(50) NULL,

    amount DECIMAL(10,2) NOT NULL,
    status ENUM(
        'pending',
        'success',
        'failed',
        'refunded'
    ) NOT NULL DEFAULT 'pending',

    response_data JSON NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================
-- WISHLIST
-- =========================================
CREATE TABLE wishlist (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_wishlist (user_id, product_id),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================
-- REVIEWS
-- =========================================
CREATE TABLE reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NULL,

    rating TINYINT NOT NULL,
    review TEXT NULL,

    status ENUM('pending','approved','rejected')
        NOT NULL DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (rating >= 1 AND rating <= 5),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================
-- REPAIR BOOKINGS
-- =========================================
CREATE TABLE repair_bookings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    booking_number VARCHAR(30) NOT NULL UNIQUE,

    user_id BIGINT UNSIGNED NULL,

    customer_name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL,

    device_type VARCHAR(100) NOT NULL,
    device_model VARCHAR(150) NULL,
    problem VARCHAR(255) NOT NULL,
    description TEXT NULL,

    address_line TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,

    preferred_date DATE NULL,
    preferred_time VARCHAR(50) NULL,

    status ENUM(
        'received',
        'checking',
        'repairing',
        'ready',
        'delivered',
        'cancelled'
    ) NOT NULL DEFAULT 'received',

    estimated_cost DECIMAL(10,2) NULL,
    final_cost DECIMAL(10,2) NULL,

    admin_note TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================
-- SERVICE REQUESTS
-- =========================================
CREATE TABLE service_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    request_number VARCHAR(30) NOT NULL UNIQUE,

    user_id BIGINT UNSIGNED NULL,

    customer_name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL,

    service_type VARCHAR(150) NOT NULL,
    description TEXT NULL,

    address_line TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,

    preferred_date DATE NULL,
    preferred_time VARCHAR(50) NULL,

    status ENUM(
        'pending',
        'confirmed',
        'in_progress',
        'completed',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',

    admin_note TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================
-- PRODUCT REQUESTS
-- =========================================
CREATE TABLE product_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    request_number VARCHAR(30) NOT NULL UNIQUE,

    user_id BIGINT UNSIGNED NULL,

    product_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NULL,
    quantity INT NOT NULL DEFAULT 1,
    brand_model VARCHAR(200) NULL,
    description TEXT NULL,

    customer_name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL,

    address_line TEXT NULL,
    city VARCHAR(100) NULL,
    pincode VARCHAR(10) NULL,

    status ENUM(
        'pending',
        'checking',
        'available',
        'not_available',
        'completed',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',

    admin_note TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================
-- COUPONS
-- =========================================
CREATE TABLE coupons (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(50) NOT NULL UNIQUE,

    discount_type ENUM('percentage','fixed') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,

    minimum_order DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    maximum_discount DECIMAL(10,2) NULL,

    usage_limit INT NULL,
    used_count INT NOT NULL DEFAULT 0,

    start_date DATETIME NULL,
    end_date DATETIME NULL,

    status ENUM('active','inactive') NOT NULL DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================
-- COUPON USAGE
-- =========================================
CREATE TABLE coupon_usages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    coupon_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    order_id BIGINT UNSIGNED NOT NULL,

    discount_amount DECIMAL(10,2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (coupon_id)
        REFERENCES coupons(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================
-- DELIVERY AREAS
-- =========================================
CREATE TABLE delivery_areas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    area_name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL DEFAULT 'Bihar',

    pincode VARCHAR(10) NULL,

    delivery_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    minimum_order DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    estimated_days VARCHAR(50) NULL,

    status ENUM('active','inactive') NOT NULL DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================
-- INVENTORY TRANSACTIONS
-- =========================================
CREATE TABLE inventory_transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    product_id BIGINT UNSIGNED NOT NULL,

    type ENUM(
        'purchase',
        'sale',
        'return',
        'adjustment',
        'damage'
    ) NOT NULL,

    quantity INT NOT NULL,

    reference_type VARCHAR(50) NULL,
    reference_id BIGINT UNSIGNED NULL,

    note TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================
-- SETTINGS
-- =========================================
CREATE TABLE settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;




INSERT INTO categories
(name, slug, description, status, sort_order)
VALUES
('Electrical', 'electrical', 'Electrical products and accessories', 'active', 1),
('Home & Kitchen', 'home-kitchen', 'Useful products for home and kitchen', 'active', 2),
('Electronics', 'electronics', 'Electronic products and accessories', 'active', 3),
('Daily Needs', 'daily-needs', 'Everyday useful products', 'active', 4),
('Tools', 'tools', 'Tools and hardware products', 'active', 5);




INSERT INTO delivery_areas
(area_name, city, state, delivery_charge, minimum_order, estimated_days)
VALUES
('Simri Bakhtiyarpur', 'Simri Bakhtiyarpur', 'Bihar', 0.00, 0.00, '1-2 Days');




INSERT INTO settings
(setting_key, setting_value)
VALUES
('store_name', 'AshrafBazar'),
('store_tagline', 'Aapki Local Online Dukaan'),
('store_city', 'Simri Bakhtiyarpur'),
('store_state', 'Bihar'),
('currency', 'INR'),
('cod_enabled', '1'),
('online_payment_enabled', '0'),
('delivery_enabled', '1');