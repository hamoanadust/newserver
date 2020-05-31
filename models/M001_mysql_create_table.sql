use new;

DROP TABLE IF EXISTS user, carpark, season_rate, season, invoice, invoice_item, system_config, vehicle;

CREATE TABLE IF NOT EXISTS user ( 
user_id SERIAL NOT NULL,
username varchar(30),
name varchar(50),
company varchar(50),
email varchar(100),
contact_number varchar(20),
role varchar(200),
customer_id BIGINT,
created_at datetime,
created_by varchar(20),
password varchar(200),
announcement_dismiss boolean,
CONSTRAINT user_id_pk PRIMARY KEY(user_id)
);

CREATE TABLE IF NOT EXISTS carpark (
carpark_id SERIAL NOT NULL,
carpark_name VARCHAR(20),
carpark_code VARCHAR(10),
address VARCHAR(50),
postal_code VARCHAR(10),
public_policy ENUM('ALLOW', 'NOTALLOW', 'VERIFY'),
billing_method varchar(50),
allow_auto_renew boolean not null default false,
allow_giro boolean not null default false,
updated_at datetime,
updated_by VARCHAR(20),
status ENUM('ACTIVE', 'INACTIVE') not null default 'ACTIVE',
remarks VARCHAR(1000),
CONSTRAINT carpark_id_pk PRIMARY KEY(carpark_id)
);

CREATE TABLE IF NOT EXISTS season_rate (
season_rate_id SERIAL NOT NULL,
carpark_id INT UNSIGNED,
client_type VARCHAR(20),
vehicle_type ENUM('CAR', 'MOTOR', 'LORRY'),
total_lot INT UNSIGNED,
available_lot INT UNSIGNED,
rate INT UNSIGNED,
updated_at datetime,
updated_by VARCHAR(20),
status ENUM('ACTIVE', 'INACTIVE') not null default 'ACTIVE',
remarks VARCHAR(1000),
CONSTRAINT season_rate_id_pk PRIMARY KEY(season_rate_id)
);

CREATE TABLE IF NOT EXISTS season ( 
season_id SERIAL NOT NULL,
carpark_id INT UNSIGNED,
card_type ENUM('IU', 'CASHCARD') not null default 'IU',
card_number varchar(16) not null,
start_date date,
end_date date,
status ENUM('NEW', 'ACTIVE', 'TERMINATED', 'INACTIVE', 'PENDING', 'CANCELLED', 'EXPIRED') not null default 'NEW',
vehicle_number varchar(10),
vehicle_type enum('CAR', 'MOTOR', 'LORRY'),
auto_renew boolean,
holder_id int,
holder_name varchar(50),
holder_company varchar(100),
holder_address varchar(200),
holder_contact_number varchar(20),
holder_email varchar(50),
holder_type ENUM('TENANT', 'PUBLIC', 'VIP'),
created_at datetime,
updated_at datetime,
created_by varchar(35),
updated_by varchar(35),
CONSTRAINT season_id_pk PRIMARY KEY(season_id)
);

CREATE TABLE IF NOT EXISTS invoice ( 
invoice_id SERIAL NOT NULL,	
invoice_number varchar(20),
invoice_date datetime,
payment_terms int,
invoice_type enum('NEW', 'RENEW'),
invoice_amount float(18,2),
total_amount float(18,2),
attn varchar(20),
buyer_id int,
buyer_name varchar(50),
buyer_company varchar(200),
buyer_address varchar(200),
buyer_email varchar(100),
buyer_contact_number varchar(20),
supplier_name varchar(50),
supplier_address varchar(200),
supplier_email varchar(100),
supplier_contact_number varchar(20),
supplier_fax varchar(20),
supplier_uen varchar(20),
supplier_rcb varchar(20),
status enum('DRAFT', 'OUTSTANDING', 'PAID', 'CANCELLED'),
created_at datetime,
updated_at datetime,
created_by varchar(35),
updated_by varchar(35),
CONSTRAINT invoice_id_pk PRIMARY KEY(invoice_id)
);

CREATE TABLE IF NOT EXISTS invoice_item ( 
invoice_item_id SERIAL NOT NULL,
invoice_id int not null,
season_id int not null,
unit_price float(18,2),
quantity float(18,2),
amount float(18,2),
description varchar(1000),
CONSTRAINT invoice_item_id_pk PRIMARY KEY(invoice_item_id)
);

CREATE TABLE IF NOT EXISTS vehicle ( 
vehicle_id SERIAL NOT NULL,
user_id int,
vehicle_number varchar(20) not null,
card_type enum('IU', 'CASHCARD'),
card_number varchar(16),
status enum('ACTIVE', 'DELETED') not null default 'ACTIVE',
CONSTRAINT vehicle_id_pk PRIMARY KEY(vehicle_id)
);

