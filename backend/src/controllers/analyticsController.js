import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';

export const getDashboardSummary = async (req, res) => {
  try {
    // Overall Stats
    const stats = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalBilled: { $sum: '$total' },
          totalTax: { $sum: '$tax' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalBilled = stats.length > 0 ? parseFloat(stats[0].totalBilled.toFixed(2)) : 0;
    const totalTax = stats.length > 0 ? parseFloat(stats[0].totalTax.toFixed(2)) : 0;
    const totalInvoices = stats.length > 0 ? stats[0].count : 0;
    const totalCustomers = await Customer.countDocuments();

    // Top 5 Customers by Value
    const topCustomers = await Invoice.aggregate([
      {
        $group: {
          _id: '$customer',
          totalValue: { $sum: '$total' }
        }
      },
      {
        $sort: { totalValue: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customerDetails'
        }
      },
      {
        $unwind: '$customerDetails'
      },
      {
        $project: {
          _id: 1,
          totalValue: { $round: ['$totalValue', 2] },
          name: '$customerDetails.name',
          company: '$customerDetails.company'
        }
      }
    ]);

    res.status(200).json({
      totalBilled,
      totalTax,
      totalInvoices,
      totalCustomers,
      topCustomers
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard summary', error: error.message });
  }
};
