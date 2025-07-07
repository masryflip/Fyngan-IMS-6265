import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '../context/InventoryContext';
import Modal from '../components/Modal';
import StockLevelIndicator from '../components/StockLevelIndicator';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const {
  FiPlus, FiEdit2, FiTrash2, FiPackage, FiRefreshCw, FiMapPin, FiGrid,
  FiCheckSquare, FiSquare, FiSettings, FiCopy, FiTarget
} = FiIcons;

// Common units for coffee shop inventory
const UNIT_OPTIONS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'liter', label: 'Liter (L)' },
  { value: 'ml', label: 'Milliliter (ml)' },
  { value: 'piece', label: 'Piece' },
  { value: 'pack', label: 'Pack' },
  { value: 'box', label: 'Box' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'bag', label: 'Bag' },
  { value: 'can', label: 'Can' },
  { value: 'cup', label: 'Cup' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'lb', label: 'Pound (lb)' },
  { value: 'oz', label: 'Ounce (oz)' },
  { value: 'gallon', label: 'Gallon' },
  { value: 'pint', label: 'Pint' },
  { value: 'roll', label: 'Roll' },
  { value: 'sheet', label: 'Sheet' },
  { value: 'tray', label: 'Tray' },
  { value: 'case', label: 'Case' }
];

