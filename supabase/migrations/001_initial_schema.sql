-- ============================================================
-- WORKIE — Esquema inicial
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Tipos enumerados
CREATE TYPE role_type AS ENUM ('admin', 'employee');
CREATE TYPE contract_type AS ENUM ('indefinido', 'temporal', 'formacion', 'practicas', 'obra_servicio');
CREATE TYPE haccp_control_type AS ENUM ('temperatura', 'limpieza', 'plagas', 'otro');
CREATE TYPE haccp_status AS ENUM ('ok', 'incidencia');
CREATE TYPE certificate_status AS ENUM ('vigente', 'caducado', 'pendiente');

-- ============================================================
-- NEGOCIOS
-- ============================================================
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trade_name TEXT,
  cif TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  province TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',
  phone TEXT,
  email TEXT,
  activity_license TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PERFILES (extiende auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  role role_type NOT NULL DEFAULT 'employee',
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- EMPLEADOS
-- ============================================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  dni TEXT NOT NULL,
  social_security_number TEXT,
  position TEXT NOT NULL,
  contract_type contract_type NOT NULL DEFAULT 'indefinido',
  start_date DATE NOT NULL,
  end_date DATE,
  hourly_rate NUMERIC(8,2),
  weekly_hours NUMERIC(5,2) NOT NULL DEFAULT 40,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- FICHAJES (Real Decreto-ley 8/2019)
-- ============================================================
CREATE TABLE time_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  check_in TIMESTAMPTZ NOT NULL,
  check_out TIMESTAMPTZ,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PROVEEDORES
-- ============================================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nif TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  contact_person TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- FACTURAS DE PROVEEDORES
-- ============================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  base_amount NUMERIC(12,2) NOT NULL,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 10,
  vat_amount NUMERIC(12,2) NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  quarter SMALLINT NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  year SMALLINT NOT NULL,
  is_deductible BOOLEAN NOT NULL DEFAULT true,
  concept TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PLANTILLAS APPCC
-- ============================================================
CREATE TABLE haccp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  control_type haccp_control_type NOT NULL DEFAULT 'temperatura',
  description TEXT,
  min_value NUMERIC(8,2),
  max_value NUMERIC(8,2),
  unit TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- REGISTROS APPCC
-- ============================================================
CREATE TABLE haccp_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES haccp_templates(id) ON DELETE RESTRICT,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  control_date DATE NOT NULL,
  value NUMERIC(8,2),
  status haccp_status NOT NULL DEFAULT 'ok',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ALÉRGENOS (Reglamento UE 1169/2011)
-- ============================================================
CREATE TABLE allergen_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  gluten BOOLEAN NOT NULL DEFAULT false,
  crustaceans BOOLEAN NOT NULL DEFAULT false,
  eggs BOOLEAN NOT NULL DEFAULT false,
  fish BOOLEAN NOT NULL DEFAULT false,
  peanuts BOOLEAN NOT NULL DEFAULT false,
  soy BOOLEAN NOT NULL DEFAULT false,
  dairy BOOLEAN NOT NULL DEFAULT false,
  nuts BOOLEAN NOT NULL DEFAULT false,
  celery BOOLEAN NOT NULL DEFAULT false,
  mustard BOOLEAN NOT NULL DEFAULT false,
  sesame BOOLEAN NOT NULL DEFAULT false,
  sulphites BOOLEAN NOT NULL DEFAULT false,
  lupin BOOLEAN NOT NULL DEFAULT false,
  molluscs BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- FICHAS SANITARIAS DE PROVEEDORES
-- ============================================================
CREATE TABLE supplier_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  rgseaa_number TEXT,
  supplied_products TEXT,
  last_audit_date DATE,
  next_audit_date DATE,
  notes TEXT,
  file_urls TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CERTIFICADOS DE MANIPULADOR DE ALIMENTOS
-- ============================================================
CREATE TABLE food_handler_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  obtained_date DATE NOT NULL,
  expiry_date DATE,
  certificate_number TEXT,
  status certificate_status NOT NULL DEFAULT 'vigente',
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE haccp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE haccp_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergen_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_handler_certificates ENABLE ROW LEVEL SECURITY;

-- Función auxiliar: obtener business_id del usuario actual
CREATE OR REPLACE FUNCTION get_my_business_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT business_id FROM profiles WHERE id = auth.uid()
$$;

-- Función auxiliar: obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS role_type
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- Función auxiliar: obtener employee_id del usuario actual
CREATE OR REPLACE FUNCTION get_my_employee_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM employees WHERE user_id = auth.uid() AND is_active = true LIMIT 1
$$;

-- BUSINESSES: solo el owner puede ver/editar
CREATE POLICY "businesses_owner" ON businesses
  FOR ALL USING (owner_id = auth.uid());

-- Admins también pueden ver su negocio
CREATE POLICY "businesses_admin_read" ON businesses
  FOR SELECT USING (id = get_my_business_id());

-- PROFILES: cada usuario ve su perfil; admins ven todos los de su negocio
CREATE POLICY "profiles_own" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_admin" ON profiles
  FOR ALL USING (
    business_id = get_my_business_id()
    AND get_my_role() = 'admin'
  );

-- EMPLOYEES: admins ven todos; empleados solo el suyo
CREATE POLICY "employees_admin" ON employees
  FOR ALL USING (
    business_id = get_my_business_id()
    AND get_my_role() = 'admin'
  );

CREATE POLICY "employees_self" ON employees
  FOR SELECT USING (user_id = auth.uid());

-- TIME_RECORDS: admins ven todos; empleados solo los suyos
CREATE POLICY "time_records_admin" ON time_records
  FOR ALL USING (
    business_id = get_my_business_id()
    AND get_my_role() = 'admin'
  );

CREATE POLICY "time_records_employee_read" ON time_records
  FOR SELECT USING (employee_id = get_my_employee_id());

CREATE POLICY "time_records_employee_insert" ON time_records
  FOR INSERT WITH CHECK (employee_id = get_my_employee_id());

CREATE POLICY "time_records_employee_update" ON time_records
  FOR UPDATE USING (employee_id = get_my_employee_id());

-- SUPPLIERS: solo admins
CREATE POLICY "suppliers_admin" ON suppliers
  FOR ALL USING (
    business_id = get_my_business_id()
    AND get_my_role() = 'admin'
  );

-- INVOICES: solo admins
CREATE POLICY "invoices_admin" ON invoices
  FOR ALL USING (
    business_id = get_my_business_id()
    AND get_my_role() = 'admin'
  );

-- HACCP: admins gestionan, empleados pueden registrar controles
CREATE POLICY "haccp_templates_admin" ON haccp_templates
  FOR ALL USING (
    business_id = get_my_business_id()
    AND get_my_role() = 'admin'
  );

CREATE POLICY "haccp_templates_employee_read" ON haccp_templates
  FOR SELECT USING (business_id = get_my_business_id());

CREATE POLICY "haccp_controls_admin" ON haccp_controls
  FOR ALL USING (
    business_id = get_my_business_id()
    AND get_my_role() = 'admin'
  );

CREATE POLICY "haccp_controls_employee_insert" ON haccp_controls
  FOR INSERT WITH CHECK (business_id = get_my_business_id());

-- ALLERGEN_PRODUCTS: solo admins
CREATE POLICY "allergen_products_admin" ON allergen_products
  FOR ALL USING (
    business_id = get_my_business_id()
    AND get_my_role() = 'admin'
  );

-- SUPPLIER_SHEETS: solo admins
CREATE POLICY "supplier_sheets_admin" ON supplier_sheets
  FOR ALL USING (
    business_id = get_my_business_id()
    AND get_my_role() = 'admin'
  );

-- FOOD_HANDLER_CERTIFICATES: solo admins
CREATE POLICY "food_handler_certificates_admin" ON food_handler_certificates
  FOR ALL USING (
    business_id = get_my_business_id()
    AND get_my_role() = 'admin'
  );

-- ============================================================
-- TRIGGER: crear perfil y negocio automáticamente al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_business_id UUID;
BEGIN
  -- Si el usuario se registra como admin, crear negocio
  IF (NEW.raw_user_meta_data->>'role') = 'admin' THEN
    INSERT INTO businesses (owner_id, name, cif, address, city, province, postal_code)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'business_name', 'Mi negocio'),
      COALESCE(NEW.raw_user_meta_data->>'cif', ''),
      '', '', '', ''
    )
    RETURNING id INTO new_business_id;
  END IF;

  INSERT INTO profiles (id, business_id, role, full_name, email)
  VALUES (
    NEW.id,
    new_business_id,
    COALESCE((NEW.raw_user_meta_data->>'role')::role_type, 'employee'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- STORAGE: bucket para documentos
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Solo usuarios autenticados de la misma empresa pueden subir/ver documentos
CREATE POLICY "documents_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "documents_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "documents_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
  );
