import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://iprjfyzeklhzkyvgayum.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwcmpmeXpla2xoemt5dmdheXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MDc5NjAsImV4cCI6MjA2NzM4Mzk2MH0.Tuu170ztur_obEsA1UXFboqlvKtFIsxP63Rd0wkM6tk'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables')
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {'X-Client-Info': 'fyngan-inventory'}
  }
})

// Ensure all tables exist before app starts
const ensureTablesExist = async () => {
  try {
    console.log("Ensuring all required tables exist...");
    
    // Create locations table if not exists
    await supabase.rpc('create_locations_table_if_not_exists').catch(err => {
      console.log('Creating locations table directly...');
      return supabase.query(`
        CREATE TABLE IF NOT EXISTS locations_fyngan_2024 (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          address TEXT,
          type TEXT DEFAULT 'retail',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        ALTER TABLE locations_fyngan_2024 ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access" ON locations_fyngan_2024;
        CREATE POLICY "Allow all access" ON locations_fyngan_2024 USING (true) WITH CHECK (true);
      `);
    });
    
    // Create categories table if not exists
    await supabase.rpc('create_categories_table_if_not_exists').catch(err => {
      console.log('Creating categories table directly...');
      return supabase.query(`
        CREATE TABLE IF NOT EXISTS categories_fyngan_2024 (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        ALTER TABLE categories_fyngan_2024 ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access" ON categories_fyngan_2024;
        CREATE POLICY "Allow all access" ON categories_fyngan_2024 USING (true) WITH CHECK (true);
      `);
    });
    
    // Create suppliers table if not exists
    await supabase.rpc('create_suppliers_table_if_not_exists').catch(err => {
      console.log('Creating suppliers table directly...');
      return supabase.query(`
        CREATE TABLE IF NOT EXISTS suppliers_fyngan_2024 (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          contact TEXT,
          email TEXT,
          phone TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        ALTER TABLE suppliers_fyngan_2024 ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access" ON suppliers_fyngan_2024;
        CREATE POLICY "Allow all access" ON suppliers_fyngan_2024 USING (true) WITH CHECK (true);
      `);
    });
    
    // Create items table if not exists
    await supabase.rpc('create_items_table_if_not_exists').catch(err => {
      console.log('Creating items table directly...');
      return supabase.query(`
        CREATE TABLE IF NOT EXISTS items_fyngan_2024 (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          category_id UUID REFERENCES categories_fyngan_2024(id),
          supplier_id UUID REFERENCES suppliers_fyngan_2024(id),
          unit TEXT NOT NULL,
          min_stock NUMERIC DEFAULT 0,
          max_stock NUMERIC DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        ALTER TABLE items_fyngan_2024 ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access" ON items_fyngan_2024;
        CREATE POLICY "Allow all access" ON items_fyngan_2024 USING (true) WITH CHECK (true);
      `);
    });
    
    // Create stock levels table if not exists
    await supabase.rpc('create_stock_levels_table_if_not_exists').catch(err => {
      console.log('Creating stock levels table directly...');
      return supabase.query(`
        CREATE TABLE IF NOT EXISTS stock_levels_fyngan_2024 (
          item_id UUID REFERENCES items_fyngan_2024(id),
          location_id UUID REFERENCES locations_fyngan_2024(id),
          quantity NUMERIC DEFAULT 0,
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          PRIMARY KEY (item_id, location_id)
        );
        ALTER TABLE stock_levels_fyngan_2024 ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access" ON stock_levels_fyngan_2024;
        CREATE POLICY "Allow all access" ON stock_levels_fyngan_2024 USING (true) WITH CHECK (true);
      `);
    });
    
    // Create transactions table if not exists
    await supabase.rpc('create_transactions_table_if_not_exists').catch(err => {
      console.log('Creating transactions table directly...');
      return supabase.query(`
        CREATE TABLE IF NOT EXISTS transactions_fyngan_2024 (
          id UUID PRIMARY KEY,
          type TEXT NOT NULL,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          details JSONB,
          user_name TEXT
        );
        ALTER TABLE transactions_fyngan_2024 ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access" ON transactions_fyngan_2024;
        CREATE POLICY "Allow all access" ON transactions_fyngan_2024 USING (true) WITH CHECK (true);
      `);
    });

    // Insert default data if tables are empty
    await supabase.query(`
      -- Insert default location if none exists
      INSERT INTO locations_fyngan_2024 (name, address, type)
      SELECT 'Main Store', 'Main Location', 'retail'
      WHERE NOT EXISTS (SELECT 1 FROM locations_fyngan_2024 LIMIT 1);

      -- Insert default category if none exists
      INSERT INTO categories_fyngan_2024 (name, description)
      SELECT 'General', 'Default category'
      WHERE NOT EXISTS (SELECT 1 FROM categories_fyngan_2024 LIMIT 1);

      -- Insert default supplier if none exists
      INSERT INTO suppliers_fyngan_2024 (name, contact, email, phone)
      SELECT 'Default Supplier', 'Contact Person', 'contact@example.com', '123-456-7890'
      WHERE NOT EXISTS (SELECT 1 FROM suppliers_fyngan_2024 LIMIT 1);
    `);

    // Add sample items if none exist
    const { data: categoryData } = await supabase.from('categories_fyngan_2024').select('id').limit(1);
    const { data: supplierData } = await supabase.from('suppliers_fyngan_2024').select('id').limit(1);
    
    if (categoryData && categoryData.length > 0 && supplierData && supplierData.length > 0) {
      const categoryId = categoryData[0].id;
      const supplierId = supplierData[0].id;
      
      const { count } = await supabase.from('items_fyngan_2024').select('*', { count: 'exact', head: true });
      
      if (count === 0) {
        await supabase.from('items_fyngan_2024').insert([
          { 
            name: 'Arabica Coffee Beans', 
            category_id: categoryId, 
            supplier_id: supplierId, 
            unit: 'kg', 
            min_stock: 5, 
            max_stock: 20 
          },
          { 
            name: 'Whole Milk', 
            category_id: categoryId, 
            supplier_id: supplierId, 
            unit: 'liter', 
            min_stock: 10, 
            max_stock: 30 
          },
          { 
            name: 'Granulated Sugar', 
            category_id: categoryId, 
            supplier_id: supplierId, 
            unit: 'kg', 
            min_stock: 3, 
            max_stock: 10 
          }
        ]);
      }
    }

    console.log("Database tables setup completed successfully");
  } catch (error) {
    console.error('Error ensuring tables exist:', error);
  }
};

// Run the tables setup
ensureTablesExist();

// Test connection on initialization
supabase
  .from('transactions_fyngan_2024')
  .select('count')
  .limit(1)
  .then(
    result => console.log('✅ Supabase connected successfully'),
    error => {
      console.error('❌ Supabase connection error:', error);
      // Try to create the table directly if it's missing
      if (error.message && error.message.includes('does not exist')) {
        ensureTablesExist().then(() => {
          console.log('🔄 Tables created, retrying connection...');
          supabase
            .from('transactions_fyngan_2024')
            .select('count')
            .limit(1)
            .then(
              () => console.log('✅ Supabase connection successful after table creation'),
              err => console.error('❌ Still having connection issues:', err)
            );
        });
      }
    }
  );

export default supabase;