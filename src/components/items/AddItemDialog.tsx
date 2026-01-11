import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from '@/hooks/use-toast';
import { Loader2, Link2, DollarSign, Package, AlertCircle } from 'lucide-react';
import { inferItemSize } from '@/lib/colleges';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  categoryName: string;
  onAddItem: (item: {
    category_id: string;
    name: string;
    size?: string;
    price?: number;
    store_link?: string;
    notes?: string;
  }) => Promise<void>;
}

export function AddItemDialog({ 
  open, 
  onOpenChange, 
  categoryId, 
  categoryName,
  onAddItem 
}: AddItemDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    size: 'Medium',
    price: '',
    storeLink: '',
    notes: '',
  });
  const [priceError, setPriceError] = useState('');

  // Auto-infer size when name changes
  useEffect(() => {
    if (formData.name) {
      const inferredSize = inferItemSize(formData.name);
      setFormData(prev => ({ ...prev, size: inferredSize }));
    }
  }, [formData.name]);

  // Attempt to fetch price when store link changes
  useEffect(() => {
    const fetchPrice = async () => {
      if (!formData.storeLink || !isValidUrl(formData.storeLink)) {
        return;
      }
      
      setIsFetchingPrice(true);
      setPriceError('');
      
      // Note: In a real app, this would call an edge function to scrape the price
      // For now, we'll show that manual entry is needed
      setTimeout(() => {
        setIsFetchingPrice(false);
        if (!formData.price) {
          setPriceError('Could not auto-fetch price. Please enter manually.');
        }
      }, 1000);
    };

    const timeoutId = setTimeout(fetchPrice, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.storeLink]);

  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onAddItem({
        category_id: categoryId,
        name: formData.name.trim(),
        size: formData.size,
        price: formData.price ? parseFloat(formData.price) : undefined,
        store_link: formData.storeLink || undefined,
        notes: formData.notes || undefined,
      });
      
      toast({ title: 'Item added! 📦' });
      onOpenChange(false);
      setFormData({ name: '', size: 'Medium', price: '', storeLink: '', notes: '' });
    } catch (error) {
      toast({ title: 'Failed to add item', variant: 'destructive' });
    }
    
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Add Item to {categoryName}
          </DialogTitle>
          <DialogDescription>
            Add an item with optional purchase link and price
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Desk Lamp"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Select 
                value={formData.size} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, size: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Small">Small</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Large">Large</SelectItem>
                  <SelectItem value="XL">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeLink" className="flex items-center gap-2">
              <Link2 className="h-3 w-3" />
              Purchase Link
            </Label>
            <Input
              id="storeLink"
              type="url"
              value={formData.storeLink}
              onChange={(e) => setFormData(prev => ({ ...prev, storeLink: e.target.value }))}
              placeholder="https://amazon.com/..."
            />
            {isFetchingPrice && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking for price...
              </p>
            )}
            {priceError && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {priceError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Color preference, brand, etc."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
