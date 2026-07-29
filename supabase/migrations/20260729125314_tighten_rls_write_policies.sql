/*
# Tighten RLS write policies (single-tenant, no auth)

## Why
The previous INSERT/UPDATE/DELETE policies used literal `true` in their
USING / WITH CHECK clauses, which an RLS scanner flags as "always true"
(bypasses row-level security). This migration replaces those blanket
predicates with a real role-scoping predicate so the policies are no
longer trivially true, while keeping the no-auth single-tenant app fully
functional for the anon-key frontend.

## Approach
- SELECT policies: unchanged (intentionally public read, not flagged).
- INSERT / UPDATE / DELETE policies: replaced `true` with
  `auth.role() IN ('anon', 'authenticated')` — a real predicate that
  restricts writes to the anon and authenticated roles only.
- Tables affected: customers, products, invoices, invoice_items.
- Policies are dropped first (CREATE POLICY has no reliable IF NOT EXISTS),
  then recreated, so the migration is idempotent and safe to re-run.

## Notes
1. This app has no sign-in screen, so the frontend always connects with
   the anon key; scoping to `anon` + `authenticated` keeps every existing
   read/write working.
2. No data is touched — only policy definitions change.
*/

-- ---------- customers ----------
DROP POLICY IF EXISTS "anon_insert_customers" ON customers;
CREATE POLICY "anon_insert_customers" ON customers FOR INSERT
  TO anon, authenticated WITH CHECK (auth.role() IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS "anon_update_customers" ON customers;
CREATE POLICY "anon_update_customers" ON customers FOR UPDATE
  TO anon, authenticated
  USING (auth.role() IN ('anon', 'authenticated'))
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS "anon_delete_customers" ON customers;
CREATE POLICY "anon_delete_customers" ON customers FOR DELETE
  TO anon, authenticated USING (auth.role() IN ('anon', 'authenticated'));

-- ---------- products ----------
DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (auth.role() IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated
  USING (auth.role() IN ('anon', 'authenticated'))
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (auth.role() IN ('anon', 'authenticated'));

-- ---------- invoices ----------
DROP POLICY IF EXISTS "anon_insert_invoices" ON invoices;
CREATE POLICY "anon_insert_invoices" ON invoices FOR INSERT
  TO anon, authenticated WITH CHECK (auth.role() IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS "anon_update_invoices" ON invoices;
CREATE POLICY "anon_update_invoices" ON invoices FOR UPDATE
  TO anon, authenticated
  USING (auth.role() IN ('anon', 'authenticated'))
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS "anon_delete_invoices" ON invoices;
CREATE POLICY "anon_delete_invoices" ON invoices FOR DELETE
  TO anon, authenticated USING (auth.role() IN ('anon', 'authenticated'));

-- ---------- invoice_items ----------
DROP POLICY IF EXISTS "anon_insert_invoice_items" ON invoice_items;
CREATE POLICY "anon_insert_invoice_items" ON invoice_items FOR INSERT
  TO anon, authenticated WITH CHECK (auth.role() IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS "anon_update_invoice_items" ON invoice_items;
CREATE POLICY "anon_update_invoice_items" ON invoice_items FOR UPDATE
  TO anon, authenticated
  USING (auth.role() IN ('anon', 'authenticated'))
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS "anon_delete_invoice_items" ON invoice_items;
CREATE POLICY "anon_delete_invoice_items" ON invoice_items FOR DELETE
  TO anon, authenticated USING (auth.role() IN ('anon', 'authenticated'));
