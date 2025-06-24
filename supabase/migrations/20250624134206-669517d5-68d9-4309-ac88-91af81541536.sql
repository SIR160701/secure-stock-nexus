
-- Créer une table pour les catégories avec leurs seuils critiques
CREATE TABLE IF NOT EXISTS public.stock_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  critical_threshold integer NOT NULL DEFAULT 10,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Créer une table pour les attributions d'équipements
CREATE TABLE IF NOT EXISTS public.equipment_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  equipment_name text NOT NULL,
  park_number text,
  serial_number text,
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'returned')),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Ajouter des politiques RLS pour les nouvelles tables
ALTER TABLE public.stock_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_assignments ENABLE ROW LEVEL SECURITY;

-- Politiques pour stock_categories
CREATE POLICY "Everyone can view categories" ON public.stock_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage categories" ON public.stock_categories
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Politiques pour equipment_assignments
CREATE POLICY "Everyone can view assignments" ON public.equipment_assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage assignments" ON public.equipment_assignments
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Insérer quelques catégories par défaut
INSERT INTO public.stock_categories (name, critical_threshold) VALUES
  ('Informatique', 5),
  ('Mobilier', 3),
  ('Électronique', 8),
  ('Téléphonie', 10)
ON CONFLICT (name) DO NOTHING;

-- Fonction pour les triggers de mise à jour
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_stock_categories_updated_at
  BEFORE UPDATE ON public.stock_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_equipment_assignments_updated_at
  BEFORE UPDATE ON public.equipment_assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
