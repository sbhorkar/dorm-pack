import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePackingList, Item } from '@/hooks/usePackingLists';
import { categoryTemplates, inferItemSize } from '@/lib/colleges';
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
} from 'lucide-react';

const SIZE_COLORS: Record<string, string> = {
  Small: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
  Medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  Large: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
  XL: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
};

export function PackingListView() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
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
  } = usePackingList(listId!);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [filterBy, setFilterBy] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    await createCategory.mutateAsync(newCategoryName);
    setNewCategoryName('');
    setIsCategoryDialogOpen(false);
  };

  const handleQuickAddItem = async (categoryId: string) => {
    if (!newItemName.trim()) return;
    const size = inferItemSize(newItemName);
    await createItem.mutateAsync({
      category_id: categoryId,
      name: newItemName,
      size,
    });
    setNewItemName('');
    setSelectedCategoryId(null);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">List not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">{list.name}</h1>
              <p className="text-sm text-muted-foreground">
                {totalItems} items • {boughtItems} bought • {packedItems} packed
              </p>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <ShoppingCart className="h-3 w-3" /> Bought
                </span>
                <span className="text-foreground font-medium">
                  {totalItems > 0 ? Math.round((boughtItems / totalItems) * 100) : 0}%
                </span>
              </div>
              <Progress value={totalItems > 0 ? (boughtItems / totalItems) * 100 : 0} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Package className="h-3 w-3" /> Packed
                </span>
                <span className="text-foreground font-medium">
                  {totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0}%
                </span>
              </div>
              <Progress value={totalItems > 0 ? (packedItems / totalItems) * 100 : 0} className="h-2" />
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="container mx-auto px-4 py-4 flex gap-2 flex-wrap">
        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
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
              />
              <div className="flex flex-wrap gap-2">
                {Object.keys(categoryTemplates).map((name) => (
                  <Button
                    key={name}
                    variant="outline"
                    size="sm"
                    onClick={() => setNewCategoryName(name)}
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
          <SelectTrigger className="w-40">
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
          <SelectTrigger className="w-40">
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
        {categories?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No categories yet</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Start by adding categories like Bathroom, Desk, or Bedding
              </p>
              <Button onClick={() => setIsCategoryDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {categories?.map((category) => {
              const categoryItems = getFilteredItems(category.id);
              const categoryBought = categoryItems.filter((i) => i.is_bought).length;
              const categoryPacked = categoryItems.filter((i) => i.is_packed).length;

              return (
                <Card key={category.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {category.name}
                        <Badge variant="secondary" className="text-xs">
                          {categoryItems.length} items
                        </Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
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
                            <Plus className="h-4 w-4 mr-2" />
                            Add Template Items
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
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
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group"
                        >
                          <Checkbox
                            checked={item.is_bought}
                            onCheckedChange={() => toggleBought(item)}
                            className="data-[state=checked]:bg-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${item.is_bought ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {item.name}
                            </p>
                            <div className="flex gap-2 mt-1">
                              {item.size && (
                                <Badge variant="outline" className={`text-xs ${SIZE_COLORS[item.size]}`}>
                                  {item.size}
                                </Badge>
                              )}
                              {item.price && (
                                <Badge variant="outline" className="text-xs">
                                  ${item.price.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant={item.is_packed ? 'default' : 'outline'}
                            size="sm"
                            className="gap-1"
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
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                            onClick={() => deleteItem.mutateAsync(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Quick Add Item */}
                    {selectedCategoryId === category.id ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Item name..."
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleQuickAddItem(category.id)}
                          autoFocus
                        />
                        <Button onClick={() => handleQuickAddItem(category.id)}>
                          Add
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedCategoryId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground"
                        onClick={() => setSelectedCategoryId(category.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add item
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
