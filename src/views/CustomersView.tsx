import { useState } from 'react';
import { Users, Plus, Pencil, Trash2, Mail, Phone } from 'lucide-react';
import {
  Card,
  PageHeader,
  Button,
  Input,
  Modal,
  EmptyState,
} from '@/components/ui';
import { useCustomers } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import type { Customer } from '@/lib/types';

// Edit is still done via supabase directly (the REST API covers GET/POST/DELETE);
// update is an optional route not required by the task spec.

export function CustomersView() {
  const { customers, loading, reload, add, remove } = useCustomers();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);

  function openCreate() {
    setEditing(null);
    setName('');
    setEmail('');
    setPhone('');
    setModalOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setName(c.name);
    setEmail(c.email ?? '');
    setPhone(c.phone ?? '');
    setModalOpen(true);
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await supabase
          .from('customers')
          .update({ name: name.trim(), email: email.trim() || null, phone: phone.trim() || null })
          .eq('id', editing.id);
        await reload();
      } else {
        await add({ name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined });
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

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} ${customers.length === 1 ? 'customer' : 'customers'} in your directory`}
        action={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" /> Add Customer
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Loading…</div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={<Users className="w-7 h-7" />}
            title="No customers yet"
            subtitle="Add your first customer to start invoicing"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {c.email ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" /> {c.email}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {c.phone ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {c.phone}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(c)}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <div className="space-y-4">
          <Input label="Full name" value={name} onChange={setName} placeholder="Jane Doe" required />
          <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="jane@example.com" />
          <Input label="Phone" value={phone} onChange={setPhone} placeholder="+1 555 0100" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add customer'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete customer" maxWidth="max-w-sm">
        <p className="text-sm text-slate-600">
          Delete <span className="font-semibold text-slate-900">{confirmDelete?.name}</span>? This won't remove their past invoices, but the customer link will be cleared.
        </p>
        <div className="flex justify-end gap-2 pt-5">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => confirmDelete && handleDelete(confirmDelete.id)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
