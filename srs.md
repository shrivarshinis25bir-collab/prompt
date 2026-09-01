1.	Plant Management – Add, update, and remove plant details and prices.
2.	Stock Management – Track available plants and update stock quantities.
3.	Customer Management – Store and manage customer details and contact information.
4.	Order Management – Create, view, and update customer orders.
5.	Payment Management – Record payment details and payment status.
6.	User Management – Allow Varshini and Sri to log in and manage the nursery system.

Understood. I’ll use **only these six requirements** for the Plant Management System and won’t introduce any additional features.

### Requirements

1. **Plant Management**

   * Add plant details
   * Update plant details
   * Remove plant details
   * Manage plant prices

2. **Stock Management**

   * Track available plants
   * Update stock quantities

3. **Customer Management**

   * Store customer details
   * Manage customer contact information

4. **Order Management**

   * Create customer orders
   * View customer orders
   * Update customer orders

5. **Payment Management**

   * Record payment details
   * Manage payment status

6. **User Management**

   * Login for **Varshini and Sri**
   * Allow them to manage the nursery system

**Scope rule:** I will not add features such as reports, notifications, search, analytics, delivery management, inventory alerts, registration, etc., unless you explicitly add them to the requirements.
## 1. Purpose and Scope

### 1.1 Purpose

The purpose of the Plant Management System is to provide a system for managing nursery plant information, stock quantities, customer details, orders, payments, and authorized user access. The system will allow Varshini and Sri to log in and perform the specified nursery management activities.

### 1.2 Scope

**In Scope**

* Add, update, and remove plant details and prices.
* Track available plants and update stock quantities.
* Store and manage customer details and contact information.
* Create, view, and update customer orders.
* Record payment details and payment status.
* Provide login access for Varshini and Sri to manage the nursery system.

**Out of Scope**

* Plant delivery or transportation management.
* Online customer registration or customer login.
* Notifications or alerts.
* Reports, analytics, or dashboards.
* Online payment processing.
* Any functionality not explicitly defined in the requirements above.
## 2. Functional Requirements

**FR-01:** The system shall allow authorized users to add, update, and remove plant details and prices.

**FR-02:** The system shall allow authorized users to track available plants and update stock quantities.

**FR-03:** The system shall allow authorized users to store and manage customer details and contact information.

**FR-04:** The system shall allow authorized users to create, view, and update customer orders.

**FR-05:** The system shall allow authorized users to record payment details and payment status.

**FR-06:** The system shall allow Varshini and Sri to log in and manage the nursery system.
Now write the Non-Functional Requirements.
Cover speed, security, usability and reliability.
Every requirement must contain a number I can measure.
Number them NFR-01 onwards.
## 3. Assumptions and Constraints

### 3.1 Assumptions

* The system will be used by Varshini and Sri as authorized users.
* Users will provide correct plant, stock, customer, order, and payment information.
* Plant prices and stock quantities will be updated by authorized users when required.
* Customer and order information will be available when creating or updating orders.
* Payment details and payment status will be entered by authorized users.

### 3.2 Constraints

* The system shall be developed using Python.
* SQLite shall be used as the database for storing system data.
* Only Varshini and Sri shall have login access to the system.
* The system shall be limited to the six features defined in the requirements.
* The first version shall not include functionality outside the specified requirements.
