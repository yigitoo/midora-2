import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Watchlist } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  BookmarkPlus,
  BookmarkCheck,
  MoreHorizontal,
  ListPlus,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ManageWatchlistsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [newWatchlistName, setNewWatchlistName] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [editingWatchlist, setEditingWatchlist] = useState<Watchlist | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [deleteConfirmWatchlist, setDeleteConfirmWatchlist] = useState<Watchlist | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  // Fetch user's watchlists
  const {
    data: watchlists,
    isLoading,
    error,
  } = useQuery<Watchlist[]>({
    queryKey: ["/api/watchlists"],
    enabled: !!user,
  });

  // Create a new watchlist
  const createWatchlistMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/watchlists", { name });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      setNewWatchlistName("");
      setIsCreateDialogOpen(false);
      toast({
        title: "Watchlist Created",
        description: "Your new watchlist has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create watchlist",
        variant: "destructive",
      });
    },
  });

  // Update watchlist name
  const updateWatchlistMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await apiRequest("PATCH", `/api/watchlists/${id}`, { name });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      setEditingWatchlist(null);
      setEditName("");
      setIsEditDialogOpen(false);
      toast({
        title: "Watchlist Updated",
        description: "Your watchlist has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update watchlist",
        variant: "destructive",
      });
    },
  });

  // Delete watchlist
  const deleteWatchlistMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/watchlists/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      setDeleteConfirmWatchlist(null);
      setIsDeleteDialogOpen(false);
      toast({
        title: "Watchlist Deleted",
        description: "Your watchlist has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete watchlist",
        variant: "destructive",
      });
    },
  });

  const handleCreateWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWatchlistName.trim()) {
      createWatchlistMutation.mutate(newWatchlistName.trim());
    }
  };

  const handleUpdateWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWatchlist && editName.trim()) {
      updateWatchlistMutation.mutate({
        id: editingWatchlist.id,
        name: editName.trim(),
      });
    }
  };

  const handleDeleteWatchlist = () => {
    if (deleteConfirmWatchlist) {
      deleteWatchlistMutation.mutate(deleteConfirmWatchlist.id);
    }
  };

  const openEditDialog = (watchlist: Watchlist) => {
    setEditingWatchlist(watchlist);
    setEditName(watchlist.name);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (watchlist: Watchlist) => {
    setDeleteConfirmWatchlist(watchlist);
    setIsDeleteDialogOpen(true);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
              Authentication Required
            </CardTitle>
            <CardDescription>You need to be logged in to manage your watchlists</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
              Error Loading Watchlists
            </CardTitle>
            <CardDescription>
              There was a problem loading your watchlists
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/")}>Return to Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Watchlists</h1>
        <Badge variant="outline" className="px-3 py-1">
          {user.membershipType} User
        </Badge>
      </div>

      <div className="flex justify-between items-center mb-6">
        <Button
          variant="outline"
          onClick={() => navigate("/watchlist")}
        >
          Back to Watchlist
        </Button>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Create New Watchlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateWatchlist}>
              <DialogHeader>
                <DialogTitle>Create New Watchlist</DialogTitle>
                <DialogDescription>
                  Enter a name for your new watchlist
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="watchlist-name">Watchlist Name</Label>
                <Input
                  id="watchlist-name"
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  placeholder="My Watchlist"
                  className="mt-2"
                  required
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!newWatchlistName.trim() || createWatchlistMutation.isPending}
                >
                  {createWatchlistMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Watchlist"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {watchlists?.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Watchlists Found</CardTitle>
            <CardDescription>
              You haven't created any watchlists yet.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Watchlist
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {watchlists?.map((watchlist) => (
            <Card key={watchlist.id} className="hover:border-primary transition-colors">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <BookmarkCheck className="mr-2 h-5 w-5 text-primary" />
                    {watchlist.name}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate(`/watchlist/${watchlist.id}`)}>
                        <BookmarkPlus className="mr-2 h-4 w-4" />
                        View Watchlist
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(watchlist)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => openDeleteDialog(watchlist)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="flex items-center">
                  <Clock className="mr-1 h-3 w-3" />
                  Created {format(new Date(watchlist.createdAt), "MMMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <ListPlus className="mr-2 h-4 w-4" />
                  <span>Add stocks to this watchlist to track them</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  variant="ghost"
                  className="w-full justify-between hover:bg-accent"
                  onClick={() => navigate(`/watchlist/${watchlist.id}`)}
                >
                  <span>View Watchlist</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateWatchlist}>
            <DialogHeader>
              <DialogTitle>Rename Watchlist</DialogTitle>
              <DialogDescription>
                Enter a new name for your watchlist
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="edit-watchlist-name">Watchlist Name</Label>
              <Input
                id="edit-watchlist-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-2"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingWatchlist(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!editName.trim() || updateWatchlistMutation.isPending}
              >
                {updateWatchlistMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Watchlist</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the watchlist "{deleteConfirmWatchlist?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeleteConfirmWatchlist(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteWatchlist}
              disabled={deleteWatchlistMutation.isPending}
            >
              {deleteWatchlistMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Watchlist"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}