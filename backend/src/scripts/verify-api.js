import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env configuration
dotenv.config({ path: join(__dirname, '../../.env') });

// Setup basic verification runner
const runTests = async () => {
  console.log('--- RUNNING AUTOMATED BACKEND VERIFICATION TESTS ---');
  try {
    // Connect to database
    await connectDB();

    // 1. Check DB documents count
    console.log('\n[TEST 1] Verifying Data Seeding Counts...');
    const customerCount = await Customer.countDocuments();
    const invoiceCount = await Invoice.countDocuments();
    console.log(`- Customers in DB: ${customerCount} (Expected: 61)`);
    console.log(`- Invoices in DB : ${invoiceCount} (Expected: 2000+)`);
    
    if (customerCount !== 61) {
      throw new Error(`Customer count mismatch: ${customerCount} !== 61`);
    }
    if (invoiceCount < 2000) {
      throw new Error(`Invoice count is too low: ${invoiceCount}`);
    }
    console.log('✓ TEST 1 PASSED.');

    // 2. Fetch dashboard summary statistics
    console.log('\n[TEST 2] Verifying Dashboard Summary API...');
    const summaryRes = await fetch('http://localhost:5000/api/dashboard/summary');
    if (!summaryRes.ok) throw new Error('Failed to fetch dashboard summary');
    const summary = await summaryRes.json();
    console.log(`- Total Billed: $${summary.totalBilled}`);
    console.log(`- Total Tax   : $${summary.totalTax}`);
    console.log(`- Total Invs  : ${summary.totalInvoices}`);
    console.log(`- Top Clients : ${summary.topCustomers.map(c => c.name).join(', ')}`);
    
    if (summary.topCustomers.length !== 5) {
      throw new Error(`Expected 5 top customers, got ${summary.topCustomers.length}`);
    }
    console.log('✓ TEST 2 PASSED.');

    // 3. Search and Pagination
    console.log('\n[TEST 3] Verifying Search & Pagination...');
    const searchRes = await fetch('http://localhost:5000/api/invoices?search=Sara%20Mukherjee&limit=5');
    if (!searchRes.ok) throw new Error('Failed to search invoices');
    const searchData = await searchRes.json();
    console.log(`- Found ${searchData.totalCount} invoices for "Sara Mukherjee"`);
    console.log(`- Returned items size: ${searchData.invoices.length} (Expected: <=5)`);
    
    if (searchData.totalCount === 0 || searchData.invoices.length === 0) {
      throw new Error('No search results returned for existing customer "Sara Mukherjee"');
    }
    console.log('✓ TEST 3 PASSED.');

    // 4. Create Invoice & verify calculation
    console.log('\n[TEST 4] Verifying Create Invoice and Math Calculations...');
    const sampleCustomer = await Customer.findOne();
    const newInvoiceData = {
      customer: sampleCustomer._id,
      amount: 1500,
      taxRate: 18,
      status: 'Draft',
      issueDate: '2026-06-06',
      dueDate: '2026-07-06'
    };

    const createRes = await fetch('http://localhost:5000/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInvoiceData)
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(`Failed to create invoice: ${err.message}`);
    }

    const created = await createRes.json();
    console.log(`- Created Invoice ID: ${created.invoiceId}`);
    console.log(`- Base Amount : $${created.amount}`);
    console.log(`- Calculated Tax  : $${created.tax} (Expected: 270)`);
    console.log(`- Calculated Total: $${created.total} (Expected: 1770)`);

    if (created.tax !== 270 || created.total !== 1770) {
      throw new Error(`Calculation error: Tax ${created.tax} (expected 270), Total ${created.total} (expected 1770)`);
    }
    console.log('✓ TEST 4 PASSED.');

    // 5. Update Invoice Status
    console.log('\n[TEST 5] Verifying Update Invoice Status...');
    const updateRes = await fetch(`http://localhost:5000/api/invoices/${created._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Paid' })
    });

    if (!updateRes.ok) throw new Error('Failed to update invoice');
    const updated = await updateRes.json();
    console.log(`- Updated Status: ${updated.status} (Expected: Paid)`);

    if (updated.status !== 'Paid') {
      throw new Error(`Failed to update status, got: ${updated.status}`);
    }
    console.log('✓ TEST 5 PASSED.');

    // 6. Customer Profile metrics verification
    console.log('\n[TEST 6] Verifying Customer Profile Dashboard Metrics...');
    const profileRes = await fetch(`http://localhost:5000/api/customers/${sampleCustomer._id}`);
    if (!profileRes.ok) throw new Error('Failed to fetch customer profile');
    const profile = await profileRes.json();
    console.log(`- Customer Name: ${profile.customer.name}`);
    console.log(`- Customer Comp: ${profile.customer.company}`);
    console.log(`- Total Billed : $${profile.metrics.totalBilled}`);
    console.log(`- Outstanding  : $${profile.metrics.outstanding}`);
    console.log(`- History Size : ${profile.invoices.length} invoices`);
    
    if (!profile.metrics || profile.invoices.length === 0) {
      throw new Error('Empty metrics or invoice history returned for customer profile');
    }
    console.log('✓ TEST 6 PASSED.');

    console.log('\n==================================================');
    console.log('⭐ ALL BACKEND API VERIFICATION TESTS PASSED SUCCESSFULLY! ⭐');
    console.log('==================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ VERIFICATION TEST FAILED:', error.message);
    process.exit(1);
  }
};

// Start tests
setTimeout(runTests, 1000);
