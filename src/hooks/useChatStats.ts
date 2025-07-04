import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ChatStats {
  total_messages: number;
  messages_today: number;
  most_active_hour: string;
  popular_topics: string[];
}

export const useChatStats = () => {
  const { data: chatStats, isLoading } = useQuery({
    queryKey: ['chat-stats'],
    queryFn: async () => {
      const { data: activities, error } = await supabase
        .from('activity_history')
        .select('*')
        .eq('action', 'Chat IA')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      const messagesTotal = activities?.length || 0;
      const messagesToday = activities?.filter(activity => 
        activity.created_at.startsWith(today)
      ).length || 0;

      // Calculate most active hour
      const hourCounts = activities?.reduce((acc, activity) => {
        const hour = new Date(activity.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>) || {};

      const mostActiveHour = Object.entries(hourCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || '12';

      return {
        total_messages: messagesTotal,
        messages_today: messagesToday,
        most_active_hour: `${mostActiveHour}h`,
        popular_topics: ['Gestion Stock', 'Maintenance', 'Équipements', 'Analyses']
      } as ChatStats;
    },
  });

  return {
    chatStats,
    isLoading,
  };
};