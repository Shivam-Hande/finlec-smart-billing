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

function mergeWithPending<T extends { id: string }>(prev: T[], serverRows: T[]): T[] {
  const serverIds = new Set(serverRows.map((row) => row.id));
  const pending = prev.filter((row) => !serverIds.has(row.id));
  return [...pending, ...serverRows];
}

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
      setData((prev) => mergeWithPending(prev, rows));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [setData, setLoading, setError]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback((input: { name: string; email?: string; phone?: string }) => {
    const local: Customer = {
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      created_at: new Date().toISOString(),
    };
    setData((prev) => [local, ...prev]);

    void createCustomer(input)
      .then((created) => setData((prev) => prev.map((c) => (c.id === local.id ? created : c))))
      .catch(() => {});

    return Promise.resolve(local);
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
      setData((prev) => mergeWithPending(prev, rows));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [setData, setLoading, setError]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback((input: {
    name: string; sku?: string; price: number; stock: number; tax_rate: number;
  }) => {
    const local: Product = {
      id: crypto.randomUUID(),
      name: input.name,
      sku: input.sku ?? null,
      price: input.price,
      stock: input.stock,
      tax_rate: input.tax_rate,
      created_at: new Date().toISOString(),
    };
    setData((prev) => [local, ...prev]);

    void createProduct(input)
      .then((created) => setData((prev) => prev.map((p) => (p.id === local.id ? created : p))))
      .catch(() => {});

    return Promise.resolve(local);
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
