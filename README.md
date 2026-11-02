# Masala Table: Restaurant Menu and Food Ordering System

A front-end web app where customers browse a menu, build an order, and place it.

## Features
- Menu grouped by category, with search and a veg-only filter
- Add/remove items, live quantity and bill (subtotal, 5% GST, total)
- Checkout form with validation (dine-in table number or pickup)
- Order confirmation with an order ID
- Cart and order history saved in the browser (localStorage)

## Tech
HTML, CSS, JavaScript (no frameworks)

## Run
Open `index.html` in a browser, or use the VS Code "Live Server" extension.

## Files
- `index.html`: page structure
- `style.css`: styling
- `menu-data.js`: menu items (edit to add dishes)
- `script.js`: menu, cart, checkout logic

## Team
Himanshu Purohit
Harshit Deorari
Gaurav Gaur
Harshit Agrawal

## Owner dashboard
Open `admin.html` (or click "Owner login" on the customer site). Demo login: `owner` / `admin123`.
The owner sees new orders, then confirms or rejects them and moves each one through
Confirmed, Preparing, Ready and Completed. There are status tabs, search, and daily stats.
Orders are shared between the two pages through the browser's localStorage, so use the same browser
(and the same Live Server address) for both pages.
