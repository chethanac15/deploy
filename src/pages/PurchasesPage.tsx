// ==============================================================================
// APNI ESTATE INTERIORS - PURCHASES & PROCUREMENT ORDERS PAGE
// Multi-item purchase orders, vendor tracking, line item breakdowns & fulfillment
// ==============================================================================

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Purchase, PurchaseStatus, PurchasePaymentStatus } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Building2, 
  Calendar, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Edit2, 
  Trash2,
  Package,
  Layers,
  AlertCircle
} from 'lucide-react';
import { PurchaseModal } from '../components/modals/PurchaseModal';
import { EmptyState } from '../components/common/EmptyState';

const FULFILLMENT_FILTERS: ('All' | PurchaseStatus)[] = [
  'All',
  'Draft',
  'Ordered',
  'Partially Received',
  'Received',
  'Cancelled'
];

export const PurchasesPage: React.FC = () => {
  const { purchases, projects, vendors, addPurchase, updatePurchase, deletePurchase } = useApp();
  const { isDemoMode } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | PurchaseStatus>('All');
  const [expandedPoId, setExpandedPoId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = useState<Purchase | null>(null);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const matchesProject = selectedProjectId === 'All' || p.project_id === selectedProjectId;
      const matchesStatus = selectedStatus === 'All' || p.status === selectedStatus;
      const matchesSearch = 
        p.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.projectName && p.projectName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.vendorName && p.vendorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.items && p.items.some(it => it.item_name.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchesProject && matchesStatus && matchesSearch;
    });
  }, [purchases, selectedProjectId, selectedStatus, searchQuery]);

  // Overall Metrics
  const metrics = useMemo(() => {
    const totalSpend = purchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);
    const activeOrders = purchases.filter(p => p.status === 'Ordered' || p.status === 'Partially Received').length;
    const fulfilled = purchases.filter(p => p.status === 'Received').length;
    const draftCount = purchases.filter(p => p.status === 'Draft').length;

    return {
      totalSpend,
      activeOrders,
      fulfilled,
      draftCount
    };
  }, [purchases]);

  const handleSave = async (purchaseData: any) => {
    if (purchaseToEdit) {
      await updatePurchase(purchaseToEdit.id, purchaseData);
    } else {
      await addPurchase(purchaseData);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedPoId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight">
              Purchases & Procurement
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              {purchases.length} Purchase Orders
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Issue purchase orders, track supplier deliveries, and audit multi-item procurement totals.
          </p>
        </div>

        <button
          onClick={() => {
            setPurchaseToEdit(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-sm transition-all hover:shadow hover:-translate-y-0.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-brand-400" />
          <span>+ Create Purchase Order</span>
        </button>
      </div>

      {/* Procurement Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Procurement Value
            </span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 font-display">
            {formatINR(metrics.totalSpend)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            Across all issued purchase orders
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-indigo-100 bg-indigo-50/20 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
              Active In-Transit Orders
            </span>
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-indigo-900 font-display">
            {metrics.activeOrders} Orders
          </div>
          <div className="text-[11px] text-indigo-600 mt-1 font-medium">
            Awaiting site delivery
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Fulfilled Deliveries
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-700 font-display">
            {metrics.fulfilled} Received
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">
            Delivered and verified on site
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-amber-100 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Draft Purchase Orders
            </span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-800 font-display">
            {metrics.draftCount} Drafts
          </div>
          <div className="text-[11px] text-amber-700 mt-1 font-medium">
            Pending vendor quotation sign-off
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search PO number, item, project, or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-xs"
            />
          </div>

          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="All">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {FULFILLMENT_FILTERS.map(st => {
            const active = selectedStatus === st;
            return (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* Purchases List */}
      {filteredPurchases.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No purchase orders found"
          description="Create structured procurement orders for plywood, paint, sanitaryware, or lighting."
          actionLabel="+ Create Purchase Order"
          onAction={() => {
            setPurchaseToEdit(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredPurchases.map((purchase) => {
            const isExpanded = expandedPoId === purchase.id;
            const isReceived = purchase.status === 'Received';
            const isCancelled = purchase.status === 'Cancelled';
            const itemCount = purchase.items?.length || 0;

            return (
              <div
                key={purchase.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:border-brand-300 transition-all overflow-hidden"
              >
                {/* Main Card Row */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-black font-mono text-slate-900 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                        {purchase.po_number}
                      </span>

                      {/* Status Badges */}
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg border ${
                        isReceived
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : isCancelled
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : purchase.status === 'Ordered'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {purchase.status}
                      </span>

                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
                        Payment: {purchase.payment_status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mb-1.5">
                      {purchase.projectName && (
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{purchase.projectName}</span>
                        </span>
                      )}

                      {purchase.vendorName && (
                        <span className="font-semibold text-brand-700">
                          Supplier: {purchase.vendorName}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                      <span>Ordered: {formatDate(purchase.order_date)}</span>
                      {purchase.expected_delivery && (
                        <span>Delivery: {formatDate(purchase.expected_delivery)}</span>
                      )}
                      <span>{itemCount} line {itemCount === 1 ? 'item' : 'items'}</span>
                    </div>
                  </div>

                  {/* Amounts & Expand Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <span className="text-base sm:text-xl font-black text-slate-900 font-display block">
                        {formatINR(purchase.total_amount)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Total Order Cost
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleExpand(purchase.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Items' : 'View Items'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => {
                          setPurchaseToEdit(purchase);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Edit PO"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete purchase order "${purchase.po_number}"?`)) {
                            deletePurchase(purchase.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete PO"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Line Items Table */}
                {isExpanded && (
                  <div className="bg-slate-50/70 p-4 border-t border-slate-200/80 animate-in fade-in duration-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-brand-600" />
                      <span>Line Items Breakdown</span>
                    </h4>

                    {(!purchase.items || purchase.items.length === 0) ? (
                      <div className="text-xs text-slate-400 italic">No line item details available.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                              <th className="py-1.5 px-2">#</th>
                              <th className="py-1.5 px-2">Item Name & Description</th>
                              <th className="py-1.5 px-2 text-center">Qty</th>
                              <th className="py-1.5 px-2 text-center">Unit</th>
                              <th className="py-1.5 px-2 text-right">Unit Rate</th>
                              <th className="py-1.5 px-2 text-right">Line Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/60 font-medium text-slate-700">
                            {purchase.items.map((it, idx) => (
                              <tr key={it.id || idx} className="hover:bg-white/60">
                                <td className="py-2 px-2 text-slate-400 font-mono">{idx + 1}</td>
                                <td className="py-2 px-2">
                                  <span className="font-bold text-slate-900 block">{it.item_name}</span>
                                  {it.description && <span className="text-[11px] text-slate-400">{it.description}</span>}
                                </td>
                                <td className="py-2 px-2 text-center font-bold">{it.quantity}</td>
                                <td className="py-2 px-2 text-center text-slate-500">{it.unit}</td>
                                <td className="py-2 px-2 text-right">{formatINR(it.rate)}</td>
                                <td className="py-2 px-2 text-right font-bold text-slate-900">{formatINR(it.total || (it.quantity * it.rate))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {purchase.notes && (
                      <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                        <strong className="font-semibold text-slate-700">Procurement Notes:</strong> {purchase.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Purchase Modal */}
      <PurchaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        purchaseToEdit={purchaseToEdit}
        projects={projects}
        vendors={vendors}
      />
    </div>
  );
};
