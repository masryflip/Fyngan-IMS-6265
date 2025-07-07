import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiAlertTriangle, FiCheckCircle, FiXCircle, FiTrendingUp, FiAlertCircle } = FiIcons;

export default function StockCard({ 
  item, 
  totalStock, 
  minStock, 
  maxStock, 
  locations, 
  formatQuantity,
  enhanced = false 
}) {
  const getStockStatus = () => {
    if (totalStock === 0) return 'out';
    if (totalStock <= minStock) return 'critical';
    
    const stockPercentage = maxStock > 0 ? (totalStock / maxStock) * 100 : 0;
    if (stockPercentage <= 25) return 'low';
    if (stockPercentage >= 90) return 'high';
    return 'good';
  };

  const status = getStockStatus();
  const stockPercentage = maxStock > 0 ? Math.min((totalStock / maxStock) * 100, 100) : 0;

  const statusConfig = {
    out: {
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: FiXCircle,
      text: 'Out of Stock',
      priority: 'URGENT',
      progressColor: 'bg-red-500'
    },
    critical: {
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: FiAlertTriangle,
      text: 'Critical Low',
      priority: 'HIGH',
      progressColor: 'bg-red-500'
    },
    low: {
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: FiAlertCircle,
      text: 'Low Stock',
      priority: 'MEDIUM',
      progressColor: 'bg-yellow-500'
    },
    high: {
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: FiTrendingUp,
      text: 'High Stock',
      priority: 'INFO',
      progressColor: 'bg-blue-500'
    },
    good: {
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: FiCheckCircle,
      text: 'Good Stock',
      priority: 'GOOD',
      progressColor: 'bg-green-500'
    }
  };

  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg border-2 ${config.bg} ${config.border} relative overflow-hidden`}
    >
      {/* Priority Badge */}
      {enhanced && (status === 'out' || status === 'critical') && (
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs font-bold rounded-full ${config.color} bg-white border`}>
            {config.priority}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 pr-16">{item.name}</h3>
        <div className={`flex items-center space-x-1 ${config.color}`}>
          <SafeIcon icon={config.icon} className="text-sm" />
          <span className="text-sm font-medium">{config.text}</span>
        </div>
      </div>

      {/* Enhanced Stock Display */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Current Stock:</span>
          <span className={`text-lg font-bold ${config.color}`}>
            {formatQuantity(totalStock)} {item.unit}
          </span>
        </div>

        {/* Stock Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${config.progressColor}`}
            style={{ width: `${stockPercentage}%` }}
          ></div>
          {/* Min stock indicator line */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-gray-600 opacity-70"
            style={{ left: `${Math.min((minStock / maxStock) * 100, 100)}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-xs text-gray-600">
          <span>Min: {formatQuantity(minStock)}</span>
          <span>{Math.round(stockPercentage)}%</span>
          <span>Max: {formatQuantity(maxStock)}</span>
        </div>

        {/* Stock Level Indicators */}
        <div className="flex justify-between text-xs">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-gray-600 rounded-full mr-1"></div>
            <span className="text-gray-600">Min Level</span>
          </div>
          <div className="text-center">
            <span className={`font-medium ${config.color}`}>
              {totalStock <= minStock ? 'Below Min' : 
               stockPercentage >= 90 ? 'Near Max' : 'Optimal'}
            </span>
          </div>
        </div>
      </div>

      {/* Location Breakdown */}
      {locations && locations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Stock by Location:</p>
          <div className="space-y-1">
            {locations.map(location => (
              <div key={location.id} className="flex justify-between text-xs">
                <span className="text-gray-600">{location.name}:</span>
                <span className="font-medium">{formatQuantity(location.stock)} {item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Indicator */}
      {enhanced && (status === 'out' || status === 'critical' || status === 'low') && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className={`flex items-center text-xs ${config.color} font-medium`}>
            <SafeIcon icon={FiAlertTriangle} className="mr-1" />
            {status === 'out' ? 'Restock immediately' : 
             status === 'critical' ? 'Restock urgently' : 
             'Consider restocking'}
          </div>
        </div>
      )}
    </motion.div>
  );
}