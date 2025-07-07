import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '../context/InventoryContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const {
  FiMapPin, FiPackage, FiGrid, FiCheckSquare, FiSquare, FiRefreshCw,
  FiFilter, FiTarget, FiCopy, FiTrash2, FiPlus
} = FiIcons;

export default function LocationItemAssignment() {
  const {
    items, locations, categories, stockLevels, isLoading,
    updateStockLevel
  } = useInventory();

  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bulkAssignments, setBulkAssignments] = useState({});
  const [saving, setSaving] = useState(false);

  // Get items assigned to a specific location
  const getLocationItems = (locationId) => {
    return items.filter(item => 
      stockLevels.some(stock => 
        stock.item_id === item.id && stock.location_id === locationId
      )
    );
  };

  // Get all available items not yet assigned to the selected location
  const getUnassignedItems = () => {
    if (!selectedLocation) return [];
    
    return items.filter(item => 
      !stockLevels.some(stock => 
        stock.item_id === item.id && stock.location_id === selectedLocation
      )
    );
  };

  // Analysis data for the selected location
  const locationAnalysis = useMemo(() => {
    if (!selectedLocation) return null;

    const location = locations.find(loc => loc.id === selectedLocation);
    const assignedItems = getLocationItems(selectedLocation);
    const unassignedItems = getUnassignedItems();

    const itemsByCategory = categories.map(category => {
      const categoryAssigned = assignedItems.filter(item => item.category_id === category.id);
      const categoryUnassigned = unassignedItems.filter(item => item.category_id === category.id);
      
      return {
        ...category,
        assignedItems: categoryAssigned,
        unassignedItems: categoryUnassigned,
        assignedCount: categoryAssigned.length,
        unassignedCount: categoryUnassigned.length,
        totalCategoryItems: categoryAssigned.length + categoryUnassigned.length
      };
    }).filter(category => category.totalCategoryItems > 0);

    return {
      location,
      assignedItems,
      unassignedItems,
      itemsByCategory,
      totalAssigned: assignedItems.length,
      totalUnassigned: unassignedItems.length,
      totalItems: items.length
    };
  }, [selectedLocation, items, locations, categories, stockLevels]);

  const handleBulkToggle = (itemId) => {
    setBulkAssignments(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleCategoryToggle = (category) => {
    const allSelected = category.unassignedItems.every(item => bulkAssignments[item.id]);
    
    const newAssignments = { ...bulkAssignments };
    category.unassignedItems.forEach(item => {
      newAssignments[item.id] = !allSelected;
    });
    
    setBulkAssignments(newAssignments);
  };

  const handleSaveBulkAssignments = async () => {
    const itemsToAssign = Object.entries(bulkAssignments)
      .filter(([_, isSelected]) => isSelected)
      .map(([itemId, _]) => itemId);

    if (itemsToAssign.length === 0) {
      alert('Please select items to assign');
      return;
    }

    setSaving(true);
    try {
      // Initialize stock levels for newly assigned items
      await Promise.all(
        itemsToAssign.map(itemId =>
          updateStockLevel(itemId, selectedLocation, 0)
        )
      );

      setBulkAssignments({});
      alert(`Successfully assigned ${itemsToAssign.length} items to ${locationAnalysis.location.name}`);
    } catch (error) {
      console.error('Error assigning items:', error);
      alert('Error assigning items. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const copyFromLocation = async (sourceLocationId) => {
    if (!window.confirm('This will copy all item assignments from the selected location. Continue?')) {
      return;
    }

    setSaving(true);
    try {
      const sourceItems = getLocationItems(sourceLocationId);
      const itemsToAdd = sourceItems.filter(item => 
        !stockLevels.some(stock => 
          stock.item_id === item.id && stock.location_id === selectedLocation
        )
      );

      if (itemsToAdd.length === 0) {
        alert('No new items to copy - all items are already assigned');
        return;
      }

      await Promise.all(
        itemsToAdd.map(item =>
          updateStockLevel(item.id, selectedLocation, 0)
        )
      );

      alert(`Successfully copied ${itemsToAdd.length} items from the selected location`);
    } catch (error) {
      console.error('Error copying items:', error);
      alert('Error copying items. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = selectedCategory === 'all' 
    ? locationAnalysis?.itemsByCategory || []
    : locationAnalysis?.itemsByCategory.filter(cat => cat.id === selectedCategory) || [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <SafeIcon icon={FiRefreshCw} className="animate-spin text-4xl text-coffee-600 mb-4" />
            <p className="text-gray-600">Loading location assignments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Location Item Assignment</h1>
        <p className="text-gray-600">Manage which items are available at each location for streamlined inventory control</p>
      </div>

      {/* Location Selector */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <SafeIcon icon={FiMapPin} className="text-coffee-600 text-xl" />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Location to Manage
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setBulkAssignments({});
                }}
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

          {selectedLocation && locationAnalysis && (
            <div className="ml-6 text-right">
              <div className="text-2xl font-bold text-gray-900">
                {locationAnalysis.totalAssigned}/{locationAnalysis.totalItems}
              </div>
              <div className="text-sm text-gray-600">Items Assigned</div>
            </div>
          )}
        </div>
      </div>

      {locationAnalysis && (
        <>
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex items-center space-x-4">
              <select
                onChange={(e) => e.target.value && copyFromLocation(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
                disabled={saving}
              >
                <option value="">Copy items from another location...</option>
                {locations
                  .filter(loc => loc.id !== selectedLocation)
                  .map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({getLocationItems(location.id).length} items)
                    </option>
                  ))}
              </select>

              {Object.values(bulkAssignments).some(selected => selected) && (
                <button
                  onClick={handleSaveBulkAssignments}
                  disabled={saving}
                  className="flex items-center space-x-2 bg-coffee-600 text-white px-4 py-2 rounded-md hover:bg-coffee-700 transition-colors disabled:opacity-50"
                >
                  <SafeIcon icon={FiPlus} />
                  <span>
                    {saving ? 'Assigning...' : `Assign ${Object.values(bulkAssignments).filter(Boolean).length} Items`}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Assigned Items</p>
                  <p className="text-2xl font-bold text-green-600">{locationAnalysis.totalAssigned}</p>
                </div>
                <SafeIcon icon={FiCheckSquare} className="text-green-600 text-2xl" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Unassigned Items</p>
                  <p className="text-2xl font-bold text-yellow-600">{locationAnalysis.totalUnassigned}</p>
                </div>
                <SafeIcon icon={FiSquare} className="text-yellow-600 text-2xl" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Coverage</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round((locationAnalysis.totalAssigned / locationAnalysis.totalItems) * 100)}%
                  </p>
                </div>
                <SafeIcon icon={FiTarget} className="text-blue-600 text-2xl" />
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center space-x-4">
              <SafeIcon icon={FiFilter} className="text-coffee-600" />
              <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category-wise Assignment */}
          <div className="space-y-6">
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <SafeIcon icon={FiGrid} className="text-coffee-600 text-xl" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-600">
                          {category.assignedCount} assigned, {category.unassignedCount} available to assign
                        </p>
                      </div>
                    </div>
                    
                    {category.unassignedCount > 0 && (
                      <button
                        onClick={() => handleCategoryToggle(category)}
                        className="flex items-center space-x-2 px-3 py-2 bg-coffee-100 text-coffee-700 rounded-md hover:bg-coffee-200 transition-colors"
                      >
                        <SafeIcon 
                          icon={category.unassignedItems.every(item => bulkAssignments[item.id]) ? FiCheckSquare : FiSquare} 
                        />
                        <span>Toggle All</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {/* Already Assigned Items */}
                  {category.assignedItems.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-green-700 mb-3 flex items-center">
                        <SafeIcon icon={FiCheckSquare} className="mr-2" />
                        Already Assigned ({category.assignedItems.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {category.assignedItems.map(item => (
                          <div key={item.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <SafeIcon icon={FiPackage} className="text-green-600" />
                              <div>
                                <div className="font-medium text-gray-900">{item.name}</div>
                                <div className="text-xs text-gray-500">{item.unit}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available to Assign */}
                  {category.unassignedItems.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <SafeIcon icon={FiSquare} className="mr-2" />
                        Available to Assign ({category.unassignedItems.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {category.unassignedItems.map(item => (
                          <div 
                            key={item.id} 
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              bulkAssignments[item.id] 
                                ? 'bg-coffee-50 border-coffee-300' 
                                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleBulkToggle(item.id)}
                          >
                            <div className="flex items-center space-x-3">
                              <SafeIcon 
                                icon={bulkAssignments[item.id] ? FiCheckSquare : FiSquare} 
                                className={bulkAssignments[item.id] ? 'text-coffee-600' : 'text-gray-400'} 
                              />
                              <SafeIcon icon={FiPackage} className="text-gray-600" />
                              <div>
                                <div className="font-medium text-gray-900">{item.name}</div>
                                <div className="text-xs text-gray-500">{item.unit}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {category.unassignedItems.length === 0 && category.assignedItems.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No items in this category</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {locationAnalysis.totalUnassigned === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <SafeIcon icon={FiCheckSquare} className="text-green-600 text-4xl mb-4 mx-auto" />
              <h3 className="text-lg font-medium text-green-800 mb-2">All Items Assigned!</h3>
              <p className="text-green-700">
                All available items have been assigned to {locationAnalysis.location.name}.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}