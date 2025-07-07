import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { 
  FiHome, 
  FiMapPin, 
  FiGrid, 
  FiPackage, 
  FiTruck, 
  FiEdit3, 
  FiAlertTriangle, 
  FiMenu, 
  FiX, 
  FiFileText, 
  FiBarChart3 
} = FiIcons;

const menuItems = [
  { path: '/', icon: FiHome, label: 'Dashboard' },
  { path: '/stock-entry', icon: FiEdit3, label: 'Stock Entry' },
  { path: '/stock-analysis', icon: FiBarChart3, label: 'Stock Analysis' },
  { path: '/locations', icon: FiMapPin, label: 'Locations' },
  { path: '/categories', icon: FiGrid, label: 'Categories' },
  { path: '/items', icon: FiPackage, label: 'Items' },
  { path: '/suppliers', icon: FiTruck, label: 'Suppliers' },
  { path: '/alerts', icon: FiAlertTriangle, label: 'Alerts' },
  { path: '/transaction-log', icon: FiFileText, label: 'Transaction Log' }
];

export default function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-coffee-800 text-white
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-coffee-700">
          <div className="flex items-center space-x-3">
            <img 
              src="https://quest-media-storage-bucket.s3.us-east-2.amazonaws.com/1751614378200-logo%20circle.png" 
              alt="Fyngan Logo" 
              className="w-8 h-8 rounded-full object-cover" 
            />
            <h1 className="text-xl font-bold">Fyngan Inventory</h1>
          </div>
          {/* Close button - only visible on mobile */}
          <button 
            onClick={onToggle}
            className="lg:hidden p-1 rounded-md hover:bg-coffee-700 transition-colors"
          >
            <SafeIcon icon={FiX} className="text-xl" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 h-full overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                    ${location.pathname === item.path 
                      ? 'bg-coffee-600 text-white' 
                      : 'text-coffee-300 hover:bg-coffee-700 hover:text-white'
                    }
                  `}
                  onClick={() => {
                    // Close sidebar on mobile when clicking a link
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                >
                  <SafeIcon icon={item.icon} className="text-lg flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-30 lg:hidden bg-coffee-800 text-white p-3 rounded-lg shadow-lg hover:bg-coffee-700 transition-colors"
      >
        <SafeIcon icon={FiMenu} className="text-xl" />
      </button>
    </>
  );
}