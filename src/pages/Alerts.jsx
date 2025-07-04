import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '../context/InventoryContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiAlertTriangle, FiXCircle, FiPackage } = FiIcons;

export default function Alerts() {
  const { getStockAlerts, items, locations, stockLevels, formatQuantity } = useInventory();

  const alerts = useMemo(() => {
    return getStockAlerts();
  }, [getStockAlerts]);

  const getItemDetails = (itemName) => {
    const item = items.find(i => i.name === itemName);
    if (!item) return null;

    const locationStocks = locations.map(location => {
      const stock = stockLevels.find(s => s.itemId === item.id && s.locationId === location.id);
      return {
        locationName: location.name,
        stock: stock ? stock.quantity : 0
      };
    }).filter(loc => loc.stock > 0);

    return {
      item,
      locationStocks
    };
  };

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  const warningAlerts = alerts.filter(alert => alert.severity === 'warning');

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Alerts</h1>
        <p className="text-gray-600">Monitor your inventory levels and stock alerts</p>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <SafeIcon icon={FiPackage} className="text-gray-400 text-4xl mb-4 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h3>
          <p className="text-gray-500">All your inventory items are within healthy stock levels.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Critical Alerts */}
          {criticalAlerts.length > 0 && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-4 bg-red-50 border-b border-red-200">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiXCircle} className="text-red-600" />
                  <h2 className="text-lg font-semibold text-red-800">Critical Alerts</h2>
                  <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs">
                    {criticalAlerts.length}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {criticalAlerts.map((alert, index) => {
                  const details = getItemDetails(alert.itemName);
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <SafeIcon icon={FiXCircle} className="text-red-600 text-xl" />
                        <div>
                          <h3 className="font-medium text-red-900">{alert.itemName}</h3>
                          <p className="text-sm text-red-700">
                            Out of stock - Minimum required: {formatQuantity(alert.minStock)} {details?.item?.unit}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-900">
                          Current: {formatQuantity(alert.currentStock)} {details?.item?.unit}
                        </p>
                        <p className="text-xs text-red-700">Immediate action required</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Warning Alerts */}
          {warningAlerts.length > 0 && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-4 bg-yellow-50 border-b border-yellow-200">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiAlertTriangle} className="text-yellow-600" />
                  <h2 className="text-lg font-semibold text-yellow-800">Low Stock Warnings</h2>
                  <span className="bg-yellow-600 text-white px-2 py-1 rounded-full text-xs">
                    {warningAlerts.length}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {warningAlerts.map((alert, index) => {
                  const details = getItemDetails(alert.itemName);
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <SafeIcon icon={FiAlertTriangle} className="text-yellow-600 text-xl" />
                        <div>
                          <h3 className="font-medium text-yellow-900">{alert.itemName}</h3>
                          <p className="text-sm text-yellow-700">
                            Low stock - Minimum required: {formatQuantity(alert.minStock)} {details?.item?.unit}
                          </p>
                          {details?.locationStocks && details.locationStocks.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-yellow-600">Stock by location:</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {details.locationStocks.map(loc => (
                                  <span key={loc.locationName} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                    {loc.locationName}: {formatQuantity(loc.stock)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-yellow-900">
                          Current: {formatQuantity(alert.currentStock)} {details?.item?.unit}
                        </p>
                        <p className="text-xs text-yellow-700">Restock recommended</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}