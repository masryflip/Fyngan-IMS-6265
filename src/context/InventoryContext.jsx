import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../lib/supabase';

const InventoryContext = createContext();

const initialState = {
  locations: [],
  categories: [],
  suppliers: [],
  items: [],
  stockLevels: [],
  transactions: [],
  isLoading: false,
  error: null,
  isOnline: true
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
    case 'SET_LOCATIONS':
      return { ...state, locations: action.payload, isLoading: false };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload, isLoading: false };
    case 'SET_SUPPLIERS':
      return { ...state, suppliers: action.payload, isLoading: false };
    case 'SET_ITEMS':
      return { ...state, items: action.payload, isLoading: false };
    case 'SET_STOCK_LEVELS':
      return { ...state, stockLevels: action.payload, isLoading: false };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload, isLoading: false };
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
        stock =>
          stock.item_id === action.payload.item_id && stock.location_id === action.payload.location_id
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

  // Database operations
  const loadLocations = async () => {
    try {
      console.log("Loading locations...");
      const { data, error } = await supabase
        .from('locations_fyngan_2024')
        .select('*')
        .order('name');
      
      if (error) throw error;
      console.log("Loaded locations:", data?.length || 0);
      
      // Create default location if none exists
      if (!data || data.length === 0) {
        const defaultLocation = {
          name: 'Main Store',
          address: 'Main Location',
          type: 'retail'
        };
        
        const { data: newLocation, error: createError } = await supabase
          .from('locations_fyngan_2024')
          .insert([defaultLocation])
          .select();
          
        if (createError) throw createError;
        
        dispatch({ type: 'SET_LOCATIONS', payload: newLocation || [] });
      } else {
        dispatch({ type: 'SET_LOCATIONS', payload: data || [] });
      }
    } catch (error) {
      console.error('Error loading locations:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const loadCategories = async () => {
    try {
      console.log("Loading categories...");
      const { data, error } = await supabase
        .from('categories_fyngan_2024')
        .select('*')
        .order('name');
      
      if (error) throw error;
      console.log("Loaded categories:", data?.length || 0);
      
      // Create default category if none exists
      if (!data || data.length === 0) {
        const defaultCategory = {
          name: 'General',
          description: 'Default category'
        };
        
        const { data: newCategory, error: createError } = await supabase
          .from('categories_fyngan_2024')
          .insert([defaultCategory])
          .select();
          
        if (createError) throw createError;
        
        dispatch({ type: 'SET_CATEGORIES', payload: newCategory || [] });
      } else {
        dispatch({ type: 'SET_CATEGORIES', payload: data || [] });
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const loadSuppliers = async () => {
    try {
      console.log("Loading suppliers...");
      const { data, error } = await supabase
        .from('suppliers_fyngan_2024')
        .select('*')
        .order('name');
      
      if (error) throw error;
      console.log("Loaded suppliers:", data?.length || 0);
      
      // Create default supplier if none exists
      if (!data || data.length === 0) {
        const defaultSupplier = {
          name: 'Default Supplier',
          contact: 'Contact Person',
          email: 'contact@example.com',
          phone: '123-456-7890'
        };
        
        const { data: newSupplier, error: createError } = await supabase
          .from('suppliers_fyngan_2024')
          .insert([defaultSupplier])
          .select();
          
        if (createError) throw createError;
        
        dispatch({ type: 'SET_SUPPLIERS', payload: newSupplier || [] });
      } else {
        dispatch({ type: 'SET_SUPPLIERS', payload: data || [] });
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const loadItems = async () => {
    try {
      console.log("Loading items...");
      const { data, error } = await supabase
        .from('items_fyngan_2024')
        .select(`
          *,
          category:categories_fyngan_2024(name),
          supplier:suppliers_fyngan_2024(name)
        `)
        .order('name');
      
      if (error) throw error;
      console.log("Loaded items:", data?.length || 0);
      
      // Create default item if none exists and we have categories and suppliers
      if ((!data || data.length === 0) && state.categories.length > 0 && state.suppliers.length > 0) {
        const defaultItem = {
          name: 'Sample Item',
          category_id: state.categories[0].id,
          supplier_id: state.suppliers[0].id,
          unit: 'piece',
          min_stock: 5,
          max_stock: 20
        };
        
        const { data: newItem, error: createError } = await supabase
          .from('items_fyngan_2024')
          .insert([defaultItem])
          .select(`
            *,
            category:categories_fyngan_2024(name),
            supplier:suppliers_fyngan_2024(name)
          `);
          
        if (createError) throw createError;
        
        dispatch({ type: 'SET_ITEMS', payload: newItem || [] });
      } else {
        dispatch({ type: 'SET_ITEMS', payload: data || [] });
      }
    } catch (error) {
      console.error('Error loading items:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const loadStockLevels = async () => {
    try {
      console.log("Loading stock levels...");
      const { data, error } = await supabase
        .from('stock_levels_fyngan_2024')
        .select(`
          *,
          item:items_fyngan_2024(name,unit),
          location:locations_fyngan_2024(name)
        `)
        .order('last_updated', { ascending: false });
      
      if (error) throw error;
      console.log("Loaded stock levels:", data?.length || 0);
      dispatch({ type: 'SET_STOCK_LEVELS', payload: data || [] });
    } catch (error) {
      console.error('Error loading stock levels:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const loadTransactions = async () => {
    try {
      console.log("Loading transactions...");
      const { data, error } = await supabase
        .from('transactions_fyngan_2024')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      console.log("Loaded transactions:", data?.length || 0);
      dispatch({ type: 'SET_TRANSACTIONS', payload: data || [] });
    } catch (error) {
      console.error('Error loading transactions:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // Load all data on mount
  useEffect(() => {
    const loadAllData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      try {
        // First, check if tables exist
        const { data: tableData, error: tableError } = await supabase
          .from('locations_fyngan_2024')
          .select('count');
        
        if (tableError) {
          // Tables don't exist, create them
          await createTables();
        }
        
        // Load data in sequence to ensure dependencies
        await loadLocations();
        await loadCategories();
        await loadSuppliers();
        await loadItems();
        await loadStockLevels();
        await loadTransactions();
      } catch (error) {
        console.error('Error loading data:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadAllData();
  }, []);

  // Create database tables if they don't exist
  const createTables = async () => {
    try {
      console.log("Creating database tables...");
      
      // Create locations table
      await supabase.rpc('create_locations_table_if_not_exists');
      
      // Create categories table
      await supabase.rpc('create_categories_table_if_not_exists');
      
      // Create suppliers table
      await supabase.rpc('create_suppliers_table_if_not_exists');
      
      // Create items table
      await supabase.rpc('create_items_table_if_not_exists');
      
      // Create stock levels table
      await supabase.rpc('create_stock_levels_table_if_not_exists');
      
      // Create transactions table
      await supabase.rpc('create_transactions_table_if_not_exists');
      
      console.log("Database tables created successfully");
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  };

  // CRUD operations
  const addLocation = async (locationData) => {
    try {
      const { data, error } = await supabase
        .from('locations_fyngan_2024')
        .insert([locationData])
        .select()
        .single();

      if (error) throw error;
      dispatch({ type: 'ADD_LOCATION', payload: data });

      // Log transaction
      await logTransaction('LOCATION_ADDED', {
        locationId: data.id,
        locationName: data.name,
        address: data.address,
        type: data.type
      });

      return data;
    } catch (error) {
      console.error('Error adding location:', error);
      throw error;
    }
  };

  const updateLocation = async (id, locationData) => {
    try {
      const { data, error } = await supabase
        .from('locations_fyngan_2024')
        .update(locationData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      dispatch({ type: 'UPDATE_LOCATION', payload: data });

      // Log transaction
      await logTransaction('LOCATION_UPDATED', {
        locationId: data.id,
        locationName: data.name,
        changes: locationData
      });

      return data;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  };

  const deleteLocation = async (id) => {
    try {
      const location = state.locations.find(loc => loc.id === id);
      const { error } = await supabase
        .from('locations_fyngan_2024')
        .delete()
        .eq('id', id);

      if (error) throw error;
      dispatch({ type: 'DELETE_LOCATION', payload: id });

      // Log transaction
      await logTransaction('LOCATION_DELETED', {
        locationId: id,
        locationName: location?.name || 'Unknown Location'
      });
    } catch (error) {
      console.error('Error deleting location:', error);
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

      // Log transaction
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

      // Log transaction
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

      // Log transaction
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

      // Log transaction
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

      // Log transaction
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

      // Log transaction
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

      // Log transaction
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

      // Log transaction
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

      // Log transaction
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
          item:items_fyngan_2024(name,unit),
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
        user_name: 'System'
      };

      const { data, error } = await supabase
        .from('transactions_fyngan_2024')
        .insert([transaction])
        .select()
        .single();

      if (error) throw error;
      dispatch({ type: 'ADD_TRANSACTION', payload: data });
      return data;
    } catch (error) {
      console.error('Error logging transaction:', error);
      // Don't throw error for transaction logging failures
    }
  };

  // Utility functions
  const getStockAlerts = () => {
    const alerts = [];
    state.items.forEach(item => {
      const totalStock = state.stockLevels
        .filter(stock => stock.item_id === item.id)
        .reduce((sum, stock) => sum + parseFloat(stock.quantity), 0);

      if (totalStock <= item.min_stock) {
        alerts.push({
          id: `${item.id}-low`,
          type: 'low',
          itemName: item.name,
          currentStock: totalStock,
          minStock: item.min_stock,
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
      .reduce((sum, stock) => sum + parseFloat(stock.quantity), 0);
  };

  const formatQuantity = (quantity) => {
    const num = parseFloat(quantity);
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
    loadTransactions
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