import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import supabase from '../lib/supabase';

const InventoryContext = createContext();

const initialState = {
  locations: [],
  categories: [],
  suppliers: [],
  items: [],
  stockLevels: [],
  transactions: [],
  isLoading: true,
  error: null,
  isOnline: true,
  isInitialized: false
};

function inventoryReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_ONLINE':
      return { ...state, isOnline: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: true };
    case 'SET_LOCATIONS':
      console.log('Setting locations in context:', action.payload);
      return { ...state, locations: action.payload };
    case 'SET_CATEGORIES':
      console.log('Setting categories in context:', action.payload);
      return { ...state, categories: action.payload };
    case 'SET_SUPPLIERS':
      console.log('Setting suppliers in context:', action.payload);
      return { ...state, suppliers: action.payload };
    case 'SET_ITEMS':
      console.log('Setting items in context:', action.payload);
      return { ...state, items: action.payload };
    case 'SET_STOCK_LEVELS':
      console.log('Setting stock levels in context:', action.payload);
      return { ...state, stockLevels: action.payload };
    case 'SET_TRANSACTIONS':
      console.log('Setting transactions in context:', action.payload);
      return { ...state, transactions: action.payload };
    case 'ADD_LOCATION':
      return { ...state, locations: [...state.locations, action.payload] };
    case 'UPDATE_LOCATION':
      return {
        ...state,
        locations: state.locations.map(loc =>
          loc.id === action.payload.id ? action.payload : loc
        )
      };
    case 'DELETE_LOCATION':
      return {
        ...state,
        locations: state.locations.filter(loc => loc.id !== action.payload),
        stockLevels: state.stockLevels.filter(stock => stock.location_id !== action.payload)
      };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(cat =>
          cat.id === action.payload.id ? action.payload : cat
        )
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(cat => cat.id !== action.payload)
      };
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [...state.suppliers, action.payload] };
    case 'UPDATE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.map(sup =>
          sup.id === action.payload.id ? action.payload : sup
        )
      };
    case 'DELETE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.filter(sup => sup.id !== action.payload)
      };
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      };
    case 'DELETE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
        stockLevels: state.stockLevels.filter(stock => stock.item_id !== action.payload)
      };
    case 'ADD_STOCK_LEVEL':
      return { ...state, stockLevels: [...state.stockLevels, action.payload] };
    case 'UPDATE_STOCK_LEVEL':
      const existingIndex = state.stockLevels.findIndex(
        stock => stock.item_id === action.payload.item_id && 
                 stock.location_id === action.payload.location_id
      );
      if (existingIndex >= 0) {
        return {
          ...state,
          stockLevels: state.stockLevels.map((stock, index) =>
            index === existingIndex ? action.payload : stock
          )
        };
      } else {
        return {
          ...state,
          stockLevels: [...state.stockLevels, action.payload]
        };
      }
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] };
    default:
      return state;
  }
}

