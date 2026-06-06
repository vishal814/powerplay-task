import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit2, Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Modal from '../components/Modal';
import InvoiceForm from '../components/InvoiceForm';

const Dashboard = ({ API_URL, onNavigateToCustomer, onNavigateToAnalytics }) => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [issueDateStart, setIssueDateStart] = useState('');
  const [issueDateEnd, setIssueDateEnd] = useState('');
  const [dueDateStart, setDueDateStart] = useState('');
  const [dueDateEnd, setDueDateEnd] = useState('');
  
  // Sorting state
  const [sortBy, setSortBy] = useState('issueDate');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Fetch unique customers list for filters and dropdowns
  useEffect(() => {
    const fetchCustomersList = async () => {
      try {
        const res = await fetch(`${API_URL}/customers`);
        if (res.ok) {
          const data = await res.json();
          setCustomers(data);
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
      }
    };
    fetchCustomersList();
  }, [API_URL]);

  // Main data fetch hook
  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
        search,
        status,
        customer: selectedCustomer,
        issueDateStart,
        issueDateEnd,
        dueDateStart,
        dueDateEnd
      });

      const res = await fetch(`${API_URL}/invoices?${queryParams}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, sortBy, sortOrder, status, selectedCustomer, issueDateStart, issueDateEnd, dueDateStart, dueDateEnd]);

  // Debounced search trigger (or simple trigger on click/enter)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchInvoices();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('');
    setSelectedCustomer('');
    setIssueDateStart('');
    setIssueDateEnd('');
    setDueDateStart('');
    setDueDateEnd('');
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleOpenCreateModal = () => {
    setEditingInvoice(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (invoice) => {
    setEditingInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleSaveInvoice = async (formData) => {
    const method = editingInvoice ? 'PUT' : 'POST';
    const endpoint = editingInvoice ? `${API_URL}/invoices/${editingInvoice._id}` : `${API_URL}/invoices`;

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchInvoices();
    } else {
      const errData = await res.json();
      throw new Error(errData.message || 'Operation failed');
    }
  };

  // Pagination bounds calculation
  const startIndex = (page - 1) * 20 + 1;
  const endIndex = Math.min(page * 20, totalCount);

  return (
    <div className="animation-fade">
      {/* Upper header action section */}
      <div className="header-wrapper">
        <div className="title-section">
          <h1>Invoice Ledger</h1>
          <p>Manage, track and generate client invoices instantly.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={onNavigateToAnalytics}>
            View Summary
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={16} /> New Invoice
          </button>
        </div>
      </div>

      {/* Advanced Toolbar Search/Filters */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSearchSubmit} className="toolbar-grid">
          <div className="input-group">
            <label htmlFor="searchField">Search</label>
            <div style={{ position: 'relative' }}>
              <input
                id="searchField"
                type="text"
                className="form-control"
                placeholder="Invoice ID or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingRight: '2.5rem' }}
              />
              <button type="submit" className="btn-icon-only" style={{
                position: 'absolute',
                right: '4px',
                top: '4px',
                border: 'none',
                background: 'transparent'
              }}>
                <Search size={16} />
              </button>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="statusFilter">Status</label>
            <select
              id="statusFilter"
              className="form-control"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Overdue">Overdue</option>
              <option value="Paid">Paid</option>
              <option value="Void">Void</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="customerFilter">Client</label>
            <select
              id="customerFilter"
              className="form-control"
              value={selectedCustomer}
              onChange={(e) => { setSelectedCustomer(e.target.value); setPage(1); }}
            >
              <option value="">All Clients</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="issueDateStartFilter">Issue Date</label>
            <input
              id="issueDateStartFilter"
              type="date"
              className="form-control"
              value={issueDateStart}
              onChange={(e) => { setIssueDateStart(e.target.value); setPage(1); }}
            />
          </div>

          <div className="input-group">
            <label htmlFor="dueDateStartFilter">Due Date</label>
            <input
              id="dueDateStartFilter"
              type="date"
              className="form-control"
              value={dueDateStart}
              onChange={(e) => { setDueDateStart(e.target.value); setPage(1); }}
            />
          </div>
        </form>

        {(search || status || selectedCustomer || issueDateStart || issueDateEnd || dueDateStart || dueDateEnd) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button className="btn btn-outline" onClick={handleClearFilters} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
              <X size={14} /> Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Table Section */}
      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading database invoices...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="empty-state">
          <h3>No Invoices Found</h3>
          <p>Adjust your search/filters or create a new invoice to populate records.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th className="sortable" onClick={() => handleSort('amount')}>
                    Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th>Tax%</th>
                  <th className="sortable" onClick={() => handleSort('total')}>
                    Total {sortBy === 'total' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="sortable" onClick={() => handleSort('dueDate')}>
                    Due Date {sortBy === 'dueDate' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv._id}>
                    <td>
                      <span className="invoice-link" onClick={() => handleOpenEditModal(inv)}>
                        {inv.invoiceId}
                      </span>
                    </td>
                    <td>
                      <span className="customer-link" onClick={() => onNavigateToCustomer(inv.customer?._id)}>
                        {inv.customer?.name || 'Unknown'}
                      </span>
                    </td>
                    <td>${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>{inv.taxRate}%</td>
                    <td>${inv.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>{new Date(inv.dueDate).toISOString().split('T')[0]}</td>
                    <td>
                      <span className={`status-badge ${inv.status.toLowerCase()}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button className="btn-icon-only" onClick={() => onNavigateToCustomer(inv.customer?._id)} title="View Customer Profile">
                          <Eye size={14} />
                        </button>
                        <button className="btn-icon-only" onClick={() => handleOpenEditModal(inv)} title="Edit Invoice">
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer and Custom Pagination */}
          <div className="pagination-wrapper">
            <div className="pagination-info">
              Showing <strong>{startIndex}</strong>–<strong>{endIndex}</strong> of <strong>{totalCount.toLocaleString()}</strong> invoices
            </div>
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={16} />
              </button>
              
              {/* Intelligent pagination logic to not show all 100 buttons */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = page;
                if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                // Boundaries doublecheck
                if (pageNum <= 0 || pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    className={`pagination-btn ${page === pageNum ? 'active' : ''}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                className="pagination-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Insert Modal wrapper */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingInvoice ? `Edit Invoice (${editingInvoice.invoiceId})` : 'New Invoice'}
      >
        <InvoiceForm
          invoice={editingInvoice}
          customers={customers}
          onSave={handleSaveInvoice}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;
