import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ForumTopic, insertForumTopicSchema } from "@shared/schema";
import { useLocation, useRoute } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  FileText,
  Pin,
  Plus,
  Eye,
  MessageSquare,
  Clock,
  Lock,
  Loader2,
  User,
  AlertCircle,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as z from "zod";

// Form schema for creating a new topic
const formSchema = insertForumTopicSchema.extend({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }).max(100, {
    message: "Title must not exceed 100 characters."
  }),
  content: z.string().min(10, {
    message: "Content must be at least 10 characters.",
  }).max(5000, {
    message: "Content must not exceed 5000 characters."
  }),
});

export default function TopicsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/forum/category/:id");
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<string>("latest");
  
  const categoryId = params ? Number(params.id) : 0;

  // Fetch category details
  const {
    data: category,
    isLoading: categoryLoading,
    error: categoryError
  } = useQuery({
    queryKey: [`/api/forum/categories/${categoryId}`],
    enabled: categoryId > 0,
  });

  // Fetch topics for this category
  const {
    data: topics,
    isLoading: topicsLoading,
    error: topicsError
  } = useQuery<ForumTopic[]>({
    queryKey: [`/api/forum/topics?categoryId=${categoryId}`],
    enabled: categoryId > 0,
  });

  // Form for creating a new topic
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: categoryId,
      userId: user?.id || 0,
      title: "",
      content: "",
      isPinned: false,
      isLocked: false,
    },
  });

  // Create topic mutation
  const createTopicMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/forum/topics", values);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/forum/topics?categoryId=${categoryId}`] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Topic Created",
        description: "Your topic has been created successfully",
      });
      navigate(`/forum/topic/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Topic",
        description: error.message || "There was an error creating your topic",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createTopicMutation.mutate(values);
  };

  const isLoading = categoryLoading || topicsLoading;
  const hasError = categoryError || topicsError;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
              Error Loading Forum Topics
            </CardTitle>
            <CardDescription>
              There was a problem loading the forum topics for this category.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/forum")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Categories
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Sort topics based on selected order
  const sortedTopics = [...(topics || [])];
  if (sortOrder === "latest") {
    sortedTopics.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortOrder === "oldest") {
    sortedTopics.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (sortOrder === "most-views") {
    sortedTopics.sort((a, b) => b.views - a.views);
  } else if (sortOrder === "pinned") {
    sortedTopics.sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1));
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{category?.name}</h1>
            <p className="text-muted-foreground">{category?.description}</p>
          </div>
          
          <div className="mt-4 sm:mt-0">
            <Button
              variant="outline"
              className="mr-2"
              onClick={() => navigate("/forum")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Categories
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Topic
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>Create New Topic</DialogTitle>
                  <DialogDescription>
                    Start a new discussion in the {category?.name} category
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Topic Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter a title for your topic" {...field} />
                          </FormControl>
                          <FormDescription>
                            Make your title descriptive and concise
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Share your thoughts, questions, or insights..." 
                              className="min-h-[200px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Be clear and include relevant details to encourage discussion
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <input type="hidden" {...form.register("categoryId")} value={categoryId} />
                    <input type="hidden" {...form.register("userId")} value={user?.id} />
                    <input type="hidden" {...form.register("isPinned")} value="false" />
                    <input type="hidden" {...form.register("isLocked")} value="false" />
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createTopicMutation.isPending}
                      >
                        {createTopicMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Topic"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground mr-2">
              {topics?.length} topics
            </span>
          </div>
          
          <div className="flex items-center">
            <Label htmlFor="sort-order" className="mr-2 text-sm">Sort by:</Label>
            <Select 
              value={sortOrder}
              onValueChange={setSortOrder}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="most-views">Most Views</SelectItem>
                <SelectItem value="pinned">Pinned First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {sortedTopics.length === 0 ? (
          <Card className="text-center">
            <CardHeader>
              <CardTitle>No Topics Found</CardTitle>
              <CardDescription>
                Be the first to start a discussion in this category
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Topic
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedTopics.map((topic) => (
              <Card 
                key={topic.id} 
                className={`hover:border-primary transition-colors ${topic.isPinned ? 'border-l-4 border-l-amber-500' : ''}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle 
                        className="text-xl font-semibold hover:text-primary cursor-pointer flex items-center"
                        onClick={() => navigate(`/forum/topic/${topic.id}`)}
                      >
                        {topic.title}
                        {topic.isPinned && (
                          <Pin className="ml-2 h-4 w-4 text-amber-500" />
                        )}
                        {topic.isLocked && (
                          <Lock className="ml-2 h-4 w-4 text-muted-foreground" />
                        )}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap gap-2 text-xs">
                        <span className="flex items-center">
                          <User className="mr-1 h-3 w-3" />
                          Started by {user?.username || 'Anonymous'}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {format(new Date(topic.createdAt), "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center">
                          <Eye className="mr-1 h-3 w-3" />
                          {topic.views} views
                        </span>
                        <span className="flex items-center">
                          <MessageSquare className="mr-1 h-3 w-3" />
                          {/* When we have a reply count, we can show it here */}
                          0 replies
                        </span>
                        <span className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          Last reply: {format(new Date(topic.lastReplyAt || topic.createdAt), "MMM d, yyyy")}
                        </span>
                      </CardDescription>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <Badge variant={topic.isLocked ? "outline" : "secondary"} className="mb-2">
                        {topic.isLocked ? "Locked" : "Active"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {topic.content}
                  </p>
                </CardContent>
                <CardFooter className="pt-0 justify-end">
                  <Button
                    variant="ghost"
                    className="text-sm font-medium"
                    onClick={() => navigate(`/forum/topic/${topic.id}`)}
                  >
                    View Topic
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}