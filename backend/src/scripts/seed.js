import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env configuration
dotenv.config({ path: join(__dirname, '../../.env') });

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/invoice_db';
    console.log(`Connecting to database at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('Database connected successfully.');

    // Clear existing collections
    console.log('Clearing existing Customer and Invoice documents...');
    await Customer.deleteMany({});
    await Invoice.deleteMany({});
    console.log('Collections cleared.');

    // Read seed-data.json
    const seedDataPath = join(__dirname, '../../../seed-data.json');
    console.log(`Reading seed data from ${seedDataPath}...`);
    if (!fs.existsSync(seedDataPath)) {
      throw new Error(`Seed data file not found at path: ${seedDataPath}`);
    }
    const rawData = fs.readFileSync(seedDataPath, 'utf8');
    const invoicesData = JSON.parse(rawData);
    console.log(`Loaded ${invoicesData.length} raw invoice records.`);

    // Extract unique customers
    console.log('Extracting unique customers...');
    const customerCompanyMap = new Map();
    for (const record of invoicesData) {
      const { customer, company } = record;
      if (!customerCompanyMap.has(customer)) {
        customerCompanyMap.set(customer, company);
      } else {
        // Validation: Verify 1:1 constraint
        const existingCompany = customerCompanyMap.get(customer);
        if (existingCompany !== company) {
          console.warn(`WARNING: Customer "${customer}" is linked to multiple companies: "${existingCompany}" and "${company}"`);
        }
      }
    }
    console.log(`Found ${customerCompanyMap.size} unique customers.`);

    // Insert Customers
    const customersToInsert = Array.from(customerCompanyMap.entries()).map(([name, company]) => ({
      name,
      company
    }));
    console.log(`Inserting ${customersToInsert.length} customers into database...`);
    const insertedCustomers = await Customer.insertMany(customersToInsert);
    console.log('Customers inserted successfully.');

    // Create a lookup dictionary mapping Customer Name -> MongoDB ObjectId
    const customerLookup = {};
    for (const doc of insertedCustomers) {
      customerLookup[doc.name] = doc._id;
    }

    // Map invoices data to database documents with customer reference ObjectId
    console.log('Mapping invoices with customer references...');
    const invoicesToInsert = invoicesData.map(record => {
      const customerId = customerLookup[record.customer];
      if (!customerId) {
        throw new Error(`Reference error: Customer "${record.customer}" was not created in the database.`);
      }

      // Calculations integrity double-check
      const calculatedTax = parseFloat((record.amount * record.taxRate / 100).toFixed(2));
      const calculatedTotal = parseFloat((record.amount + calculatedTax).toFixed(2));
      
      // Let's print mismatch warning if they exist (sometimes floating points in JSON might vary slightly)
      if (Math.abs(calculatedTax - record.tax) > 0.05 || Math.abs(calculatedTotal - record.total) > 0.05) {
        console.warn(`Math mismatch in raw data for ${record.invoiceId}: Tax standard (${calculatedTax}) vs JSON (${record.tax})`);
      }

      return {
        invoiceId: record.invoiceId,
        customer: customerId,
        amount: record.amount,
        taxRate: record.taxRate,
        tax: record.tax,
        total: record.total,
        status: record.status,
        issueDate: new Date(record.issueDate),
        dueDate: new Date(record.dueDate)
      };
    });

    console.log(`Inserting ${invoicesToInsert.length} invoices into database...`);
    const insertedInvoices = await Invoice.insertMany(invoicesToInsert);
    console.log('Invoices inserted successfully.');

    console.log('\n--- Seeding summary ---');
    console.log(`Total Customers Inserted: ${insertedCustomers.length}`);
    console.log(`Total Invoices Inserted : ${insertedInvoices.length}`);
    console.log('Database seeding operation complete.');

    await mongoose.disconnect();
    console.log('Disconnected from database.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding script failed:', error);
    process.exit(1);
  }
};

seedDatabase();
