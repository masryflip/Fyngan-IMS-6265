import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '../context/InventoryContext';
import StockCard from '../components/StockCard';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const {
  FiPackage, FiMapPin, FiAlertTriangle, FiTrendingUp, FiRefreshCw, FiXCircle,
  FiAlertCircle, FiCheckCircle, FiBarChart3, FiEye, FiGrid, FiLayers,
  FiChevronDown, FiChevronUp, FiFilter, FiTarget, FiActivity
} = FiIcons;

export default function Dashboard() {
  const {
    items, locations, stockLevels, getStockAlerts, getTotalStock, formatQuantity,
    isLoading, error, categories
  } = useInventory();

  const [selectedLocationView, setSelectedLocationView] = useState('all');
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'location-detail', 'location-grid'
  const [expandedLocation, setExpandedLocation] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'critical', 'low', 'good'

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
          type: location.type,
          stock: stock ? parseFloat(stock.quantity) : 0
        };
      }).filter(loc => loc.stock > 0 || selectedLocationView === 'all');

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
  }, [items, locations, stockLevels, getTotalStock, getStockAlerts, selectedLocationView]);

  // Location-based analysis
  const locationAnalysis = useMemo(() => {
    return locations.map(location => {
      const locationItems = items.map(item => {
        const stock = stockLevels.find(s => s.item_id === item.id && s.location_id === location.id);
        const currentStock = stock ? parseFloat(stock.quantity) : 0;
        
        let stockStatus = 'good';
        if (currentStock === 0) stockStatus = 'out';
        else if (currentStock <= item.min_stock) stockStatus = 'critical';
        else if (currentStock <= item.min_stock * 1.5) stockStatus = 'low';
        else if (currentStock >= item.max_stock * 0.9) stockStatus = 'high';

        return {
          ...item,
          currentStock,
          stockStatus,
          stockPercentage: item.max_stock > 0 ? (currentStock / item.max_stock) * 100 : 0
        };
      });

      const stats = {
        totalItems: locationItems.length,
        outOfStock: locationItems.filter(item => item.stockStatus === 'out').length,
        critical: locationItems.filter(item => item.stockStatus === 'critical').length,
        low: locationItems.filter(item => item.stockStatus === 'low').length,
        good: locationItems.filter(item => item.stockStatus === 'good').length,
        high: locationItems.filter(item => item.stockStatus === 'high').length
      };

      const totalValue = locationItems.reduce((sum, item) => sum + item.currentStock, 0);
      const alertCount = stats.outOfStock + stats.critical + stats.low;

      return {
        ...location,
        items: locationItems,
        stats,
        totalValue,
        alertCount,
        healthScore: stats.totalItems > 0 ? ((stats.good + stats.high) / stats.totalItems) * 100 : 100
      };
    }).sort((a, b) => b.alertCount - a.alertCount); // Sort by most alerts first
  }, [locations, items, stockLevels]);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'out':
        return { icon: FiXCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Out of Stock', priority: 'URGENT' };
      case 'critical':
        return { icon: FiAlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Critical', priority: 'HIGH' };
      case 'low':
        return { icon: FiAlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Low Stock', priority: 'MEDIUM' };
      case 'high':
        return { icon: FiTrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'High Stock', priority: 'INFO' };
      default:
        return { icon: FiCheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Good Stock', priority: 'GOOD' };
    }
  };

  const getLocationIcon = (type) => {
    const iconMap = {
      'retail': FiGrid,
      'storage': FiPackage,
      'production': FiActivity,
      'warehouse': FiLayers
    };
    return iconMap[type] || FiMapPin;
  };

  const filteredLocationItems = (locationItems) => {
    if (filterStatus === 'all') return locationItems;
    return locationItems.filter(item => {
      if (filterStatus === 'critical') return item.stockStatus === 'out' || item.stockStatus === 'critical';
      if (filterStatus === 'low') return item.stockStatus === 'low';
      if (filterStatus === 'good') return item.stockStatus === 'good' || item.stockStatus === 'high';
      return true;
    });
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
        <p className="text-gray-600">Real-time overview of your coffee shop inventory across all locations</p>
      </div>

      {/* View Mode Selector */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex space-x-2 bg-white rounded-lg shadow-md border overflow-hidden">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-4 py-2 flex items-center space-x-2 transition-colors ${
              viewMode === 'overview' ? 'bg-coffee-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <SafeIcon icon={FiBarChart3} />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setViewMode('location-grid')}
            className={`px-4 py-2 flex items-center space-x-2 transition-colors ${
              viewMode === 'location-grid' ? 'bg-coffee-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <SafeIcon icon={FiGrid} />
            <span>Location Grid</span>
          </button>
          <button
            onClick={() => setViewMode('location-detail')}
            className={`px-4 py-2 flex items-center space-x-2 transition-colors ${
              viewMode === 'location-detail' ? 'bg-coffee-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <SafeIcon icon={FiLayers} />
            <span>Location Details</span>
          </button>
        </div>

        {/* Filters */}
        {viewMode !== 'overview' && (
          <div className="flex space-x-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="all">All Items</option>
              <option value="critical">Critical Only</option>
              <option value="low">Low Stock</option>
              <option value="good">Good Stock</option>
            </select>
          </div>
        )}
      </div>

      {viewMode === 'overview' && (
        <>
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
                  <p className="text-sm text-gray-600 mb-1">Total Locations</p>
                  <p className="text-3xl font-bold text-gray-900">{stockAnalysis.stats.totalLocations}</p>
                  <p className="text-xs text-gray-500 mt-1">{stockAnalysis.stats.totalItems} items tracked</p>
                </div>
                <div className="p-3 rounded-full bg-blue-500">
                  <SafeIcon icon={FiMapPin} className="text-white text-xl" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Location Health Overview */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <SafeIcon icon={FiMapPin} className="mr-2" />
              Location Health Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locationAnalysis.map((location, index) => (
                <motion.div
                  key={location.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-2 ${
                    location.alertCount > 5 ? 'border-red-200 bg-red-50' :
                    location.alertCount > 2 ? 'border-yellow-200 bg-yellow-50' :
                    'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <SafeIcon icon={getLocationIcon(location.type)} className="text-coffee-600" />
                      <h3 className="font-semibold text-gray-900">{location.name}</h3>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                      location.alertCount > 5 ? 'bg-red-600 text-white' :
                      location.alertCount > 2 ? 'bg-yellow-600 text-white' :
                      'bg-green-600 text-white'
                    }`}>
                      {location.alertCount} alerts
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Health Score:</span>
                      <span className={`font-bold ${
                        location.healthScore >= 80 ? 'text-green-600' :
                        location.healthScore >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {Math.round(location.healthScore)}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          location.healthScore >= 80 ? 'bg-green-500' :
                          location.healthScore >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${location.healthScore}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                      <span>{location.stats.outOfStock} out</span>
                      <span>{location.stats.critical} critical</span>
                      <span>{location.stats.low} low</span>
                      <span>{location.stats.good} good</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}

      {viewMode === 'location-grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {locationAnalysis.map((location, locationIndex) => (
            <motion.div
              key={location.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: locationIndex * 0.1 }}
              className="bg-white rounded-lg shadow-md border"
            >
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={getLocationIcon(location.type)} className="text-coffee-600 text-xl" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                      <p className="text-sm text-gray-600">{location.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                      location.alertCount > 5 ? 'bg-red-100 text-red-800' :
                      location.alertCount > 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {location.alertCount} alerts
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Health: {Math.round(location.healthScore)}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                  <div className="p-2 bg-red-50 rounded">
                    <div className="text-lg font-bold text-red-600">{location.stats.outOfStock}</div>
                    <div className="text-xs text-red-600">Out</div>
                  </div>
                  <div className="p-2 bg-orange-50 rounded">
                    <div className="text-lg font-bold text-orange-600">{location.stats.critical}</div>
                    <div className="text-xs text-orange-600">Critical</div>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded">
                    <div className="text-lg font-bold text-yellow-600">{location.stats.low}</div>
                    <div className="text-xs text-yellow-600">Low</div>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">{location.stats.good + location.stats.high}</div>
                    <div className="text-xs text-green-600">Good</div>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredLocationItems(location.items)
                    .filter(item => item.currentStock > 0 || item.stockStatus === 'out')
                    .sort((a, b) => {
                      const statusOrder = { out: 0, critical: 1, low: 2, good: 3, high: 4 };
                      return statusOrder[a.stockStatus] - statusOrder[b.stockStatus];
                    })
                    .slice(0, 10)
                    .map((item) => {
                      const config = getStatusConfig(item.stockStatus);
                      return (
                        <div key={item.id} className={`flex items-center justify-between p-2 rounded border ${config.bg} ${config.border}`}>
                          <div className="flex items-center space-x-2">
                            <SafeIcon icon={config.icon} className={`text-sm ${config.color}`} />
                            <span className="text-sm font-medium text-gray-900">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-bold ${config.color}`}>
                              {formatQuantity(item.currentStock)} {item.unit}
                            </div>
                            <div className="text-xs text-gray-500">
                              Min: {formatQuantity(item.min_stock)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                
                {filteredLocationItems(location.items).length > 10 && (
                  <div className="mt-2 text-center">
                    <button 
                      onClick={() => setViewMode('location-detail')}
                      className="text-coffee-600 hover:text-coffee-800 text-sm font-medium"
                    >
                      View all {filteredLocationItems(location.items).length} items →
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {viewMode === 'location-detail' && (
        <div className="space-y-6">
          {locationAnalysis.map((location, locationIndex) => (
            <motion.div
              key={location.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: locationIndex * 0.1 }}
              className="bg-white rounded-lg shadow-md border"
            >
              <div 
                className="p-6 border-b bg-gray-50 cursor-pointer"
                onClick={() => setExpandedLocation(expandedLocation === location.id ? null : location.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <SafeIcon icon={getLocationIcon(location.type)} className="text-coffee-600 text-2xl" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{location.name}</h2>
                      <p className="text-gray-600">{location.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div className="p-2 bg-red-50 rounded">
                        <div className="text-lg font-bold text-red-600">{location.stats.outOfStock}</div>
                        <div className="text-xs text-red-600">Out</div>
                      </div>
                      <div className="p-2 bg-orange-50 rounded">
                        <div className="text-lg font-bold text-orange-600">{location.stats.critical}</div>
                        <div className="text-xs text-orange-600">Critical</div>
                      </div>
                      <div className="p-2 bg-yellow-50 rounded">
                        <div className="text-lg font-bold text-yellow-600">{location.stats.low}</div>
                        <div className="text-xs text-yellow-600">Low</div>
                      </div>
                      <div className="p-2 bg-green-50 rounded">
                        <div className="text-lg font-bold text-green-600">{location.stats.good + location.stats.high}</div>
                        <div className="text-xs text-green-600">Good</div>
                      </div>
                    </div>
                    
                    <SafeIcon 
                      icon={expandedLocation === location.id ? FiChevronUp : FiChevronDown} 
                      className="text-xl text-gray-400" 
                    />
                  </div>
                </div>
              </div>
              
              {expandedLocation === location.id && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredLocationItems(location.items)
                      .sort((a, b) => {
                        const statusOrder = { out: 0, critical: 1, low: 2, good: 3, high: 4 };
                        return statusOrder[a.stockStatus] - statusOrder[b.stockStatus];
                      })
                      .map((item) => {
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
                                  {formatQuantity(item.currentStock)} {item.unit}
                                </span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>Min needed:</span>
                                <span>{formatQuantity(item.min_stock)} {item.unit}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    item.stockStatus === 'out' ? 'bg-red-500' : 
                                    item.stockStatus === 'critical' ? 'bg-orange-500' :
                                    item.stockStatus === 'low' ? 'bg-yellow-500' :
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(item.stockPercentage, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Critical Items Alert - Only show in overview mode */}
      {viewMode === 'overview' && stockAnalysis.criticalItems.length > 0 && (
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
                    
                    {/* Show locations with stock */}
                    {item.locationStocks.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-1">Available at:</p>
                        {item.locationStocks.map(loc => (
                          <div key={loc.id} className="flex justify-between text-xs">
                            <span className="text-gray-600">{loc.name}:</span>
                            <span className="font-medium">{formatQuantity(loc.stock)} {item.unit}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {stockAnalysis.criticalItems.length > 6 && (
            <div className="mt-4 text-center">
              <a href="#/alerts" className="inline-flex items-center text-red-600 hover:text-red-800 font-medium">
                <SafeIcon icon={FiEye} className="mr-1" />
                View all {stockAnalysis.criticalItems.length} critical items
              </a>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}