import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Clock, FileSpreadsheet, ShieldCheck, ChevronRight } from 'lucide-react';

const CustomerProfile = ({ customerId, API_URL, onBack }) => {
  const [profile, setProfile] = useState(null);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomerProfile = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/customers/${customerId}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setFilteredInvoices(data.invoices);
        }
      } catch (err) {
        console.error('Error fetching customer profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (customerId) {
      fetchCustomerProfile();
      setSelectedStatusFilter('All');
    }
  }, [customerId, API_URL]);

  // Handle status filter chip clicks
  const handleFilterStatus = (status) => {
    setSelectedStatusFilter(status);
    if (!profile) return;
    
    if (status === 'All') {
      setFilteredInvoices(profile.invoices);
    } else {
      const filtered = profile.invoices.filter(inv => inv.status.toLowerCase() === status.toLowerCase());
      setFilteredInvoices(filtered);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Fetching client ledger...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="empty-state">
        <h3>Customer Not Found</h3>
        <p>Return to dashboard list and try again.</p>
        <button className="btn btn-primary" onClick={onBack} style={{ marginTop: '1rem' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { customer, metrics, invoices } = profile;
  const initials = customer.name
    ? customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'CN';

  return (
    <div className="animation-fade">
      {/* Breadcrumbs Navigation */}
      <div className="breadcrumbs">
        <span onClick={onBack} className="invoice-link">Invoices</span>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{customer.name}</span>
      </div>

      {/* Customer Header card */}
      <div className="profile-meta-card">
        <div className="profile-avatar">
          {initials}
        </div>
        <div className="profile-details">
          <h2>{customer.name}</h2>
          <p>{customer.company}</p>
        </div>
      </div>

      {/* Grid of metrics cards */}
      <div className="metrics-grid">
        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>Total Invoiced</span>
            <FileSpreadsheet size={16} className="metric-icon" />
          </div>
          <div className="metric-value">
            ${metrics.totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="glass-card metric-card indigo">
          <div className="metric-header">
            <span>Total Tax</span>
            <ShieldCheck size={16} className="metric-icon" />
          </div>
          <div className="metric-value">
            ${metrics.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="glass-card metric-card amber">
          <div className="metric-header">
            <span>Outstanding</span>
            <Clock size={16} className="metric-icon" />
          </div>
          <div className="metric-value">
            ${metrics.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="glass-card metric-card emerald">
          <div className="metric-header">
            <span>Invoices Count</span>
            <CreditCard size={16} className="metric-icon" />
          </div>
          <div className="metric-value">
            {metrics.totalInvoices}
          </div>
        </div>
      </div>

      {/* Section title & quick filters chips */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>Invoice History</h3>
        
        <div className="profile-filters-row">
          <span className="profile-filter-label">Quick Filters:</span>
          <button 
            className={`filter-chip ${selectedStatusFilter === 'All' ? 'active' : ''}`}
            onClick={() => handleFilterStatus('All')}
          >
            All <span>({invoices.length})</span>
          </button>
          {Object.entries(metrics.statusCounts).map(([status, count]) => {
            if (count === 0 && status !== 'Paid' && status !== 'Unpaid' && status !== 'Overdue') return null; // keep basic filters
            return (
              <button
                key={status}
                className={`filter-chip ${selectedStatusFilter === status ? 'active' : ''}`}
                onClick={() => handleFilterStatus(status)}
              >
                {status} <span>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Invoice list table */}
      {filteredInvoices.length === 0 ? (
        <div className="empty-state" style={{ padding: '3rem 2rem' }}>
          <h3>No Invoices Matched</h3>
          <p>No invoices with status "{selectedStatusFilter}" for this client.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Amount</th>
                <th>Tax%</th>
                <th>Total</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv._id}>
                  <td style={{ fontWeight: 600 }}>{inv.invoiceId}</td>
                  <td>${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>{inv.taxRate}%</td>
                  <td>${inv.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>{new Date(inv.issueDate).toISOString().split('T')[0]}</td>
                  <td>{new Date(inv.dueDate).toISOString().split('T')[0]}</td>
                  <td>
                    <span className={`status-badge ${inv.status.toLowerCase()}`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Back button */}
      <div style={{ marginTop: '2rem' }}>
        <button className="btn btn-outline" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Invoices
        </button>
      </div>
    </div>
  );
};

export default CustomerProfile;
