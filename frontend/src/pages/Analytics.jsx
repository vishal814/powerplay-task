import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, FileText, Landmark, Wallet, ChevronRight } from 'lucide-react';

const Analytics = ({ API_URL, onBack }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/dashboard/summary`);
        if (res.ok) {
          const summaryData = await res.json();
          setData(summaryData);
          
          // Trigger animations on next tick
          setTimeout(() => {
            setAnimateBars(true);
          }, 100);
        }
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [API_URL]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Analyzing financials...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <h3>Could Not Load Analytics</h3>
        <p>Verify MongoDB/API connection status and retry.</p>
        <button className="btn btn-primary" onClick={onBack} style={{ marginTop: '1rem' }}>
          Back to Invoices
        </button>
      </div>
    );
  }

  const { totalBilled, totalTax, totalInvoices, totalCustomers, topCustomers } = data;

  // Maximum value for scaling the horizontal bar charts
  const maxTotalVal = topCustomers.length > 0 ? topCustomers[0].totalValue : 1;

  return (
    <div className="animation-fade">
      {/* Breadcrumbs Navigation */}
      <div className="breadcrumbs">
        <span onClick={onBack} className="invoice-link">Invoices</span>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Summary & Analytics</span>
      </div>

      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700 }}>Summary Analytics</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.2rem' }}>
          Macro view of invoice distribution and top-tier client billing values.
        </p>
      </div>

      {/* Grid of stats cards */}
      <div className="metrics-grid">
        <div className="glass-card metric-card">
          <div className="metric-header">
            <span>Total Value</span>
            <Wallet size={16} className="metric-icon" />
          </div>
          <div className="metric-value">
            ${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="glass-card metric-card indigo">
          <div className="metric-header">
            <span>Total Taxes Collected</span>
            <Landmark size={16} className="metric-icon" />
          </div>
          <div className="metric-value">
            ${totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="glass-card metric-card emerald">
          <div className="metric-header">
            <span>Invoices Ledger</span>
            <FileText size={16} className="metric-icon" />
          </div>
          <div className="metric-value">
            {totalInvoices.toLocaleString()}
          </div>
        </div>

        <div className="glass-card metric-card amber">
          <div className="metric-header">
            <span>Unique Customers</span>
            <Users size={16} className="metric-icon" />
          </div>
          <div className="metric-value">
            {totalCustomers}
          </div>
        </div>
      </div>

      {/* Visual top customer chart */}
      <div className="glass-card chart-card" style={{ padding: '2rem' }}>
        <h2>Top 5 Customers by Value</h2>
        
        {topCustomers.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No client data available to compile chart.</p>
        ) : (
          <div className="chart-container">
            {topCustomers.map((cust) => {
              const widthPercentage = Math.round((cust.totalValue / maxTotalVal) * 100);
              return (
                <div key={cust._id} className="chart-bar-row">
                  <div className="chart-bar-info">
                    <span className="chart-bar-customer">
                      {cust.name}
                      <span className="chart-bar-company">({cust.company})</span>
                    </span>
                    <span className="chart-bar-value">
                      ${cust.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="chart-bar-track">
                    <div 
                      className="chart-bar-fill"
                      style={{ width: animateBars ? `${widthPercentage}%` : '0%' }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer navigation */}
      <div style={{ marginTop: '2.5rem' }}>
        <button className="btn btn-outline" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Invoices List
        </button>
      </div>
    </div>
  );
};

export default Analytics;
