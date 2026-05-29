-- Initial Schema for Jaspel Medis

-- RBAC Roles
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM (
      'SUPER_ADMIN', 'DIREKTUR_RS', 'WAKIL_DIREKTUR', 'KABID_PELAYANAN', 
      'ADMIN_JASA_PELAYANAN', 'VERIFIKATOR_KEUANGAN', 'KOMITE_MEDIS', 
      'DOKTER', 'AUDITOR', 'READ_ONLY_INSPECTOR'
    );
  END IF;
END $$;

-- Enable RLS
-- (Prisma will create the tables, but we need to enable RLS and add policies)

-- Audit Log Trigger Function
CREATE OR REPLACE FUNCTION public.handle_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (action, "table", record_id, old_data, new_data, user_id, created_at)
  VALUES (
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
    auth.uid()::text,
    now()
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Transaction Locking for Closing Payroll
CREATE OR REPLACE FUNCTION public.close_payroll_period(p_period_id uuid)
RETURNS void AS $$
DECLARE
    v_locked boolean;
BEGIN
    SELECT is_locked INTO v_locked FROM public.payroll_periods WHERE id = p_period_id FOR UPDATE;
    
    IF v_locked THEN
        RAISE EXCEPTION 'Period is already locked.';
    END IF;

    UPDATE public.payroll_periods 
    SET status = 'FINAL_LOCKED', is_locked = true, updated_at = now() 
    WHERE id = p_period_id;
    
    UPDATE public.incentive_slips
    SET status = 'FINAL_LOCKED', updated_at = now()
    WHERE period_id = p_period_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed TER Tax Rates (PP 58/2023) - Simplified sample
-- Category A
INSERT INTO public.tax_ter_rates (category, min_bruto, max_bruto, rate) VALUES
('A', 0, 5400000, 0),
('A', 5400001, 5650000, 0.0025),
('A', 5650001, 5950000, 0.005),
-- ... more rates would be added here
('B', 0, 6200000, 0),
('B', 6200001, 6500000, 0.0025);

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentive_slips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Doctors can view their own data" ON public.doctors
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Doctors can view their own slips" ON public.incentive_slips
  FOR SELECT USING (auth.uid()::text = (SELECT user_id FROM public.doctors WHERE id = doctor_id));

CREATE POLICY "Admins can manage everything" ON public.users
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role IN ('SUPER_ADMIN', 'ADMIN_JASA_PELAYANAN'))
  );
