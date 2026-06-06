# Invoice Management Dashboard

A full-stack, highly interactive Invoice Management Dashboard. This project is built using React on the frontend, Node.js and Express on the backend, and MongoDB with Mongoose for data persistence. It satisfies all core requirements (sorting, filtering, pagination, search, metrics, and customer profiles) and incorporates stretch goals like multi-container Docker Compose.

---

##  Premium Aesthetics & UX Design
- **Theme**: Dark cyberpunk-inspired dark-mode with rich slate background, neon electric teal primary accents, and subtle indigo details.
- **Glassmorphism**: Cards and overlays utilize `backdrop-filter: blur(12px)` and thin semi-transparent borders for high-fidelity layering.
- **Visual Charts**: Custom CSS-animated progress/bar elements representing the Top 5 Customers by value, scaling dynamically.
- **Responsive Layout**: Advanced grid structure that adapts layout flows fluidly from desktop monitors to tablets and phone viewports.
- **Micro-interactions**: Scale transforms and shadow glow indicators on table row hover, buttons, chips, and paginated numbers.

---

##  System Architecture & Data Modeling

### 1. Normalized Database Design
The raw dataset contains nested customer and company properties. To model this data sensibly and avoid redundancy, we normalized the collection into two relational Mongoose models:
- **Customer Model**:
  - `name` (String, unique: true, index: true): Unique customer name.
  - `company` (String, index: true): Company associated with the customer (1:1 constraint).
- **Invoice Model**:
  - `invoiceId` (String, unique: true, index: true): Format `INV-XXXXXXX` where XXXXXXX is random numbers.
  - `customer` (ObjectId, ref: 'Customer', index: true): Reference link to Customer document.
  - `amount` (Number): Base pre-tax amount.
  - `taxRate` (Number): Options 0%, 3%, 5%, 18%, 28%.
  - `tax` (Number): Calculated as `amount * taxRate / 100`.
  - `total` (Number, index: true): Calculated as `amount + tax`.
  - `status` (String, index: true): Enum `['Sent', 'Unpaid', 'Overdue', 'Paid', 'Void', 'Draft']`.
  - `issueDate` (Date, index: true)
  - `dueDate` (Date, index: true)

**Why normalize?**
Storing customer name and company name redundantly inside all 2,000+ invoices would waste space and complicate updates (e.g., if a company changes name, we would need to run bulk updates on thousands of invoice documents). With normalization, updates to customer attributes occur in exactly one place.

---

##  Setup & Execution Guide

Ensure you have **Node.js (v20+)** installed.

### Option A: Standard Local Run

#### 1. Spin up MongoDB
Create a database directory and start MongoDB locally:
```powershell
# Create folder
mkdir -p data/db

# Start mongod process (pointing to the directory)
mongod --dbpath ./data/db --port 27017
```

#### 2. Install Project Dependencies
Run npm install at the root level to install the script coordinator, then fetch frontend/backend modules:
```bash
# Install root tools
npm install

# Install backend and frontend packages
npm run install:all
```

#### 3. Ingest Seed Data
Import the 2,000 records from `seed-data.json` into MongoDB using the automated script:
```bash
npm run seed
```
This script will clear out old test documents, populate 61 unique customers, compile reference IDs, calculate tax/totals, and insert 2,000 invoices.

#### 4. Run Development Servers
Boot the React Vite client and Express server concurrently:
```bash
npm run dev
```
- Client dashboard: `http://localhost:5173`
- Backend API server: `http://localhost:5000`

---

### Option B: Docker Compose (Single-Command Run)

If you have Docker and Docker Compose installed:
1. Orchestrate and build all containers:
   ```bash
   docker-compose up --build
   ```
2. Once running, access the dashboard at `http://localhost:3000`.

---

## API Endpoints Documentation

- **Invoices API** (`/api/invoices`)
  - `GET /`: Retrieve paginated, sorted, and filtered invoices.
    - Query parameters: `page`, `limit`, `sortBy` (amount, dueDate, total, etc.), `sortOrder` (asc/desc), `status`, `customer` (Id), `search` (searches invoice ID or customer name).
  - `GET /:id`: Fetch detailed invoice by ID.
  - `POST /`: Create invoice. Auto-calculates tax/total and generates unique `invoiceId` (`INV-XXXXXXX`).
  - `PUT /:id`: Edit existing invoice, recalculates totals when amount changes.
- **Customers API** (`/api/customers`)
  - `GET /`: List all customers.
  - `GET /:id`: Fetch customer details, full invoice history, and aggregated statistics (Total billed, Total tax, Outstanding amount, count by status).
- **Dashboard Summary API** (`/api/dashboard/summary`)
  - `GET /summary`: Compiles aggregate financial indicators and compiles the top 5 customers by invoice billing value.
