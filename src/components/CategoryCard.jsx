import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiPackage, FiGrid, FiAlertTriangle, FiCheckCircle } = FiIcons;

export default function CategoryCard({ 
  category, 
  items, 
  onEdit, 
  onDelete, 
  isExpanded, 
  onToggleExpand,
  formatQuantity 
}) {
  const getCategoryStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'border-red-300 bg-red-50';
      case 'warning': return 'border-yellow-300 bg-yellow-50';
      case 'empty': return 'border-gray-300 bg-gray-50';
      default: return 'border-green-300 bg-green-50';
    }
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'out': return 'border-red-300 bg-red-50 text-red-700';
      case 'low': return 'border-yellow-300 bg-yellow-50 text-yellow-700';
      case 'high': return 'border-blue-300 bg-blue-50 text-blue-700';
      default: return 'border-green-300 bg-green-50 text-green-700';
    }
  };

  const getStockIcon = (status) => {
    switch (status) {
      case 'out': return FiAlertTriangle;
      case 'low': return FiAlertTriangle;
      default: return FiCheckCircle;
    }
  };

  const getProgressWidth = () => {
    if (category.totalItems === 0) return '0%';
    return `${(category.healthyItems / category.totalItems) * 100}%`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg shadow-md border ${getCategoryStatusColor(category.categoryStatus)}`}
    >
      <div className="px-5 py-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <SafeIcon icon={FiGrid} className="text-coffee-600 mr-3 text-xl" />
            <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => onEdit(category)}
              className="p-1 text-coffee-600 hover:text-coffee-800 transition-colors"
              aria-label="Edit category"
            >
              <SafeIcon icon={FiIcons.FiEdit2} />
            </button>
            <button 
              onClick={() => onDelete(category.id)}
              className="p-1 text-red-600 hover:text-red-800 transition-colors"
              aria-label="Delete category"
            >
              <SafeIcon icon={FiIcons.FiTrash2} />
            </button>
          </div>
        </div>
        
        {category.description && (
          <p className="mt-1 text-sm text-gray-600">{category.description}</p>
        )}
        
        <div className="mt-3 flex justify-between items-center">
          <div className="flex space-x-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {category.outOfStockItems} out
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {category.lowStockItems} low
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {category.healthyItems} ok
            </span>
          </div>
          
          <button 
            onClick={() => onToggleExpand(category.id)}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <SafeIcon 
              icon={isExpanded ? FiIcons.FiChevronUp : FiIcons.FiChevronDown} 
              className="text-coffee-600" 
            />
          </button>
        </div>
      </div>
      
      <div className="px-5 py-3">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Stock Health</span>
          <span>{category.healthyItems}/{category.totalItems} items healthy</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
          <div 
            className="h-2.5 rounded-full bg-green-500" 
            style={{ width: getProgressWidth() }}
          ></div>
        </div>
        
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 mb-2">Items in this category</h4>
            
            {category.items.length > 0 ? (
              <div className="space-y-2">
                {category.items.map(item => (
                  <div 
                    key={item.id}
                    className={`p-3 rounded-lg border flex justify-between items-center ${getStockStatusColor(item.stockStatus)}`}
                  >
                    <div className="flex items-center">
                      <SafeIcon 
                        icon={getStockIcon(item.stockStatus)} 
                        className={`mr-2 ${item.stockStatus === 'out' ? 'text-red-500' : item.stockStatus === 'low' ? 'text-yellow-500' : 'text-green-500'}`} 
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatQuantity(item.totalStock)} {item.unit}</div>
                      <div className="text-xs">
                        Min: {formatQuantity(item.min_stock)} | Max: {formatQuantity(item.max_stock)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No items in this category yet</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}