export function InventoryProvider({ children }) {
  const [state, dispatch] = useReducer(inventoryReducer, initialState);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth();

  // Database operations - fetch existing data only (NO SAMPLE DATA)
  const loadLocations = async () => {
    try {
      console.log("📍 Loading existing locations from database...");
      dispatch({ type: 'CLEAR_ERROR' });
      
      const { data, error } = await supabase
        .from('locations_fyngan_2024')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching locations:', error);
        throw error;
      }

      console.log(`✅ Successfully loaded ${data?.length || 0} existing locations from database`);
      dispatch({ type: 'SET_LOCATIONS', payload: data || [] });
      return true;
    } catch (error) {
      console.error('💥 Critical error loading locations:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to load locations: ${error.message}` });
      return false;
    }
  };

  const loadCategories = async () => {
    try {
      console.log("📁 Loading existing categories from database...");
      
      const { data, error } = await supabase
        .from('categories_fyngan_2024')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching categories:', error);
        throw error;
      }

      console.log(`✅ Successfully loaded ${data?.length || 0} existing categories from database`);
      dispatch({ type: 'SET_CATEGORIES', payload: data || [] });
      return true;
    } catch (error) {
      console.error('💥 Critical error loading categories:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to load categories: ${error.message}` });
      return false;
    }
  };

  const loadSuppliers = async () => {
    try {
      console.log("🚛 Loading existing suppliers from database...");
      
      const { data, error } = await supabase
        .from('suppliers_fyngan_2024')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching suppliers:', error);
        throw error;
      }

      console.log(`✅ Successfully loaded ${data?.length || 0} existing suppliers from database`);
      dispatch({ type: 'SET_SUPPLIERS', payload: data || [] });
      return true;
    } catch (error) {
      console.error('💥 Critical error loading suppliers:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to load suppliers: ${error.message}` });
      return false;
    }
  };

  const loadItems = async () => {
    try {
      console.log("📦 Loading existing items from database...");
      
      const { data, error } = await supabase
        .from('items_fyngan_2024')
        .select(`
          *,
          category:categories_fyngan_2024(name),
          supplier:suppliers_fyngan_2024(name)
        `)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching items:', error);
        throw error;
      }

      console.log(`✅ Successfully loaded ${data?.length || 0} existing items from database`);
      dispatch({ type: 'SET_ITEMS', payload: data || [] });
      return true;
    } catch (error) {
      console.error('💥 Critical error loading items:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to load items: ${error.message}` });
      return false;
    }
  };

  const loadStockLevels = async () => {
    try {
      console.log("📊 Loading existing stock levels from database...");
      
      const { data, error } = await supabase
        .from('stock_levels_fyngan_2024')
        .select(`
          *,
          item:items_fyngan_2024(name, unit),
          location:locations_fyngan_2024(name)
        `)
        .order('last_updated', { ascending: false });

      if (error) {
        console.error('❌ Error fetching stock levels:', error);
        throw error;
      }

      console.log(`✅ Successfully loaded ${data?.length || 0} existing stock level records from database`);
      dispatch({ type: 'SET_STOCK_LEVELS', payload: data || [] });
      return true;
    } catch (error) {
      console.error('💥 Critical error loading stock levels:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to load stock levels: ${error.message}` });
      return false;
    }
  };

  const loadTransactions = async () => {
    try {
      console.log("📋 Loading existing transactions from database...");
      
      const { data, error } = await supabase
        .from('transactions_fyngan_2024')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) {
        if (error.message && error.message.includes('does not exist')) {
          console.log('⚠️ Transactions table does not exist yet - this is normal for new setups');
          dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
          return true;
        }
        throw error;
      }

      console.log(`✅ Successfully loaded ${data?.length || 0} existing transactions from database`);
      dispatch({ type: 'SET_TRANSACTIONS', payload: data || [] });
      return true;
    } catch (error) {
      console.error('💥 Critical error loading transactions:', error);
      // Don't fail the entire app if transactions fail
      console.log('🔄 Continuing without transactions...');
      dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
      return true;
    }
  };

  // Force refresh all data from database
  const refreshAllData = async () => {
    console.log("🔄 MANUAL REFRESH: Forcing reload of all data from database...");
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      // Load all data in sequence to ensure dependencies
      console.log("🚀 Starting data refresh sequence...");
      const locationsLoaded = await loadLocations();
      const categoriesLoaded = await loadCategories();
      const suppliersLoaded = await loadSuppliers();

      if (locationsLoaded && categoriesLoaded && suppliersLoaded) {
        await loadItems();
        await loadStockLevels();
        await loadTransactions();
      } else {
        throw new Error('Failed to load basic data (locations, categories, or suppliers)');
      }

      dispatch({ type: 'SET_INITIALIZED', payload: true });
      console.log("✅ Manual refresh completed successfully!");
    } catch (error) {
      console.error('💥 Error during manual refresh:', error);
      dispatch({ type: 'SET_ERROR', payload: `Refresh failed: ${error.message}` });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load all data on app startup - ONLY EXISTING DATA, NO SAMPLE DATA
  useEffect(() => {
    // Only load data if user is authenticated
    if (!user) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    const loadAllData = async () => {
      console.log("🚀 APP STARTUP: Loading all existing data from database (NO SAMPLE DATA)...");
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      try {
        // Load data in sequence to ensure dependencies
        console.log("📋 Loading sequence: locations → categories → suppliers → items → stock → transactions");
        const locationsLoaded = await loadLocations();
        const categoriesLoaded = await loadCategories();
        const suppliersLoaded = await loadSuppliers();

        if (locationsLoaded && categoriesLoaded && suppliersLoaded) {
          await loadItems();
          await loadStockLevels();
          await loadTransactions();
        } else {
          throw new Error('Failed to load basic data tables');
        }

        dispatch({ type: 'SET_INITIALIZED', payload: true });
        console.log("🎉 App initialization completed successfully! Showing only existing data from database.");
      } catch (error) {
        console.error('💥 Critical error during app startup:', error);
        dispatch({ type: 'SET_ERROR', payload: `App startup failed: ${error.message}` });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadAllData();
  }, [user]);

  // CRUD operations
  const addLocation = async (locationData) => {
    try {
      console.log('📍 Adding location:', locationData);
      
      const { data, error } = await supabase
        .from('locations_fyngan_2024')
        .insert([{
          ...locationData,
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding location:', error);
        throw error;
      }

      console.log('✅ Location added successfully:', data);
      dispatch({ type: 'ADD_LOCATION', payload: data });
      
      await logTransaction('LOCATION_ADDED', {
        locationId: data.id,
        locationName: data.name,
        address: data.address,
        type: data.type
      });

      return data;
    } catch (error) {
      console.error('💥 Error adding location:', error);
      throw error;
    }
  };

  const updateLocation = async (id, locationData) => {
    try {
      console.log('📍 Updating location:', id, locationData);
      
      const { data, error } = await supabase
        .from('locations_fyngan_2024')
        .update({
          ...locationData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating location:', error);
        throw error;
      }

      console.log('✅ Location updated successfully:', data);
      dispatch({ type: 'UPDATE_LOCATION', payload: data });
      
      await logTransaction('LOCATION_UPDATED', {
        locationId: data.id,
        locationName: data.name,
        changes: locationData
      });

      return data;
    } catch (error) {
      console.error('💥 Error updating location:', error);
      throw error;
    }
  };

  const deleteLocation = async (id) => {
    try {
      console.log('📍 Deleting location:', id);
      const location = state.locations.find(loc => loc.id === id);
      
      // First delete all stock levels for this location
      console.log('🗑️ Deleting stock levels for location:', id);
      const { error: stockError } = await supabase
        .from('stock_levels_fyngan_2024')
        .delete()
        .eq('location_id', id);
        
      if (stockError) {
        console.error('⚠️ Error deleting stock levels:', stockError);
        // Continue anyway - the location deletion is more important
      }
      
      // Then delete the location
      console.log('🗑️ Deleting location record:', id);
      const { error } = await supabase
        .from('locations_fyngan_2024')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting location:', error);
        throw error;
      }

      console.log('✅ Location deleted successfully:', id);
      dispatch({ type: 'DELETE_LOCATION', payload: id });
      
      await logTransaction('LOCATION_DELETED', {
        locationId: id,
        locationName: location?.name || 'Unknown Location'
      });
    } catch (error) {
      console.error('💥 Error deleting location:', error);
      throw error;
    }
  };

  const addCategory = async (categoryData) => {
    try {
      const { data, error } = await supabase
        .from('categories_fyngan_2024')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'ADD_CATEGORY', payload: data });
      
      await logTransaction('CATEGORY_ADDED', {
        categoryId: data.id,
        categoryName: data.name,
        description: data.description
      });

      return data;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateCategory = async (id, categoryData) => {
    try {
      const { data, error } = await supabase
        .from('categories_fyngan_2024')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'UPDATE_CATEGORY', payload: data });
      
      await logTransaction('CATEGORY_UPDATED', {
        categoryId: data.id,
        categoryName: data.name,
        changes: categoryData
      });

      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id) => {
    try {
      const category = state.categories.find(cat => cat.id === id);
      
      const { error } = await supabase
        .from('categories_fyngan_2024')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'DELETE_CATEGORY', payload: id });
      
      await logTransaction('CATEGORY_DELETED', {
        categoryId: id,
        categoryName: category?.name || 'Unknown Category'
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  const addSupplier = async (supplierData) => {
    try {
      const { data, error } = await supabase
        .from('suppliers_fyngan_2024')
        .insert([supplierData])
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'ADD_SUPPLIER', payload: data });
      
      await logTransaction('SUPPLIER_ADDED', {
        supplierId: data.id,
        supplierName: data.name,
        contact: data.contact,
        email: data.email,
        phone: data.phone
      });

      return data;
    } catch (error) {
      console.error('Error adding supplier:', error);
      throw error;
    }
  };

  const updateSupplier = async (id, supplierData) => {
    try {
      const { data, error } = await supabase
        .from('suppliers_fyngan_2024')
        .update(supplierData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      dispatch({ type: 'UPDATE_SUPPLIER', payload: data });
      
      await logTransaction('SUPPLIER_UPDATED', {
        supplierId: data.id,
        supplierName: data.name,
        changes: supplierData
      });

      return data;
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  };

  const deleteSupplier = async (id) => {
    try {
      const supplier = state.suppliers.find(sup => sup.id === id);
      
      const { error } = await supabase
        .from('suppliers_fyngan_2024')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'DELETE_SUPPLIER', payload: id });
      
      await logTransaction('SUPPLIER_DELETED', {
        supplierId: id,
        supplierName: supplier?.name || 'Unknown Supplier'
      });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  };

  const addItem = async (itemData) => {
    try {
      const { data, error } = await supabase
        .from('items_fyngan_2024')
        .insert([itemData])
        .select(`
          *,
          category:categories_fyngan_2024(name),
          supplier:suppliers_fyngan_2024(name)
        `)
        .single();

      if (error) throw error;

      dispatch({ type: 'ADD_ITEM', payload: data });
      
      await logTransaction('ITEM_ADDED', {
        itemId: data.id,
        itemName: data.name,
        categoryName: data.category?.name || 'Unknown Category',
        supplierName: data.supplier?.name || 'Unknown Supplier',
        unit: data.unit,
        minStock: data.min_stock,
        maxStock: data.max_stock
      });

      return data;
    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    }
  };

  const updateItem = async (id, itemData) => {
    try {
      const { data, error } = await supabase
        .from('items_fyngan_2024')
        .update(itemData)
        .eq('id', id)
        .select(`
          *,
          category:categories_fyngan_2024(name),
          supplier:suppliers_fyngan_2024(name)
        `)
        .single();

      if (error) throw error;

      dispatch({ type: 'UPDATE_ITEM', payload: data });
      
      await logTransaction('ITEM_UPDATED', {
        itemId: data.id,
        itemName: data.name,
        categoryName: data.category?.name || 'Unknown Category',
        supplierName: data.supplier?.name || 'Unknown Supplier',
        changes: itemData
      });

      return data;
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  };

  const deleteItem = async (id) => {
    try {
      const item = state.items.find(item => item.id === id);
      
      const { error } = await supabase
        .from('items_fyngan_2024')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dispatch({ type: 'DELETE_ITEM', payload: id });
      
      await logTransaction('ITEM_DELETED', {
        itemId: id,
        itemName: item?.name || 'Unknown Item'
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  };

  const updateStockLevel = async (itemId, locationId, quantity) => {
    try {
      const item = state.items.find(i => i.id === itemId);
      const location = state.locations.find(l => l.id === locationId);

      // Get previous quantity
      const existingStock = state.stockLevels.find(
        stock => stock.item_id === itemId && stock.location_id === locationId
      );
      const previousQuantity = existingStock ? existingStock.quantity : 0;
      const quantityChange = quantity - previousQuantity;

      const { data, error } = await supabase
        .from('stock_levels_fyngan_2024')
        .upsert(
          {
            item_id: itemId,
            location_id: locationId,
            quantity: quantity,
            last_updated: new Date().toISOString()
          },
          { onConflict: 'item_id,location_id' }
        )
        .select(`
          *,
          item:items_fyngan_2024(name, unit),
          location:locations_fyngan_2024(name)
        `)
        .single();

      if (error) throw error;

      dispatch({ type: 'UPDATE_STOCK_LEVEL', payload: data });

      // Log transaction
      await logTransaction('STOCK_UPDATED', {
        itemId: itemId,
        itemName: item?.name || 'Unknown Item',
        locationId: locationId,
        locationName: location?.name || 'Unknown Location',
        previousQuantity: previousQuantity,
        newQuantity: quantity,
        quantityChange: quantityChange,
        unit: item?.unit || 'unit',
        type: quantityChange > 0 ? 'STOCK_IN' : quantityChange < 0 ? 'STOCK_OUT' : 'STOCK_ADJUSTMENT'
      });

      return data;
    } catch (error) {
      console.error('Error updating stock level:', error);
      throw error;
    }
  };

  const logTransaction = async (type, details) => {
    try {
      const transaction = {
        id: uuidv4(),
        type,
        timestamp: new Date().toISOString(),
        details,
        user_name: user?.user_metadata?.name || user?.email || 'System'
      };

      const { data, error } = await supabase
        .from('transactions_fyngan_2024')
        .insert([transaction])
        .select()
        .single();

      if (error) {
        if (error.message && error.message.includes('does not exist')) {
          console.log('⚠️ Transactions table does not exist yet, skipping transaction logging');
          return null;
        }
        throw error;
      }

      dispatch({ type: 'ADD_TRANSACTION', payload: data });
      return data;
    } catch (error) {
      console.error('⚠️ Error logging transaction:', error);
      return null;
    }
  };

  // Utility functions
  const getStockAlerts = () => {
    const alerts = [];
    state.items.forEach(item => {
      const totalStock = state.stockLevels
        .filter(stock => stock.item_id === item.id)
        .reduce((sum, stock) => sum + parseFloat(stock.quantity || 0), 0);

      if (totalStock <= parseFloat(item.min_stock || 0)) {
        alerts.push({
          id: `${item.id}-low`,
          type: 'low',
          itemName: item.name,
          currentStock: totalStock,
          minStock: parseFloat(item.min_stock || 0),
          severity: totalStock === 0 ? 'critical' : 'warning'
        });
      }
    });
    return alerts;
  };

  const getLocationStock = (locationId) => {
    return state.stockLevels.filter(stock => stock.location_id === locationId);
  };

  const getItemStock = (itemId) => {
    return state.stockLevels.filter(stock => stock.item_id === itemId);
  };

  const getTotalStock = (itemId) => {
    return state.stockLevels
      .filter(stock => stock.item_id === itemId)
      .reduce((sum, stock) => sum + parseFloat(stock.quantity || 0), 0);
  };

  const formatQuantity = (quantity) => {
    const num = parseFloat(quantity || 0);
    return num % 1 === 0 ? num.toString() : num.toFixed(2);
  };

  const value = {
    ...state,
    dispatch,
    // CRUD operations
    addLocation,
    updateLocation,
    deleteLocation,
    addCategory,
    updateCategory,
    deleteCategory,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addItem,
    updateItem,
    deleteItem,
    updateStockLevel,
    // Utility functions
    getStockAlerts,
    getLocationStock,
    getItemStock,
    getTotalStock,
    formatQuantity,
    // Refresh functions
    loadLocations,
    loadCategories,
    loadSuppliers,
    loadItems,
    loadStockLevels,
    loadTransactions,
    refreshAllData
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}