import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
      index: true
    },
    taxRate: {
      type: Number,
      required: true,
      enum: [0, 3, 5, 18, 28],
      default: 0
    },
    tax: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      index: true
    },
    status: {
      type: String,
      required: true,
      enum: ['Sent', 'Unpaid', 'Overdue', 'Paid', 'Void', 'Draft'],
      default: 'Draft',
      index: true
    },
    issueDate: {
      type: Date,
      required: true,
      index: true
    },
    dueDate: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compounding indexes can help speed up dashboard filtering & sorting
InvoiceSchema.index({ status: 1, customer: 1 });

export default mongoose.model('Invoice', InvoiceSchema);
