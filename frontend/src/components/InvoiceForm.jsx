import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const InvoiceForm = ({ invoice, customers, onSave, onCancel }) => {
  const [customerId, setCustomerId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [amount, setAmount] = useState('');
  const [taxRate, setTaxRate] = useState(18); // Default to standard 18%
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Draft'); // Default to Draft
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pre-populate if editing
  useEffect(() => {
    if (invoice) {
      setCustomerId(invoice.customer?._id || invoice.customer || '');
      setAmount(invoice.amount || '');
      setTaxRate(invoice.taxRate ?? 18);
      setStatus(invoice.status || 'Draft');
      
      // Format ISO dates to YYYY-MM-DD for input
      if (invoice.issueDate) {
        setIssueDate(new Date(invoice.issueDate).toISOString().split('T')[0]);
      }
      if (invoice.dueDate) {
        setDueDate(new Date(invoice.dueDate).toISOString().split('T')[0]);
      }
    } else {
      // Create defaults
      const today = new Date().toISOString().split('T')[0];
      setIssueDate(today);
      
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      setDueDate(thirtyDaysLater.toISOString().split('T')[0]);
      
      setCustomerId('');
      setAmount('');
      setTaxRate(18);
      setStatus('Draft');
    }
    setError('');
  }, [invoice]);

  // Autofill company name when customer changes
  useEffect(() => {
    if (customerId) {
      const selected = customers.find(c => c._id === customerId);
      setCompanyName(selected ? selected.company : '');
    } else {
      setCompanyName('');
    }
  }, [customerId, customers]);

  // On-the-fly calculations
  const numericAmount = parseFloat(amount) || 0;
  const computedTax = parseFloat((numericAmount * taxRate / 100).toFixed(2));
  const computedTotal = parseFloat((numericAmount + computedTax).toFixed(2));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!customerId) {
      setError('Please select a customer.');
      return;
    }
    if (numericAmount <= 0) {
      setError('Amount must be a positive number.');
      return;
    }
    if (!issueDate) {
      setError('Please provide an issue date.');
      return;
    }
    if (!dueDate) {
      setError('Please provide a due date.');
      return;
    }
    if (new Date(dueDate) < new Date(issueDate)) {
      setError('Due date cannot be earlier than the issue date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = {
        customer: customerId,
        amount: numericAmount,
        taxRate: parseInt(taxRate, 10),
        status,
        issueDate,
        dueDate
      };
      await onSave(formData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save invoice. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          fontSize: '0.9rem',
          fontWeight: 500
        }}>
          {error}
        </div>
      )}

      <div className="form-grid">
        <div className="input-group form-row-full">
          <label htmlFor="customerSelect">Customer</label>
          <select
            id="customerSelect"
            className="form-control"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            disabled={!!invoice} // Lock customer modification during edits (standard invoicing logic)
          >
            <option value="">Select customer...</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group form-row-full">
          <label>Company (Auto-filled)</label>
          <div className="read-only-box">
            {companyName || <span style={{ color: 'var(--text-muted)' }}>Select a customer to view company...</span>}
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="invoiceAmount">Amount ($)</label>
          <input
            id="invoiceAmount"
            type="number"
            step="0.01"
            min="0"
            className="form-control"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="taxRateSelect">Tax Rate (%)</label>
          <select
            id="taxRateSelect"
            className="form-control"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
          >
            <option value={0}>0%</option>
            <option value={3}>3%</option>
            <option value={5}>5%</option>
            <option value={18}>18%</option>
            <option value={28}>28%</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="issueDateInput">Issue Date</label>
          <input
            id="issueDateInput"
            type="date"
            className="form-control"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="dueDateInput">Due Date</label>
          <input
            id="dueDateInput"
            type="date"
            className="form-control"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>

        <div className="input-group form-row-full">
          <label htmlFor="statusSelect">Status</label>
          <select
            id="statusSelect"
            className="form-control"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Overdue">Overdue</option>
            <option value="Paid">Paid</option>
            <option value="Void">Void</option>
          </select>
        </div>
      </div>

      <div className="live-summary-box">
        <span>Tax: <strong>${computedTax.toFixed(2)}</strong></span>
        <span>Total: <strong>${computedTotal.toFixed(2)}</strong></span>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
              Saving...
            </>
          ) : (
            'Save Invoice'
          )}
        </button>
      </div>
    </form>
  );
};

export default InvoiceForm;
