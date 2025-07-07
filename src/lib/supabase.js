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

// Create stored procedures for table creation if they don't exist
const setupStoredProcedures = async () => {
  try {
    // Create locations table procedure
    await supabase.rpc('create_procedure_if_not_exists', {
      procedure_name: 'create_locations_table_if_not_exists',
      procedure_sql: `
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
      `
    });

    // Create categories table procedure
    await supabase.rpc('create_procedure_if_not_exists', {
      procedure_name: 'create_categories_table_if_not_exists',
      procedure_sql: `
        CREATE TABLE IF NOT EXISTS categories_fyngan_2024 (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        ALTER TABLE categories_fyngan_2024 ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all access" ON categories_fyngan_2024;
        CREATE POLICY "Allow all access" ON categories_fyngan_2024 USING (true) WITH CHECK (true);
      `
    });

    // Create suppliers table procedure
    await supabase.rpc('create_procedure_if_not_exists', {
      procedure_name: 'create_suppliers_table_if_not_exists',
      procedure_sql: `
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
      `
    });

    // Create items table procedure
    await supabase.rpc('create_procedure_if_not_exists', {
      procedure_name: 'create_items_table_if_not_exists',
      procedure_sql: `
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
      `
    });

    // Create stock levels table procedure
    await supabase.rpc('create_procedure_if_not_exists', {
      procedure_name: 'create_stock_levels_table_if_not_exists',
      procedure_sql: `
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
      `
    });

    // Create transactions table procedure
    await supabase.rpc('create_procedure_if_not_exists', {
      procedure_name: 'create_transactions_table_if_not_exists',
      procedure_sql: `
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
      `
    });

    // Create procedure creation helper procedure
    await supabase.rpc('create_procedure_creation_helper', {
      sql_statement: `
        CREATE OR REPLACE FUNCTION create_procedure_if_not_exists(
          procedure_name TEXT,
          procedure_sql TEXT
        ) RETURNS void AS $$
        BEGIN
          EXECUTE procedure_sql;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error creating procedure %: %', procedure_name, SQLERRM;
        END;
        $$ LANGUAGE plpgsql;
      `
    }).catch(err => {
      // This might fail if the function already exists, which is fine
      console.log('Note: create_procedure_if_not_exists setup:', err.message);
    });

  } catch (error) {
    console.error('Error setting up stored procedures:', error);
  }
};

// Run the setup
setupStoredProcedures();

// Test connection on initialization
supabase
  .from('locations_fyngan_2024')
  .select('count')
  .limit(1)
  .then(
    result => console.log('✅ Supabase connected successfully'),
    error => console.error('❌ Supabase connection failed:', error)
  )

export default supabase