export default function Items() {
  const {
    items, categories, suppliers, locations, stockLevels, isLoading,
    addItem, updateItem, deleteItem, getTotalStock, formatQuantity, updateStockLevel
  } = useInventory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItemForLocations, setSelectedItemForLocations] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    supplier_id: '',
    unit: '',
    min_stock: '',
    max_stock: '',
    assigned_locations: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'by-location'
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('all');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const itemData = {
        ...formData,
        min_stock: parseFloat(formData.min_stock),
        max_stock: parseFloat(formData.max_stock)
      };

      let savedItem;
      if (editingItem) {
        savedItem = await updateItem(editingItem.id, itemData);
      } else {
        savedItem = await addItem(itemData);
      }

      // Initialize stock levels for assigned locations
      if (formData.assigned_locations.length > 0) {
        await Promise.all(
          formData.assigned_locations.map(locationId =>
            updateStockLevel(savedItem.id, locationId, 0)
          )
        );
      }

      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({
        name: '',
        category_id: '',
        supplier_id: '',
        unit: '',
        min_stock: '',
        max_stock: '',
        assigned_locations: []
      });
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    
    // Get locations where this item has stock
    const assignedLocations = stockLevels
      .filter(stock => stock.item_id === item.id)
      .map(stock => stock.location_id);

    setFormData({
      name: item.name,
      category_id: item.category_id,
      supplier_id: item.supplier_id,
      unit: item.unit,
      min_stock: item.min_stock.toString(),
      max_stock: item.max_stock.toString(),
      assigned_locations: assignedLocations
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(id);
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please try again.');
      }
    }
  };

  const handleLocationAssignment = (item) => {
    setSelectedItemForLocations(item);
    const assignedLocations = stockLevels
      .filter(stock => stock.item_id === item.id)
      .map(stock => stock.location_id);
    
    setFormData(prev => ({
      ...prev,
      assigned_locations: assignedLocations
    }));
    setIsLocationModalOpen(true);
  };

  const handleLocationToggle = (locationId) => {
    setFormData(prev => ({
      ...prev,
      assigned_locations: prev.assigned_locations.includes(locationId)
        ? prev.assigned_locations.filter(id => id !== locationId)
        : [...prev.assigned_locations, locationId]
    }));
  };

  const saveLocationAssignments = async () => {
    if (!selectedItemForLocations) return;

    setSubmitting(true);
    try {
      const currentAssignments = stockLevels
        .filter(stock => stock.item_id === selectedItemForLocations.id)
        .map(stock => stock.location_id);

      // Add new locations (initialize with 0 stock)
      const newLocations = formData.assigned_locations.filter(
        locationId => !currentAssignments.includes(locationId)
      );

      // Remove unassigned locations would require deleting stock records
      // For safety, we'll keep the stock data but user can manually clear it

      // Initialize stock for new locations
      await Promise.all(
        newLocations.map(locationId =>
          updateStockLevel(selectedItemForLocations.id, locationId, 0)
        )
      );

      setIsLocationModalOpen(false);
      setSelectedItemForLocations(null);
      alert('Location assignments updated successfully!');
    } catch (error) {
      console.error('Error updating location assignments:', error);
      alert('Error updating assignments. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Unknown';
  };

  const getUnitLabel = (unitValue) => {
    const unit = UNIT_OPTIONS.find(u => u.value === unitValue);
    return unit ? unit.label : unitValue;
  };

  const getItemLocations = (itemId) => {
    const itemStocks = stockLevels.filter(stock => stock.item_id === itemId);
    return itemStocks.map(stock => {
      const location = locations.find(loc => loc.id === stock.location_id);
      return {
        ...location,
        stock: parseFloat(stock.quantity || 0)
      };
    });
  };

  // Enhanced items with stock data and location info
  const itemsWithStock = items.map(item => {
    const itemLocations = getItemLocations(item.id);
    const totalStock = getTotalStock(item.id);
    
    return {
      ...item,
      currentStock: totalStock,
      assignedLocations: itemLocations,
      locationCount: itemLocations.length
    };
  }).sort((a, b) => {
    // Sort by stock status (critical first)
    const aStatus = a.currentStock === 0 ? 0 : a.currentStock <= a.min_stock ? 1 : 2;
    const bStatus = b.currentStock === 0 ? 0 : b.currentStock <= b.min_stock ? 1 : 2;
    return aStatus - bStatus;
  });

  // Filter items by location
  const filteredItems = selectedLocationFilter === 'all' 
    ? itemsWithStock 
    : itemsWithStock.filter(item => 
        item.assignedLocations.some(loc => loc.id === selectedLocationFilter)
      );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <SafeIcon icon={FiRefreshCw} className="animate-spin text-4xl text-coffee-600 mb-4" />
            <p className="text-gray-600">Loading items...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Items</h1>
          <p className="text-gray-600">Manage your inventory items with location assignments and real-time stock levels</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-coffee-600 text-white px-4 py-2 rounded-md hover:bg-coffee-700 transition-colors"
        >
          <SafeIcon icon={FiPlus} />
          <span>Add Item</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Location
              </label>
              <select
                value={selectedLocationFilter}
                onChange={(e) => setSelectedLocationFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
              >
                <option value="all">All Locations</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredItems.length} of {itemsWithStock.length} items
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center">
            <SafeIcon icon={FiPackage} className="text-gray-400 text-4xl mb-4 mx-auto" />
            <p className="text-gray-500">
              {selectedLocationFilter === 'all' 
                ? 'No items found. Add your first item to get started.'
                : 'No items assigned to this location.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Locations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min/Max Levels
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <SafeIcon icon={FiPackage} className="text-coffee-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">{getUnitLabel(item.unit)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getCategoryName(item.category_id)}</div>
                      <div className="text-xs text-gray-500">{getSupplierName(item.supplier_id)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.assignedLocations.length === 0 ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            No locations
                          </span>
                        ) : (
                          item.assignedLocations.map(location => (
                            <span
                              key={location.id}
                              className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
                            >
                              {location.name}
                              {location.stock > 0 && (
                                <span className="ml-1 font-bold">
                                  ({formatQuantity(location.stock)})
                                </span>
                              )}
                            </span>
                          ))
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.locationCount} location{item.locationCount !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-32">
                        <StockLevelIndicator
                          currentStock={item.currentStock}
                          minStock={item.min_stock}
                          maxStock={item.max_stock}
                          unit={item.unit}
                          size="sm"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {formatQuantity(item.currentStock)} {item.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatQuantity(item.min_stock)} / {formatQuantity(item.max_stock)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleLocationAssignment(item)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Manage locations"
                        >
                          <SafeIcon icon={FiMapPin} />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-coffee-600 hover:text-coffee-900 p-1"
                          title="Edit item"
                        >
                          <SafeIcon icon={FiEdit2} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete item"
                        >
                          <SafeIcon icon={FiTrash2} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
          setFormData({
            name: '',
            category_id: '',
            supplier_id: '',
            unit: '',
            min_stock: '',
            max_stock: '',
            assigned_locations: []
          });
        }}
        title={editingItem ? 'Edit Item' : 'Add New Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
              placeholder="Enter item name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              required
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier
            </label>
            <select
              required
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="">Select a supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit of Measurement
            </label>
            <select
              required
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="">Select a unit</option>
              {UNIT_OPTIONS.map(unit => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Locations
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
              {locations.map(location => (
                <label key={location.id} className="flex items-center space-x-2 py-1">
                  <button
                    type="button"
                    onClick={() => handleLocationToggle(location.id)}
                    className="flex items-center"
                  >
                    <SafeIcon
                      icon={formData.assigned_locations.includes(location.id) ? FiCheckSquare : FiSquare}
                      className={`mr-2 ${formData.assigned_locations.includes(location.id) ? 'text-coffee-600' : 'text-gray-400'}`}
                    />
                    <span className="text-sm text-gray-700">{location.name}</span>
                  </button>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Select which locations will carry this item
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Stock
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Stock
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                value={formData.max_stock}
                onChange={(e) => setFormData({ ...formData, max_stock: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingItem(null);
                setFormData({
                  name: '',
                  category_id: '',
                  supplier_id: '',
                  unit: '',
                  min_stock: '',
                  max_stock: '',
                  assigned_locations: []
                });
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-coffee-600 rounded-md hover:bg-coffee-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingItem ? 'Update' : 'Add'} Item
            </button>
          </div>
        </form>
      </Modal>

      {/* Location Assignment Modal */}
      <Modal
        isOpen={isLocationModalOpen}
        onClose={() => {
          setIsLocationModalOpen(false);
          setSelectedItemForLocations(null);
        }}
        title={`Manage Locations - ${selectedItemForLocations?.name}`}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Location Assignment</h4>
            <p className="text-sm text-blue-700">
              Select which locations should carry this item. Stock levels will be initialized to 0 for new locations.
            </p>
          </div>

          <div className="space-y-2">
            {locations.map(location => {
              const isAssigned = formData.assigned_locations.includes(location.id);
              const currentStock = stockLevels.find(
                stock => stock.item_id === selectedItemForLocations?.id && stock.location_id === location.id
              );

              return (
                <div key={location.id} className={`p-3 border rounded-lg ${isAssigned ? 'border-coffee-200 bg-coffee-50' : 'border-gray-200'}`}>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => handleLocationToggle(location.id)}
                        className="flex items-center"
                      >
                        <SafeIcon
                          icon={isAssigned ? FiCheckSquare : FiSquare}
                          className={`mr-2 text-lg ${isAssigned ? 'text-coffee-600' : 'text-gray-400'}`}
                        />
                      </button>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{location.name}</div>
                        <div className="text-xs text-gray-500">{location.address}</div>
                      </div>
                    </div>
                    
                    {currentStock && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          Current: {formatQuantity(currentStock.quantity)} {selectedItemForLocations?.unit}
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsLocationModalOpen(false);
                setSelectedItemForLocations(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveLocationAssignments}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-coffee-600 rounded-md hover:bg-coffee-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Assignments'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}