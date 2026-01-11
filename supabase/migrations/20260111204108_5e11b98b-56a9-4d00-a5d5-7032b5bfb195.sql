-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  selected_college TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create packing_lists table
CREATE TABLE public.packing_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  share_token TEXT UNIQUE,
  allow_suggestions BOOLEAN NOT NULL DEFAULT false,
  allow_editing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.packing_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create items table
CREATE TABLE public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size TEXT CHECK (size IN ('Small', 'Medium', 'Large', 'XL')),
  price DECIMAL(10, 2),
  store_link TEXT,
  notes TEXT,
  is_bought BOOLEAN NOT NULL DEFAULT false,
  is_packed BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create suggestions table for shared list collaboration
CREATE TABLE public.list_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.packing_lists(id) ON DELETE CASCADE,
  suggested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  category_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_suggestions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Packing lists policies
CREATE POLICY "Users can view their own lists" ON public.packing_lists
  FOR SELECT USING (auth.uid() = user_id OR is_shared = true);

CREATE POLICY "Users can create their own lists" ON public.packing_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists" ON public.packing_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists" ON public.packing_lists
  FOR DELETE USING (auth.uid() = user_id);

-- Categories policies
CREATE POLICY "Users can view categories of their lists or shared lists" ON public.categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.packing_lists 
      WHERE id = categories.list_id 
      AND (user_id = auth.uid() OR is_shared = true)
    )
  );

CREATE POLICY "Users can create categories in their lists" ON public.categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.packing_lists 
      WHERE id = categories.list_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update categories in their lists" ON public.categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.packing_lists 
      WHERE id = categories.list_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete categories in their lists" ON public.categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.packing_lists 
      WHERE id = categories.list_id AND user_id = auth.uid()
    )
  );

-- Items policies
CREATE POLICY "Users can view items of their lists or shared lists" ON public.items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.categories c
      JOIN public.packing_lists pl ON pl.id = c.list_id
      WHERE c.id = items.category_id 
      AND (pl.user_id = auth.uid() OR pl.is_shared = true)
    )
  );

CREATE POLICY "Users can create items in their lists" ON public.items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.categories c
      JOIN public.packing_lists pl ON pl.id = c.list_id
      WHERE c.id = items.category_id AND pl.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their lists" ON public.items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.categories c
      JOIN public.packing_lists pl ON pl.id = c.list_id
      WHERE c.id = items.category_id AND pl.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items in their lists" ON public.items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.categories c
      JOIN public.packing_lists pl ON pl.id = c.list_id
      WHERE c.id = items.category_id AND pl.user_id = auth.uid()
    )
  );

-- Suggestions policies
CREATE POLICY "Users can view suggestions on their lists or shared lists" ON public.list_suggestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.packing_lists 
      WHERE id = list_suggestions.list_id 
      AND (user_id = auth.uid() OR is_shared = true)
    )
  );

CREATE POLICY "Users can create suggestions on shared lists" ON public.list_suggestions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.packing_lists 
      WHERE id = list_suggestions.list_id 
      AND is_shared = true 
      AND allow_suggestions = true
    )
  );

CREATE POLICY "List owners can update suggestions" ON public.list_suggestions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.packing_lists 
      WHERE id = list_suggestions.list_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "List owners can delete suggestions" ON public.list_suggestions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.packing_lists 
      WHERE id = list_suggestions.list_id AND user_id = auth.uid()
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_packing_lists_updated_at
  BEFORE UPDATE ON public.packing_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_packing_lists_user_id ON public.packing_lists(user_id);
CREATE INDEX idx_packing_lists_share_token ON public.packing_lists(share_token);
CREATE INDEX idx_categories_list_id ON public.categories(list_id);
CREATE INDEX idx_items_category_id ON public.items(category_id);
CREATE INDEX idx_list_suggestions_list_id ON public.list_suggestions(list_id);