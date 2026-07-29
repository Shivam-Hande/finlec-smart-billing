import { useCallback, useEffect, useState } from 'react';
import {
  fetchCustomers,
  fetchProducts,
  fetchInvoices,
  createCustomer,
  createProduct,
  deleteCustomer,
  deleteProduct,
} from '@/lib/api';
import type { Customer, Product, InvoiceWithDetails } from '@/lib/types';

export function useLoading<T>(initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  return { data, setData, loading, setLoading, error, setError };
}

export function useCustomers() {
  const { data, setData, loading, setLoading, error, setError } = useLoading<Customer[]>([]);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchCustomers();
      setData(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [setData, setLoading, setError]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (input: { name: string; email?: string; phone?: string }) => {
    const created = await createCustomer(input);
    setData((prev) => [created, ...prev]);
    return created;
  }, [setData]);

  const remove = useCallback(async (id: string) => {
    await deleteCustomer(id);
    setData((prev) => prev.filter((c) => c.id !== id));
  }, [setData]);

  return { customers: data, setCustomers: setData, loading, error, reload: load, add, remove };
}

export function useProducts() {
  const { data, setData, loading, setLoading, error, setError } = useLoading<Product[]>([]);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchProducts();
      setData(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [setData, setLoading, setError]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (input: {
    name: string; sku?: string; price: number; stock: number; tax_rate: number;
  }) => {
    const created = await createProduct(input);
    setData((prev) => [created, ...prev]);
    return created;
  }, [setData]);

  const remove = useCallback(async (id: string) => {
    await deleteProduct(id);
    setData((prev) => prev.filter((p) => p.id !== id));
  }, [setData]);

  return { products: data, setProducts: setData, loading, error, reload: load, add, remove };
}

export function useInvoices() {
  const { data, setData, loading, setLoading, error, setError } = useLoading<InvoiceWithDetails[]>([]);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchInvoices();
      setData(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [setData, setLoading, setError]);

  useEffect(() => { load(); }, [load]);

  return { invoices: data, setInvoices: setData, loading, error, reload: load };
}
