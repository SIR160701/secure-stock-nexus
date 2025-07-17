
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface ActivityRecord {
  id: string;
  user_id: string;
  action: string;
  description: string;
  page: string;
  created_at: string;
}

export const useActivityHistory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: activities = [], isLoading, error } = useQuery({
    queryKey: ['activity-history'],
    queryFn: async () => {
      console.log('Récupération de l\'historique des activités...');
      
      const { data, error } = await supabase
        .from('activity_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        throw error;
      }
      
      console.log('Historique récupéré:', data);
      return data as ActivityRecord[];
    },
  });

  const addActivity = useMutation({
    mutationFn: async (activity: { action: string; description: string; page: string }) => {
      const currentUserId = user?.id || 'anonymous';
      console.log('Ajout d\'activité:', { ...activity, user_id: currentUserId });
      
      const { data, error } = await supabase
        .from('activity_history')
        .insert([{
          ...activity,
          user_id: currentUserId
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Erreur lors de l\'ajout de l\'activité:', error);
        throw error;
      }
      
      console.log('Activité ajoutée avec succès:', data);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activity-history'] });
      toast({
        title: "Action effectuée",
        description: variables.description,
      });
    },
    onError: (error) => {
      console.error('Erreur lors de l\'ajout de l\'activité:', error);
    },
  });

  return {
    activities,
    isLoading,
    error,
    addActivity,
  };
};
