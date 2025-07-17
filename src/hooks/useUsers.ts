import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export const useUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as User[];
    },
  });

  const createUser = useMutation({
    mutationFn: async (userData: { email: string; password: string; full_name: string; role: string }) => {
      // Create user profile directly (auth user will be created by signup)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({ 
          id: crypto.randomUUID(),
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role 
        })
        .select()
        .single();

      if (profileError) throw profileError;
      
      return profileData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Utilisateur créé",
        description: "L'utilisateur a été créé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de l'utilisateur.",
        variant: "destructive",
      });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      // Delete from profiles table
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de l'utilisateur.",
        variant: "destructive",
      });
    },
  });

  return {
    users,
    isLoading,
    error,
    createUser,
    deleteUser,
  };
};