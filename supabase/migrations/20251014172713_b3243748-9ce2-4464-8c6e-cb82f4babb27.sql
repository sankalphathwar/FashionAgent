-- Create enum for body types
CREATE TYPE public.body_type AS ENUM ('athletic', 'slim', 'curvy', 'plus_size', 'petite', 'tall');

-- Create enum for aesthetics
CREATE TYPE public.aesthetic_style AS ENUM ('minimalist', 'bohemian', 'streetwear', 'classic', 'romantic', 'edgy', 'preppy', 'casual');

-- Create enum for clothing categories
CREATE TYPE public.clothing_category AS ENUM ('tops', 'bottoms', 'dresses', 'outerwear', 'footwear', 'accessories');

-- Create profiles table with extended user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  height INTEGER, -- in cm
  body_type public.body_type,
  aesthetics public.aesthetic_style[] DEFAULT '{}',
  color_preferences TEXT[] DEFAULT '{}',
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clothes table
CREATE TABLE public.clothes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  category public.clothing_category NOT NULL,
  subcategory TEXT,
  tags TEXT[] DEFAULT '{}',
  color TEXT,
  material TEXT,
  season TEXT,
  last_worn TIMESTAMP WITH TIME ZONE,
  times_worn INTEGER DEFAULT 0,
  ai_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create outfits table
CREATE TABLE public.outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  occasion TEXT,
  weather TEXT,
  clothes_ids UUID[] NOT NULL,
  ai_reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clothes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for clothes
CREATE POLICY "Users can view their own clothes"
  ON public.clothes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clothes"
  ON public.clothes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clothes"
  ON public.clothes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clothes"
  ON public.clothes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for outfits
CREATE POLICY "Users can view their own outfits"
  ON public.outfits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own outfits"
  ON public.outfits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outfits"
  ON public.outfits FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_clothes_updated_at
  BEFORE UPDATE ON public.clothes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for clothing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('clothes', 'clothes', true);

-- Storage policies for clothes bucket
CREATE POLICY "Users can view clothes images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'clothes');

CREATE POLICY "Users can upload their own clothes images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'clothes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own clothes images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'clothes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own clothes images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'clothes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );