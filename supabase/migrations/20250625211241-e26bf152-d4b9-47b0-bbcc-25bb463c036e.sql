
-- Créer la table activity_history pour stocker l'historique des activités
CREATE TABLE public.activity_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  page TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter un index sur created_at pour optimiser les requêtes de tri
CREATE INDEX idx_activity_history_created_at ON public.activity_history(created_at);

-- Ajouter un index sur user_id pour filtrer par utilisateur
CREATE INDEX idx_activity_history_user_id ON public.activity_history(user_id);
