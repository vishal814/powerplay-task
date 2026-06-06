import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';

// Get paginated, sorted, and filtered invoices list
export const getInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'issueDate',
      sortOrder = 'desc',
      status,
      customer,
      issueDateStart,
      issueDateEnd,
      dueDateStart,
      dueDateEnd,
      search
    } = req.query;

    const query = {};

    // Filter by Status
    if (status) {
      query.status = status;
    }

    // Filter by Customer ObjectId
    if (customer) {
      query.customer = customer;
    }

    // Filter by Issue Date Range
    if (issueDateStart || issueDateEnd) {
      query.issueDate = {};
      if (issueDateStart) {
        query.issueDate.$gte = new Date(issueDateStart);
      }
      if (issueDateEnd) {
        query.issueDate.$lte = new Date(issueDateEnd);
      }
    }

    // Filter by Due Date Range
    if (dueDateStart || dueDateEnd) {
      query.dueDate = {};
      if (dueDateStart) {
        query.dueDate.$gte = new Date(dueDateStart);
      }
      if (dueDateEnd) {
        query.dueDate.$lte = new Date(dueDateEnd);
      }
    }

    // Text search (matches Invoice ID or Customer Name)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      
      // Find matching customers first
      const matchingCustomers = await Customer.find({ name: { $regex: searchRegex } }).select('_id');
      const customerIds = matchingCustomers.map(c => c._id);

      query.$or = [
        { invoiceId: { $regex: searchRegex } },
        { customer: { $in: customerIds } }
      ];
    }

    // Sorting parameters mapping
    const sort = {};
    const validSortFields = ['amount', 'dueDate', 'total', 'issueDate', 'status', 'invoiceId'];
    const actualSortField = validSortFields.includes(sortBy) ? sortBy : 'issueDate';
    sort[actualSortField] = sortOrder === 'asc' ? 1 : -1;

    // Pagination numbers calculation
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skipNum = (pageNum - 1) * limitNum;

    // Run query count and find concurrently
    const [invoices, totalCount] = await Promise.all([
      Invoice.find(query)
        .populate('customer')
        .sort(sort)
        .skip(skipNum)
        .limit(limitNum),
      Invoice.countDocuments(query)
    ]);

    res.status(200).json({
      invoices,
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving invoices', error: error.message });
  }
};

// Get single invoice details
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('customer');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving invoice details', error: error.message });
  }
};

// Create new invoice with server-side computations
export const createInvoice = async (req, res) => {
  try {
    const { customer, amount, taxRate, status, issueDate, dueDate } = req.body;

    if (!customer || amount === undefined || taxRate === undefined || !issueDate || !dueDate) {
      return res.status(400).json({ message: 'Missing required invoice fields' });
    }

    // Validate if customer exists
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ message: 'Reference Error: Customer does not exist' });
    }

    // Calculate tax and total server-side
    const parsedAmount = parseFloat(amount);
    const parsedTaxRate = parseFloat(taxRate);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ message: 'Invalid invoice amount' });
    }

    const tax = parseFloat((parsedAmount * parsedTaxRate / 100).toFixed(2));
    const total = parseFloat((parsedAmount + tax).toFixed(2));

    // Generate unique Invoice ID (INV-XXXXXXX)
    let invoiceId;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const randomDigits = Math.floor(1000000 + Math.random() * 9000000).toString();
      invoiceId = `INV-${randomDigits}`;
      const duplicate = await Invoice.findOne({ invoiceId });
      if (!duplicate) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ message: 'Error generating unique invoice identifier' });
    }

    const newInvoice = new Invoice({
      invoiceId,
      customer,
      amount: parsedAmount,
      taxRate: parsedTaxRate,
      tax,
      total,
      status: status || 'Draft',
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate)
    });

    const savedInvoice = await newInvoice.save();
    const populatedInvoice = await savedInvoice.populate('customer');

    res.status(201).json(populatedInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Error creating invoice', error: error.message });
  }
};

// Update invoice
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer, amount, taxRate, status, issueDate, dueDate } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Validate customer change if any
    if (customer && customer !== invoice.customer.toString()) {
      const customerExists = await Customer.findById(customer);
      if (!customerExists) {
        return res.status(404).json({ message: 'Reference Error: Customer does not exist' });
      }
      invoice.customer = customer;
    }

    // Apply fields update
    if (status) invoice.status = status;
    if (issueDate) invoice.issueDate = new Date(issueDate);
    if (dueDate) invoice.dueDate = new Date(dueDate);

    if (amount !== undefined || taxRate !== undefined) {
      const updatedAmount = amount !== undefined ? parseFloat(amount) : invoice.amount;
      const updatedTaxRate = taxRate !== undefined ? parseFloat(taxRate) : invoice.taxRate;

      if (isNaN(updatedAmount) || updatedAmount < 0) {
        return res.status(400).json({ message: 'Invalid invoice amount' });
      }

      invoice.amount = updatedAmount;
      invoice.taxRate = updatedTaxRate;
      invoice.tax = parseFloat((updatedAmount * updatedTaxRate / 100).toFixed(2));
      invoice.total = parseFloat((updatedAmount + invoice.tax).toFixed(2));
    }

    const savedInvoice = await invoice.save();
    const populatedInvoice = await savedInvoice.populate('customer');

    res.status(200).json(populatedInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Error updating invoice', error: error.message });
  }
};
