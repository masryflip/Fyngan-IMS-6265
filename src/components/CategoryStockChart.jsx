import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiAlertTriangle, FiCheckCircle, FiBarChart2 } = FiIcons;

export default function CategoryStockChart({ category }) {
  if (!category || !category.items || category.items.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <SafeIcon icon={FiBarChart2} className="text-gray-400 text-2xl mb-2 mx-auto" />
        <p className="text-gray-500 text-sm">No items to display</p>
      </div>
    );
  }

  // Calculate percentages
  const total = category.totalItems;
  const outOfStockPercentage = (category.outOfStockItems / total) * 100;
  const lowStockPercentage = (category.lowStockItems / total) * 100;
  const healthyPercentage = (category.healthyItems / total) * 100;

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Stock Health Distribution</h3>
      
      <div className="w-full h-6 rounded-full overflow-hidden flex">
        {outOfStockPercentage > 0 && (
          <div 
            className="bg-red-500 h-full flex items-center justify-center text-white text-xs font-bold" 
            style={{ width: `${outOfStockPercentage}%` }}
          >
            {outOfStockPercentage >= 10 && `${Math.round(outOfStockPercentage)}%`}
          </div>
        )}
        
        {lowStockPercentage > 0 && (
          <div 
            className="bg-yellow-500 h-full flex items-center justify-center text-white text-xs font-bold" 
            style={{ width: `${lowStockPercentage}%` }}
          >
            {lowStockPercentage >= 10 && `${Math.round(lowStockPercentage)}%`}
          </div>
        )}
        
        {healthyPercentage > 0 && (
          <div 
            className="bg-green-500 h-full flex items-center justify-center text-white text-xs font-bold" 
            style={{ width: `${healthyPercentage}%` }}
          >
            {healthyPercentage >= 10 && `${Math.round(healthyPercentage)}%`}
          </div>
        )}
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-xs text-gray-600">Out of Stock ({category.outOfStockItems})</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-xs text-gray-600">Low Stock ({category.lowStockItems})</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-600">Healthy ({category.healthyItems})</span>
        </div>
      </div>
    </div>
  );
}