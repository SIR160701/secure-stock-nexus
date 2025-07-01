-- Ajouter les champs manquants à la table maintenance_records
ALTER TABLE public.maintenance_records 
ADD COLUMN IF NOT EXISTS park_number text,
ADD COLUMN IF NOT EXISTS serial_number text,
ADD COLUMN IF NOT EXISTS previous_status text DEFAULT 'active';