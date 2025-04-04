import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Edit,
  Eye,
  FileText,
  Loader2,
  MessageSquare,
  Pin,
  Search,
  Trash2,
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ForumTopic, ForumReply } from "@shared/schema";

// Define types for the user's posts
interface ForumTopicWithCategory extends ForumTopic {
  categoryName?: string;
  replyCount?: number;
}

interface ForumReplyWithTopic extends ForumReply {
  topicTitle?: string;
  categoryName?: string;
}

export default function MyPostsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("topics");

  // Fetch user's topics
  const {
    data: userTopics,
    isLoading: topicsLoading,
    error: topicsError,
  } = useQuery<ForumTopicWithCategory[]>({
    queryKey: ["/api/forum/my-topics"],
    enabled: !!user,
  });

  // Fetch user's replies
  const {
    data: userReplies,
    isLoading: repliesLoading,
    error: repliesError,
  } = useQuery<ForumReplyWithTopic[]>({
    queryKey: ["/api/forum/my-replies"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              You need to be logged in to view your forum posts.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/auth")}>
              Go to Login
            </Button>
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
              Error Loading Your Posts
            </CardTitle>
            <CardDescription>
              There was a problem loading your forum posts. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/forum")}>
              Return to Forum
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Mock data until the API endpoints are implemented
  const mockTopics: ForumTopicWithCategory[] = [
    {
      id: 1,
      categoryId: 2,
      userId: user.id,
      title: "What do you think about NVIDIA's latest earnings?",
      content: "I was surprised by their recent performance and wondering what others think about the long-term prospect...",
      views: 42,
      isPinned: false,
      isLocked: false,
      createdAt: new Date(2025, 3, 1),
      lastReplyAt: new Date(2025, 3, 2),
      categoryName: "Stock Discussion",
      replyCount: 5,
    },
    {
      id: 2,
      categoryId: 3,
      userId: user.id,
      title: "My strategy for tech stocks in a rising interest rate environment",
      content: "I've been adjusting my portfolio based on the Fed's recent policy changes and wanted to share my approach...",
      views: 78,
      isPinned: false,
      isLocked: false,
      createdAt: new Date(2025, 2, 25),
      lastReplyAt: new Date(2025, 3, 1),
      categoryName: "Investment Strategies",
      replyCount: 12,
    },
    {
      id: 3,
      categoryId: 1,
      userId: user.id,
      title: "Introducing myself - New investor from Seattle",
      content: "Hello everyone! I'm new to investing and excited to join this community...",
      views: 24,
      isPinned: false,
      isLocked: false,
      createdAt: new Date(2025, 2, 20),
      lastReplyAt: new Date(2025, 2, 21),
      categoryName: "Introductions",
      replyCount: 8,
    },
  ];

  const mockReplies: ForumReplyWithTopic[] = [
    {
      id: 1,
      topicId: 4,
      userId: user.id,
      content: "I agree with your analysis. The market seems to be pricing in too much optimism for some of these growth stocks.",
      isEdited: false,
      createdAt: new Date(2025, 3, 3),
      topicTitle: "Market overvaluation in tech sector",
      categoryName: "Market Analysis",
    },
    {
      id: 2,
      topicId: 5,
      userId: user.id,
      content: "I've been using this screener for years and can confirm it's one of the best tools for dividend stock research.",
      isEdited: true,
      createdAt: new Date(2025, 3, 1),
      editedAt: new Date(2025, 3, 1, 10, 30),
      topicTitle: "Best tools for finding dividend stocks",
      categoryName: "Tools & Resources",
    },
    {
      id: 3,
      topicId: 6,
      userId: user.id,
      content: "Thanks for sharing your experience. Have you considered dollar-cost averaging instead of trying to time these volatile swings?",
      isEdited: false,
      createdAt: new Date(2025, 2, 28),
      topicTitle: "Timing the market vs. time in the market",
      categoryName: "Investment Strategies",
    },
    {
      id: 4,
      topicId: 7,
      userId: user.id,
      content: "Congratulations on your first investment! My advice would be to focus on learning about the businesses you're investing in rather than just looking at stock price movements.",
      isEdited: false,
      createdAt: new Date(2025, 2, 25),
      topicTitle: "Made my first investment today!",
      categoryName: "Introductions",
    },
  ];

  const topics = userTopics || mockTopics;
  const replies = userReplies || mockReplies;

  // Filter topics based on search query
  let filteredTopics = topics;
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredTopics = topics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(query) ||
        topic.content.toLowerCase().includes(query) ||
        (topic.categoryName && topic.categoryName.toLowerCase().includes(query))
    );
  }

  // Filter replies based on search query
  let filteredReplies = replies;
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredReplies = replies.filter(
      (reply) =>
        reply.content.toLowerCase().includes(query) ||
        (reply.topicTitle && reply.topicTitle.toLowerCase().includes(query)) ||
        (reply.categoryName && reply.categoryName.toLowerCase().includes(query))
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">My Forum Posts</h1>
          <p className="text-muted-foreground">
            Manage and review all your contributions to the forum
          </p>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search your posts..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Tabs defaultValue="topics" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="topics" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              My Topics
              <Badge variant="secondary" className="ml-2 h-5 min-w-5">
                {topics.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="replies" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              My Replies
              <Badge variant="secondary" className="ml-2 h-5 min-w-5">
                {replies.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="topics" className="mt-6">
            {filteredTopics.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "No topics match your search criteria"
                      : "You haven't created any topics yet"}
                  </p>
                  {!searchQuery && (
                    <Button className="mt-4" onClick={() => navigate("/forum")}>
                      Browse Forum
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredTopics.map((topic) => (
                  <Card 
                    key={topic.id} 
                    className={`hover:border-primary transition-colors ${topic.isPinned ? 'border-l-4 border-l-amber-500' : ''}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle 
                            className="text-xl font-semibold hover:text-primary cursor-pointer"
                            onClick={() => navigate(`/forum/topic/${topic.id}`)}
                          >
                            {topic.title}
                            {topic.isPinned && (
                              <Pin className="inline-block ml-2 h-4 w-4 text-amber-500" />
                            )}
                          </CardTitle>
                          <CardDescription className="flex flex-wrap gap-2 text-xs mt-1">
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
                              {topic.replyCount || 0} replies
                            </span>
                            <span>
                              in {topic.categoryName}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-destructive border-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
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
                        size="sm"
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
          </TabsContent>
          
          <TabsContent value="replies" className="mt-6">
            {filteredReplies.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "No replies match your search criteria"
                      : "You haven't replied to any topics yet"}
                  </p>
                  {!searchQuery && (
                    <Button className="mt-4" onClick={() => navigate("/forum")}>
                      Browse Forum
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredReplies.map((reply) => (
                  <Card key={reply.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle 
                            className="text-lg font-semibold hover:text-primary cursor-pointer"
                            onClick={() => navigate(`/forum/topic/${reply.topicId}`)}
                          >
                            Re: {reply.topicTitle}
                          </CardTitle>
                          <CardDescription className="flex flex-wrap gap-2 text-xs mt-1">
                            <span className="flex items-center">
                              <Calendar className="mr-1 h-3 w-3" />
                              {format(new Date(reply.createdAt), "MMM d, yyyy")}
                            </span>
                            {reply.isEdited && (
                              <span className="text-muted-foreground">
                                (edited)
                              </span>
                            )}
                            <span>
                              in {reply.categoryName}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-destructive border-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted rounded-full"></div>
                      <div className="pl-4">
                        <p className="text-sm text-muted-foreground">
                          {reply.content}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/forum/topic/${reply.topicId}`)}
                      >
                        View Full Discussion
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-8 border-t pt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Statistics</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-primary" />
                  Total Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{topics.length}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                  Total Replies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{replies.length}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Eye className="mr-2 h-5 w-5 text-primary" />
                  Topic Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {topics.reduce((sum, topic) => sum + topic.views, 0)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}