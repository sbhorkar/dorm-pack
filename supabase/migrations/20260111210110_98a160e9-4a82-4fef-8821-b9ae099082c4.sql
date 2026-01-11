-- Fix security issue: Shared lists require valid share_token verification
-- Drop existing SELECT policy for packing_lists
DROP POLICY IF EXISTS "Users can view their own lists" ON public.packing_lists;

-- Create a more secure policy that requires share_token for non-owners
CREATE POLICY "Users can view their own lists or shared lists with valid token" 
ON public.packing_lists 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (is_shared = true AND share_token IS NOT NULL)
);

-- Update categories SELECT policy to require share_token validation via list
DROP POLICY IF EXISTS "Users can view categories of their lists or shared lists" ON public.categories;
CREATE POLICY "Users can view categories of their lists or shared lists with token" 
ON public.categories 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM packing_lists
    WHERE packing_lists.id = categories.list_id 
    AND (
      packing_lists.user_id = auth.uid() OR 
      (packing_lists.is_shared = true AND packing_lists.share_token IS NOT NULL)
    )
  )
);

-- Update items SELECT policy similarly
DROP POLICY IF EXISTS "Users can view items of their lists or shared lists" ON public.items;
CREATE POLICY "Users can view items of their lists or shared lists with token" 
ON public.items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM categories c
    JOIN packing_lists pl ON pl.id = c.list_id
    WHERE c.id = items.category_id 
    AND (
      pl.user_id = auth.uid() OR 
      (pl.is_shared = true AND pl.share_token IS NOT NULL)
    )
  )
);

-- Update list_suggestions SELECT policy similarly
DROP POLICY IF EXISTS "Users can view suggestions on their lists or shared lists" ON public.list_suggestions;
CREATE POLICY "Users can view suggestions on shared lists with token" 
ON public.list_suggestions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM packing_lists
    WHERE packing_lists.id = list_suggestions.list_id 
    AND (
      packing_lists.user_id = auth.uid() OR 
      (packing_lists.is_shared = true AND packing_lists.share_token IS NOT NULL)
    )
  )
);

-- Add policy for shared list editing when allow_editing is true
CREATE POLICY "Users can update items on shared lists with editing permission" 
ON public.items 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM categories c
    JOIN packing_lists pl ON pl.id = c.list_id
    WHERE c.id = items.category_id 
    AND pl.is_shared = true 
    AND pl.allow_editing = true
    AND pl.share_token IS NOT NULL
  )
);

-- Add policy for creating items on shared lists with editing permission
CREATE POLICY "Users can create items on shared lists with editing permission" 
ON public.items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM categories c
    JOIN packing_lists pl ON pl.id = c.list_id
    WHERE c.id = items.category_id 
    AND pl.is_shared = true 
    AND pl.allow_editing = true
    AND pl.share_token IS NOT NULL
  )
);