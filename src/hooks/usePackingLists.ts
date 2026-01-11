import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface PackingList {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_shared: boolean;
  share_token: string | null;
  allow_suggestions: boolean;
  allow_editing: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  list_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Item {
  id: string;
  category_id: string;
  name: string;
  size: string | null;
  price: number | null;
  store_link: string | null;
  notes: string | null;
  is_bought: boolean;
  is_packed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function usePackingLists() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: lists, isLoading } = useQuery({
    queryKey: ['packing-lists', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packing_lists')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PackingList[];
    },
    enabled: !!user,
  });

  const createList = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('packing_lists')
        .insert({ user_id: user!.id, name })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packing-lists'] });
      toast({ title: 'List created successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create list', description: error.message, variant: 'destructive' });
    },
  });

  const deleteList = useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase
        .from('packing_lists')
        .delete()
        .eq('id', listId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packing-lists'] });
      toast({ title: 'List deleted successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete list', description: error.message, variant: 'destructive' });
    },
  });

  return { lists, isLoading, createList, deleteList };
}

export function usePackingList(listId: string) {
  const queryClient = useQueryClient();

  const { data: list, isLoading: listLoading } = useQuery({
    queryKey: ['packing-list', listId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packing_lists')
        .select('*')
        .eq('id', listId)
        .maybeSingle();
      
      if (error) throw error;
      return data as PackingList | null;
    },
    enabled: !!listId,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', listId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('list_id', listId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!listId,
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['items', listId],
    queryFn: async () => {
      if (!categories?.length) return [];
      
      const categoryIds = categories.map(c => c.id);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .in('category_id', categoryIds)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Item[];
    },
    enabled: !!categories?.length,
  });

  const createCategory = useMutation({
    mutationFn: async (name: string) => {
      const sortOrder = categories?.length || 0;
      const { data, error } = await supabase
        .from('categories')
        .insert({ list_id: listId, name, sort_order: sortOrder })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', listId] });
      toast({ title: 'Category created!' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create category', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', listId] });
      queryClient.invalidateQueries({ queryKey: ['items', listId] });
      toast({ title: 'Category deleted!' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete category', description: error.message, variant: 'destructive' });
    },
  });

  const createItem = useMutation({
    mutationFn: async (item: { category_id: string; name: string; size?: string; price?: number; store_link?: string; notes?: string }) => {
      const categoryItems = items?.filter(i => i.category_id === item.category_id) || [];
      const sortOrder = categoryItems.length;
      
      const { data, error } = await supabase
        .from('items')
        .insert({ ...item, sort_order: sortOrder })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', listId] });
    },
    onError: (error) => {
      toast({ title: 'Failed to create item', description: error.message, variant: 'destructive' });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: Partial<Item> }) => {
      const { data, error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', listId] });
    },
    onError: (error) => {
      toast({ title: 'Failed to update item', description: error.message, variant: 'destructive' });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', listId] });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete item', description: error.message, variant: 'destructive' });
    },
  });

  const updateList = useMutation({
    mutationFn: async (updates: Partial<PackingList>) => {
      const { data, error } = await supabase
        .from('packing_lists')
        .update(updates)
        .eq('id', listId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packing-list', listId] });
      queryClient.invalidateQueries({ queryKey: ['packing-lists'] });
    },
    onError: (error) => {
      toast({ title: 'Failed to update list', description: error.message, variant: 'destructive' });
    },
  });

  return {
    list,
    categories,
    items,
    isLoading: listLoading || categoriesLoading || itemsLoading,
    createCategory,
    deleteCategory,
    createItem,
    updateItem,
    deleteItem,
    updateList,
  };
}
