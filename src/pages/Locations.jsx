import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '../context/InventoryContext';
import Modal from '../components/Modal';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import supabase from '../lib/supabase';

const { 
  FiPlus, FiEdit2, FiTrash2, FiMapPin, FiRefreshCw, FiRotateCcw, 
  FiDatabase, FiSettings, FiStore, FiPackage, FiBriefcase, FiSun, 
  FiHome, FiTruck, FiCoffee, FiGrid 
} = FiIcons;

// Icon mapping for location types
const ICON_MAP = {
  'map-pin': FiMapPin,
  'store': FiStore,
  'package': FiPackage,
  'briefcase': FiBriefcase,
  'sun': FiSun,
  'home': FiHome,
  'truck': FiTruck,
  'coffee': FiCoffee,
  'grid': FiGrid,
  'settings': FiSettings
};

// Default location types as fallback
const DEFAULT_LOCATION_TYPES = [
  { name: 'retail', description: 'Customer-facing areas', color: 'blue', icon: 'store' },
  { name: 'storage', description: 'Storage areas', color: 'green', icon: 'package' },
  { name: 'production', description: 'Production areas', color: 'purple', icon: 'settings' }
];

export default function Locations() {
  const { 
    locations, isLoading, error, addLocation, updateLocation, deleteLocation, refreshAllData 
  } = useInventory();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationTypes, setLocationTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [formError, setFormError] = useState(null);
  const [dbConstraintTypes, setDbConstraintTypes] = useState([]);

  // Load location types and constraint types
  useEffect(() => {
    loadLocationTypes();
    loadConstraintTypes();
  }, []);

  const loadConstraintTypes = async () => {
    try {
      // Get the actual type constraint values from an existing location
      const { data, error } = await supabase
        .from('locations_fyngan_2024')
        .select('type')
        .limit(100);

      if (error) {
        console.error('Error checking constraint types:', error);
        return;
      }

      // Extract unique types
      const uniqueTypes = [...new Set(data.map(loc => loc.type))].filter(Boolean);
      console.log('Database constraint types:', uniqueTypes);
      setDbConstraintTypes(uniqueTypes);
    } catch (err) {
      console.error('Error loading constraint types:', err);
    }
  };

  const loadLocationTypes = async () => {
    try {
      setLoadingTypes(true);
      const { data, error } = await supabase
        .from('location_types_fyngan_2024')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');

      if (error) {
        console.error('Error loading location types:', error);
        // Fallback to default types
        setLocationTypes(DEFAULT_LOCATION_TYPES);
      } else {
        setLocationTypes(data || []);
        console.log('Loaded location types:', data);
      }
    } catch (error) {
      console.error('Error loading location types:', error);
      setLocationTypes(DEFAULT_LOCATION_TYPES);
    } finally {
      setLoadingTypes(false);
    }
  };

  // Check if a location type is valid based on database constraints
  const isValidLocationType = (typeName) => {
    // First check if it's in our loaded location types
    const typeExists = locationTypes.find(type => type.name === typeName);
    
    // Then check if it's in the known constraint types
    const isInConstraint = dbConstraintTypes.includes(typeName);
    
    // For new locations, we must use existing types
    if (!editingLocation) {
      return !!typeExists;
    }
    
    // For editing, if it's the same type as before, it's valid
    if (editingLocation && typeName === editingLocation.type) {
      return true;
    }
    
    // Otherwise, check both conditions
    return !!typeExists || isInConstraint;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      // Validate form data
      if (!formData.name?.trim()) {
        throw new Error('Location name is required');
      }
      if (!formData.address?.trim()) {
        throw new Error('Description is required');
      }
      if (!formData.type) {
        throw new Error('Location type is required');
      }

      // Check if type is valid
      if (!isValidLocationType(formData.type)) {
        throw new Error(`Location type "${formData.type}" is not valid. Please choose from the dropdown.`);
      }

      const locationData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        type: formData.type,
        is_default: false // Ensure new locations are not default
      };

      console.log('Submitting location data:', locationData);

      if (editingLocation) {
        console.log('Updating location:', editingLocation.id, locationData);
        
        // If we're not changing the type, or if the new type is valid, proceed normally
        if (editingLocation.type === formData.type || isValidLocationType(formData.type)) {
          await updateLocation(editingLocation.id, locationData);
        } else {
          // If we're changing to a type that might not be in the constraint,
          // try a direct database update to bypass the constraint
          const { error } = await supabase
            .from('locations_fyngan_2024')
            .update({
              name: locationData.name,
              address: locationData.address,
              // Keep the original type to avoid constraint issues
              type: editingLocation.type,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingLocation.id);
            
          if (error) throw error;
          
          // Refresh data to show the update
          await refreshAllData();
        }
      } else {
        console.log('Adding new location:', locationData);
        await addLocation(locationData);
      }

      setIsModalOpen(false);
      setEditingLocation(null);
      setFormData({ name: '', address: '', type: '' });
    } catch (error) {
      console.error('Error saving location:', error);
      setFormError(error.message || 'An error occurred while saving the location');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (location) => {
    console.log('Editing location:', location);
    setEditingLocation(location);
    setFormData({
      name: location.name || '',
      address: location.address || '',
      type: location.type || ''
    });
    setIsModalOpen(true);
    setFormError(null);
  };

  const handleDelete = async (id) => {
    try {
      // Check if location has stock data
      const { data: stockData, error: stockError } = await supabase
        .from('stock_levels_fyngan_2024')
        .select('id, item:items_fyngan_2024(name)')
        .eq('location_id', id);

      if (stockError) {
        console.error('Error checking stock data:', stockError);
      }

      const hasStock = stockData && stockData.length > 0;
      
      let confirmMessage = 'Are you sure you want to delete this location?';
      if (hasStock) {
        confirmMessage = `This location has ${stockData.length} stock record(s) associated with it. Deleting it will also delete all stock data for this location. Are you sure you want to continue?`;
      }

      if (window.confirm(confirmMessage)) {
        console.log('Deleting location:', id);
        await deleteLocation(id);
        console.log('Location deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      alert(`Error deleting location: ${error.message}`);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Manual refresh triggered by user');
      await refreshAllData();
      await loadLocationTypes(); // Also refresh location types
      await loadConstraintTypes(); // Also refresh constraint types
      console.log('✅ Manual refresh completed');
    } catch (error) {
      console.error('💥 Error during manual refresh:', error);
      alert('Error refreshing data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const getLocationTypeConfig = (typeName) => {
    const type = locationTypes.find(t => t.name === typeName);
    if (type) {
      return {
        label: type.name.charAt(0).toUpperCase() + type.name.slice(1),
        color: getColorClass(type.color),
        icon: ICON_MAP[type.icon] || FiMapPin,
        description: type.description
      };
    }
    // Fallback for unknown types
    return {
      label: typeName || 'Unknown',
      color: 'bg-gray-100 text-gray-800',
      icon: FiMapPin,
      description: 'Unknown location type'
    };
  };

  const getColorClass = (colorName) => {
    const colorMap = {
      'blue': 'bg-blue-100 text-blue-800',
      'green': 'bg-green-100 text-green-800',
      'purple': 'bg-purple-100 text-purple-800',
      'red': 'bg-red-100 text-red-800',
      'yellow': 'bg-yellow-100 text-yellow-800',
      'gray': 'bg-gray-100 text-gray-800',
      'indigo': 'bg-indigo-100 text-indigo-800',
      'pink': 'bg-pink-100 text-pink-800'
    };
    return colorMap[colorName] || 'bg-gray-100 text-gray-800';
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
  if (isLoading || loadingTypes) {
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
              Debug: {locations?.length || 0} locations loaded, {locationTypes?.length || 0} location types
            </div>
          )}
        </div>
        <div className="flex space-x-3">
          <a
            href="#/location-types"
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            <SafeIcon icon={FiSettings} />
            <span>Manage Types</span>
          </a>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <SafeIcon icon={FiRotateCcw} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh from DB'}</span>
          </button>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setFormError(null);
              setEditingLocation(null);
              setFormData({ name: '', address: '', type: '' });
            }}
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
                : 'Your database appears to be empty. Add your first location to get started.'}
            </p>
            {locations !== null && (
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setIsModalOpen(true);
                    setFormError(null);
                    setEditingLocation(null);
                    setFormData({ name: '', address: '', type: '' });
                  }}
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
                {locations.map((location, index) => {
                  const typeConfig = getLocationTypeConfig(location.type);
                  return (
                    <motion.tr
                      key={location.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <SafeIcon icon={typeConfig.icon} className="text-coffee-600 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {location.name}
                            </div>
                            {location.is_default && (
                              <div className="text-xs text-gray-500">Default Location</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{location.address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${typeConfig.color}`}>
                          <SafeIcon icon={typeConfig.icon} className="mr-1 text-xs" />
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(location)}
                            className="text-coffee-600 hover:text-coffee-900 p-1"
                            title="Edit location"
                          >
                            <SafeIcon icon={FiEdit2} />
                          </button>
                          <button
                            onClick={() => handleDelete(location.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete location"
                          >
                            <SafeIcon icon={FiTrash2} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
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
          setFormData({ name: '', address: '', type: '' });
          setFormError(null);
        }}
        title={editingLocation ? 'Edit Location' : 'Add New Location'}
      >
        {formError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            <div className="font-medium">Error:</div>
            {formError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Name *
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
              Description *
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
              Location Type *
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => {
                console.log('Selected type:', e.target.value);
                setFormData({ ...formData, type: e.target.value });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
            >
              <option value="">Select a location type...</option>
              {locationTypes.map((type) => (
                <option key={type.name} value={type.name}>
                  {type.name.charAt(0).toUpperCase() + type.name.slice(1)} - {type.description}
                </option>
              ))}
              
              {/* Show existing constraint types that aren't in location_types table */}
              {dbConstraintTypes
                .filter(type => !locationTypes.some(t => t.name === type))
                .map(type => (
                  <option key={`constraint-${type}`} value={type} className="bg-yellow-50">
                    {type} (legacy type)
                  </option>
                ))
              }
            </select>
            
            {locationTypes.length === 0 && (
              <p className="mt-1 text-xs text-red-500">
                No location types found. Please add location types first.
              </p>
            )}
            
            {/* Warning about location type issues */}
            {editingLocation && editingLocation.type && !locationTypes.some(t => t.name === editingLocation.type) && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                <p className="font-medium">Warning:</p>
                <p>The current location type "{editingLocation.type}" is not in your location types list. 
                Changing it might cause database constraint errors.</p>
              </div>
            )}
            
            <p className="mt-1 text-xs text-gray-500">
              Don't see the type you need?{' '}
              <a href="#/location-types" className="text-coffee-600 hover:text-coffee-800">
                Manage location types
              </a>
            </p>
          </div>

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="p-3 bg-gray-100 rounded text-xs">
              <div><strong>Debug Info:</strong></div>
              <div>Form Data: {JSON.stringify(formData)}</div>
              <div>Available Types: {locationTypes.map(t => t.name).join(', ')}</div>
              <div>Constraint Types: {dbConstraintTypes.join(', ')}</div>
              <div>Editing: {editingLocation ? editingLocation.id : 'new'}</div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingLocation(null);
                setFormData({ name: '', address: '', type: '' });
                setFormError(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || locationTypes.length === 0}
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