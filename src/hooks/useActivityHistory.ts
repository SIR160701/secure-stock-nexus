
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

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activity-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as ActivityRecord[];
    },
  });

  const addActivity = useMutation({
    mutationFn: async (activity: { action: string; description: string; page: string }) => {
      const { data, error } = await supabase
        .from('activity_history')
        .insert([{
          ...activity,
          user_id: user?.id || 'system'
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activity-history'] });
      toast({
        title: "Action effectuée",
        description: variables.description,
      });
    },
  });

  return {
    activities,
    isLoading,
    addActivity,
  };
};
