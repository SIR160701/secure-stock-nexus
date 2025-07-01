
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MaintenanceRecord {
  id: string;
  equipment_name: string;
  park_number?: string;
  serial_number?: string;
  maintenance_type: 'preventive' | 'corrective' | 'emergency';
  description: string;
  scheduled_date: string;
  completed_date?: string;
  technician_id?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  previous_status?: string;
  cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useMaintenance = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: maintenanceRecords = [], isLoading, error } = useQuery({
    queryKey: ['maintenance-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .order('scheduled_date', { ascending: false });
      
      if (error) throw error;
      return data as MaintenanceRecord[];
    },
  });

  const createMaintenanceRecord = useMutation({
    mutationFn: async (newRecord: Omit<MaintenanceRecord, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('maintenance_records')
        .insert([newRecord])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] });
      toast({
        title: "Maintenance planifiée",
        description: "La maintenance a été planifiée avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la planification de la maintenance.",
        variant: "destructive",
      });
    },
  });

  const updateMaintenanceRecord = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MaintenanceRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from('maintenance_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] });
      toast({
        title: "Maintenance mise à jour",
        description: "La maintenance a été mise à jour avec succès.",
      });
    },
  });

  const deleteMaintenanceRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('maintenance_records')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] });
      toast({
        title: "Maintenance supprimée",
        description: "La maintenance a été supprimée avec succès.",
      });
    },
  });

  return {
    maintenanceRecords,
    isLoading,
    error,
    createMaintenanceRecord,
    updateMaintenanceRecord,
    deleteMaintenanceRecord,
  };
};
