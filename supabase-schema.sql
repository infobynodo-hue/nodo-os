-- ============================================================
-- NODO OS — Schema Completo de Supabase
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- ─── Tabla: internal_users ──────────────────────────────────
CREATE TABLE IF NOT EXISTS internal_users (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text UNIQUE NOT NULL,
  full_name       text NOT NULL,
  role            text NOT NULL CHECK (role IN ('admin', 'tecnico')),
  avatar_url      text,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

-- ─── Tabla: clients ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name   text NOT NULL,
  contact_name    text NOT NULL,
  contact_email   text NOT NULL,
  contact_phone   text,
  sector          text NOT NULL,
  country         text NOT NULL,
  notes           text,
  portal_password text,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  created_by      uuid REFERENCES internal_users(id)
);

-- ─── Tabla: projects ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid REFERENCES clients(id) NOT NULL,
  service_type    text NOT NULL CHECK (service_type IN ('bpo_claudia', 'bpo_lucia', 'track_property', 'recovery')),
  duration_months integer NOT NULL CHECK (duration_months IN (6, 12)),
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  monthly_price   numeric(10,2) DEFAULT 0,
  total_price     numeric(10,2) DEFAULT 0,
  current_phase   integer DEFAULT 1,
  progress_pct    integer DEFAULT 0,
  status          text DEFAULT 'active' CHECK (status IN ('active','paused','completed','cancelled')),
  assigned_tech   uuid REFERENCES internal_users(id),
  created_at      timestamptz DEFAULT now()
);

-- ─── Tabla: project_phases ──────────────────────────────────
CREATE TABLE IF NOT EXISTS project_phases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid REFERENCES projects(id) NOT NULL,
  phase_number    integer NOT NULL,
  phase_name      text NOT NULL,
  phase_description text,
  status          text DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  started_at      timestamptz,
  completed_at    timestamptz
);

-- ─── Tabla: tasks ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid REFERENCES projects(id) NOT NULL,
  phase_number    integer NOT NULL,
  title           text NOT NULL,
  description     text,
  assigned_to     text CHECK (assigned_to IN ('internal','client')),
  is_enabled      boolean DEFAULT false,
  is_completed    boolean DEFAULT false,
  due_date        date,
  completed_at    timestamptz,
  completed_by    uuid REFERENCES internal_users(id),
  order_index     integer DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

-- ─── Tabla: onboarding_sessions ─────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid REFERENCES projects(id) UNIQUE NOT NULL,
  status          text DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
  completion_pct  integer DEFAULT 0,
  last_activity   timestamptz,
  completed_at    timestamptz
);

-- ─── Tabla: chat_messages ────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid REFERENCES projects(id) NOT NULL,
  session_type    text NOT NULL,
  role            text NOT NULL CHECK (role IN ('user','assistant')),
  content         text NOT NULL,
  metadata        jsonb,
  created_at      timestamptz DEFAULT now()
);

-- ─── Tabla: plug_requests ────────────────────────────────────
CREATE TABLE IF NOT EXISTS plug_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid REFERENCES projects(id) NOT NULL,
  plug_id         text NOT NULL,
  plug_label      text NOT NULL,
  summary         jsonb NOT NULL DEFAULT '{}',
  status          text DEFAULT 'pending' CHECK (status IN ('pending','in_progress','resolved')),
  client_approved boolean DEFAULT false,
  resolved_by     uuid REFERENCES internal_users(id),
  resolved_at     timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- ─── Tabla: bot_knowledge ────────────────────────────────────
CREATE TABLE IF NOT EXISTS bot_knowledge (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid REFERENCES projects(id) NOT NULL,
  category        text NOT NULL,
  title           text NOT NULL,
  content         text NOT NULL,
  is_visible_to_client boolean DEFAULT true,
  order_index     integer DEFAULT 0,
  updated_at      timestamptz DEFAULT now(),
  updated_by      uuid REFERENCES internal_users(id)
);

-- ─── Tabla: billing_records ──────────────────────────────────
CREATE TABLE IF NOT EXISTS billing_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid REFERENCES projects(id) NOT NULL,
  period_month    integer NOT NULL,
  due_date        date NOT NULL,
  amount          numeric(10,2) NOT NULL,
  status          text DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue')),
  paid_at         timestamptz,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

-- ─── Tabla: project_plugs ────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_plugs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid REFERENCES projects(id) NOT NULL,
  plug_id         text NOT NULL,
  is_enabled      boolean DEFAULT false,
  enabled_at      timestamptz,
  enabled_by      uuid REFERENCES internal_users(id),
  UNIQUE(project_id, plug_id)
);

