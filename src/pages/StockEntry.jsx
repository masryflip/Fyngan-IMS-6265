import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '../context/InventoryContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiSave, FiPackage, FiMapPin, FiInfo, FiRefreshCw } = FiIcons;

export default function StockEntry() {
  const { items, locations, stockLevels, isLoading, updateStockLevel, formatQuantity } = useInventory();
  const [selectedLocation, setSelectedLocation] = useState('');
  const [stockUpdates, setStockUpdates] = useState({});
  const [saving, setSaving] = useState(false);

  const handleStockChange = (itemId, value) => {
    // Allow empty string for clearing input
    if (value === '') {
      setStockUpdates(prev => ({
        ...prev,
        [itemId]: ''
      }));
      return;
    }

    // Parse as float to support decimals
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setStockUpdates(prev => ({
        ...prev,
        [itemId]: numValue
      }));
    }
  };

  const handleSave = async () => {
    if (!selectedLocation) {
      alert('Please select a location first');
      return;
    }

    const validUpdates = Object.entries(stockUpdates).filter(([_, quantity]) => 
      quantity !== '' && !isNaN(quantity) && parseFloat(quantity) >= 0
    );

    if (validUpdates.length === 0) {
      alert('Please enter valid stock quantities');
      return;
    }

    setSaving(true);
    
    try {
      // Update all stock levels
      await Promise.all(
        validUpdates.map(([itemId, quantity]) => 
          updateStockLevel(itemId, selectedLocation, parseFloat(quantity))
        )
      );

      setStockUpdates({});
      alert('Stock levels updated successfully!');
    } catch (error) {
      console.error('Error updating stock levels:', error);
      alert('Error updating stock levels. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getCurrentStock = (itemId, locationId) => {
    const stock = stockLevels.find(s => s.item_id === itemId && s.location_id === locationId);
    return stock ? parseFloat(stock.quantity) : 0;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <SafeIcon icon={FiRefreshCw} className="animate-spin text-4xl text-coffee-600 mb-4" />
            <p className="text-gray-600">Loading stock entry...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Entry</h1>
        <p className="text-gray-600">Update daily stock levels for your inventory</p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <SafeIcon icon={FiInfo} className="text-blue-600 text-lg mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Decimal Support</h3>
            <p className="text-sm text-blue-700">
              You can enter decimal values (e.g., 15.5 kg, 2.75 liters) for precise stock tracking.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-4">
            <SafeIcon icon={FiMapPin} className="text-coffee-600 text-xl" />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
              >
                <option value="">Choose a location...</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {selectedLocation && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Update Stock for {locations.find(l => l.id === selectedLocation)?.name}
              </h2>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 bg-coffee-600 text-white px-4 py-2 rounded-md hover:bg-coffee-700 transition-colors disabled:opacity-50"
              >
                <SafeIcon icon={FiSave} />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>

            <div className="space-y-4">
              {items.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={FiPackage} className="text-coffee-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        Current: {formatQuantity(getCurrentStock(item.id, selectedLocation))} {item.unit}
                      </p>
                      <p className="text-xs text-gray-400">
                        Min: {formatQuantity(item.min_stock)} | Max: {formatQuantity(item.max_stock)} {item.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="New quantity"
                      value={stockUpdates[item.id] || ''}
                      onChange={(e) => handleStockChange(item.id, e.target.value)}
                      className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
                    />
                    <span className="text-sm text-gray-500 min-w-[3rem]">{item.unit}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}