import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Package,
  ShoppingCart,
  Check,
  Loader2,
  ExternalLink,
  Eye,
  MessageSquare,
  Edit3,
  Copy,
  Lock,
} from 'lucide-react';

interface PackingList {
  id: string;
  name: string;
  is_shared: boolean;
  allow_suggestions: boolean;
  allow_editing: boolean;
  share_token: string | null;
  user_id: string;
}

interface Category {
  id: string;
  name: string;
  list_id: string;
  sort_order: number;
}

interface Item {
  id: string;
  category_id: string;
  name: string;
  size: string | null;
  price: number | null;
  store_link: string | null;
  is_bought: boolean;
  is_packed: boolean;
}

const SIZE_COLORS: Record<string, string> = {
  Small: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Medium: 'bg-blue-100 text-blue-700 border-blue-200',
  Large: 'bg-amber-100 text-amber-700 border-amber-200',
  XL: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function SharedListPage() {
  const { listId } = useParams<{ listId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = searchParams.get('token');

  const [list, setList] = useState<PackingList | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = useState(false);
  const [suggestionData, setSuggestionData] = useState({
    itemName: '',
    categoryName: '',
    notes: '',
  });

  useEffect(() => {
    fetchList();
  }, [listId, token]);

  const fetchList = async () => {
    if (!listId || !token) {
      setIsLoading(false);
      return;
    }

    // Use RPC function to fetch list with server-side token validation
    const { data: listData, error: listError } = await supabase
      .rpc('get_shared_list', { p_list_id: listId, p_token: token });

    if (listError || !listData || listData.length === 0) {
      setIsLoading(false);
      return;
    }

    const listInfo = listData[0] as PackingList;
    setList(listInfo);
    setHasAccess(true);

    // Fetch categories using RPC with token validation
    const { data: categoriesData } = await supabase
      .rpc('get_shared_list_categories', { p_list_id: listId, p_token: token });

    if (categoriesData && categoriesData.length > 0) {
      setCategories(categoriesData as Category[]);

      // Fetch items using RPC with token validation
      const { data: itemsData } = await supabase
        .rpc('get_shared_list_items', { p_list_id: listId, p_token: token });

      if (itemsData) {
        setItems(itemsData as Item[]);
      }
    }

    setIsLoading(false);
  };

  const handleSuggestItem = async () => {
    if (!suggestionData.itemName.trim()) {
      toast({ title: 'Please enter an item name', variant: 'destructive' });
      return;
    }

    // Require authentication for suggestions
    if (!user) {
      toast({ 
        title: 'Sign in required', 
        description: 'Please create an account to suggest items',
        variant: 'destructive' 
      });
      return;
    }

    if (!token) {
      toast({ title: 'Invalid share link', variant: 'destructive' });
      return;
    }

    // Use RPC function with server-side token validation
    const { error } = await supabase.rpc('submit_list_suggestion', {
      p_list_id: listId,
      p_token: token,
      p_item_name: suggestionData.itemName,
      p_category_name: suggestionData.categoryName || null,
      p_notes: suggestionData.notes || null,
    });

    if (error) {
      toast({ title: 'Failed to submit suggestion', variant: 'destructive' });
    } else {
      toast({ title: 'Suggestion submitted! 💡' });
      setSuggestionData({ itemName: '', categoryName: '', notes: '' });
      setIsSuggestDialogOpen(false);
    }
  };

  const handleCopyToMyList = async () => {
    if (!user) {
      toast({ title: 'Please sign in to copy this list', description: 'Create an account to save lists' });
      navigate('/');
      return;
    }

    // Create a new list
    const { data: newList, error: listError } = await supabase
      .from('packing_lists')
      .insert({
        user_id: user.id,
        name: `Copy of ${list?.name}`,
      })
      .select()
      .single();

    if (listError || !newList) {
      toast({ title: 'Failed to copy list', variant: 'destructive' });
      return;
    }

    // Copy categories and items
    for (const category of categories) {
      const { data: newCategory } = await supabase
        .from('categories')
        .insert({
          list_id: newList.id,
          name: category.name,
        })
        .select()
        .single();

      if (newCategory) {
        const categoryItems = items.filter(i => i.category_id === category.id);
        for (const item of categoryItems) {
          await supabase
            .from('items')
            .insert({
              category_id: newCategory.id,
              name: item.name,
              size: item.size,
              price: item.price,
              store_link: item.store_link,
            });
        }
      }
    }

    toast({ title: 'List copied! 🎉', description: 'Check your dashboard' });
    navigate('/dashboard');
  };

  const getItemsByCategory = (categoryId: string) => {
    return items.filter(item => item.category_id === categoryId);
  };

  const totalItems = items.length;
  const boughtItems = items.filter(i => i.is_bought).length;
  const packedItems = items.filter(i => i.is_packed).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading shared list...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess || !list) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Access Denied</h3>
            <p className="text-muted-foreground text-center mb-4">
              This list doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => navigate('/')}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  {list.name}
                  <Badge variant="secondary" className="gap-1">
                    <Eye className="h-3 w-3" />
                    Shared
                  </Badge>
                </h1>
                <p className="text-sm text-muted-foreground">
                  {totalItems} items
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {list.allow_suggestions && (
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => setIsSuggestDialogOpen(true)}
                >
                  <MessageSquare className="h-4 w-4" />
                  Suggest
                </Button>
              )}
              <Button className="gap-2" onClick={handleCopyToMyList}>
                <Copy className="h-4 w-4" />
                Copy to My Lists
              </Button>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-emerald-500" /> 
                  Bought
                </span>
                <span className="font-semibold text-emerald-600">
                  {boughtItems}/{totalItems}
                </span>
              </div>
              <Progress 
                value={totalItems > 0 ? (boughtItems / totalItems) * 100 : 0} 
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" /> 
                  Packed
                </span>
                <span className="font-semibold text-primary">
                  {packedItems}/{totalItems}
                </span>
              </div>
              <Progress 
                value={totalItems > 0 ? (packedItems / totalItems) * 100 : 0} 
                className="h-2"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Permissions Banner */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>View</span>
          </div>
          {list.allow_suggestions && (
            <div className="flex items-center gap-1 text-primary">
              <MessageSquare className="h-4 w-4" />
              <span>Suggest Items</span>
            </div>
          )}
          {list.allow_editing && (
            <div className="flex items-center gap-1 text-primary">
              <Edit3 className="h-4 w-4" />
              <span>Edit Items</span>
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      <main className="container mx-auto px-4 pb-8">
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryItems = getItemsByCategory(category.id);

            return (
              <Card key={category.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-3">
                    {category.name}
                    <Badge variant="secondary" className="font-normal">
                      {categoryItems.length} items
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border ${
                          item.is_packed 
                            ? 'bg-primary/5 border-primary/20' 
                            : item.is_bought 
                              ? 'bg-emerald-50 border-emerald-200' 
                              : 'bg-card border-border'
                        }`}
                      >
                        <Checkbox
                          checked={item.is_bought}
                          disabled={!list.allow_editing}
                          className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${
                            item.is_bought ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}>
                            {item.name}
                          </p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {item.size && (
                              <Badge variant="outline" className={`text-xs ${SIZE_COLORS[item.size]}`}>
                                {item.size}
                              </Badge>
                            )}
                            {item.price && (
                              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                                ${item.price.toFixed(2)}
                              </Badge>
                            )}
                            {item.store_link && (
                              <a 
                                href={item.store_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Buy
                              </a>
                            )}
                          </div>
                        </div>
                        {item.is_packed && (
                          <Badge className="bg-primary gap-1">
                            <Check className="h-3 w-3" />
                            Packed
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Suggest Dialog */}
      <Dialog open={isSuggestDialogOpen} onOpenChange={setIsSuggestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Suggest an Item
            </DialogTitle>
            <DialogDescription>
              {user 
                ? 'Suggest an item to add to this list. The owner will review your suggestion.'
                : 'Please sign in to suggest items to this list.'}
            </DialogDescription>
          </DialogHeader>
          {user ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name *</Label>
                <Input
                  id="itemName"
                  value={suggestionData.itemName}
                  onChange={(e) => setSuggestionData(prev => ({ ...prev, itemName: e.target.value }))}
                  placeholder="e.g., Desk Lamp"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category (optional)</Label>
                <Input
                  id="categoryName"
                  value={suggestionData.categoryName}
                  onChange={(e) => setSuggestionData(prev => ({ ...prev, categoryName: e.target.value }))}
                  placeholder="e.g., Desk"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={suggestionData.notes}
                  onChange={(e) => setSuggestionData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Why you think they need this..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsSuggestDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSuggestItem}>
                  Submit Suggestion
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <p className="text-muted-foreground">
                Create a free account to suggest items to shared lists.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsSuggestDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => navigate('/')}>
                  Sign In
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
