import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, ChevronLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ForumTopicsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const categoryId = Number(id);
  
  const { data: category, isLoading: isLoadingCategory } = useQuery({
    queryKey: [`/api/forum/categories/${categoryId}`],
    enabled: !!categoryId,
  });
  
  const { data: topics, isLoading: isLoadingTopics, refetch } = useQuery({
    queryKey: ['/api/forum/topics', { categoryId }],
    enabled: !!categoryId,
  });
  
  if (isLoadingCategory || isLoadingTopics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-xl text-destructive">Forum category not found</p>
        <Link href="/forum">
          <Button variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Button>
        </Link>
      </div>
    );
  }
  
  const handleCreateTopic = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create a topic",
        variant: "destructive"
      });
      return;
    }
    
    if (!newTopic.title.trim() || !newTopic.content.trim()) {
      toast({
        title: "Invalid input",
        description: "Please provide both a title and content for your topic",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", "/api/forum/topics", {
        categoryId,
        title: newTopic.title,
        content: newTopic.content
      });
      
      toast({
        title: "Topic created",
        description: "Your topic has been created successfully"
      });
      
      setNewTopic({ title: '', content: '' });
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create topic. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/forum">
          <Button variant="ghost" className="mb-4 pl-0 hover:pl-0">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Button>
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{category.name}</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Topic</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Topic</DialogTitle>
                <DialogDescription>
                  Start a new discussion in the {category.name} category
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newTopic.title}
                    onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                    placeholder="Enter a descriptive title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newTopic.content}
                    onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                    placeholder="Share your thoughts..."
                    className="min-h-[120px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleCreateTopic} 
                  disabled={isSubmitting || !newTopic.title.trim() || !newTopic.content.trim()}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Post Topic
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-muted-foreground mt-2">{category.description}</p>
      </div>
      
      <div className="space-y-4">
        {topics && topics.length > 0 ? (
          topics.map((topic) => (
            <Link key={topic.id} href={`/forum/topic/${topic.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="mr-2">{topic.title}</CardTitle>
                    {topic.isPinned && (
                      <div className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Pinned</div>
                    )}
                  </div>
                  <CardDescription>
                    Posted by {topic.username || 'Anonymous'} on {new Date(topic.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {topic.content}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    <span>Replies: {topic.replyCount || 0}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span>Views: {topic.views || 0}</span>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-xl text-muted-foreground">No topics in this category yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Be the first to start a discussion!
              </p>
              <Button 
                onClick={() => setIsDialogOpen(true)} 
                className="mt-4"
              >
                Create Topic
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}