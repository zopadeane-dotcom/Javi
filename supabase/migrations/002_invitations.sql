-- Tabla de invitaciones para trabajadores
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE DEFAULT upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden crear y ver invitaciones de su negocio
CREATE POLICY "invitations_admin" ON invitations
  FOR ALL USING (
    business_id = get_my_business_id()
    AND get_my_role() = 'admin'
  );

-- Cualquiera puede leer una invitación por código (para el flujo de registro)
CREATE POLICY "invitations_public_read" ON invitations
  FOR SELECT USING (true);
