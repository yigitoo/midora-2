import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { ForumTopic, ForumReply } from "@shared/schema";
import { format } from "date-fns";
import {
  Loader2,
  AlertCircle,
  MessageSquare,
  Reply,
  Filter,
  Clock,
  Eye,
  Lock,
  Pin,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Custom hook to fetch user's forum topics
function useUserTopics() {
  const { user } = useAuth();
  
  return useQuery<ForumTopic[]>({
    queryKey: ["/api/forum/user/topics", user?.id],
    queryFn: async () => {
      // This would be a real API call in a production environment
      // Returning mock data for now since the API endpoint doesn't exist yet
      return [];
    },
    enabled: !!user,
  });
}

// Custom hook to fetch user's forum replies
function useUserReplies() {
  const { user } = useAuth();
  
  return useQuery<ForumReply[]>({
    queryKey: ["/api/forum/user/replies", user?.id],
    queryFn: async () => {
      // This would be a real API call in a production environment
      // Returning mock data for now since the API endpoint doesn't exist yet
      return [];
    },
    enabled: !!user,
  });
}

export default function MyPostsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [sortOrder, setSortOrder] = useState<string>("newest");
  
  const {
    data: topics,
    isLoading: topicsLoading,
    error: topicsError,
  } = useUserTopics();
  
  const {
    data: replies,
    isLoading: repliesLoading,
    error: repliesError,
  } = useUserReplies();
  
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
              Authentication Required
            </CardTitle>
            <CardDescription>You need to be logged in to view your posts</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  const isLoading = topicsLoading || repliesLoading;
  const hasError = topicsError || repliesError;
  
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
              Error Loading Posts
            </CardTitle>
            <CardDescription>
              There was a problem loading your forum posts
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/forum/categories")}>Return to Forum</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Sort topics by date if they exist
  const sortedTopics = topics ? [...topics] : [];
  if (sortOrder === "newest") {
    sortedTopics.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortOrder === "oldest") {
    sortedTopics.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (sortOrder === "most-viewed") {
    sortedTopics.sort((a, b) => b.views - a.views);
  }

  // Sort replies by date if they exist
  const sortedReplies = replies ? [...replies] : [];
  if (sortOrder === "newest") {
    sortedReplies.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortOrder === "oldest") {
    sortedReplies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Forum Posts</h1>
        <Badge variant="outline" className="px-3 py-1">
          {user.membershipType} Member
        </Badge>
      </div>

      <div className="flex justify-between items-center mb-6">
        <Button
          variant="outline"
          onClick={() => navigate("/forum/categories")}
        >
          Back to Forum
        </Button>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select 
            value={sortOrder} 
            onValueChange={setSortOrder}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="most-viewed">Most Viewed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="topics" className="w-full">
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-2">
          <TabsTrigger value="topics" className="flex items-center">
            <MessageSquare className="mr-2 h-4 w-4" />
            My Topics
          </TabsTrigger>
          <TabsTrigger value="replies" className="flex items-center">
            <Reply className="mr-2 h-4 w-4" />
            My Replies
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="topics" className="mt-6">
          {sortedTopics.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Topics Found</CardTitle>
                <CardDescription>
                  You haven't created any topics yet.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => navigate("/forum/categories")}>Start a New Discussion</Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedTopics.map((topic) => (
                <Card key={topic.id} className="hover:border-primary transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle 
                        className="text-lg font-medium hover:text-primary cursor-pointer"
                        onClick={() => navigate(`/forum/topics/${topic.id}`)}
                      >
                        {topic.title}
                        {topic.isPinned && (
                          <Pin className="inline-block ml-2 h-4 w-4 text-amber-500" />
                        )}
                        {topic.isLocked && (
                          <Lock className="inline-block ml-2 h-4 w-4 text-muted-foreground" />
                        )}
                      </CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Filter className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/forum/topics/${topic.id}`)}>
                            View Topic
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/forum/topics/edit/${topic.id}`)}>
                            Edit Topic
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {format(new Date(topic.createdAt), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center">
                        <Eye className="mr-1 h-3 w-3" />
                        {topic.views} views
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm line-clamp-2">
                      {topic.content}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => navigate(`/forum/topics/${topic.id}`)}
                    >
                      Continue Reading
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="replies" className="mt-6">
          {sortedReplies.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Replies Found</CardTitle>
                <CardDescription>
                  You haven't replied to any topics yet.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => navigate("/forum/categories")}>Browse Discussions</Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedReplies.map((reply) => (
                <Card key={reply.id} className="hover:border-primary transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg font-medium">
                        Reply to Topic #{reply.topicId}
                      </CardTitle>
                      <Badge variant={reply.isEdited ? "outline" : "secondary"} className="ml-2">
                        {reply.isEdited ? "Edited" : "Original"}
                      </Badge>
                    </div>
                    <CardDescription>
                      <span className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {format(new Date(reply.createdAt), "MMM d, yyyy h:mm a")}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm line-clamp-2">
                      {reply.content}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => navigate(`/forum/topics/${reply.topicId}`)}
                    >
                      View Full Topic
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}