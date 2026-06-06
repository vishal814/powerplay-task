import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';

// Get list of all unique customers (sorted alphabetically)
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving customers list', error: error.message });
  }
};

// Get profile details, metrics summary and invoice history for a single customer
export const getCustomerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Retrieve all invoices for this customer, sorted by issueDate desc
    const invoices = await Invoice.find({ customer: id }).sort({ issueDate: -1 });

    // Calculate metrics
    let totalBilled = 0;
    let totalTax = 0;
    let outstanding = 0;
    const statusCounts = {
      Paid: 0,
      Unpaid: 0,
      Overdue: 0,
      Sent: 0,
      Void: 0,
      Draft: 0
    };

    invoices.forEach(inv => {
      totalBilled += inv.total;
      totalTax += inv.tax;

      // Outstanding includes Sent, Unpaid and Overdue invoices
      if (['Sent', 'Unpaid', 'Overdue'].includes(inv.status)) {
        outstanding += inv.total;
      }

      if (statusCounts[inv.status] !== undefined) {
        statusCounts[inv.status]++;
      }
    });

    res.status(200).json({
      customer: {
        _id: customer._id,
        name: customer.name,
        company: customer.company
      },
      metrics: {
        totalBilled: parseFloat(totalBilled.toFixed(2)),
        totalTax: parseFloat(totalTax.toFixed(2)),
        outstanding: parseFloat(outstanding.toFixed(2)),
        totalInvoices: invoices.length,
        statusCounts
      },
      invoices
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving customer profile', error: error.message });
  }
};
