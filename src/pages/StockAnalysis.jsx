import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '../context/InventoryContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiBarChart3, 
  FiCalendar, 
  FiRefreshCw, 
  FiDownload, 
  FiFilter,
  FiPackage,
  FiActivity,
  FiTarget,
  FiAlertCircle
} = FiIcons;

export default function StockAnalysis() {
  const { transactions, items, locations, stockLevels, formatQuantity, isLoading } = useInventory();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedItem, setSelectedItem] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  const analysisData = useMemo(() => {
    // Handle loading state
    if (isLoading) return null;
    
    // Handle no transactions case
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return {
        itemAnalysis: {},
        dailyData: {},
        summary: {
          totalItems: 0,
          totalRestockEvents: 0,
          totalConsumptionEvents: 0,
          totalTransactions: 0,
          averageRestocksPerItem: 0,
          averageConsumptionsPerItem: 0
        },
        topPerformers: {
          topConsumed: [],
          topRestocked: [],
          mostActive: []
        },
        isEmpty: true
      };
    }

    const now = new Date();
    const periods = {
      day: 1,
      week: 7,
      month: 30,
      quarter: 90,
      year: 365
    };

    const cutoffDate = new Date(now.getTime() - (periods[selectedPeriod] * 24 * 60 * 60 * 1000));
    
    // Filter stock transactions
    const stockTransactions = transactions.filter(transaction => {
      try {
        const transactionDate = new Date(transaction.timestamp);
        const matchesPeriod = transactionDate >= cutoffDate;
        const isStockTransaction = transaction.type === 'STOCK_UPDATED';
        const matchesItem = selectedItem === 'all' || transaction.details?.itemId === selectedItem;
        const matchesLocation = selectedLocation === 'all' || transaction.details?.locationId === selectedLocation;
        
        return matchesPeriod && isStockTransaction && matchesItem && matchesLocation;
      } catch (error) {
        console.error('Error filtering transaction:', error);
        return false;
      }
    });

    // If no stock transactions, show empty state
    if (stockTransactions.length === 0) {
      return {
        itemAnalysis: {},
        dailyData: {},
        summary: {
          totalItems: 0,
          totalRestockEvents: 0,
          totalConsumptionEvents: 0,
          totalTransactions: 0,
          averageRestocksPerItem: 0,
          averageConsumptionsPerItem: 0
        },
        topPerformers: {
          topConsumed: [],
          topRestocked: [],
          mostActive: []
        },
        isEmpty: true
      };
    }

    // Group transactions by item
    const itemAnalysis = {};
    const dailyData = {};

    stockTransactions.forEach(transaction => {
      try {
        const { details } = transaction;
        if (!details || !details.itemId) return;

        const itemId = details.itemId;
        const itemName = details.itemName || 'Unknown Item';
        const locationName = details.locationName || 'Unknown Location';
        const quantityChange = parseFloat(details.quantityChange) || 0;
        const unit = details.unit || 'unit';
        const transactionDate = new Date(transaction.timestamp);

        // Initialize item analysis
        if (!itemAnalysis[itemId]) {
          itemAnalysis[itemId] = {
            itemName,
            unit,
            totalRestocked: 0,
            totalConsumed: 0,
            restockCount: 0,
            consumptionCount: 0,
            locations: {},
            dailyActivity: {},
            averageRestock: 0,
            averageConsumption: 0,
            trend: 'stable'
          };
        }

        // Track by location
        if (!itemAnalysis[itemId].locations[locationName]) {
          itemAnalysis[itemId].locations[locationName] = {
            restocked: 0,
            consumed: 0,
            transactions: 0
          };
        }

        // Categorize transaction
        if (quantityChange > 0) {
          itemAnalysis[itemId].totalRestocked += quantityChange;
          itemAnalysis[itemId].restockCount++;
          itemAnalysis[itemId].locations[locationName].restocked += quantityChange;
        } else if (quantityChange < 0) {
          itemAnalysis[itemId].totalConsumed += Math.abs(quantityChange);
          itemAnalysis[itemId].consumptionCount++;
          itemAnalysis[itemId].locations[locationName].consumed += Math.abs(quantityChange);
        }

        itemAnalysis[itemId].locations[locationName].transactions++;

        // Daily tracking
        const dateKey = transactionDate.toISOString().split('T')[0];
        if (!itemAnalysis[itemId].dailyActivity[dateKey]) {
          itemAnalysis[itemId].dailyActivity[dateKey] = {
            restocked: 0,
            consumed: 0,
            transactions: 0
          };
        }

        if (quantityChange > 0) {
          itemAnalysis[itemId].dailyActivity[dateKey].restocked += quantityChange;
        } else if (quantityChange < 0) {
          itemAnalysis[itemId].dailyActivity[dateKey].consumed += Math.abs(quantityChange);
        }
        itemAnalysis[itemId].dailyActivity[dateKey].transactions++;

        // Global daily data
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = {
            totalRestocked: 0,
            totalConsumed: 0,
            transactions: 0
          };
        }

        if (quantityChange > 0) {
          dailyData[dateKey].totalRestocked += quantityChange;
        } else if (quantityChange < 0) {
          dailyData[dateKey].totalConsumed += Math.abs(quantityChange);
        }
        dailyData[dateKey].transactions++;
      } catch (error) {
        console.error('Error processing transaction:', error);
      }
    });

    // Calculate averages and trends
    Object.keys(itemAnalysis).forEach(itemId => {
      try {
        const item = itemAnalysis[itemId];
        const days = Object.keys(item.dailyActivity).length || 1;
        
        item.averageRestock = item.restockCount > 0 ? item.totalRestocked / item.restockCount : 0;
        item.averageConsumption = item.consumptionCount > 0 ? item.totalConsumed / item.consumptionCount : 0;
        item.dailyConsumption = item.totalConsumed / days;
        item.dailyRestock = item.totalRestocked / days;
        
        // Determine trend
        if (item.totalConsumed > item.totalRestocked * 1.2) {
          item.trend = 'declining';
        } else if (item.totalRestocked > item.totalConsumed * 1.2) {
          item.trend = 'increasing';
        } else {
          item.trend = 'stable';
        }
      } catch (error) {
        console.error('Error calculating trends:', error);
      }
    });

    // Calculate summary statistics
    const totalItems = Object.keys(itemAnalysis).length;
    const totalRestockEvents = Object.values(itemAnalysis).reduce((sum, item) => sum + item.restockCount, 0);
    const totalConsumptionEvents = Object.values(itemAnalysis).reduce((sum, item) => sum + item.consumptionCount, 0);
    const totalTransactions = stockTransactions.length;

    // Top performers
    const topConsumed = Object.values(itemAnalysis)
      .sort((a, b) => b.totalConsumed - a.totalConsumed)
      .slice(0, 5);

    const topRestocked = Object.values(itemAnalysis)
      .sort((a, b) => b.totalRestocked - a.totalRestocked)
      .slice(0, 5);

    const mostActive = Object.values(itemAnalysis)
      .sort((a, b) => (b.restockCount + b.consumptionCount) - (a.restockCount + a.consumptionCount))
      .slice(0, 5);

    return {
      itemAnalysis,
      dailyData,
      summary: {
        totalItems,
        totalRestockEvents,
        totalConsumptionEvents,
        totalTransactions,
        averageRestocksPerItem: totalItems > 0 ? (totalRestockEvents / totalItems).toFixed(1) : 0,
        averageConsumptionsPerItem: totalItems > 0 ? (totalConsumptionEvents / totalItems).toFixed(1) : 0
      },
      topPerformers: {
        topConsumed,
        topRestocked,
        mostActive
      },
      isEmpty: false
    };
  }, [transactions, selectedPeriod, selectedItem, selectedLocation, isLoading]);

  const generateSampleData = async () => {
    try {
      // This would add some sample transactions for analysis
      alert('Sample data generation would be implemented here. For now, try updating some stock levels first in the Stock Entry page to generate transaction data.');
    } catch (error) {
      console.error('Error generating sample data:', error);
    }
  };

  const exportAnalysis = () => {
    if (!analysisData || analysisData.isEmpty) return;

    try {
      const csvContent = [
        ['Item Name', 'Unit', 'Total Restocked', 'Total Consumed', 'Restock Count', 'Consumption Count', 'Daily Avg Consumption', 'Daily Avg Restock', 'Trend'].join(','),
        ...Object.values(analysisData.itemAnalysis).map(item => [
          item.itemName,
          item.unit,
          formatQuantity(item.totalRestocked),
          formatQuantity(item.totalConsumed),
          item.restockCount,
          item.consumptionCount,
          formatQuantity(item.dailyConsumption),
          formatQuantity(item.dailyRestock),
          item.trend
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock-analysis-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting analysis:', error);
      alert('Error exporting analysis. Please try again.');
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return FiTrendingUp;
      case 'declining': return FiTrendingDown;
      default: return FiActivity;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'increasing': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <SafeIcon icon={FiRefreshCw} className="animate-spin text-4xl text-coffee-600 mb-4" />
            <p className="text-gray-600">Loading stock analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisData || analysisData.isEmpty) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Analysis</h1>
          <p className="text-gray-600">Analyze consumption patterns, restocking trends, and inventory performance</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <SafeIcon icon={FiBarChart3} className="text-gray-400 text-4xl mb-4 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Data Available</h3>
          <p className="text-gray-500 mb-6">
            Start updating stock levels to generate analysis data. Go to Stock Entry and make some changes to see trends and patterns.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#/stock-entry"
              className="inline-flex items-center px-4 py-2 bg-coffee-600 text-white rounded-md hover:bg-coffee-700 transition-colors"
            >
              <SafeIcon icon={FiPackage} className="mr-2" />
              Go to Stock Entry
            </a>
            <button
              onClick={generateSampleData}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <SafeIcon icon={FiTarget} className="mr-2" />
              Generate Sample Data
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How to Generate Analysis Data:</h4>
            <ol className="text-sm text-blue-800 text-left space-y-1">
              <li>1. Go to <strong>Stock Entry</strong> page</li>
              <li>2. Select a location (Main Store, Storage, etc.)</li>
              <li>3. Update quantities for different items</li>
              <li>4. Save the changes</li>
              <li>5. Return here to see your analysis</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Analysis</h1>
          <p className="text-gray-600">Analyze consumption patterns, restocking trends, and inventory performance</p>
        </div>
        <button
          onClick={exportAnalysis}
          className="flex items-center space-x-2 bg-coffee-600 text-white px-4 py-2 rounded-md hover:bg-coffee-700 transition-colors"
        >
          <SafeIcon icon={FiDownload} />
          <span>Export Analysis</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <SafeIcon icon={FiCalendar} className="inline mr-1" />
              Time Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <SafeIcon icon={FiPackage} className="inline mr-1" />
              Filter by Item
            </label>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="all">All Items</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <SafeIcon icon={FiFilter} className="inline mr-1" />
              Filter by Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="all">All Locations</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Items Analyzed</p>
              <p className="text-2xl font-bold text-gray-900">{analysisData.summary.totalItems}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <SafeIcon icon={FiPackage} className="text-white text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Restock Events</p>
              <p className="text-2xl font-bold text-gray-900">{analysisData.summary.totalRestockEvents}</p>
              <p className="text-xs text-gray-500">Avg: {analysisData.summary.averageRestocksPerItem}/item</p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <SafeIcon icon={FiTrendingUp} className="text-white text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Consumption Events</p>
              <p className="text-2xl font-bold text-gray-900">{analysisData.summary.totalConsumptionEvents}</p>
              <p className="text-xs text-gray-500">Avg: {analysisData.summary.averageConsumptionsPerItem}/item</p>
            </div>
            <div className="p-3 rounded-full bg-red-500">
              <SafeIcon icon={FiTrendingDown} className="text-white text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{analysisData.summary.totalTransactions}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-500">
              <SafeIcon icon={FiBarChart3} className="text-white text-xl" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Most Consumed */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <SafeIcon icon={FiTrendingDown} className="text-red-600 mr-2" />
            Most Consumed Items
          </h3>
          <div className="space-y-3">
            {analysisData.topPerformers.topConsumed.length > 0 ? (
              analysisData.topPerformers.topConsumed.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.itemName}</p>
                    <p className="text-sm text-gray-600">{item.consumptionCount} times</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">
                      {formatQuantity(item.totalConsumed)} {item.unit}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatQuantity(item.dailyConsumption)}/day
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No consumption data yet</p>
            )}
          </div>
        </div>

        {/* Most Restocked */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <SafeIcon icon={FiTrendingUp} className="text-green-600 mr-2" />
            Most Restocked Items
          </h3>
          <div className="space-y-3">
            {analysisData.topPerformers.topRestocked.length > 0 ? (
              analysisData.topPerformers.topRestocked.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.itemName}</p>
                    <p className="text-sm text-gray-600">{item.restockCount} times</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatQuantity(item.totalRestocked)} {item.unit}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatQuantity(item.dailyRestock)}/day
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No restock data yet</p>
            )}
          </div>
        </div>

        {/* Most Active */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <SafeIcon icon={FiActivity} className="text-blue-600 mr-2" />
            Most Active Items
          </h3>
          <div className="space-y-3">
            {analysisData.topPerformers.mostActive.length > 0 ? (
              analysisData.topPerformers.mostActive.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.itemName}</p>
                    <p className="text-sm text-gray-600">
                      {item.restockCount + item.consumptionCount} transactions
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <SafeIcon 
                        icon={getTrendIcon(item.trend)} 
                        className={`text-sm ${getTrendColor(item.trend)}`} 
                      />
                      <span className={`text-xs font-medium ${getTrendColor(item.trend)}`}>
                        {item.trend}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No activity data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Analysis Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Item Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Consumed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Restocked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Daily Avg Consumption
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restock Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.values(analysisData.itemAnalysis).length > 0 ? (
                Object.values(analysisData.itemAnalysis).map((item, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <SafeIcon icon={FiPackage} className="text-coffee-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                          <div className="text-xs text-gray-500">{item.unit}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatQuantity(item.totalConsumed)} {item.unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.consumptionCount} times
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatQuantity(item.totalRestocked)} {item.unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.restockCount} times
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatQuantity(item.dailyConsumption)} {item.unit}/day
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.restockCount > 0 ? 
                          `Every ${Math.round(Object.keys(item.dailyActivity).length / item.restockCount)} days` : 
                          'No restocks'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <SafeIcon 
                          icon={getTrendIcon(item.trend)} 
                          className={`mr-2 ${getTrendColor(item.trend)}`} 
                        />
                        <span className={`text-sm font-medium ${getTrendColor(item.trend)}`}>
                          {item.trend}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No detailed analysis data available yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}