insert into carpark (carpark_name, carpark_code, address, postal_code, public_policy, billing_method, tenant_slot_total, tenant_slot_available, public_slot_total, public_slot_available, updated_at, updated_by, remarks) values ('test carpark', 'test001', 'test address', '123456', 'ALLOW', 'CREDIT_CARD,PAYNOW,CHECK,GIRO', 100, 100, 50, 50, NOW(), 'sys init', 'test carpark');
insert into season_rate (carpark_id, client_type, vehicle_type, rate, updated_at, updated_by, remarks) values ((select carpark_id from carpark where carpark_name='test carpark'), 'TENANT', 'CAR', 100, NOW(), 'sys init', 'car rate for tenant for test carpark');
insert into season_rate (carpark_id, client_type, vehicle_type, rate, updated_at, updated_by, remarks) values ((select carpark_id from carpark where carpark_name='test carpark'), 'PUBLIC', 'CAR', 120, NOW(), 'sys init', 'car rate for public for test carpark');

CREATE TABLE IF NOT EXISTS iu_type ( 
iu_type_id SERIAL NOT NULL,	
initial_number varchar(100),
vehicle_type ENUM('CAR', 'LORRY', 'MOTORCYCLE', 'TRICYCLE', 'FREE'),
remarks varchar(200),
status ENUM('NEW', 'NORMAL', 'ACTIVE', 'TERMINATED', 'INACTIVE', 'SUBMITTED', 'PENDING', 'REJECTED', 'APPROVED', 'DRAFT', 'CANCELLED', 'COMPLETED', 'INCOMPLETE', 'NO-ENTRY', 'NO-EXIT', 'WRONG-ZONE', 'EXPIRED') not null default 'ACTIVE',
CONSTRAINT iu_type_id_pk PRIMARY KEY(iu_type_id)
);

CREATE TABLE IF NOT EXISTS system_config ( 
system_config_id SERIAL NOT NULL,
config_key VARCHAR(20),
config_value VARCHAR(50),
type VARCHAR(20),
description VARCHAR(1000),
CONSTRAINT system_config_id_pk PRIMARY KEY(system_config_id)
);

CREATE TABLE IF NOT EXISTS request ( 
request_id SERIAL NOT NULL,
user_id int,
request_type enum('CHANGE_VEHICLE', 'CHANGE_IU', 'CHANGE_CASHCARD', 'CHANGE_CARD_TYPE', 'RECURRING_BILLING', 'TERMINATE_SEASON'),
season_id int,
vehicle_number varchar(20),
card_type enum('IU', 'CASHCARD'),
card_number varchar(16),
recurring_billing boolean,
remarks varchar(200),
effective_datetime datetime,
status enum('NEW', 'PENDING', 'APPROVED', 'EFFECTIVE', 'REJECTED', 'CANCELLED', 'DELETED'),
updated_at datetime,
updated_by varchar(35),
CONSTRAINT request_id_pk PRIMARY KEY(request_id)
);

CREATE TABLE IF NOT EXISTS otp (
    otp_id SERIAL NOT NULL,
    user_id int,
    value varchar(6),
    contact_number varchar(20),
    email varchar(100),
    otp_type enum('SIGNUP', 'SIGNIN', 'TRANSACTION'),
    status enum('NEW', '1-TIME-WRONG', '2-TIME-WRONG', 'LOCK', 'VALID', 'EXPIRED'),
    updated_at datetime,
    CONSTRAINT otp_id_pk PRIMARY KEY(otp_id)
);


CREATE TABLE IF NOT EXISTS transaction (
    transaction_id SERIAL NOT NULL,
    invoice_id int,
    amount float(18,2),
    transaction_time datetime,
    status enum('SUCCESS', 'FAIL'),
    CONSTRAINT transaction_id_pk PRIMARY KEY(transaction_id)
);

CREATE TABLE IF NOT EXISTS payment_method (
    payment_method_id SERIAL NOT NULL,
    customer_id int,
    cardType varchar(20),
    maskedNumber varchar(30),
    expirationDate varchar(10),
    last4 varchar(4),
    token varchar(10),
    is_default boolean,
    status enum('ACTIVE', 'INACTIVE'),
    created_at datetime,
    updated_at datetime,
    CONSTRAINT payment_method_id_pk PRIMARY KEY(payment_method_id)
);


CREATE TABLE IF NOT EXISTS announcement (
    announcement_id SERIAL NOT NULL,
    content varchar(200),
    status enum('ACTIVE', 'INACTIVE') not null default 'INACTIVE',
    created_at datetime,
    updated_at datetime,
    CONSTRAINT announcement_id_pk PRIMARY KEY(announcement_id)
);

insert into iu_type (initial_number, vehicle_type) values
('{001, 002, 003, 004}', 'FREE'),
('{071, 072, 073, 074, 075, 076, 077}', 'MOTORCYCLE'),
('{101, 107}', 'TRICYCLE'),
('{102, 103, 104, 105, 106, 108, 109, 112}', 'CAR'),
('{151, 152, 153, 154, 155, 156, 161, 162, 163, 201, 202, 203, 204, 205, 206, 211, 212, 213}', 'LORRY');

insert into system_config (config_key, config_value, type, description) values
('name', 'test company name', 'COMPANY_INFO', ''),
('address', 'test street test building', 'COMPANY_INFO', ''),
('email', 'test@email.com', 'COMPANY_INFO', ''),
('contact_number', '12345678', 'COMPANY_INFO', ''),
('fax', '12345678', 'COMPANY_INFO', ''),
('uen', '1234567890', 'COMPANY_INFO', ''),
('rcb', '1234567890', 'COMPANY_INFO', '');

