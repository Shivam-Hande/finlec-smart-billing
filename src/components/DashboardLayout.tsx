import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  FilePlus2,
  ReceiptText,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { Dashboard } from '@/views/Dashboard';
import { CustomersView } from '@/views/CustomersView';
import { ProductsView } from '@/views/ProductsView';
import { InvoiceBuilder } from '@/views/InvoiceBuilder';
import { InvoicesView } from '@/views/InvoicesView';

type View = 'dashboard' | 'customers' | 'products' | 'builder' | 'invoices';

const NAV: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'products', label: 'Inventory', icon: Package },
  { id: 'builder', label: 'New Invoice', icon: FilePlus2 },
  { id: 'invoices', label: 'Invoices', icon: ReceiptText },
];

export function DashboardLayout() {
  const [view, setView] = useState<View>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [view]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Smart Billing</p>
            <p className="text-[11px] text-slate-500">Invoice & Inventory</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t border-slate-800 text-[11px] text-slate-500">
          <p className="font-medium text-slate-400">Smart Billing App</p>
          <p className="mt-0.5">Production-ready billing suite</p>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14 bg-white border-b border-slate-200">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-700"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-semibold text-slate-900 text-sm">Smart Billing</span>
          <span className="w-9" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {view === 'dashboard' && <Dashboard onNavigate={setView} />}
          {view === 'customers' && <CustomersView />}
          {view === 'products' && <ProductsView />}
          {view === 'builder' && <InvoiceBuilder onSaved={() => setView('invoices')} />}
          {view === 'invoices' && <InvoicesView />}
        </main>
      </div>
    </div>
  );
}
