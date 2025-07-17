
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
      
      if (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        throw error;
      }
      return data as User[];
    },
  });

  const createUser = useMutation({
    mutationFn: async (userData: { email: string; password: string; full_name: string; role: string }) => {
      console.log('Création utilisateur:', userData);
      
      // Créer un profil utilisateur directement dans la table profiles
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

      if (profileError) {
        console.error('Erreur création profil:', profileError);
        throw profileError;
      }
      
      console.log('Profil créé avec succès:', profileData);
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
      console.error('Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de l'utilisateur.",
        variant: "destructive",
      });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      console.log('Suppression utilisateur:', userId);
      
      // Supprimer le profil de la table profiles
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) {
        console.error('Erreur suppression profil:', error);
        throw error;
      }
      
      console.log('Profil supprimé avec succès');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès.",
      });
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de l'utilisateur.",
        variant: "destructive",
      });
    },
  });

  const updateProfile = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: { full_name?: string; role?: string } }) => {
      console.log('Mise à jour profil:', userId, updates);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Erreur mise à jour profil:', error);
        throw error;
      }
      
      console.log('Profil mis à jour avec succès:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Profil mis à jour",
        description: "Le profil a été mis à jour avec succès.",
      });
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du profil.",
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
    updateProfile,
  };
};
