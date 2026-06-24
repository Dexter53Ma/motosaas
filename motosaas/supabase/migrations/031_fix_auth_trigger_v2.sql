-- Fix the auth trigger to handle new user signup properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  INSERT INTO public.tenants (id, name, slug, subscription_status, trial_ends_at)
  VALUES (
    gen_random_uuid(),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Shop') || ' Shop',
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', 'my-shop'), ' ', '-')),
    'trialing',
    NOW() + INTERVAL '30 days'
  )
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.users (id, email, full_name, role, tenant_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'owner',
    v_tenant_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
