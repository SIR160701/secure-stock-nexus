
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StockItem {
  id: string;
  name: string;
  description?: string;
  sku: string;
  category: string;
  quantity: number;
  minimum_quantity?: number;
  unit_price?: number;
  supplier?: string;
  location?: string;
  park_number?: string;
  serial_number?: string;
  assigned_to?: string;
  status: 'active' | 'inactive' | 'discontinued';
  previous_status?: string;
  created_at: string;
  updated_at: string;
}

export const useStock = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stockItems = [], isLoading, error } = useQuery({
    queryKey: ['stock-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_items')
        .select(`
          *,
          employees:assigned_to(first_name, last_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as StockItem[];
    },
  });

  const createStockItem = useMutation({
    mutationFn: async (newItem: Omit<StockItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('stock_items')
        .insert([newItem])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
      toast({
        title: "Article ajouté",
        description: "L'article a été ajouté au stock avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout de l'article.",
        variant: "destructive",
      });
    },
  });

  const updateStockItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StockItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('stock_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
      toast({
        title: "Article mis à jour",
        description: "L'article a été mis à jour avec succès.",
      });
    },
  });

  const deleteStockItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stock_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
      toast({
        title: "Article supprimé",
        description: "L'article a été supprimé du stock avec succès.",
      });
    },
  });

  return {
    stockItems,
    isLoading,
    error,
    createStockItem,
    updateStockItem,
    deleteStockItem,
  };
};
