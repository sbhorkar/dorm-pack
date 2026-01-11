import { useState, useEffect } from 'react';
import { PackingList } from '@/hooks/usePackingLists';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Copy, Link2, Users, Eye, Edit3, MessageSquare, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list: PackingList;
  onUpdate: (updates: Partial<PackingList>) => Promise<void>;
}

export function ShareDialog({ open, onOpenChange, list, onUpdate }: ShareDialogProps) {
  const [isShared, setIsShared] = useState(list.is_shared);
  const [allowSuggestions, setAllowSuggestions] = useState(list.allow_suggestions);
  const [allowEditing, setAllowEditing] = useState(list.allow_editing);
  const [shareToken, setShareToken] = useState(list.share_token || '');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsShared(list.is_shared);
    setAllowSuggestions(list.allow_suggestions);
    setAllowEditing(list.allow_editing);
    setShareToken(list.share_token || '');
  }, [list]);

  const generateShareToken = () => {
    const token = crypto.randomUUID().slice(0, 8);
    setShareToken(token);
    return token;
  };

  const getShareUrl = () => {
    const token = shareToken || generateShareToken();
    return `${window.location.origin}/shared/${list.id}?token=${token}`;
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: 'Link copied! 🔗', description: 'Share it with friends and family' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    const token = isShared ? (shareToken || generateShareToken()) : null;
    
    await onUpdate({
      is_shared: isShared,
      allow_suggestions: allowSuggestions,
      allow_editing: allowEditing,
      share_token: token,
    });
    
    toast({ title: 'Sharing settings updated! ✨' });
    setIsLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Share "{list.name}"
          </DialogTitle>
          <DialogDescription>
            Let others view or collaborate on your packing list
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Main Share Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label className="text-base font-medium">Enable Sharing</Label>
                <p className="text-sm text-muted-foreground">Anyone with the link can access</p>
              </div>
            </div>
            <Switch checked={isShared} onCheckedChange={setIsShared} />
          </div>

          {isShared && (
            <>
              {/* Share Link */}
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input 
                    value={getShareUrl()} 
                    readOnly 
                    className="font-mono text-sm bg-muted"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Permission Levels */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">Permissions</Label>
                
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">View Only</p>
                      <p className="text-xs text-muted-foreground">Always enabled when shared</p>
                    </div>
                  </div>
                  <Switch checked disabled />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Suggest Items</p>
                      <p className="text-xs text-muted-foreground">Others can suggest items for your list</p>
                    </div>
                  </div>
                  <Switch checked={allowSuggestions} onCheckedChange={setAllowSuggestions} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Edit3 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Full Edit Access</p>
                      <p className="text-xs text-muted-foreground">Others can add, edit, and check off items</p>
                    </div>
                  </div>
                  <Switch checked={allowEditing} onCheckedChange={setAllowEditing} />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
