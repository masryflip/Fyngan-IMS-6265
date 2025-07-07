import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Modal from '../components/Modal';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import supabase from '../lib/supabase';

const { 
  FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiMapPin, FiStore, FiPackage, 
  FiBriefcase, FiSun, FiHome, FiTruck, FiCoffee, FiGrid, FiSettings 
} = FiIcons;

// Available icons for location types
const AVAILABLE_ICONS = [
  { value: 'map-pin', icon: FiMapPin, label: 'Map Pin' },
  { value: 'store', icon: FiStore, label: 'Store' },
  { value: 'package', icon: FiPackage, label: 'Package' },
  { value: 'briefcase', icon: FiBriefcase, label: 'Briefcase' },
  { value: 'sun', icon: FiSun, label: 'Sun' },
  { value: 'home', icon: FiHome, label: 'Home' },
  { value: 'truck', icon: FiTruck, label: 'Truck' },
  { value: 'coffee', icon: FiCoffee, label: 'Coffee' },
  { value: 'grid', icon: FiGrid, label: 'Grid' },
  { value: 'settings', icon: FiSettings, label: 'Settings' }
];

// Available colors for location types
const AVAILABLE_COLORS = [
  { value: 'blue', class: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Blue' },
  { value: 'green', class: 'bg-green-100 text-green-800 border-green-300', label: 'Green' },
  { value: 'purple', class: 'bg-purple-100 text-purple-800 border-purple-300', label: 'Purple' },
  { value: 'red', class: 'bg-red-100 text-red-800 border-red-300', label: 'Red' },
  { value: 'yellow', class: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Yellow' },
  { value: 'gray', class: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Gray' },
  { value: 'indigo', class: 'bg-indigo-100 text-indigo-800 border-indigo-300', label: 'Indigo' },
  { value: 'pink', class: 'bg-pink-100 text-pink-800 border-pink-300', label: 'Pink' }
];

export default function LocationTypes() {
  const [locationTypes, setLocationTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue',
    icon: 'map-pin'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load location types
  useEffect(() => {
    loadLocationTypes();
  }, []);

  const loadLocationTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('location_types_fyngan_2024')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');

      if (error) {
        console.error('Error loading location types:', error);
        setError(`Failed to load location types: ${error.message}`);
        return;
      }

      setLocationTypes(data || []);
    } catch (err) {
      console.error('Error loading location types:', err);
      setError(`Unexpected error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingType) {
        // First, check if this name already exists (and it's not the same record)
        if (formData.name !== editingType.name) {
          const { data: existingType } = await supabase
            .from('location_types_fyngan_2024')
            .select('id')
            .eq('name', formData.name)
            .single();
            
          if (existingType) {
            throw new Error(`A location type named "${formData.name}" already exists. Please use a different name.`);
          }
        }

        // Store the old name before updating
        const oldTypeName = editingType.name;
        
        // Update existing type
        const { data, error: updateError } = await supabase
          .from('location_types_fyngan_2024')
          .update({
            name: formData.name,
            description: formData.description,
            color: formData.color,
            icon: formData.icon,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingType.id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Only update locations if the name has changed
        if (oldTypeName !== formData.name) {
          // Update locations that use this type name
          const { error: locationsError } = await supabase
            .from('locations_fyngan_2024')
            .update({ type: formData.name })
            .eq('type', oldTypeName);

          if (locationsError) {
            console.error('Warning: Failed to update locations with the new type name:', locationsError);
            // Continue anyway - the type was updated successfully
          }
        }

        setLocationTypes(prev => 
          prev.map(type => type.id === editingType.id ? data : type)
        );
        
        alert('Location type updated successfully!');
      } else {
        // Check if name already exists for new types
        const { data: existingType } = await supabase
          .from('location_types_fyngan_2024')
          .select('id')
          .eq('name', formData.name)
          .single();
          
        if (existingType) {
          throw new Error(`A location type named "${formData.name}" already exists. Please use a different name.`);
        }
        
        // Create new type
        const { data, error: createError } = await supabase
          .from('location_types_fyngan_2024')
          .insert([{
            name: formData.name,
            description: formData.description,
            color: formData.color,
            icon: formData.icon,
            is_default: false
          }])
          .select()
          .single();

        if (createError) throw createError;

        setLocationTypes(prev => [...prev, data]);
        alert('Location type created successfully!');
      }

      setIsModalOpen(false);
      setEditingType(null);
      setFormData({ name: '', description: '', color: 'blue', icon: 'map-pin' });
    } catch (err) {
      console.error('Error saving location type:', err);
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      color: type.color,
      icon: type.icon
    });
    setIsModalOpen(true);
    setError(null);
  };

  const handleDelete = async (type) => {
    if (type.is_default) {
      alert('Cannot delete default location types.');
      return;
    }

    // Check if any locations use this type
    const { data: locationsUsingType, error: checkError } = await supabase
      .from('locations_fyngan_2024')
      .select('id, name')
      .eq('type', type.name);

    if (checkError) {
      console.error('Error checking locations:', checkError);
      alert('Error checking if type is in use. Please try again.');
      return;
    }

    if (locationsUsingType && locationsUsingType.length > 0) {
      alert(`Cannot delete this location type. It is currently used by ${locationsUsingType.length} location(s): ${locationsUsingType.map(loc => loc.name).join(', ')}`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the location type "${type.name}"?`)) {
      return;
    }

    try {
      setError(null);
      const { error } = await supabase
        .from('location_types_fyngan_2024')
        .delete()
        .eq('id', type.id);

      if (error) throw error;

      setLocationTypes(prev => prev.filter(t => t.id !== type.id));
      alert('Location type deleted successfully!');
    } catch (err) {
      console.error('Error deleting location type:', err);
      setError(`Failed to delete: ${err.message}`);
      alert(`Error deleting location type: ${err.message}`);
    }
  };

  const getIconComponent = (iconName) => {
    const iconConfig = AVAILABLE_ICONS.find(icon => icon.value === iconName);
    return iconConfig ? iconConfig.icon : FiMapPin;
  };

  const getColorClass = (colorName) => {
    const colorConfig = AVAILABLE_COLORS.find(color => color.value === colorName);
    return colorConfig ? colorConfig.class : 'bg-blue-100 text-blue-800 border-blue-300';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <SafeIcon icon={FiRefreshCw} className="animate-spin text-4xl text-coffee-600 mb-4" />
            <p className="text-gray-600">Loading location types...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Location Types</h1>
          <p className="text-gray-600">Manage the types of locations in your inventory system</p>
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setError(null);
            setEditingType(null);
            setFormData({ name: '', description: '', color: 'blue', icon: 'map-pin' });
          }}
          className="flex items-center space-x-2 bg-coffee-600 text-white px-4 py-2 rounded-md hover:bg-coffee-700 transition-colors"
        >
          <SafeIcon icon={FiPlus} />
          <span>Add Location Type</span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex">
            <SafeIcon icon={FiIcons.FiAlertTriangle} className="text-red-500 mt-1 mr-2" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Location Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locationTypes.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white rounded-lg shadow-md border-l-4 ${getColorClass(type.color).split(' ')[2]} p-6 relative`}
          >
            {/* Default badge */}
            {type.is_default && (
              <div className="absolute top-4 right-4">
                <span className="bg-coffee-100 text-coffee-800 text-xs font-medium px-2 py-1 rounded-full">
                  Default
                </span>
              </div>
            )}

            {/* Type header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-3 rounded-full ${getColorClass(type.color)}`}>
                <SafeIcon icon={getIconComponent(type.icon)} className="text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 capitalize">{type.name}</h3>
                <p className="text-sm text-gray-500">
                  {type.description || 'No description'}
                </p>
              </div>
            </div>

            {/* Type details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Color:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorClass(type.color)}`}>
                  {type.color}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Icon:</span>
                <div className="flex items-center space-x-1">
                  <SafeIcon icon={getIconComponent(type.icon)} className="text-sm" />
                  <span className="text-xs text-gray-500">{type.icon}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleEdit(type)}
                className="text-coffee-600 hover:text-coffee-900 p-2 rounded-md hover:bg-coffee-50 transition-colors"
                title="Edit location type"
              >
                <SafeIcon icon={FiEdit2} />
              </button>
              {!type.is_default && (
                <button
                  onClick={() => handleDelete(type)}
                  className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 transition-colors"
                  title="Delete location type"
                >
                  <SafeIcon icon={FiTrash2} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {locationTypes.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <SafeIcon icon={FiMapPin} className="text-gray-400 text-4xl mb-4 mx-auto" />
          <p className="text-gray-500">No location types found. Add your first location type to get started.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingType(null);
          setFormData({ name: '', description: '', color: 'blue', icon: 'map-pin' });
          setError(null);
        }}
        title={editingType ? 'Edit Location Type' : 'Add New Location Type'}
      >
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500"
              placeholder="e.g., Warehouse, Kitchen, Office"
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
              placeholder="Describe what this location type is used for"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Theme
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVAILABLE_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`p-2 rounded-md border-2 transition-all ${
                    formData.color === color.value
                      ? 'ring-2 ring-coffee-500 ring-offset-1'
                      : 'hover:ring-1 hover:ring-gray-300'
                  } ${color.class}`}
                >
                  <span className="text-xs font-medium">{color.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-5 gap-2">
              {AVAILABLE_ICONS.map((iconOption) => (
                <button
                  key={iconOption.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: iconOption.value })}
                  className={`p-3 rounded-md border-2 transition-all ${
                    formData.icon === iconOption.value
                      ? 'border-coffee-500 bg-coffee-50 text-coffee-600'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                  title={iconOption.label}
                >
                  <SafeIcon icon={iconOption.icon} className="text-lg" />
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full border ${getColorClass(formData.color)}`}>
              <SafeIcon icon={getIconComponent(formData.icon)} className="text-sm" />
              <span className="text-sm font-medium">
                {formData.name || 'Location Type Name'}
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingType(null);
                setFormData({ name: '', description: '', color: 'blue', icon: 'map-pin' });
                setError(null);
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
              {submitting ? 'Saving...' : editingType ? 'Update' : 'Create'} Location Type
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}