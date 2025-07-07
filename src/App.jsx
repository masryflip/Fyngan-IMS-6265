import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Locations from './pages/Locations';
import Categories from './pages/Categories';
import Items from './pages/Items';
import Suppliers from './pages/Suppliers';
import StockEntry from './pages/StockEntry';
import StockAnalysis from './pages/StockAnalysis';
import Alerts from './pages/Alerts';
import TransactionLog from './pages/TransactionLog';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import './App.css';

function DatabaseInitializer() {
  const { isLoading, error, createTables } = useInventory();
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        await createTables();
        setInitializing(false);
      } catch (error) {
        console.error("Error initializing database:", error);
        setInitError(error.message);
        setInitializing(false);
      }
    };

    init();
  }, [createTables]);

  if (initializing || isLoading) {
    return (
      <div className="fixed inset-0 bg-coffee-800 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-coffee-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Initializing Inventory System</h2>
          <p className="text-gray-600">Setting up database tables and loading data...</p>
        </div>
      </div>
    );
  }

  if (initError || error) {
    return (
      <div className="fixed inset-0 bg-red-800 bg-opacity-20 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Database Error</h2>
          <p className="text-red-600 mb-4">{initError || error}</p>
          <p className="text-gray-600 mb-6">Please check your database connection or refresh the page to try again.</p>
          <button onClick={() => window.location.reload()} className="bg-coffee-600 text-white px-4 py-2 rounded-md hover:bg-coffee-700">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return null;
}

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
          <button onClick={() => window.location.reload()} className="bg-coffee-600 text-white px-4 py-2 rounded-md hover:bg-coffee-700">
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Database Initializer */}
      <DatabaseInitializer />
      
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
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
            <Route path="/categories" element={<Categories />} />
            <Route path="/items" element={<Items />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/stock-entry" element={<StockEntry />} />
            <Route path="/stock-analysis" element={<StockAnalysis />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/transaction-log" element={<TransactionLog />} />
          </Routes>
        </motion.main>
      </div>
    </div>
  );
}

function App() {
  return (
    <InventoryProvider>
      <Router>
        <AppContent />
      </Router>
    </InventoryProvider>
  );
}

export default App;