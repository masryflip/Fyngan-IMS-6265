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
import { InventoryProvider } from './context/InventoryContext';
import './App.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <InventoryProvider>
      <Router>
        <div className="flex h-screen bg-gray-50">
          <Sidebar 
            isOpen={isSidebarOpen} 
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
          />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <motion.main
              className="flex-1 overflow-y-auto"
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
      </Router>
    </InventoryProvider>
  );
}

export default App;