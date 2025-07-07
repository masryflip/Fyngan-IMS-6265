import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiAlertTriangle, FiCheckCircle, FiXCircle, FiTrendingUp, FiAlertCircle } = FiIcons;

export default function StockLevelIndicator({ 
  currentStock, 
  minStock, 
  maxStock, 
  unit,
  showDetails = false,
  size = 'md' // 'sm', 'md', 'lg'
}) {
  const getStockStatus = () => {
    if (currentStock === 0) return 'out';
    if (currentStock <= minStock) return 'critical';
    
    const stockPercentage = maxStock > 0 ? (currentStock / maxStock) * 100 : 0;
    if (stockPercentage <= 25) return 'low';
    if (stockPercentage >= 90) return 'high';
    return 'good';
  };

  const status = getStockStatus();
  const stockPercentage = maxStock > 0 ? Math.min((currentStock / maxStock) * 100, 100) : 0;

  const statusConfig = {
    out: {
      color: 'text-red-600',
      bg: 'bg-red-500',
      icon: FiXCircle,
      text: 'Out',
      fullText: 'Out of Stock'
    },
    critical: {
      color: 'text-red-600',
      bg: 'bg-red-500',
      icon: FiAlertTriangle,
      text: 'Critical',
      fullText: 'Critical Low'
    },
    low: {
      color: 'text-yellow-600',
      bg: 'bg-yellow-500',
      icon: FiAlertCircle,
      text: 'Low',
      fullText: 'Low Stock'
    },
    high: {
      color: 'text-blue-600',
      bg: 'bg-blue-500',
      icon: FiTrendingUp,
      text: 'High',
      fullText: 'High Stock'
    },
    good: {
      color: 'text-green-600',
      bg: 'bg-green-500',
      icon: FiCheckCircle,
      text: 'Good',
      fullText: 'Good Stock'
    }
  };

  const config = statusConfig[status];

  const sizeClasses = {
    sm: {
      height: 'h-2',
      icon: 'text-xs',
      text: 'text-xs',
      badge: 'px-2 py-0.5'
    },
    md: {
      height: 'h-3',
      icon: 'text-sm',
      text: 'text-sm',
      badge: 'px-3 py-1'
    },
    lg: {
      height: 'h-4',
      icon: 'text-base',
      text: 'text-base',
      badge: 'px-4 py-2'
    }
  };

  const sizeClass = sizeClasses[size];

  return (
    <div className="space-y-2">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center space-x-1 ${config.color}`}>
          <SafeIcon icon={config.icon} className={sizeClass.icon} />
          <span className={`font-medium ${sizeClass.text}`}>
            {showDetails ? config.fullText : config.text}
          </span>
        </div>
        {showDetails && (
          <span className={`${sizeClass.text} font-bold ${config.color}`}>
            {currentStock} {unit}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClass.height} relative overflow-hidden`}>
        <div 
          className={`${sizeClass.height} rounded-full transition-all duration-300 ${config.bg}`}
          style={{ width: `${stockPercentage}%` }}
        ></div>
        {/* Min stock indicator line */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-gray-600 opacity-70"
          style={{ left: `${Math.min((minStock / maxStock) * 100, 100)}%` }}
        ></div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="flex justify-between text-xs text-gray-600">
          <span>Min: {minStock}</span>
          <span>{Math.round(stockPercentage)}%</span>
          <span>Max: {maxStock}</span>
        </div>
      )}
    </div>
  );
}