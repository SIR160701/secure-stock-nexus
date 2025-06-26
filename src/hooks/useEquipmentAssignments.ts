
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EquipmentAssignment {
  id: string;
  employee_id: string;
  equipment_name: string;
  park_number: string;
  serial_number?: string;
  assigned_date: string;
  returned_date?: string;
  status: 'assigned' | 'returned';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useEquipmentAssignments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading, error } = useQuery({
    queryKey: ['equipment-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_assignments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EquipmentAssignment[];
    },
  });

  const createAssignment = useMutation({
    mutationFn: async (newAssignment: Omit<EquipmentAssignment, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('equipment_assignments')
        .insert([newAssignment])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-assignments'] });
      toast({
        title: "Attribution créée",
        description: "L'équipement a été attribué avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'attribution de l'équipement.",
        variant: "destructive",
      });
    },
  });

  const updateAssignment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EquipmentAssignment> & { id: string }) => {
      const { data, error } = await supabase
        .from('equipment_assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-assignments'] });
      toast({
        title: "Attribution mise à jour",
        description: "L'attribution a été mise à jour avec succès.",
      });
    },
  });

  const deleteAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipment_assignments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-assignments'] });
      toast({
        title: "Attribution supprimée",
        description: "L'attribution a été supprimée avec succès.",
      });
    },
  });

  return {
    assignments,
    isLoading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
};
