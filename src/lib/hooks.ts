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

// Helper utilities for localStorage persistence
const getLocalData = <T>(key: string): T[] => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const setLocalData = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save local data:', e);
  }
};

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
  const { data, setData, loading, setLoading, error, setError } = useLoading<Customer[]>(() =>
    getLocalData<Customer>('finlec_customers')
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchCustomers();
      setData((prev) => {
        const merged = mergeWithPending(prev, rows);
        setLocalData('finlec_customers', merged);
        return merged;
      });
    } catch (e) {
      // Keep existing local items even if backend fails
      const currentLocal = getLocalData<Customer>('finlec_customers');
      setData((prev) => (prev.length > 0 ? prev : currentLocal));
    } finally {
      setLoading(false);
    }
  }, [setData, setLoading, setError]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(
    (input: { name: string; email?: string; phone?: string }) => {
      const local: Customer = {
        id: crypto.randomUUID(),
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        created_at: new Date().toISOString(),
      };

      setData((prev) => {
        const next = [local, ...prev];
        setLocalData('finlec_customers', next);
        return next;
      });

      void createCustomer(input)
        .then((created) =>
          setData((prev) => {
            const next = prev.map((c) => (c.id === local.id ? created : c));
            setLocalData('finlec_customers', next);
            return next;
          })
        )
        .catch(() => {});

      return Promise.resolve(local);
    },
    [setData]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteCustomer(id);
      } catch (e) {
        // Continue removing locally
      }
      setData((prev) => {
        const next = prev.filter((c) => c.id !== id);
        setLocalData('finlec_customers', next);
        return next;
      });
    },
    [setData]
  );

  return { customers: data, setCustomers: setData, loading, error, reload: load, add, remove };
}

export function useProducts() {
  const { data, setData, loading, setLoading, error, setError } = useLoading<Product[]>(() =>
    getLocalData<Product>('finlec_products')
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchProducts();
      setData((prev) => {
        const merged = mergeWithPending(prev, rows);
        setLocalData('finlec_products', merged);
        return merged;
      });
    } catch (e) {
      // Keep existing local items even if backend fails
      const currentLocal = getLocalData<Product>('finlec_products');
      setData((prev) => (prev.length > 0 ? prev : currentLocal));
    } finally {
      setLoading(false);
    }
  }, [setData, setLoading, setError]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(
    (input: { name: string; sku?: string; price: number; stock: number; tax_rate: number }) => {
      const local: Product = {
        id: crypto.randomUUID(),
        name: input.name,
        sku: input.sku ?? null,
        price: input.price,
        stock: input.stock,
        tax_rate: input.tax_rate,
        created_at: new Date().toISOString(),
      };

      setData((prev) => {
        const next = [local, ...prev];
        setLocalData('finlec_products', next);
        return next;
      });

      void createProduct(input)
        .then((created) =>
          setData((prev) => {
            const next = prev.map((p) => (p.id === local.id ? created : p));
            setLocalData('finlec_products', next);
            return next;
          })
        )
        .catch(() => {});

      return Promise.resolve(local);
    },
    [setData]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteProduct(id);
      } catch (e) {
        // Continue removing locally
      }
      setData((prev) => {
        const next = prev.filter((p) => p.id !== id);
        setLocalData('finlec_products', next);
        return next;
      });
    },
    [setData]
  );

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

  useEffect(() => {
    load();
  }, [load]);

  return { invoices: data, setInvoices: setData, loading, error, reload: load };
}