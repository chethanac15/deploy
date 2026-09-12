// ==============================================================================
// APNI ESTATE INTERIORS - BOQ MODAL (ADD & EDIT BOQ LINE ITEM)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { BOQItem, Room } from '../../types';
import { Layers, IndianRupee, Hash, Tag, FileText, AlertCircle } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

const BOQ_CATEGORIES = [
  'Civil Work',
  'Carpentry',
  'Electrical',
  'Plumbing',
  'Painting',
  'Furniture',
  'Lighting',
  'Materials',
  'Decor',
  'Labour',
  'Other'
];

const BOQ_UNITS = [
  'Nos',
  'Sq Ft',
  'Running Ft',
  'Sheets',
  'Kg',
  'Litres',
  'Days',
  'Lump Sum',
  'Other'
];

interface BOQModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  defaultRoomId?: string;
  itemToEdit?: BOQItem | null;
}

export const BOQModal: React.FC<BOQModalProps> = ({
  isOpen,
  onClose,
  projectId,
  defaultRoomId,
  itemToEdit
}) => {
  const { projects, addBOQItem, updateBOQItem } = useApp();

  const currentProject = projects.find(p => p.id === projectId);
  const rooms: Room[] = currentProject?.rooms || [];

  const [roomId, setRoomId] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Civil Work');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState<string>('Sq Ft');
  const [rate, setRate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (itemToEdit) {
        setRoomId(itemToEdit.room_id || '');
        setItemName(itemToEdit.item_name || '');
        setDescription(itemToEdit.description || '');
        setCategory(itemToEdit.category || 'Civil Work');
        setQuantity(itemToEdit.quantity?.toString() || '1');
        setUnit(itemToEdit.unit || 'Sq Ft');
        setRate(itemToEdit.rate?.toString() || '0');
      } else {
        setRoomId(defaultRoomId || (rooms.length > 0 ? rooms[0].id : ''));
        setItemName('');
        setDescription('');
        setCategory('Civil Work');
        setQuantity('1');
        setUnit('Sq Ft');
        setRate('');
      }
    }
  }, [isOpen, itemToEdit, defaultRoomId, rooms]);

  const numQty = Math.max(0, parseFloat(quantity) || 0);
  const numRate = Math.max(0, parseFloat(rate.replace(/,/g, '')) || 0);
  const estimatedCost = numQty * numRate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!itemName.trim()) {
      setErrorMsg('Please provide an item name.');
      return;
    }
    if (numQty <= 0) {
      setErrorMsg('Quantity must be greater than 0.');
      return;
    }
    if (numRate < 0) {
      setErrorMsg('Rate cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (itemToEdit) {
        await updateBOQItem(itemToEdit.id, {
          room_id: roomId || undefined,
          item_name: itemName.trim(),
          description: description.trim() || undefined,
          category,
          quantity: numQty,
          unit,
          rate: numRate,
          estimated_cost: estimatedCost
        });
      } else {
        await addBOQItem({
          project_id: projectId,
          room_id: roomId || undefined,
          item_name: itemName.trim(),
          description: description.trim() || undefined,
          category,
          quantity: numQty,
          unit,
          rate: numRate,
          estimated_cost: estimatedCost
        });
      }

      onClose();
    } catch (err: any) {
      console.error('Failed to save BOQ item:', err);
      setErrorMsg(err.message || 'Failed to save BOQ line item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={itemToEdit ? 'Edit BOQ Item' : 'Add BOQ Line Item'}
      subtitle={
        currentProject
          ? `For ${currentProject.name} estimate and costing scope`
          : 'Record cost estimate line item'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Room Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Room / Scope Area
          </label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
          >
            <option value="">-- Project-Wide Scope (No Room) --</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.room_type || 'Room'})
              </option>
            ))}
          </select>
        </div>

        {/* Item Name & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Item Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. False Ceiling / Modular Kitchen"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
            >
              {BOQ_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantity, Unit, Rate */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Quantity <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              placeholder="e.g. 200"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Unit <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
            >
              {BOQ_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Rate (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                ₹
              </div>
              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="e.g. 120"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Live Calculation Banner */}
        <div className="p-3.5 bg-brand-50/70 border border-brand-200/80 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
              ∑
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-900">
                Estimated Line Cost
              </span>
              <p className="text-[11px] text-brand-700">
                {numQty} {unit} × ₹{numRate.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-brand-900 font-display">
              {formatINR(estimatedCost)}
            </span>
          </div>
        </div>

        {/* Description / Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Specifications & Material Notes
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Saint-Gobain Gyproc board with GI framing and perimeter channel."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-brand-500 focus:outline-none resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-sm transition-all"
          >
            {isSubmitting ? 'Saving...' : itemToEdit ? 'Save Changes' : 'Add to BOQ'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
