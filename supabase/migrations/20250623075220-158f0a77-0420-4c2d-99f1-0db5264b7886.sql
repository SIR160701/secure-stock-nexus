
-- Create user roles table for better role management
CREATE TABLE public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'user')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policy for user_roles
CREATE POLICY "Super admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = check_user_id;
$$;

-- Create equipment assignment table
CREATE TABLE public.equipment_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,
  park_number TEXT NOT NULL,
  serial_number TEXT,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  returned_date DATE,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'returned', 'maintenance')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on equipment_assignments
ALTER TABLE public.equipment_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for equipment_assignments
CREATE POLICY "Authenticated users can view assignments" ON public.equipment_assignments
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Users can manage assignments" ON public.equipment_assignments
  FOR ALL TO authenticated USING (TRUE);

-- Update stock_items table to include park_number and serial_number
ALTER TABLE public.stock_items 
ADD COLUMN park_number TEXT,
ADD COLUMN serial_number TEXT,
ADD COLUMN assigned_to UUID REFERENCES public.employees(id);

-- Create index for better performance
CREATE INDEX idx_stock_items_park_number ON public.stock_items(park_number);
CREATE INDEX idx_stock_items_serial_number ON public.stock_items(serial_number);

-- Enable realtime for all tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.employees REPLICA IDENTITY FULL;
ALTER TABLE public.stock_items REPLICA IDENTITY FULL;
ALTER TABLE public.maintenance_records REPLICA IDENTITY FULL;
ALTER TABLE public.equipment_assignments REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.equipment_assignments;

-- Insert some sample data for testing
INSERT INTO public.employees (employee_number, first_name, last_name, email, position, department, hire_date) VALUES
('EMP001', 'Marie', 'Dupont', 'marie.dupont@securestock.com', 'Responsable RH', 'Ressources Humaines', '2024-01-15'),
('EMP002', 'Jean', 'Martin', 'jean.martin@securestock.com', 'Technicien IT', 'IT', '2024-02-01'),
('EMP003', 'Sophie', 'Bernard', 'sophie.bernard@securestock.com', 'Chef de projet', 'Marketing', '2024-02-10');

INSERT INTO public.stock_items (name, sku, category, quantity, park_number, serial_number, status) VALUES
('Dell Latitude 5520', 'DELL-L5520-001', 'Ordinateurs', 15, 'PC001', 'DL5520001', 'active'),
('HP EliteBook 840', 'HP-EB840-001', 'Ordinateurs', 12, 'PC002', 'HP840002', 'active'),
('iPhone 13', 'APPL-IP13-001', 'Smartphones', 8, 'SP001', 'IP13001', 'active'),
('Samsung Galaxy S21', 'SAMS-GS21-001', 'Smartphones', 6, 'SP002', 'SG21002', 'active');

INSERT INTO public.maintenance_records (equipment_name, maintenance_type, description, scheduled_date, technician_id, status, priority) VALUES
('Dell Latitude 5520', 'corrective', 'Écran défaillant', '2024-01-15', NULL, 'scheduled', 'high'),
('HP Imprimante Pro', 'preventive', 'Maintenance préventive', '2024-01-20', NULL, 'scheduled', 'medium');
