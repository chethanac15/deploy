// ==============================================================================
// APNI ESTATE INTERIORS - BOQ (BILL OF QUANTITIES) SERVICE
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { BOQItem } from '../types';

export const boqService = {
  /**
   * Fetch all BOQ items for an organization or filtered by project
   */
  async getBOQItems(organizationId?: string, projectId?: string): Promise<BOQItem[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('boq_items')
      .select('*')
      .order('created_at', { ascending: true });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      organization_id: item.organization_id,
      project_id: item.project_id,
      room_id: item.room_id || undefined,
      item_name: item.item_name,
      description: item.description || '',
      category: item.category || 'Civil Work',
      quantity: Number(item.quantity) || 0,
      unit: item.unit || 'Nos',
      rate: Number(item.rate) || 0,
      estimated_cost: Number(item.estimated_cost) || (Number(item.quantity) * Number(item.rate)) || 0,
      actual_cost: item.actual_cost ? Number(item.actual_cost) : undefined,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  },

  /**
   * Fetch all BOQ items belonging to a specific room
   */
  async getBOQItemsByRoom(roomId: string): Promise<BOQItem[]> {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('boq_items')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      organization_id: item.organization_id,
      project_id: item.project_id,
      room_id: item.room_id || undefined,
      item_name: item.item_name,
      description: item.description || '',
      category: item.category || 'Civil Work',
      quantity: Number(item.quantity) || 0,
      unit: item.unit || 'Nos',
      rate: Number(item.rate) || 0,
      estimated_cost: Number(item.estimated_cost) || (Number(item.quantity) * Number(item.rate)) || 0,
      actual_cost: item.actual_cost ? Number(item.actual_cost) : undefined,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  },

  /**
   * Create a new BOQ item on Supabase
   */
  async createBOQItem(itemData: {
    organization_id: string;
    project_id: string;
    room_id?: string | null;
    item_name: string;
    description?: string;
    category?: string;
    quantity: number;
    unit?: string;
    rate: number;
    estimated_cost?: number;
  }): Promise<BOQItem> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const qty = Math.max(0, Number(itemData.quantity) || 0);
    const rate = Math.max(0, Number(itemData.rate) || 0);
    const estimated_cost = itemData.estimated_cost !== undefined ? itemData.estimated_cost : qty * rate;

    const { data, error } = await supabase
      .from('boq_items')
      .insert({
        organization_id: itemData.organization_id,
        project_id: itemData.project_id,
        room_id: itemData.room_id || null,
        item_name: itemData.item_name.trim(),
        description: itemData.description?.trim() || null,
        category: itemData.category || 'Civil Work',
        quantity: qty,
        unit: itemData.unit || 'Nos',
        rate: rate,
        estimated_cost: estimated_cost
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      organization_id: data.organization_id,
      project_id: data.project_id,
      room_id: data.room_id || undefined,
      item_name: data.item_name,
      description: data.description || '',
      category: data.category,
      quantity: Number(data.quantity),
      unit: data.unit,
      rate: Number(data.rate),
      estimated_cost: Number(data.estimated_cost),
      actual_cost: data.actual_cost ? Number(data.actual_cost) : undefined,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  /**
   * Update an existing BOQ item
   */
  async updateBOQItem(
    id: string,
    updates: Partial<{
      room_id?: string | null;
      item_name: string;
      description?: string;
      category?: string;
      quantity: number;
      unit?: string;
      rate: number;
      estimated_cost?: number;
    }>
  ): Promise<BOQItem> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const updatePayload: Record<string, any> = { ...updates };

    if (updates.room_id !== undefined) {
      updatePayload.room_id = updates.room_id || null;
    }
    if (updates.quantity !== undefined || updates.rate !== undefined) {
      const qty = updates.quantity !== undefined ? Number(updates.quantity) : undefined;
      const rate = updates.rate !== undefined ? Number(updates.rate) : undefined;
      if (qty !== undefined && rate !== undefined) {
        updatePayload.estimated_cost = qty * rate;
      }
    }

    const { data, error } = await supabase
      .from('boq_items')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      organization_id: data.organization_id,
      project_id: data.project_id,
      room_id: data.room_id || undefined,
      item_name: data.item_name,
      description: data.description || '',
      category: data.category,
      quantity: Number(data.quantity),
      unit: data.unit,
      rate: Number(data.rate),
      estimated_cost: Number(data.estimated_cost),
      actual_cost: data.actual_cost ? Number(data.actual_cost) : undefined,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  /**
   * Delete a BOQ item
   */
  async deleteBOQItem(id: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { error } = await supabase
      .from('boq_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
