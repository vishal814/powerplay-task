import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import CustomerProfile from './pages/CustomerProfile';
import Analytics from './pages/Analytics';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard', 'customer', 'analytics'
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const handleNavigateToCustomer = (customerId) => {
    setSelectedCustomerId(customerId);
    setView('customer');
  };

  const handleNavigateToAnalytics = () => {
    setView('analytics');
  };

  const handleBackToDashboard = () => {
    setSelectedCustomerId(null);
    setView('dashboard');
  };

  return (
    <div className="app-container">
      {view === 'dashboard' && (
        <Dashboard
          API_URL={API_URL}
          onNavigateToCustomer={handleNavigateToCustomer}
          onNavigateToAnalytics={handleNavigateToAnalytics}
        />
      )}
      {view === 'customer' && (
        <CustomerProfile
          customerId={selectedCustomerId}
          API_URL={API_URL}
          onBack={handleBackToDashboard}
        />
      )}
      {view === 'analytics' && (
        <Analytics
          API_URL={API_URL}
          onBack={handleBackToDashboard}
        />
      )}
    </div>
  );
}

export default App;
