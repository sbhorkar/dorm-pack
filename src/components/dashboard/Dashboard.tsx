import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePackingLists } from '@/hooks/usePackingLists';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Package, 
  MoreVertical, 
  Trash2, 
  LogOut, 
  Loader2, 
  Settings, 
  GraduationCap,
  Sparkles,
  Share2
} from 'lucide-react';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const { selectedCollege } = useTheme();
  const navigate = useNavigate();
  const { lists, isLoading, createList, deleteList } = usePackingLists();
  const [newListName, setNewListName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    await createList.mutateAsync(newListName);
    setNewListName('');
    setIsDialogOpen(false);
  };

  const handleDeleteList = async (listId: string) => {
    await deleteList.mutateAsync(listId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-xl text-foreground">DormPack</span>
              {selectedCollege && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {selectedCollege.name}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                My Packing Lists
                <Sparkles className="h-6 w-6 text-primary" />
              </h1>
              <p className="text-muted-foreground mt-1">
                Organize your dorm essentials and share with family
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" />
                  New List
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Create New Packing List
                  </DialogTitle>
                  <DialogDescription>
                    Give your list a name to get started
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="e.g., Fall 2025 Move-In"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateList} disabled={createList.isPending}>
                      {createList.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create List
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : lists?.length === 0 ? (
          <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
                <Package className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No lists yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-sm">
                Create your first packing list and start organizing your dorm essentials
              </p>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="gap-2 shadow-lg shadow-primary/20"
              >
                <Plus className="h-4 w-4" />
                Create Your First List
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lists?.map((list) => (
              <Card
                key={list.id}
                className="cursor-pointer hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300 group overflow-hidden"
                onClick={() => navigate(`/list/${list.id}`)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <CardHeader className="flex flex-row items-start justify-between space-y-0 relative">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {list.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Created {new Date(list.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteList(list.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {list.is_shared && (
                      <Badge variant="secondary" className="gap-1">
                        <Share2 className="h-3 w-3" />
                        Shared
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
}
