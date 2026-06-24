-- Step 1: Temporarily disable the auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Create the user directly in auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_token,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change_token_new,
  email_change
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'abdo.gonzaloo@gmail.com',
  extensions.crypt('Dexter2001z-', extensions.gen_salt('bf')),
  NOW(),
  '',
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User"}',
  NOW(),
  NOW(),
  '',
  '',
  ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'abdo.gonzaloo@gmail.com');

-- Step 3: Create tenant and link user
DO $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'abdo.gonzaloo@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO tenants (name, email, subscription_status, trial_ends_at)
    VALUES ('Admin Shop', 'abdo.gonzaloo@gmail.com', 'trial', NOW() + INTERVAL '365 days')
    RETURNING id INTO v_tenant_id;

    INSERT INTO users (id, tenant_id, email, full_name, role)
    VALUES (v_user_id, v_tenant_id, 'abdo.gonzaloo@gmail.com', 'Admin User', 'owner')
    ON CONFLICT (id) DO UPDATE SET tenant_id = v_tenant_id, role = 'owner';

    INSERT INTO admin_roles (user_id, role)
    VALUES (v_user_id, 'super_admin')
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- Step 4: Re-create the fixed trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  INSERT INTO tenants (name, email, subscription_status, trial_ends_at)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Shop'),
    NEW.email,
    'trial',
    NOW() + INTERVAL '30 days'
  )
  RETURNING id INTO new_tenant_id;

  INSERT INTO users (id, tenant_id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    new_tenant_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    'owner'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
