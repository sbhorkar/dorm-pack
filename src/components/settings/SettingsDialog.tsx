import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { colleges } from '@/lib/colleges';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Loader2, User, GraduationCap, Palette } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { user } = useAuth();
  const { selectedCollege, setCollegeTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [college, setCollege] = useState('');

  useEffect(() => {
    if (open && user) {
      loadProfile();
    }
  }, [open, user]);

  const loadProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('display_name, selected_college')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setDisplayName(data.display_name || '');
      setCollege(data.selected_college || selectedCollege?.name || '');
    }
  };

  const handleCollegeChange = (value: string) => {
    setCollege(value);
    setCollegeTheme(value);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        selected_college: college,
      })
      .eq('user_id', user.id);
    
    if (error) {
      toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Settings saved! ✨' });
      onOpenChange(false);
    }
    
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Customize your DormPack experience
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="displayName" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Display Name
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="college" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              Your College
            </Label>
            <Select value={college} onValueChange={handleCollegeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select your school" />
              </SelectTrigger>
              <SelectContent>
                {colleges.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Your app colors will match your school!
            </p>
          </div>

          {selectedCollege && (
            <div className="flex gap-2 items-center p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex gap-1">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                  style={{ backgroundColor: `hsl(${selectedCollege.primary})` }}
                />
                <div 
                  className="w-6 h-6 rounded-full border-2 border-background shadow-sm -ml-2"
                  style={{ backgroundColor: `hsl(${selectedCollege.accent})` }}
                />
              </div>
              <span className="text-sm font-medium text-primary">
                {selectedCollege.name} colors active
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
