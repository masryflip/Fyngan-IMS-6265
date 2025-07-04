import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiAlertTriangle, FiCheckCircle, FiXCircle } = FiIcons;

export default function StockCard({ item, totalStock, minStock, maxStock, locations, formatQuantity }) {
  const getStockStatus = () => {
    if (totalStock === 0) return 'out';
    if (totalStock <= minStock) return 'low';
    if (totalStock >= maxStock) return 'high';
    return 'good';
  };

  const status = getStockStatus();
  const statusConfig = {
    out: { color: 'text-red-600', bg: 'bg-red-50', icon: FiXCircle, text: 'Out of Stock' },
    low: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: FiAlertTriangle, text: 'Low Stock' },
    high: { color: 'text-blue-600', bg: 'bg-blue-50', icon: FiAlertTriangle, text: 'High Stock' },
    good: { color: 'text-green-600', bg: 'bg-green-50', icon: FiCheckCircle, text: 'Good Stock' }
  };

  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg border-2 ${config.bg} ${
        status === 'out' ? 'border-red-200' : 
        status === 'low' ? 'border-yellow-200' : 
        status === 'high' ? 'border-blue-200' : 
        'border-green-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{item.name}</h3>
        <div className={`flex items-center space-x-1 ${config.color}`}>
          <SafeIcon icon={config.icon} className="text-sm" />
          <span className="text-sm font-medium">{config.text}</span>
        </div>
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Current Stock:</span>
          <span className="font-medium">{formatQuantity(totalStock)} {item.unit}</span>
        </div>
        <div className="flex justify-between">
          <span>Min Stock:</span>
          <span>{formatQuantity(minStock)} {item.unit}</span>
        </div>
        <div className="flex justify-between">
          <span>Max Stock:</span>
          <span>{formatQuantity(maxStock)} {item.unit}</span>
        </div>
      </div>

      {locations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Stock by Location:</p>
          <div className="space-y-1">
            {locations.map(location => (
              <div key={location.id} className="flex justify-between text-xs">
                <span>{location.name}:</span>
                <span>{formatQuantity(location.stock)} {item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}