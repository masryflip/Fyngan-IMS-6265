import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '../context/InventoryContext';
import StockCard from '../components/StockCard';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiPackage, FiMapPin, FiAlertTriangle, FiTrendingUp, FiRefreshCw } = FiIcons;

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

  const stats = useMemo(() => {
    const alerts = getStockAlerts();
    const totalItems = items.length;
    const totalLocations = locations.length;
    const lowStockItems = alerts.filter(alert => alert.type === 'low').length;
    
    return {
      totalItems,
      totalLocations,
      lowStockItems,
      totalAlerts: alerts.length
    };
  }, [items, locations, getStockAlerts]);

  const itemsWithStock = useMemo(() => {
    return items.map(item => {
      const totalStock = getTotalStock(item.id);
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
        locationStocks
      };
    }).sort((a, b) => {
      // Sort by stock status (out of stock first, then low stock)
      const aStatus = a.totalStock === 0 ? 0 : a.totalStock <= a.min_stock ? 1 : 2;
      const bStatus = b.totalStock === 0 ? 0 : b.totalStock <= b.min_stock ? 1 : 2;
      return aStatus - bStatus;
    });
  }, [items, locations, stockLevels, getTotalStock]);

  const statCards = [
    { title: 'Total Items', value: stats.totalItems, icon: FiPackage, color: 'bg-blue-500' },
    { title: 'Locations', value: stats.totalLocations, icon: FiMapPin, color: 'bg-green-500' },
    { title: 'Low Stock Items', value: stats.lowStockItems, icon: FiAlertTriangle, color: 'bg-yellow-500' },
    { title: 'Total Alerts', value: stats.totalAlerts, icon: FiTrendingUp, color: 'bg-red-500' }
  ];

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
        <p className="text-gray-600">Overview of your coffee shop inventory</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <SafeIcon icon={stat.icon} className="text-white text-xl" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stock Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Stock Overview</h2>
        {itemsWithStock.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No items found. Add some items to get started.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {itemsWithStock.map((item) => (
              <StockCard
                key={item.id}
                item={item}
                totalStock={item.totalStock}
                minStock={item.min_stock}
                maxStock={item.max_stock}
                locations={item.locationStocks}
                formatQuantity={formatQuantity}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}