-- schema.sql
-- This file contains the initial database structure for Modulo Escolar.
-- Run this script in the Supabase SQL Editor of your new project.

-- Create an ENUM for user roles
CREATE TYPE user_role AS ENUM ('professor', 'coordenador', 'administrador');

-- Create the usuarios table to store user profiles
CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    alias TEXT,
    tipo user_role NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
-- 1. Allow any authenticated user in the school to view the directory
CREATE POLICY "Allow authenticated read access" ON public.usuarios 
FOR SELECT TO authenticated USING (true);

-- 2. Allow users to update their own profile information
CREATE POLICY "Users can update own profile" ON public.usuarios 
FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ==========================================
-- STORAGE SETUP (Avatars)
-- ==========================================

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can update avatars"
ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');

-- ==========================================
-- INSTITUTION SETTINGS (Singleton)
-- ==========================================

CREATE TABLE public.instituicao (
    id INT PRIMARY KEY CHECK (id = 1),
    nome TEXT NOT NULL DEFAULT 'Escola Exemplo',
    logotipo_url TEXT,
    cor_1 TEXT DEFAULT '#4f46e5',
    cor_2 TEXT DEFAULT '#4338ca',
    cor_3 TEXT DEFAULT '#312e81',
    cor_4 TEXT DEFAULT '#e0e7ff',
    cor_5 TEXT DEFAULT '#f8fafc',
    logout_professor INT NOT NULL DEFAULT 60,
    logout_coordenador INT NOT NULL DEFAULT 60,
    logout_administrador INT NOT NULL DEFAULT 20,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the default configuration row
INSERT INTO public.instituicao (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.instituicao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instituicao is publicly accessible" 
ON public.instituicao FOR SELECT USING (true);

-- Function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND tipo = 'administrador'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Only administrators can update instituicao" 
ON public.instituicao FOR UPDATE TO authenticated USING (public.is_admin());
