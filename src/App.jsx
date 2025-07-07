import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import AuthGuard from './components/AuthGuard';
import Dashboard from './pages/Dashboard';
import Locations from './pages/Locations';
import LocationTypes from './pages/LocationTypes';
import Categories from './pages/Categories';
import Items from './pages/Items';
import Suppliers from './pages/Suppliers';
import StockEntry from './pages/StockEntry';
import StockAnalysis from './pages/StockAnalysis';
import Alerts from './pages/Alerts';
import TransactionLog from './pages/TransactionLog';
import UserManagement from './pages/UserManagement';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isLoading, error } = useInventory();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-coffee-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600 mb-6">Unable to load inventory data. Please try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-coffee-600 text-white px-4 py-2 rounded-md hover:bg-coffee-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 lg:flex">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Main content */}
        <div className="flex-1 lg:flex lg:flex-col">
          {/* Content area with proper padding for mobile menu button */}
          <motion.main
            className="flex-1 pt-16 lg:pt-0 px-0 lg:px-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/location-types" element={<LocationTypes />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/items" element={<Items />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/stock-entry" element={<StockEntry />} />
              <Route path="/stock-analysis" element={<StockAnalysis />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/transaction-log" element={<TransactionLog />} />
              <Route path="/user-management" element={<UserManagement />} />
            </Routes>
          </motion.main>
        </div>
      </div>
    </AuthGuard>
  );
}

function App() {
  return (
    <AuthProvider>
      <InventoryProvider>
        <Router>
          <AppContent />
        </Router>
      </InventoryProvider>
    </AuthProvider>
  );
}

export default App;