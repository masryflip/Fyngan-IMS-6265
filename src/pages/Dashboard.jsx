import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '../context/InventoryContext';
import StockCard from '../components/StockCard';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { 
  FiPackage, 
  FiMapPin, 
  FiAlertTriangle, 
  FiTrendingUp, 
  FiRefreshCw, 
  FiXCircle, 
  FiAlertCircle,
  FiCheckCircle,
  FiBarChart3,
  FiEye
} = FiIcons;

export default function Dashboard() {
  const { 
    items, 
    locations, 
    stockLevels, 
    getStockAlerts, 
    getTotalStock, 
    formatQuantity, 
    isLoading, 
    error 
  } = useInventory();

  const stockAnalysis = useMemo(() => {
    const alerts = getStockAlerts();
    
    const itemsWithStockAnalysis = items.map(item => {
      const totalStock = getTotalStock(item.id);
      const stockPercentage = item.max_stock > 0 ? (totalStock / item.max_stock) * 100 : 0;
      
      let stockStatus = 'good';
      let statusColor = 'green';
      let urgency = 0;
      
      if (totalStock === 0) {
        stockStatus = 'out';
        statusColor = 'red';
        urgency = 4;
      } else if (totalStock <= item.min_stock) {
        stockStatus = 'critical';
        statusColor = 'red';
        urgency = 3;
      } else if (stockPercentage <= 25) {
        stockStatus = 'low';
        statusColor = 'yellow';
        urgency = 2;
      } else if (stockPercentage >= 90) {
        stockStatus = 'high';
        statusColor = 'blue';
        urgency = 1;
      } else {
        stockStatus = 'good';
        statusColor = 'green';
        urgency = 0;
      }

      const locationStocks = locations.map(location => {
        const stock = stockLevels.find(s => s.item_id === item.id && s.location_id === location.id);
        return {
          id: location.id,
          name: location.name,
          stock: stock ? parseFloat(stock.quantity) : 0
        };
      }).filter(loc => loc.stock > 0);

      return {
        ...item,
        totalStock,
        stockPercentage,
        stockStatus,
        statusColor,
        urgency,
        locationStocks
      };
    });

    // Sort by urgency (most urgent first)
    const sortedItems = itemsWithStockAnalysis.sort((a, b) => b.urgency - a.urgency);

    const stats = {
      totalItems: items.length,
      totalLocations: locations.length,
      outOfStock: itemsWithStockAnalysis.filter(item => item.stockStatus === 'out').length,
      criticalStock: itemsWithStockAnalysis.filter(item => item.stockStatus === 'critical').length,
      lowStock: itemsWithStockAnalysis.filter(item => item.stockStatus === 'low').length,
      highStock: itemsWithStockAnalysis.filter(item => item.stockStatus === 'high').length,
      goodStock: itemsWithStockAnalysis.filter(item => item.stockStatus === 'good').length,
      totalAlerts: alerts.length
    };

    return {
      items: sortedItems,
      stats,
      criticalItems: sortedItems.filter(item => item.urgency >= 3),
      needsAttention: sortedItems.filter(item => item.urgency >= 2),
      wellStocked: sortedItems.filter(item => item.urgency === 0)
    };
  }, [items, locations, stockLevels, getTotalStock, getStockAlerts]);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'out':
        return {
          icon: FiXCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          label: 'Out of Stock',
          priority: 'URGENT'
        };
      case 'critical':
        return {
          icon: FiAlertTriangle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          label: 'Critical',
          priority: 'HIGH'
        };
      case 'low':
        return {
          icon: FiAlertCircle,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          label: 'Low Stock',
          priority: 'MEDIUM'
        };
      case 'high':
        return {
          icon: FiTrendingUp,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          label: 'High Stock',
          priority: 'INFO'
        };
      default:
        return {
          icon: FiCheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          label: 'Good Stock',
          priority: 'GOOD'
        };
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <SafeIcon icon={FiRefreshCw} className="animate-spin text-4xl text-coffee-600 mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <SafeIcon icon={FiAlertTriangle} className="text-red-500 text-4xl mb-4" />
            <p className="text-red-600 mb-2">Error loading dashboard</p>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Dashboard</h1>
        <p className="text-gray-600">Real-time overview of your coffee shop inventory</p>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Critical Items</p>
              <p className="text-3xl font-bold text-red-600">
                {stockAnalysis.stats.outOfStock + stockAnalysis.stats.criticalStock}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stockAnalysis.stats.outOfStock} out, {stockAnalysis.stats.criticalStock} critical
              </p>
            </div>
            <div className="p-3 rounded-full bg-red-500">
              <SafeIcon icon={FiAlertTriangle} className="text-white text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Low Stock</p>
              <p className="text-3xl font-bold text-yellow-600">{stockAnalysis.stats.lowStock}</p>
              <p className="text-xs text-gray-500 mt-1">Needs restocking soon</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-500">
              <SafeIcon icon={FiAlertCircle} className="text-white text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Well Stocked</p>
              <p className="text-3xl font-bold text-green-600">{stockAnalysis.stats.goodStock}</p>
              <p className="text-xs text-gray-500 mt-1">Optimal levels</p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <SafeIcon icon={FiCheckCircle} className="text-white text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Items</p>
              <p className="text-3xl font-bold text-gray-900">{stockAnalysis.stats.totalItems}</p>
              <p className="text-xs text-gray-500 mt-1">Across {stockAnalysis.stats.totalLocations} locations</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <SafeIcon icon={FiPackage} className="text-white text-xl" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stock Health Overview */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <SafeIcon icon={FiBarChart3} className="mr-2" />
          Stock Health Overview
        </h2>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
          <div className="h-4 flex">
            <div 
              className="bg-red-500 h-full" 
              style={{ width: `${((stockAnalysis.stats.outOfStock + stockAnalysis.stats.criticalStock) / stockAnalysis.stats.totalItems) * 100}%` }}
            ></div>
            <div 
              className="bg-yellow-500 h-full" 
              style={{ width: `${(stockAnalysis.stats.lowStock / stockAnalysis.stats.totalItems) * 100}%` }}
            ></div>
            <div 
              className="bg-green-500 h-full" 
              style={{ width: `${(stockAnalysis.stats.goodStock / stockAnalysis.stats.totalItems) * 100}%` }}
            ></div>
            <div 
              className="bg-blue-500 h-full" 
              style={{ width: `${(stockAnalysis.stats.highStock / stockAnalysis.stats.totalItems) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Critical ({stockAnalysis.stats.outOfStock + stockAnalysis.stats.criticalStock})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span>Low Stock ({stockAnalysis.stats.lowStock})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Good ({stockAnalysis.stats.goodStock})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>High ({stockAnalysis.stats.highStock})</span>
          </div>
        </div>
      </div>

      {/* Critical Items Alert */}
      {stockAnalysis.criticalItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8"
        >
          <div className="flex items-center mb-4">
            <SafeIcon icon={FiAlertTriangle} className="text-red-600 text-xl mr-3" />
            <h3 className="text-lg font-semibold text-red-800">
              Critical Items Requiring Immediate Attention ({stockAnalysis.criticalItems.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stockAnalysis.criticalItems.slice(0, 6).map(item => {
              const config = getStatusConfig(item.stockStatus);
              return (
                <div key={item.id} className={`p-4 rounded-lg border-2 ${config.bg} ${config.border}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    <div className={`flex items-center ${config.color}`}>
                      <SafeIcon icon={config.icon} className="text-sm mr-1" />
                      <span className="text-xs font-bold">{config.priority}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Current:</span>
                      <span className={`font-bold ${config.color}`}>
                        {formatQuantity(item.totalStock)} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Min needed:</span>
                      <span>{formatQuantity(item.min_stock)} {item.unit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full ${item.stockStatus === 'out' ? 'bg-red-500' : 'bg-yellow-500'}`}
                        style={{ width: `${Math.min(item.stockPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {stockAnalysis.criticalItems.length > 6 && (
            <div className="mt-4 text-center">
              <a 
                href="#/alerts" 
                className="inline-flex items-center text-red-600 hover:text-red-800 font-medium"
              >
                <SafeIcon icon={FiEye} className="mr-1" />
                View all {stockAnalysis.criticalItems.length} critical items
              </a>
            </div>
          )}
        </motion.div>
      )}

      {/* Enhanced Stock Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">All Items Stock Status</h2>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>Urgent Action</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span>Monitor</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Good</span>
            </div>
          </div>
        </div>
        
        {stockAnalysis.items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No items found. Add some items to get started.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stockAnalysis.items.map((item) => (
              <StockCard
                key={item.id}
                item={item}
                totalStock={item.totalStock}
                minStock={item.min_stock}
                maxStock={item.max_stock}
                locations={item.locationStocks}
                formatQuantity={formatQuantity}
                enhanced={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}