import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '../context/InventoryContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiFileText, FiFilter, FiDownload, FiCalendar, FiUser, FiPackage, FiMapPin, FiGrid, FiTruck, FiTrendingUp, FiTrendingDown, FiRefreshCw, FiAlertCircle } = FiIcons;

const TRANSACTION_TYPES = {
  LOCATION_ADDED: { label: 'Location Added', icon: FiMapPin, color: 'bg-green-100 text-green-800' },
  LOCATION_UPDATED: { label: 'Location Updated', icon: FiMapPin, color: 'bg-yellow-100 text-yellow-800' },
  LOCATION_DELETED: { label: 'Location Deleted', icon: FiMapPin, color: 'bg-red-100 text-red-800' },
  CATEGORY_ADDED: { label: 'Category Added', icon: FiGrid, color: 'bg-green-100 text-green-800' },
  CATEGORY_UPDATED: { label: 'Category Updated', icon: FiGrid, color: 'bg-yellow-100 text-yellow-800' },
  CATEGORY_DELETED: { label: 'Category Deleted', icon: FiGrid, color: 'bg-red-100 text-red-800' },
  SUPPLIER_ADDED: { label: 'Supplier Added', icon: FiTruck, color: 'bg-green-100 text-green-800' },
  SUPPLIER_UPDATED: { label: 'Supplier Updated', icon: FiTruck, color: 'bg-yellow-100 text-yellow-800' },
  SUPPLIER_DELETED: { label: 'Supplier Deleted', icon: FiTruck, color: 'bg-red-100 text-red-800' },
  ITEM_ADDED: { label: 'Item Added', icon: FiPackage, color: 'bg-green-100 text-green-800' },
  ITEM_UPDATED: { label: 'Item Updated', icon: FiPackage, color: 'bg-yellow-100 text-yellow-800' },
  ITEM_DELETED: { label: 'Item Deleted', icon: FiPackage, color: 'bg-red-100 text-red-800' },
  STOCK_UPDATED: { label: 'Stock Updated', icon: FiRefreshCw, color: 'bg-blue-100 text-blue-800' }
};

export default function TransactionLog() {
  const { transactions, formatQuantity, isLoading } = useInventory();
  const [filterType, setFilterType] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) {
      return [];
    }

    let filtered = [...transactions].reverse(); // Show newest first

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filterType);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        default:
          filterDate.setTime(0);
      }
      
      filtered = filtered.filter(transaction => 
        new Date(transaction.timestamp) >= filterDate
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(transaction => {
        const searchLower = searchTerm.toLowerCase();
        return (
          transaction.type.toLowerCase().includes(searchLower) ||
          JSON.stringify(transaction.details).toLowerCase().includes(searchLower) ||
          transaction.user_name.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [transactions, filterType, dateFilter, searchTerm]);

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getTransactionDescription = (transaction) => {
    if (!transaction || !transaction.details) {
      return 'No details available';
    }

    const { type, details } = transaction;
    
    try {
      switch (type) {
        case 'LOCATION_ADDED':
          return `Added location "${details.locationName}" (${details.type})`;
        case 'LOCATION_UPDATED':
          return `Updated location "${details.locationName}"`;
        case 'LOCATION_DELETED':
          return `Deleted location "${details.locationName}"`;
        case 'CATEGORY_ADDED':
          return `Added category "${details.categoryName}"`;
        case 'CATEGORY_UPDATED':
          return `Updated category "${details.categoryName}"`;
        case 'CATEGORY_DELETED':
          return `Deleted category "${details.categoryName}"`;
        case 'SUPPLIER_ADDED':
          return `Added supplier "${details.supplierName}"`;
        case 'SUPPLIER_UPDATED':
          return `Updated supplier "${details.supplierName}"`;
        case 'SUPPLIER_DELETED':
          return `Deleted supplier "${details.supplierName}"`;
        case 'ITEM_ADDED':
          return `Added item "${details.itemName}" (${details.categoryName})`;
        case 'ITEM_UPDATED':
          return `Updated item "${details.itemName}"`;
        case 'ITEM_DELETED':
          return `Deleted item "${details.itemName}"`;
        case 'STOCK_UPDATED':
          const change = details.quantityChange;
          const changeText = change > 0 ? `+${formatQuantity(change)}` : formatQuantity(change);
          return `${details.itemName} stock ${change > 0 ? 'increased' : change < 0 ? 'decreased' : 'adjusted'} by ${changeText} ${details.unit} at ${details.locationName}`;
        default:
          return `${type}: ${JSON.stringify(details)}`;
      }
    } catch (error) {
      return `Error parsing transaction: ${error.message}`;
    }
  };

  const exportTransactions = () => {
    try {
      const csvContent = [
        ['Timestamp', 'Type', 'User', 'Description', 'Details'].join(','),
        ...filteredTransactions.map(transaction => [
          formatTimestamp(transaction.timestamp),
          TRANSACTION_TYPES[transaction.type]?.label || transaction.type,
          transaction.user_name,
          getTransactionDescription(transaction),
          JSON.stringify(transaction.details)
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transaction-log-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting transactions:', error);
      alert('Error exporting transactions. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <SafeIcon icon={FiRefreshCw} className="animate-spin text-4xl text-coffee-600 mb-4" />
            <p className="text-gray-600">Loading transaction log...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction Log</h1>
          <p className="text-gray-600">Complete history of all system activities</p>
        </div>
        <button
          onClick={exportTransactions}
          className="flex items-center space-x-2 bg-coffee-600 text-white px-4 py-2 rounded-md hover:bg-coffee-700 transition-colors"
        >
          <SafeIcon icon={FiDownload} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <SafeIcon icon={FiFilter} className="inline mr-1" />
              Filter by Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="all">All Types</option>
              {Object.entries(TRANSACTION_TYPES).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <SafeIcon icon={FiCalendar} className="inline mr-1" />
              Filter by Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
              placeholder="Search transactions..."
            />
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-lg shadow-md">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <SafeIcon icon={FiFileText} className="text-gray-400 text-4xl mb-4 mx-auto" />
            <p className="text-gray-500">
              {transactions && transactions.length === 0 
                ? 'No transactions recorded yet. Start by adding items or updating stock to see activity here.'
                : 'No transactions found matching your filters.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction, index) => {
                  const config = TRANSACTION_TYPES[transaction.type] || {
                    label: transaction.type,
                    icon: FiFileText,
                    color: 'bg-gray-100 text-gray-800'
                  };

                  return (
                    <motion.tr
                      key={transaction.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(transaction.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <SafeIcon icon={config.icon} className="text-coffee-600 mr-2" />
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {getTransactionDescription(transaction)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <SafeIcon icon={FiUser} className="text-gray-400 mr-2" />
                          {transaction.user_name}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
            </div>
            <SafeIcon icon={FiFileText} className="text-coffee-600 text-xl" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Updates</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredTransactions.filter(t => t.type === 'STOCK_UPDATED').length}
              </p>
            </div>
            <SafeIcon icon={FiRefreshCw} className="text-blue-600 text-xl" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Items Added</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredTransactions.filter(t => t.type === 'ITEM_ADDED').length}
              </p>
            </div>
            <SafeIcon icon={FiTrendingUp} className="text-green-600 text-xl" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Items Deleted</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredTransactions.filter(t => t.type === 'ITEM_DELETED').length}
              </p>
            </div>
            <SafeIcon icon={FiTrendingDown} className="text-red-600 text-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}