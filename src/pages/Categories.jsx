import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '../context/InventoryContext';
import Modal from '../components/Modal';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiPlus, FiEdit2, FiTrash2, FiGrid, FiRefreshCw, FiPackage, FiBarChart2, FiChevronDown, FiChevronUp } = FiIcons;

export default function Categories() {
  const { 
    categories, 
    items, 
    stockLevels, 
    isLoading, 
    addCategory, 
    updateCategory, 
    deleteCategory,
    getTotalStock,
    formatQuantity
  } = useInventory();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'

  // Calculate stock levels for each category
  const categoriesWithStock = useMemo(() => {
    return categories.map(category => {
      const categoryItems = items.filter(item => item.category_id === category.id);
      
      const itemsWithStock = categoryItems.map(item => {
        const totalStock = getTotalStock(item.id);
        const stockStatus = totalStock === 0 
          ? 'out' 
          : totalStock <= item.min_stock 
            ? 'low' 
            : totalStock >= item.max_stock 
              ? 'high' 
              : 'good';
              
        return {
          ...item,
          totalStock,
          stockStatus
        };
      });
      
      // Calculate category stats
      const totalItems = itemsWithStock.length;
      const outOfStockItems = itemsWithStock.filter(item => item.stockStatus === 'out').length;
      const lowStockItems = itemsWithStock.filter(item => item.stockStatus === 'low').length;
      const healthyItems = itemsWithStock.filter(item => ['good', 'high'].includes(item.stockStatus)).length;
      
      // Set category status based on items
      let categoryStatus = 'good';
      if (outOfStockItems > 0) {
        categoryStatus = 'critical';
      } else if (lowStockItems > 0) {
        categoryStatus = 'warning';
      } else if (totalItems === 0) {
        categoryStatus = 'empty';
      }
      
      return {
        ...category,
        items: itemsWithStock,
        totalItems,
        outOfStockItems,
        lowStockItems,
        healthyItems,
        categoryStatus
      };
    }).sort((a, b) => {
      // Sort by status (critical first, then warning, then good, then empty)
      const statusOrder = { critical: 0, warning: 1, good: 2, empty: 3 };
      return statusOrder[a.categoryStatus] - statusOrder[b.categoryStatus];
    });
  }, [categories, items, stockLevels, getTotalStock]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await addCategory(formData);
      }
      
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategory(id);
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category. Please try again.');
      }
    }
  };

  const toggleCategoryExpand = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'out': return 'bg-red-100 text-red-800 border-red-300';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'high': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-green-100 text-green-800 border-green-300';
    }
  };
  
  const getCategoryStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'bg-red-100 border-red-300';
      case 'warning': return 'bg-yellow-100 border-yellow-300';
      case 'empty': return 'bg-gray-100 border-gray-300';
      default: return 'bg-green-100 border-green-300';
    }
  };

  const getProgressBarColors = (status) => {
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'empty': return 'bg-gray-300';
      default: return 'bg-green-500';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <SafeIcon icon={FiRefreshCw} className="animate-spin text-4xl text-coffee-600 mb-4" />
            <p className="text-gray-600">Loading categories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Categories</h1>
          <p className="text-gray-600">Organize your inventory items by category</p>
        </div>
        <div className="flex space-x-3">
          <div className="flex bg-white rounded-md shadow border overflow-hidden">
            <button 
              onClick={() => setViewMode('card')} 
              className={`px-3 py-2 ${viewMode === 'card' 
                ? 'bg-coffee-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              <SafeIcon icon={FiGrid} className="text-lg" />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`px-3 py-2 ${viewMode === 'list' 
                ? 'bg-coffee-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              <SafeIcon icon={FiBarChart2} className="text-lg" />
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center space-x-2 bg-coffee-600 text-white px-4 py-2 rounded-md hover:bg-coffee-700 transition-colors"
          >
            <SafeIcon icon={FiPlus} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {categoriesWithStock.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <SafeIcon icon={FiGrid} className="text-gray-400 text-4xl mb-4 mx-auto" />
          <p className="text-gray-500">No categories found. Add your first category to get started.</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoriesWithStock.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-lg shadow-md border-l-4 ${getCategoryStatusColor(category.categoryStatus)}`}
            >
              <div className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <SafeIcon icon={FiGrid} className="text-coffee-600 mr-3 text-xl" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{category.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleEdit(category)} 
                      className="text-coffee-600 hover:text-coffee-900 p-1"
                    >
                      <SafeIcon icon={FiEdit2} />
                    </button>
                    <button 
                      onClick={() => handleDelete(category.id)} 
                      className="text-red-600 hover:text-red-900 p-1"
                    >
                      <SafeIcon icon={FiTrash2} />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {category.totalItems} {category.totalItems === 1 ? 'item' : 'items'}
                  </div>
                  <button
                    onClick={() => toggleCategoryExpand(category.id)}
                    className="text-coffee-600 hover:bg-coffee-50 p-1 rounded-full"
                  >
                    <SafeIcon icon={expandedCategory === category.id ? FiChevronUp : FiChevronDown} />
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-4">
                <div className="flex justify-between mb-3 text-xs font-medium">
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">
                      {category.outOfStockItems} out
                    </span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                      {category.lowStockItems} low
                    </span>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    {category.healthyItems} healthy
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
                  {category.totalItems > 0 && (
                    <div 
                      className={`h-2.5 rounded-full ${getProgressBarColors(category.categoryStatus)}`} 
                      style={{ width: `${(category.healthyItems / category.totalItems) * 100}%` }}
                    ></div>
                  )}
                </div>
                
                {expandedCategory === category.id && category.items.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Items in this category</h4>
                    {category.items.map(item => (
                      <div 
                        key={item.id} 
                        className={`p-3 rounded-lg border ${getStockStatusColor(item.stockStatus)} flex items-center justify-between`}
                      >
                        <div className="flex items-center">
                          <SafeIcon icon={FiPackage} className="mr-2" />
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
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categoriesWithStock.map((category, index) => (
                <React.Fragment key={category.id}>
                  <motion.tr 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`hover:bg-gray-50 ${expandedCategory === category.id ? 'bg-gray-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="mr-3">
                          <button
                            onClick={() => toggleCategoryExpand(category.id)}
                            className="text-coffee-600 hover:bg-coffee-50 p-1 rounded-full"
                          >
                            <SafeIcon icon={expandedCategory === category.id ? FiChevronUp : FiChevronDown} />
                          </button>
                        </div>
                        <div className="flex items-center">
                          <SafeIcon icon={FiGrid} className="text-coffee-600 mr-3" />
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{category.description || 'No description'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">{category.totalItems}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-center space-x-2">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {category.outOfStockItems} out
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {category.lowStockItems} low
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {category.healthyItems} ok
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleEdit(category)} 
                          className="text-coffee-600 hover:text-coffee-900 p-1"
                        >
                          <SafeIcon icon={FiEdit2} />
                        </button>
                        <button 
                          onClick={() => handleDelete(category.id)} 
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <SafeIcon icon={FiTrash2} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                  
                  {expandedCategory === category.id && (
                    <tr>
                      <td colSpan="5" className="px-6 py-2 bg-gray-50">
                        <div className="py-2">
                          {category.items.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {category.items.map(item => (
                                <div 
                                  key={item.id}
                                  className={`p-3 rounded-lg border ${getStockStatusColor(item.stockStatus)} flex items-center justify-between`}
                                >
                                  <div className="flex items-center">
                                    <SafeIcon icon={FiPackage} className="mr-2" />
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
                            <p className="text-gray-500 text-center py-4">No items in this category</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
          setFormData({ name: '', description: '' });
        }}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
              placeholder="Enter category name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
              placeholder="Enter category description"
              rows="3"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button 
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingCategory(null);
                setFormData({ name: '', description: '' });
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
              {submitting ? 'Saving...' : editingCategory ? 'Update' : 'Add'} Category
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}