-- ============================================================
-- INDEXES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_session ON chat_messages(project_id, session_type);
CREATE INDEX IF NOT EXISTS idx_plug_requests_project_id ON plug_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_project_id ON billing_records(project_id);
CREATE INDEX IF NOT EXISTS idx_bot_knowledge_project_id ON bot_knowledge(project_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE internal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE plug_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_plugs ENABLE ROW LEVEL SECURITY;

-- internal_users: usuarios internos ven todos los registros
CREATE POLICY "internal_users_select" ON internal_users
  FOR SELECT USING (auth.uid() IN (SELECT id FROM internal_users));

CREATE POLICY "internal_users_update_own" ON internal_users
  FOR UPDATE USING (auth.uid() = id);

-- clients: solo usuarios internos pueden ver clientes
CREATE POLICY "clients_internal_all" ON clients
  FOR ALL USING (auth.uid() IN (SELECT id FROM internal_users WHERE is_active = true));

-- projects: internos ven todos, clientes ven solo su proyecto
CREATE POLICY "projects_internal" ON projects
  FOR ALL USING (auth.uid() IN (SELECT id FROM internal_users WHERE is_active = true));

CREATE POLICY "projects_client_select" ON projects
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM clients WHERE contact_email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );

-- project_phases: misma lógica que projects
CREATE POLICY "project_phases_internal" ON project_phases
  FOR ALL USING (auth.uid() IN (SELECT id FROM internal_users WHERE is_active = true));

CREATE POLICY "project_phases_client_select" ON project_phases
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE c.contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- tasks: internos gestionan todo, clientes ven y actualizan las suyas
CREATE POLICY "tasks_internal" ON tasks
  FOR ALL USING (auth.uid() IN (SELECT id FROM internal_users WHERE is_active = true));

CREATE POLICY "tasks_client_select" ON tasks
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE c.contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    AND assigned_to = 'client'
    AND is_enabled = true
  );

CREATE POLICY "tasks_client_update" ON tasks
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE c.contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    AND assigned_to = 'client'
  );

-- chat_messages: clientes solo ven sus mensajes
CREATE POLICY "chat_messages_internal" ON chat_messages
  FOR ALL USING (auth.uid() IN (SELECT id FROM internal_users WHERE is_active = true));

CREATE POLICY "chat_messages_client" ON chat_messages
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE c.contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- onboarding_sessions
CREATE POLICY "onboarding_sessions_internal" ON onboarding_sessions
  FOR ALL USING (auth.uid() IN (SELECT id FROM internal_users WHERE is_active = true));

CREATE POLICY "onboarding_sessions_client" ON onboarding_sessions
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE c.contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- plug_requests
CREATE POLICY "plug_requests_internal" ON plug_requests
  FOR ALL USING (auth.uid() IN (SELECT id FROM internal_users WHERE is_active = true));

CREATE POLICY "plug_requests_client" ON plug_requests
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE c.contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- bot_knowledge: clientes solo ven is_visible_to_client = true
CREATE POLICY "bot_knowledge_internal" ON bot_knowledge
  FOR ALL USING (auth.uid() IN (SELECT id FROM internal_users WHERE is_active = true));

CREATE POLICY "bot_knowledge_client_select" ON bot_knowledge
  FOR SELECT USING (
    is_visible_to_client = true
    AND project_id IN (
      SELECT p.id FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE c.contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- billing_records
CREATE POLICY "billing_records_internal" ON billing_records
  FOR ALL USING (auth.uid() IN (SELECT id FROM internal_users WHERE is_active = true));

CREATE POLICY "billing_records_client_select" ON billing_records
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE c.contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- project_plugs
CREATE POLICY "project_plugs_internal" ON project_plugs
  FOR ALL USING (auth.uid() IN (SELECT id FROM internal_users WHERE is_active = true));

CREATE POLICY "project_plugs_client_select" ON project_plugs
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE c.contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- ============================================================
-- FUNCIÓN HELPER: trigger para sincronizar auth.users → internal_users email
-- ============================================================
CREATE OR REPLACE FUNCTION handle_auth_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE internal_users SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- DATOS DE EJEMPLO: Crear primer usuario admin
-- (Reemplaza el UUID con el ID del usuario creado en Supabase Auth)
-- ============================================================

-- INSERT INTO internal_users (id, email, full_name, role, is_active)
-- VALUES (
--   'TU-UUID-DE-AUTH-AQUI',
--   'santi@nodoone.com',
--   'Santiago Rodríguez',
--   'admin',
--   true
-- );
