-- Fix 1: Anonymous suggestions - Require authentication for INSERT
DROP POLICY IF EXISTS "Users can create suggestions on shared lists" ON public.list_suggestions;

CREATE POLICY "Authenticated users can create suggestions on shared lists" 
ON public.list_suggestions
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = suggested_by AND
  EXISTS (
    SELECT 1 FROM public.packing_lists 
    WHERE id = list_suggestions.list_id 
    AND is_shared = true 
    AND allow_suggestions = true
  )
);

-- Fix 2: Token validation bypass - Create RPC functions for secure shared list access

-- Function to get a shared list with token validation
CREATE OR REPLACE FUNCTION public.get_shared_list(p_list_id uuid, p_token text)
RETURNS TABLE(
  id uuid,
  name text,
  is_shared boolean,
  allow_suggestions boolean,
  allow_editing boolean,
  share_token text,
  user_id uuid,
  description text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    id, name, is_shared, allow_suggestions, allow_editing, 
    share_token, user_id, description, created_at, updated_at
  FROM public.packing_lists 
  WHERE packing_lists.id = p_list_id 
    AND is_shared = true 
    AND share_token = p_token;
$$;

-- Function to get categories for a shared list with token validation
CREATE OR REPLACE FUNCTION public.get_shared_list_categories(p_list_id uuid, p_token text)
RETURNS TABLE(
  id uuid,
  list_id uuid,
  name text,
  sort_order integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT c.id, c.list_id, c.name, c.sort_order, c.created_at
  FROM public.categories c
  JOIN public.packing_lists pl ON pl.id = c.list_id
  WHERE c.list_id = p_list_id 
    AND pl.is_shared = true 
    AND pl.share_token = p_token
  ORDER BY c.sort_order;
$$;

-- Function to get items for a shared list with token validation
CREATE OR REPLACE FUNCTION public.get_shared_list_items(p_list_id uuid, p_token text)
RETURNS TABLE(
  id uuid,
  category_id uuid,
  name text,
  size text,
  price numeric,
  store_link text,
  is_bought boolean,
  is_packed boolean,
  sort_order integer,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT i.id, i.category_id, i.name, i.size, i.price, i.store_link, 
         i.is_bought, i.is_packed, i.sort_order, i.notes, i.created_at, i.updated_at
  FROM public.items i
  JOIN public.categories c ON c.id = i.category_id
  JOIN public.packing_lists pl ON pl.id = c.list_id
  WHERE c.list_id = p_list_id 
    AND pl.is_shared = true 
    AND pl.share_token = p_token
  ORDER BY i.sort_order;
$$;

-- Function to submit a suggestion with server-side token and auth validation
CREATE OR REPLACE FUNCTION public.submit_list_suggestion(
  p_list_id uuid,
  p_token text,
  p_item_name text,
  p_category_name text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_suggestion_id uuid;
BEGIN
  -- Verify token and permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.packing_lists 
    WHERE id = p_list_id 
      AND is_shared = true 
      AND share_token = p_token 
      AND allow_suggestions = true
  ) THEN
    RAISE EXCEPTION 'Invalid token or suggestions not allowed';
  END IF;
  
  -- Insert the suggestion
  INSERT INTO public.list_suggestions (list_id, item_name, category_name, notes, suggested_by)
  VALUES (p_list_id, p_item_name, p_category_name, p_notes, auth.uid())
  RETURNING id INTO v_suggestion_id;
  
  RETURN v_suggestion_id;
END;
$$;