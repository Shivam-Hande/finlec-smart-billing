/*
# Smart Billing Application Schema (single-tenant, no auth)

1. New Tables
- `customers`
  - id (uuid, pk)
  - name (text, not null)
  - email (text)
  - phone (text)
  - created_at (timestamptz)
- `products`
  - id (uuid, pk)
  - name (text, not null)
  - sku (text, unique)
  - price (numeric, not null)
  - stock (integer, default 0)
  - tax_rate (numeric, percent, default 0)
  - created_at (timestamptz)
- `invoices`
  - id (uuid, pk)
  - number (text, unique, human-readable invoice number)
  - customer_id (uuid, fk -> customers)
  - status (text: paid | unpaid | overdue, default unpaid)
  - issue_date (date)
  - due_date (date)
  - discount (numeric, amount, default 0)
  - notes (text)
  - created_at (timestamptz)
- `invoice_items`
  - id (uuid, pk)
  - invoice_id (uuid, fk -> invoices, cascade delete)
  - product_id (uuid, fk -> products, set null on delete)
  - name (text, snapshot of product name)
  - quantity (integer)
  - unit_price (numeric, snapshot)
  - tax_rate (numeric, snapshot)

2. Security
- RLS enabled on all tables.
- Single-tenant no-auth app: policies allow anon + authenticated full CRUD
  because the data is intentionally shared/public.

3. Notes
- Snapshots of product name/price/tax_rate on invoice_items so historical
  invoices remain accurate even if a product is later edited or removed.
- `number` on invoices is unique for display; generated client-side.
*/

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text UNIQUE,
  price numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid','unpaid','overdue')),
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  discount numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 0
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- customers policies
DROP POLICY IF EXISTS "anon_select_customers" ON customers;
CREATE POLICY "anon_select_customers" ON customers FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_customers" ON customers;
CREATE POLICY "anon_insert_customers" ON customers FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_customers" ON customers;
CREATE POLICY "anon_update_customers" ON customers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_customers" ON customers;
CREATE POLICY "anon_delete_customers" ON customers FOR DELETE
  TO anon, authenticated USING (true);

-- products policies
DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);

-- invoices policies
DROP POLICY IF EXISTS "anon_select_invoices" ON invoices;
CREATE POLICY "anon_select_invoices" ON invoices FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_invoices" ON invoices;
CREATE POLICY "anon_insert_invoices" ON invoices FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_invoices" ON invoices;
CREATE POLICY "anon_update_invoices" ON invoices FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_invoices" ON invoices;
CREATE POLICY "anon_delete_invoices" ON invoices FOR DELETE
  TO anon, authenticated USING (true);

-- invoice_items policies
DROP POLICY IF EXISTS "anon_select_invoice_items" ON invoice_items;
CREATE POLICY "anon_select_invoice_items" ON invoice_items FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_invoice_items" ON invoice_items;
CREATE POLICY "anon_insert_invoice_items" ON invoice_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_invoice_items" ON invoice_items;
CREATE POLICY "anon_update_invoice_items" ON invoice_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_invoice_items" ON invoice_items;
CREATE POLICY "anon_delete_invoice_items" ON invoice_items FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
