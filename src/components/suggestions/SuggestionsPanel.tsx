import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Check, X, MessageSquare, Plus, Loader2 } from 'lucide-react';

interface Suggestion {
  id: string;
  item_name: string;
  category_name: string | null;
  notes: string | null;
  status: string;
  suggested_by: string | null;
  created_at: string;
}

interface SuggestionsPanelProps {
  listId: string;
  isOwner: boolean;
  onAcceptSuggestion: (suggestion: Suggestion) => void;
}

export function SuggestionsPanel({ listId, isOwner, onAcceptSuggestion }: SuggestionsPanelProps) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, [listId]);

  const fetchSuggestions = async () => {
    const { data, error } = await supabase
      .from('list_suggestions')
      .select('*')
      .eq('list_id', listId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setSuggestions(data);
    }
    setIsLoading(false);
  };

  const handleAccept = async (suggestion: Suggestion) => {
    const { error } = await supabase
      .from('list_suggestions')
      .update({ status: 'accepted' })
      .eq('id', suggestion.id);
    
    if (!error) {
      onAcceptSuggestion(suggestion);
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      toast({ title: 'Suggestion accepted! ✨' });
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('list_suggestions')
      .update({ status: 'rejected' })
      .eq('id', id);
    
    if (!error) {
      setSuggestions(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Suggestion dismissed' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Suggestions
          <Badge variant="secondary" className="ml-auto">
            {suggestions.length} pending
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion) => (
          <div 
            key={suggestion.id} 
            className="flex items-center justify-between p-3 rounded-lg bg-background border"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{suggestion.item_name}</p>
              <div className="flex items-center gap-2 mt-1">
                {suggestion.category_name && (
                  <Badge variant="outline" className="text-xs">
                    {suggestion.category_name}
                  </Badge>
                )}
                {suggestion.notes && (
                  <span className="text-xs text-muted-foreground truncate">
                    {suggestion.notes}
                  </span>
                )}
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-1 ml-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                  onClick={() => handleAccept(suggestion)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => handleReject(suggestion.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
