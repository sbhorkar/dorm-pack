import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePackingList, Item } from '@/hooks/usePackingLists';
import { useAuth } from '@/contexts/AuthContext';
import { categoryTemplates, inferItemSize } from '@/lib/colleges';
import { ShareDialog } from '@/components/sharing/ShareDialog';
import { AddItemDialog } from '@/components/items/AddItemDialog';
import { SuggestionsPanel } from '@/components/suggestions/SuggestionsPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Plus,
  Trash2,
  MoreVertical,
  Package,
  ShoppingCart,
  Check,
  Loader2,
  Filter,
  SortAsc,
  Share2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

const SIZE_COLORS: Record<string, string> = {
  Small: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  Large: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  XL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800',
};

const CATEGORY_COLORS: Record<string, string> = {
  Bathroom: 'border-l-cyan-500 bg-gradient-to-r from-cyan-50 to-transparent dark:from-cyan-950/30',
  Desk: 'border-l-amber-500 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/30',
  Bedding: 'border-l-purple-500 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-950/30',
  Electronics: 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/30',
  Clothing: 'border-l-pink-500 bg-gradient-to-r from-pink-50 to-transparent dark:from-pink-950/30',
  Kitchen: 'border-l-orange-500 bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-950/30',
};

export function PackingListView() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    list,
    categories,
    items,
    isLoading,
    createCategory,
    deleteCategory,
    createItem,
    updateItem,
    deleteItem,
    updateList,
  } = usePackingList(listId!);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [filterBy, setFilterBy] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  const isOwner = list?.user_id === user?.id;

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    await createCategory.mutateAsync(newCategoryName);
    setNewCategoryName('');
    setIsCategoryDialogOpen(false);
  };

  const handleAddTemplateItems = async (categoryId: string, categoryName: string) => {
    const template = categoryTemplates[categoryName];
    if (!template) return;
    
    for (const item of template) {
      await createItem.mutateAsync({
        category_id: categoryId,
        name: item.name,
        size: item.size,
      });
    }
  };

  const toggleBought = async (item: Item) => {
    await updateItem.mutateAsync({
      itemId: item.id,
      updates: { is_bought: !item.is_bought },
    });
  };

  const togglePacked = async (item: Item) => {
    await updateItem.mutateAsync({
      itemId: item.id,
      updates: { is_packed: !item.is_packed },
    });
  };

  const openAddItemDialog = (categoryId: string, categoryName: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(categoryName);
    setIsAddItemDialogOpen(true);
  };

  const handleAddItem = async (itemData: Parameters<typeof createItem.mutateAsync>[0]) => {
    await createItem.mutateAsync(itemData);
  };

  const getFilteredItems = (categoryId: string) => {
    let filtered = items?.filter((item) => item.category_id === categoryId) || [];
    
    if (filterBy === 'bought') {
      filtered = filtered.filter((item) => item.is_bought);
    } else if (filterBy === 'not-bought') {
      filtered = filtered.filter((item) => !item.is_bought);
    } else if (filterBy === 'packed') {
      filtered = filtered.filter((item) => item.is_packed);
    } else if (filterBy === 'not-packed') {
      filtered = filtered.filter((item) => !item.is_packed);
    }

    if (sortBy === 'name') {
      filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'size') {
      const sizeOrder = { Small: 1, Medium: 2, Large: 3, XL: 4 };
      filtered = filtered.sort((a, b) => 
        (sizeOrder[a.size as keyof typeof sizeOrder] || 0) - 
        (sizeOrder[b.size as keyof typeof sizeOrder] || 0)
      );
    } else if (sortBy === 'price') {
      filtered = filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    }

    return filtered;
  };

  const totalItems = items?.length || 0;
  const boughtItems = items?.filter((i) => i.is_bought).length || 0;
  const packedItems = items?.filter((i) => i.is_packed).length || 0;
  const totalPrice = items?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading your list...</p>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">List not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
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
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  {list.name}
                  {list.is_shared && (
                    <Badge variant="secondary" className="gap-1">
                      <Share2 className="h-3 w-3" />
                      Shared
                    </Badge>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {totalItems} items • ${totalPrice.toFixed(2)} estimated
                </p>
              </div>
            </div>
            {isOwner && (
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setIsShareDialogOpen(true)}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            )}
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

      {/* Toolbar */}
      <div className="container mx-auto px-4 py-4 flex gap-2 flex-wrap">
        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Add Category
              </DialogTitle>
              <DialogDescription>
                Create a new category for your items
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="e.g., Bathroom, Desk, Bedding"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                {Object.keys(categoryTemplates).map((name) => (
                  <Button
                    key={name}
                    variant="outline"
                    size="sm"
                    onClick={() => setNewCategoryName(name)}
                    className="text-xs"
                  >
                    {name}
                  </Button>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCategory} disabled={createCategory.isPending}>
                  {createCategory.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Select value={filterBy} onValueChange={setFilterBy}>
          <SelectTrigger className="w-36">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="bought">Bought</SelectItem>
            <SelectItem value="not-bought">Not Bought</SelectItem>
            <SelectItem value="packed">Packed</SelectItem>
            <SelectItem value="not-packed">Not Packed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-36">
            <SortAsc className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">By Name</SelectItem>
            <SelectItem value="size">By Size</SelectItem>
            <SelectItem value="price">By Price</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Categories */}
      <main className="container mx-auto px-4 pb-8">
        {/* Suggestions Panel */}
        {isOwner && list.allow_suggestions && (
          <div className="mb-6">
            <SuggestionsPanel 
              listId={listId!} 
              isOwner={isOwner}
              onAcceptSuggestion={(suggestion) => {
                // Find or create category and add item
                const category = categories?.find(c => c.name === suggestion.category_name);
                if (category) {
                  createItem.mutate({
                    category_id: category.id,
                    name: suggestion.item_name,
                    notes: suggestion.notes || undefined,
                  });
                }
              }}
            />
          </div>
        )}

        {categories?.length === 0 ? (
          <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
                <Package className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No categories yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-sm">
                Start by adding categories like Bathroom, Desk, or Bedding
              </p>
              <Button 
                onClick={() => setIsCategoryDialogOpen(true)}
                className="gap-2 shadow-lg shadow-primary/20"
              >
                <Plus className="h-4 w-4" />
                Add First Category
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {categories?.map((category) => {
              const categoryItems = getFilteredItems(category.id);
              const categoryBought = categoryItems.filter((i) => i.is_bought).length;
              const categoryPacked = categoryItems.filter((i) => i.is_packed).length;
              const categoryColor = CATEGORY_COLORS[category.name] || 'border-l-primary';

              return (
                <Card key={category.id} className={`border-l-4 ${categoryColor} overflow-hidden`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-3">
                        {category.name}
                        <Badge variant="secondary" className="font-normal">
                          {categoryItems.length} items
                        </Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {categoryBought} bought • {categoryPacked} packed
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {categoryTemplates[category.name] && (
                          <DropdownMenuItem
                            onClick={() => handleAddTemplateItems(category.id, category.name)}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Add Template Items
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => deleteCategory.mutateAsync(category.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Category
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    {/* Items List */}
                    <div className="space-y-2 mb-4">
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            item.is_packed 
                              ? 'bg-primary/5 border-primary/20' 
                              : item.is_bought 
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/30' 
                                : 'bg-card border-border hover:border-primary/30'
                          } group`}
                        >
                          <Checkbox
                            checked={item.is_bought}
                            onCheckedChange={() => toggleBought(item)}
                            className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${
                              item.is_bought 
                                ? 'line-through text-muted-foreground' 
                                : 'text-foreground'
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
                                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                                  ${item.price.toFixed(2)}
                                </Badge>
                              )}
                              {item.store_link && (
                                <a 
                                  href={item.store_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Buy
                                </a>
                              )}
                            </div>
                          </div>
                          <Button
                            variant={item.is_packed ? 'default' : 'outline'}
                            size="sm"
                            className={`gap-1 shrink-0 ${
                              item.is_packed 
                                ? 'bg-primary hover:bg-primary/90' 
                                : 'hover:bg-primary/10 hover:text-primary hover:border-primary'
                            }`}
                            onClick={() => togglePacked(item)}
                          >
                            {item.is_packed ? (
                              <>
                                <Check className="h-3 w-3" />
                                Packed
                              </>
                            ) : (
                              <>
                                <Package className="h-3 w-3" />
                                Pack
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteItem.mutateAsync(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Add Item Button */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-primary/5 border border-dashed border-border hover:border-primary/30"
                      onClick={() => openAddItemDialog(category.id, category.name)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add item to {category.name}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Dialogs */}
      {list && (
        <ShareDialog
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          list={list}
          onUpdate={async (updates) => {
            await updateList.mutateAsync(updates);
          }}
        />
      )}

      <AddItemDialog
        open={isAddItemDialogOpen}
        onOpenChange={setIsAddItemDialogOpen}
        categoryId={selectedCategoryId || ''}
        categoryName={selectedCategoryName}
        onAddItem={handleAddItem}
      />
    </div>
  );
}
