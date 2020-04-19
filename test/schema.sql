CREATE TABLE customers (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255),
    email varchar(255),
    phone varchar(255),
    role char(10),
    PRIMARY KEY(id)
);

CREATE TABLE addresses (
    id int NOT NULL AUTO_INCREMENT,
    street varchar(255),
    number varchar(255),
    city varchar(255),
    zip_code varchar(255),
    customer_id int NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(customer_id) REFERENCES customers(id)
);

CREATE TABLE products (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255),
    price int,
    currency char(5),
    PRIMARY KEY(id)
);

CREATE TABLE categories (
    id int NOT NULL AUTO_INCREMENT,
    name varchar(255)
);

CREATE TABLE products_categories (
    product_id int NOT NULL,
    category_id int NOT NULL,
    FOREIGN KEY(product_id) REFERENCES products(id),
    FOREIGN KEY(category_id) REFERENCES categories(id)
);

CREATE TABLE carts (
    id int NOT NULL AUTO_INCREMENT,
    customer_id int NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(customer_id) REFERENCES customers(id)
);

CREATE TABLE carts_products (
    cart_id int NOT NULL,
    product_id int NOT NULL,
    quantity int NOT NULL,
    FOREIGN KEY(cart_id) REFERENCES carts(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE orders (
    id int NOT NULL AUTO_INCREMENT,
    cart_id int NOT NULL,
    status varchar(30),
    description varchar(30),
    PRIMARY KEY(id),
    FOREIGN KEY(cart_id) REFERENCES carts(id)
);