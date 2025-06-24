
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StockCategory {
  id: string;
  name: string;
  critical_threshold: number;
  created_at: string;
  updated_at: string;
}

export const useStockCategories = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['stock-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as StockCategory[];
    },
  });

  const createCategory = useMutation({
    mutationFn: async (newCategory: { name: string; critical_threshold: number }) => {
      const { data, error } = await supabase
        .from('stock_categories')
        .insert([newCategory])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-categories'] });
      toast({
        title: "Catégorie créée",
        description: "La catégorie a été créée avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de la catégorie.",
        variant: "destructive",
      });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StockCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('stock_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-categories'] });
      toast({
        title: "Catégorie mise à jour",
        description: "La catégorie a été mise à jour avec succès.",
      });
    },
  });

  return {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
  };
};
