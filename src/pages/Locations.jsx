import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '../context/InventoryContext';
import Modal from '../components/Modal';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiRefreshCw, FiRotateCcw, FiDatabase } = FiIcons;

export default function Locations() {
  const { 
    locations, 
    isLoading, 
    error,
    addLocation, 
    updateLocation, 
    deleteLocation,
    refreshAllData 
  } = useInventory();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    address: '', 
    type: 'retail' 
  });
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Debug info
  useEffect(() => {
    console.log('🔍 Locations Page Debug Info:', {
      locationsCount: locations?.length || 0,
      locations: locations,
      isLoading,
      error
    });
  }, [locations, isLoading, error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, formData);
      } else {
        await addLocation(formData);
      }

      setIsModalOpen(false);
      setEditingLocation(null);
      setFormData({ name: '', address: '', type: 'retail' });
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Error saving location. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      type: location.type
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this location? This will also delete all stock data for this location.')) {
      try {
        await deleteLocation(id);
      } catch (error) {
        console.error('Error deleting location:', error);
        alert('Error deleting location. Please try again.');
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Manual refresh triggered by user');
      await refreshAllData();
      console.log('✅ Manual refresh completed');
    } catch (error) {
      console.error('💥 Error during manual refresh:', error);
      alert('Error refreshing data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const locationTypes = {
    retail: { label: 'Retail', color: 'bg-blue-100 text-blue-800' },
    storage: { label: 'Storage', color: 'bg-green-100 text-green-800' },
    production: { label: 'Production', color: 'bg-purple-100 text-purple-800' }
  };

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <SafeIcon icon={FiDatabase} className="text-red-500 text-4xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Database Connection Error</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-coffee-600 text-white px-4 py-2 rounded-md hover:bg-coffee-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <SafeIcon icon={FiRefreshCw} className="animate-spin text-4xl text-coffee-600 mb-4" />
            <p className="text-gray-600">Loading locations from database...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Locations</h1>
          <p className="text-gray-600">Manage your coffee shop locations and service areas</p>
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs text-gray-500">
              Debug: {locations?.length || 0} locations loaded
            </div>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <SafeIcon icon={FiRotateCcw} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh from DB'}</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-coffee-600 text-white px-4 py-2 rounded-md hover:bg-coffee-700 transition-colors"
          >
            <SafeIcon icon={FiPlus} />
            <span>Add Location</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        {!locations || locations.length === 0 ? (
          <div className="p-8 text-center">
            <SafeIcon icon={FiMapPin} className="text-gray-400 text-4xl mb-4 mx-auto" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {locations === null ? 'Loading locations...' : 'No locations found'}
            </h3>
            <p className="text-gray-500 mb-4">
              {locations === null 
                ? 'Fetching data from your database...'
                : 'Your database appears to be empty. Add your first location to get started.'
              }
            </p>
            {locations !== null && (
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-coffee-600 text-white px-4 py-2 rounded-md hover:bg-coffee-700"
                >
                  Add First Location
                </button>
                <button
                  onClick={handleRefresh}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Refresh Data
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locations.map((location, index) => (
                  <motion.tr
                    key={location.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <SafeIcon icon={FiMapPin} className="text-coffee-600 mr-3" />
                        <div className="text-sm font-medium text-gray-900">
                          {location.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{location.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          locationTypes[location.type]?.color || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {locationTypes[location.type]?.label || location.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(location)}
                          className="text-coffee-600 hover:text-coffee-900 p-1"
                        >
                          <SafeIcon icon={FiEdit2} />
                        </button>
                        <button
                          onClick={() => handleDelete(location.id)}
                          className="text-red-600 hover:text-red-900 p-1"
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLocation(null);
          setFormData({ name: '', address: '', type: 'retail' });
        }}
        title={editingLocation ? 'Edit Location' : 'Add New Location'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
              placeholder="e.g., Main Counter, Storage Room, Drive-Thru"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
              placeholder="e.g., Customer service area, Back storage room"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="retail">Retail (Customer-facing)</option>
              <option value="storage">Storage (Inventory storage)</option>
              <option value="production">Production (Food prep/kitchen)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingLocation(null);
                setFormData({ name: '', address: '', type: 'retail' });
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
              {submitting ? 'Saving...' : editingLocation ? 'Update' : 'Add'} Location
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}