import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '../context/InventoryContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const {
  FiSave, FiPackage, FiMapPin, FiInfo, FiRefreshCw, FiGrid, FiChevronDown,
  FiChevronUp, FiAlertTriangle, FiCheckCircle, FiAlertCircle, FiFilter
} = FiIcons;

export default function StockEntry() {
  const {
    items, categories, locations, stockLevels, isLoading,
    updateStockLevel, formatQuantity
  } = useInventory();

  const [selectedLocation, setSelectedLocation] = useState('');
  const [stockUpdates, setStockUpdates] = useState({});
  const [saving, setSaving] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // Function to get current stock for an item at a location
  const getCurrentStock = (itemId, locationId) => {
    const stock = stockLevels.find(
      s => s.item_id === itemId && s.location_id === locationId
    );
    return stock ? parseFloat(stock.quantity) : 0;
  };

  // Get items that are assigned to the selected location
  const getLocationItems = (locationId) => {
    if (!locationId) return [];
    
    return items.filter(item => {
      // Check if this item has stock record at this location
      return stockLevels.some(stock => 
        stock.item_id === item.id && stock.location_id === locationId
      );
    });
  };

  // Group items by category with enhanced data
  const categorizedItems = useMemo(() => {
    if (!selectedLocation || !items.length || !categories.length) {
      return [];
    }

    console.log("Generating categorized items with:", {
      itemsCount: items.length,
      categoriesCount: categories.length,
      selectedLocation
    });

    const locationItems = getLocationItems(selectedLocation);
    
    if (locationItems.length === 0) {
      return [];
    }

    const grouped = {};

    categories.forEach(category => {
      const categoryItems = locationItems
        .filter(item => item.category_id === category.id)
        .map(item => {
          const currentStock = getCurrentStock(item.id, selectedLocation);
          const stockPercentage = item.max_stock > 0 ? (currentStock / item.max_stock) * 100 : 0;

          let stockStatus = 'good';
          if (currentStock === 0) stockStatus = 'out';
          else if (currentStock <= item.min_stock) stockStatus = 'critical';
          else if (stockPercentage <= 25) stockStatus = 'low';
          else if (stockPercentage >= 90) stockStatus = 'high';

          return {
            ...item,
            currentStock,
            stockStatus,
            stockPercentage
          };
        })
        .sort((a, b) => {
          // Sort by urgency within category
          const urgencyOrder = { 'out': 0, 'critical': 1, 'low': 2, 'good': 3, 'high': 4 };
          return urgencyOrder[a.stockStatus] - urgencyOrder[b.stockStatus];
        });

      if (categoryItems.length > 0) {
        // Calculate category stats
        const outOfStock = categoryItems.filter(item => item.stockStatus === 'out').length;
        const critical = categoryItems.filter(item => item.stockStatus === 'critical').length;
        const low = categoryItems.filter(item => item.stockStatus === 'low').length;
        const needsAttention = outOfStock + critical + low;

        grouped[category.id] = {
          ...category,
          items: categoryItems,
          totalItems: categoryItems.length,
          needsAttention,
          outOfStock,
          critical,
          low
        };
      }
    });

    // Sort categories by urgency (most problems first)
    return Object.values(grouped).sort((a, b) => b.needsAttention - a.needsAttention);
  }, [items, categories, selectedLocation, stockLevels]);

  const handleStockChange = (itemId, value) => {
    // Allow empty string for clearing input
    if (value === '') {
      setStockUpdates(prev => ({ ...prev, [itemId]: '' }));
      return;
    }

    // Parse as float to support decimals
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setStockUpdates(prev => ({ ...prev, [itemId]: numValue }));
    }
  };

  const handleSave = async () => {
    if (!selectedLocation) {
      alert('Please select a location first');
      return;
    }

    const validUpdates = Object.entries(stockUpdates).filter(
      ([_, quantity]) => quantity !== '' && !isNaN(quantity) && parseFloat(quantity) >= 0
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

  const toggleCategory = (categoryId) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const getStockStatusIcon = (status) => {
    switch (status) {
      case 'out': return FiAlertTriangle;
      case 'critical': return FiAlertTriangle;
      case 'low': return FiAlertCircle;
      default: return FiCheckCircle;
    }
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'out': return 'text-red-600';
      case 'critical': return 'text-red-600';
      case 'low': return 'text-yellow-600';
      case 'high': return 'text-blue-600';
      default: return 'text-green-600';
    }
  };

  const getCategoryHeaderColor = (category) => {
    if (category.outOfStock > 0) return 'bg-red-100 border-red-300 text-red-800';
    if (category.critical > 0) return 'bg-orange-100 border-orange-300 text-orange-800';
    if (category.low > 0) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    return 'bg-green-100 border-green-300 text-green-800';
  };

  const selectedLocationData = locations.find(loc => loc.id === selectedLocation);
  const locationItems = selectedLocation ? getLocationItems(selectedLocation) : [];

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
        <p className="text-gray-600">Update stock levels organized by category for easy management</p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <SafeIcon icon={FiInfo} className="text-blue-600 text-lg mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Location-Specific Inventory</h3>
            <p className="text-sm text-blue-700">
              Only items assigned to the selected location will appear. Items are grouped by category with priority sorting. 
              Critical items appear first within each category. You can enter decimal values (e.g., 15.5 kg, 2.75 liters) for precise stock tracking.
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
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Update Stock for {selectedLocationData?.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {locationItems.length} item{locationItems.length !== 1 ? 's' : ''} assigned to this location
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 bg-coffee-600 text-white px-4 py-2 rounded-md hover:bg-coffee-700 transition-colors disabled:opacity-50"
              >
                <SafeIcon icon={FiSave} />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>

            {locationItems.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <SafeIcon icon={FiAlertCircle} className="text-yellow-600 text-4xl mb-4 mx-auto" />
                <h3 className="text-lg font-medium text-yellow-800 mb-2">No Items Assigned</h3>
                <p className="text-yellow-700 mb-4">
                  No items have been assigned to this location yet. Items need to be assigned to locations before you can manage their stock.
                </p>
                <div className="flex justify-center space-x-4">
                  <a
                    href="#/items"
                    className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    <SafeIcon icon={FiPackage} className="mr-2" />
                    Manage Item Assignments
                  </a>
                </div>
                <div className="mt-4 p-4 bg-yellow-100 rounded-lg text-left max-w-md mx-auto">
                  <h4 className="font-medium text-yellow-900 mb-2">How to assign items to locations:</h4>
                  <ol className="text-sm text-yellow-800 space-y-1">
                    <li>1. Go to <strong>Items</strong> page</li>
                    <li>2. Click the <strong>location icon</strong> next to any item</li>
                    <li>3. Select which locations should carry that item</li>
                    <li>4. Save the assignments</li>
                    <li>5. Return here to manage stock levels</li>
                  </ol>
                </div>
              </div>
            ) : (
              <>
                {/* Category Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Category Overview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span>Critical: {categorizedItems.reduce((sum, cat) => sum + cat.outOfStock + cat.critical, 0)}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      <span>Low: {categorizedItems.reduce((sum, cat) => sum + cat.low, 0)}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span>Categories: {categorizedItems.length}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span>Total Items: {categorizedItems.reduce((sum, cat) => sum + cat.totalItems, 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Categorized Items */}
                <div className="space-y-6">
                  {categorizedItems.length > 0 ? (
                    categorizedItems.map((category, categoryIndex) => (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: categoryIndex * 0.1 }}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        {/* Category Header */}
                        <div
                          className={`p-4 cursor-pointer ${getCategoryHeaderColor(category)} border-b`}
                          onClick={() => toggleCategory(category.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <SafeIcon icon={FiGrid} className="text-lg" />
                              <div>
                                <h3 className="font-semibold text-lg">{category.name}</h3>
                                <p className="text-sm opacity-80">
                                  {category.totalItems} items • {' '}
                                  {category.needsAttention > 0 && (
                                    <span className="font-medium">
                                      {category.needsAttention} need attention
                                    </span>
                                  )}
                                  {category.needsAttention === 0 && <span>All items OK</span>}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              {/* Alert badges */}
                              {category.outOfStock > 0 && (
                                <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                                  {category.outOfStock} OUT
                                </span>
                              )}
                              {category.critical > 0 && (
                                <span className="px-2 py-1 bg-orange-600 text-white text-xs font-bold rounded-full">
                                  {category.critical} CRITICAL
                                </span>
                              )}
                              {category.low > 0 && (
                                <span className="px-2 py-1 bg-yellow-600 text-white text-xs font-bold rounded-full">
                                  {category.low} LOW
                                </span>
                              )}
                              <SafeIcon
                                icon={collapsedCategories[category.id] ? FiChevronDown : FiChevronUp}
                                className="text-xl"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Category Items */}
                        {!collapsedCategories[category.id] && (
                          <div className="p-4 bg-white">
                            <div className="space-y-3">
                              {category.items.map((item, itemIndex) => (
                                <motion.div
                                  key={item.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: (categoryIndex * 0.1) + (itemIndex * 0.05) }}
                                  className={`flex items-center justify-between p-4 border rounded-lg transition-all hover:shadow-md ${
                                    item.stockStatus === 'out' ? 'border-red-200 bg-red-50' :
                                    item.stockStatus === 'critical' ? 'border-orange-200 bg-orange-50' :
                                    item.stockStatus === 'low' ? 'border-yellow-200 bg-yellow-50' :
                                    'border-gray-200 bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center space-x-4 flex-1">
                                    <SafeIcon
                                      icon={getStockStatusIcon(item.stockStatus)}
                                      className={`text-lg ${getStockStatusColor(item.stockStatus)}`}
                                    />
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                        <span>
                                          Current: <span className="font-medium">{formatQuantity(item.currentStock)} {item.unit}</span>
                                        </span>
                                        <span>
                                          Min: {formatQuantity(item.min_stock)} | Max: {formatQuantity(item.max_stock)} {item.unit}
                                        </span>
                                        {item.stockStatus !== 'good' && item.stockStatus !== 'high' && (
                                          <span className={`font-medium ${getStockStatusColor(item.stockStatus)}`}>
                                            {item.stockStatus === 'out' ? 'OUT OF STOCK' :
                                             item.stockStatus === 'critical' ? 'CRITICAL' : 'LOW STOCK'}
                                          </span>
                                        )}
                                      </div>
                                      {/* Visual stock bar */}
                                      <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
                                        <div
                                          className={`h-2 rounded-full transition-all ${
                                            item.stockStatus === 'out' ? 'bg-red-500' :
                                            item.stockStatus === 'critical' ? 'bg-orange-500' :
                                            item.stockStatus === 'low' ? 'bg-yellow-500' :
                                            item.stockStatus === 'high' ? 'bg-blue-500' : 'bg-green-500'
                                          }`}
                                          style={{ width: `${Math.min(item.stockPercentage, 100)}%` }}
                                        ></div>
                                      </div>
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
                                      className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500 text-center font-medium"
                                    />
                                    <span className="text-sm text-gray-500 min-w-[3rem]">{item.unit}</span>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                      <SafeIcon icon={FiAlertCircle} className="text-yellow-600 text-4xl mb-4 mx-auto" />
                      <h3 className="text-lg font-medium text-yellow-800 mb-2">No Categorized Items</h3>
                      <p className="text-yellow-700 mb-4">
                        Items are assigned to this location but may not have proper categories assigned.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}