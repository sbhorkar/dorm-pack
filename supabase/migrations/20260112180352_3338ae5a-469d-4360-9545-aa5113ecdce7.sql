-- Fix RLS token bypass vulnerability by requiring authentication for all table access
-- Shared list access must go through RPC functions that validate tokens

-- Drop existing policies that allow anonymous SELECT based on share_token IS NOT NULL
DROP POLICY IF EXISTS "Users can view their own lists or shared lists with valid token" ON public.packing_lists;
DROP POLICY IF EXISTS "Users can view categories of their lists or shared lists with t" ON public.categories;
DROP POLICY IF EXISTS "Users can view items of their lists or shared lists with token" ON public.items;
DROP POLICY IF EXISTS "Users can view suggestions on shared lists with token" ON public.list_suggestions;

-- Create new policies that only allow authenticated users to access their own data
-- All shared list access must go through RPC functions that validate tokens

-- packing_lists: Only owners can SELECT directly (shared access via RPC)
CREATE POLICY "Users can view their own lists" 
ON public.packing_lists 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- categories: Only list owners can SELECT directly (shared access via RPC)
CREATE POLICY "Users can view categories of their lists" 
ON public.categories 
FOR SELECT 
TO authenticated
USING (EXISTS ( 
  SELECT 1 FROM packing_lists 
  WHERE packing_lists.id = categories.list_id 
  AND packing_lists.user_id = auth.uid()
));

-- items: Only list owners can SELECT directly (shared access via RPC)
CREATE POLICY "Users can view items of their lists" 
ON public.items 
FOR SELECT 
TO authenticated
USING (EXISTS ( 
  SELECT 1 FROM categories c 
  JOIN packing_lists pl ON pl.id = c.list_id 
  WHERE c.id = items.category_id 
  AND pl.user_id = auth.uid()
));

-- list_suggestions: Only list owners can SELECT directly
CREATE POLICY "Users can view suggestions of their lists" 
ON public.list_suggestions 
FOR SELECT 
TO authenticated
USING (EXISTS ( 
  SELECT 1 FROM packing_lists 
  WHERE packing_lists.id = list_suggestions.list_id 
  AND packing_lists.user_id = auth.uid()
));

-- Add database constraint to enforce safe URL protocols for store_link
-- This provides defense-in-depth at the database level
ALTER TABLE public.items 
ADD CONSTRAINT valid_store_link_protocol 
CHECK (store_link IS NULL OR store_link ~* '^https?://');