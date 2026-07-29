import { useState } from 'react';
import { Package, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import {
  Card,
  PageHeader,
  Button,
  Input,
  Modal,
  EmptyState,
} from '@/components/ui';
import { useProducts } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/types';
import type { Product } from '@/lib/types';

export function ProductsView() {
  const { products, loading, reload, add, remove } = useProducts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', sku: '', price: '', stock: '', tax_rate: '' });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', sku: '', price: '', stock: '', tax_rate: '' });
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku ?? '',
      price: String(p.price),
      stock: String(p.stock),
      tax_rate: String(p.tax_rate),
    });
    setModalOpen(true);
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim() || undefined,
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      tax_rate: Number(form.tax_rate) || 0,
    };
    try {
      if (editing) {
        await supabase.from('products').update({ ...payload, sku: payload.sku || null }).eq('id', editing.id);
        await reload();
      } else {
        await add(payload);
      }
    } catch {
      // error surfaced via hook state
    } finally {
      setSaving(false);
      setModalOpen(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await remove(id);
    } catch {
      // error surfaced via hook state
    } finally {
      setConfirmDelete(null);
    }
  }

  const lowStock = products.filter((p) => p.stock <= 5);

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <PageHeader
        title="Inventory"
        subtitle={`${products.length} products · ${lowStock.length} low on stock`}
        action={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        }
      />

      {lowStock.length > 0 && (
        <div className="mb-4 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{lowStock.length} product{lowStock.length > 1 ? 's' : ''} running low (≤5 in stock)</span>
        </div>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Loading…</div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Package className="w-7 h-7" />}
            title="No products yet"
            subtitle="Add products to build invoices with live pricing and tax"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3 text-right">Price</th>
                  <th className="px-6 py-3 text-right">Tax %</th>
                  <th className="px-6 py-3 text-right">Stock</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-3.5 font-medium text-slate-900">{p.name}</td>
                    <td className="px-6 py-3.5 text-slate-500 font-mono text-xs">{p.sku ?? '—'}</td>
                    <td className="px-6 py-3.5 text-right font-medium text-slate-900">{formatCurrency(Number(p.price))}</td>
                    <td className="px-6 py-3.5 text-right text-slate-600">{Number(p.tax_rate)}%</td>
                    <td className="px-6 py-3.5 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.stock <= 5
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(p)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add Product'}>
        <div className="space-y-4">
          <Input label="Product name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Widget Pro" required />
          <Input label="SKU" value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} placeholder="WDG-001" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price ($)" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} placeholder="0.00" />
            <Input label="Tax rate (%)" type="number" value={form.tax_rate} onChange={(v) => setForm({ ...form, tax_rate: v })} placeholder="0" />
          </div>
          <Input label="Stock count" type="number" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} placeholder="0" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add product'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete product" maxWidth="max-w-sm">
        <p className="text-sm text-slate-600">
          Delete <span className="font-semibold text-slate-900">{confirmDelete?.name}</span>? Past invoices keep a snapshot, but this product can't be added to new ones.
        </p>
        <div className="flex justify-end gap-2 pt-5">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => confirmDelete && handleDelete(confirmDelete.id)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
