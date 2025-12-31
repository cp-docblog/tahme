-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid,
  name text NOT NULL,
  platform text NOT NULL CHECK (platform = ANY (ARRAY['tiktok'::text, 'snapchat'::text, 'facebook'::text])),
  campaign_data jsonb,
  status text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT campaigns_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)
);
CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  clickup_folder text,
  contact_name text,
  contact_email text,
  contact_phone text,
  tiktok_username text,
  tiktok_password text,
  snapchat_ad_account_id text,
  snapchat_ad_account_name text,
  facebook_username text,
  facebook_password text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clients_pkey PRIMARY KEY (id),
  CONSTRAINT clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.creds (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  cred_name text,
  cred text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT creds_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  role text NOT NULL CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'staff'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  invited_by uuid,
  last_sign_in_at timestamp with time zone,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id)
);