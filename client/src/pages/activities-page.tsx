import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowUpDown,
  Calendar,
  Clock,
  Eye,
  Filter,
  Link,
  Loader2,
  MessageSquare,
  Search,
  Star,
  Trash2,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type definitions for activities
type ActivityType =
  | "SEARCH"
  | "VIEW_STOCK"
  | "ADD_TO_WATCHLIST"
  | "REMOVE_FROM_WATCHLIST"
  | "CREATE_FORUM_TOPIC"
  | "CREATE_FORUM_REPLY"
  | "VIEW_FORUM_TOPIC";

interface Activity {
  id: number;
  userId: number;
  type: ActivityType;
  details: {
    symbol?: string;
    stockName?: string;
    watchlistId?: number;
    watchlistName?: string;
    topicId?: number;
    topicTitle?: string;
    categoryId?: number;
    categoryName?: string;
    replyId?: number;
  };
  timestamp: Date;
}

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all-time");
  const [sortOrder, setSortOrder] = useState("newest");

  // Fetch user activities
  const {
    data: activities,
    isLoading,
    error,
  } = useQuery<Activity[]>({
    queryKey: ["/api/user/activities"],
    enabled: !!user,
  });

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
            <CardTitle>Error Loading Activities</CardTitle>
            <CardDescription>
              There was a problem loading your activity history. Please try again later.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Mock data until the API endpoint is fully implemented
  const mockActivities: Activity[] = [
    {
      id: 1,
      userId: user?.id || 1,
      type: "SEARCH",
      details: {
        symbol: "AAPL",
        stockName: "Apple Inc.",
      },
      timestamp: new Date(2025, 3, 4, 10, 15),
    },
    {
      id: 2,
      userId: user?.id || 1,
      type: "VIEW_STOCK",
      details: {
        symbol: "MSFT",
        stockName: "Microsoft Corporation",
      },
      timestamp: new Date(2025, 3, 4, 9, 30),
    },
    {
      id: 3,
      userId: user?.id || 1,
      type: "ADD_TO_WATCHLIST",
      details: {
        symbol: "TSLA",
        stockName: "Tesla, Inc.",
        watchlistId: 1,
        watchlistName: "Tech Stocks",
      },
      timestamp: new Date(2025, 3, 3, 15, 45),
    },
    {
      id: 4,
      userId: user?.id || 1,
      type: "CREATE_FORUM_TOPIC",
      details: {
        topicId: 1,
        topicTitle: "What do you think about NVIDIA's latest earnings?",
        categoryId: 2,
        categoryName: "Stock Discussion",
      },
      timestamp: new Date(2025, 3, 2, 11, 20),
    },
    {
      id: 5,
      userId: user?.id || 1,
      type: "VIEW_FORUM_TOPIC",
      details: {
        topicId: 2,
        topicTitle: "Best dividend stocks for 2025",
        categoryId: 3,
        categoryName: "Investment Strategies",
      },
      timestamp: new Date(2025, 3, 2, 10, 5),
    },
    {
      id: 6,
      userId: user?.id || 1,
      type: "CREATE_FORUM_REPLY",
      details: {
        topicId: 2,
        topicTitle: "Best dividend stocks for 2025",
        categoryId: 3,
        categoryName: "Investment Strategies",
        replyId: 5,
      },
      timestamp: new Date(2025, 3, 2, 10, 15),
    },
    {
      id: 7,
      userId: user?.id || 1,
      type: "REMOVE_FROM_WATCHLIST",
      details: {
        symbol: "AMZN",
        stockName: "Amazon.com, Inc.",
        watchlistId: 2,
        watchlistName: "E-commerce",
      },
      timestamp: new Date(2025, 3, 1, 14, 30),
    },
  ];

  const userActivities = activities || mockActivities;

  // Filter by type based on active tab
  let filteredActivities = userActivities;
  if (activeTab === "stock") {
    filteredActivities = userActivities.filter(
      (activity) =>
        activity.type === "SEARCH" ||
        activity.type === "VIEW_STOCK" ||
        activity.type === "ADD_TO_WATCHLIST" ||
        activity.type === "REMOVE_FROM_WATCHLIST"
    );
  } else if (activeTab === "forum") {
    filteredActivities = userActivities.filter(
      (activity) =>
        activity.type === "CREATE_FORUM_TOPIC" ||
        activity.type === "CREATE_FORUM_REPLY" ||
        activity.type === "VIEW_FORUM_TOPIC"
    );
  } else if (activeTab === "watchlist") {
    filteredActivities = userActivities.filter(
      (activity) =>
        activity.type === "ADD_TO_WATCHLIST" ||
        activity.type === "REMOVE_FROM_WATCHLIST"
    );
  }

  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredActivities = filteredActivities.filter((activity) => {
      return (
        activity.details.symbol?.toLowerCase().includes(query) ||
        activity.details.stockName?.toLowerCase().includes(query) ||
        activity.details.watchlistName?.toLowerCase().includes(query) ||
        activity.details.topicTitle?.toLowerCase().includes(query) ||
        activity.details.categoryName?.toLowerCase().includes(query)
      );
    });
  }

  // Apply time filter
  if (timeFilter === "today") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    filteredActivities = filteredActivities.filter(
      (activity) => new Date(activity.timestamp) >= today
    );
  } else if (timeFilter === "this-week") {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    filteredActivities = filteredActivities.filter(
      (activity) => new Date(activity.timestamp) >= weekStart
    );
  } else if (timeFilter === "this-month") {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    filteredActivities = filteredActivities.filter(
      (activity) => new Date(activity.timestamp) >= monthStart
    );
  }

  // Apply sort order
  if (sortOrder === "newest") {
    filteredActivities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } else if (sortOrder === "oldest") {
    filteredActivities.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  const renderActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "SEARCH":
        return <Search className="h-4 w-4 text-primary" />;
      case "VIEW_STOCK":
        return <Eye className="h-4 w-4 text-blue-500" />;
      case "ADD_TO_WATCHLIST":
        return <Star className="h-4 w-4 text-amber-500" />;
      case "REMOVE_FROM_WATCHLIST":
        return <Trash2 className="h-4 w-4 text-destructive" />;
      case "CREATE_FORUM_TOPIC":
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "CREATE_FORUM_REPLY":
        return <MessageSquare className="h-4 w-4 text-indigo-500" />;
      case "VIEW_FORUM_TOPIC":
        return <Eye className="h-4 w-4 text-violet-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const renderActivityContent = (activity: Activity) => {
    switch (activity.type) {
      case "SEARCH":
        return (
          <>
            <div className="font-medium">Searched for a stock</div>
            <div className="text-sm text-muted-foreground flex items-center">
              <Link className="h-3 w-3 mr-1" />
              <span 
                className="hover:text-primary cursor-pointer"
                onClick={() => navigate(`/stocks/${activity.details.symbol}`)}
              >
                {activity.details.symbol} - {activity.details.stockName}
              </span>
            </div>
          </>
        );
      case "VIEW_STOCK":
        return (
          <>
            <div className="font-medium">Viewed stock details</div>
            <div className="text-sm text-muted-foreground flex items-center">
              <Link className="h-3 w-3 mr-1" />
              <span 
                className="hover:text-primary cursor-pointer"
                onClick={() => navigate(`/stocks/${activity.details.symbol}`)}
              >
                {activity.details.symbol} - {activity.details.stockName}
              </span>
            </div>
          </>
        );
      case "ADD_TO_WATCHLIST":
        return (
          <>
            <div className="font-medium">Added stock to watchlist</div>
            <div className="text-sm text-muted-foreground flex items-center">
              <Link className="h-3 w-3 mr-1" />
              <span 
                className="hover:text-primary cursor-pointer"
                onClick={() => navigate(`/stocks/${activity.details.symbol}`)}
              >
                {activity.details.symbol} - {activity.details.stockName}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Watchlist: {activity.details.watchlistName}
            </div>
          </>
        );
      case "REMOVE_FROM_WATCHLIST":
        return (
          <>
            <div className="font-medium">Removed stock from watchlist</div>
            <div className="text-sm text-muted-foreground flex items-center">
              <Link className="h-3 w-3 mr-1" />
              <span 
                className="hover:text-primary cursor-pointer"
                onClick={() => navigate(`/stocks/${activity.details.symbol}`)}
              >
                {activity.details.symbol} - {activity.details.stockName}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Watchlist: {activity.details.watchlistName}
            </div>
          </>
        );
      case "CREATE_FORUM_TOPIC":
        return (
          <>
            <div className="font-medium">Created a forum topic</div>
            <div className="text-sm text-muted-foreground flex items-center">
              <Link className="h-3 w-3 mr-1" />
              <span 
                className="hover:text-primary cursor-pointer"
                onClick={() => navigate(`/forum/topic/${activity.details.topicId}`)}
              >
                {activity.details.topicTitle}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Category: {activity.details.categoryName}
            </div>
          </>
        );
      case "CREATE_FORUM_REPLY":
        return (
          <>
            <div className="font-medium">Replied to a forum topic</div>
            <div className="text-sm text-muted-foreground flex items-center">
              <Link className="h-3 w-3 mr-1" />
              <span 
                className="hover:text-primary cursor-pointer"
                onClick={() => navigate(`/forum/topic/${activity.details.topicId}`)}
              >
                {activity.details.topicTitle}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Category: {activity.details.categoryName}
            </div>
          </>
        );
      case "VIEW_FORUM_TOPIC":
        return (
          <>
            <div className="font-medium">Viewed a forum topic</div>
            <div className="text-sm text-muted-foreground flex items-center">
              <Link className="h-3 w-3 mr-1" />
              <span 
                className="hover:text-primary cursor-pointer"
                onClick={() => navigate(`/forum/topic/${activity.details.topicId}`)}
              >
                {activity.details.topicTitle}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Category: {activity.details.categoryName}
            </div>
          </>
        );
      default:
        return <div className="font-medium">Unknown activity</div>;
    }
  };

  const groupActivitiesByDate = () => {
    const grouped: Record<string, Activity[]> = {};
    
    filteredActivities.forEach((activity) => {
      const date = new Date(activity.timestamp);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(activity);
    });
    
    return grouped;
  };

  const groupedActivities = groupActivitiesByDate();
  
  const formatGroupDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return format(date, "MMMM d, yyyy");
    }
  };

  const hasActivities = Object.keys(groupedActivities).length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">Activities</h1>
            <p className="text-muted-foreground">
              Track all your interactions on the platform
            </p>
          </div>
          
          <div className="flex items-center mt-4 sm:mt-0 gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTimeFilter("all-time")}>
                  All Time
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter("today")}>
                  Today
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter("this-week")}>
                  This Week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter("this-month")}>
                  This Month
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {sortOrder === "newest" ? "Newest First" : "Oldest First"}
            </Button>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search activities..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Tabs defaultValue="all" onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex">
            <TabsTrigger value="all">All Activities</TabsTrigger>
            <TabsTrigger value="stock">Stocks</TabsTrigger>
            <TabsTrigger value="forum">Forum</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlists</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <p className="text-sm text-muted-foreground mb-4">
              Showing all activities across the platform
            </p>
          </TabsContent>
          
          <TabsContent value="stock">
            <p className="text-sm text-muted-foreground mb-4">
              Showing only stock-related activities
            </p>
          </TabsContent>
          
          <TabsContent value="forum">
            <p className="text-sm text-muted-foreground mb-4">
              Showing only forum activities
            </p>
          </TabsContent>
          
          <TabsContent value="watchlist">
            <p className="text-sm text-muted-foreground mb-4">
              Showing only watchlist-related activities
            </p>
          </TabsContent>
        </Tabs>
        
        {!hasActivities ? (
          <Card className="text-center py-8">
            <CardContent>
              <p className="text-muted-foreground">No activities found</p>
              {searchQuery && (
                <p className="text-sm mt-2">
                  Try adjusting your search query or filters
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedActivities).map(([dateStr, activities]) => (
              <div key={dateStr}>
                <div className="flex items-center mb-4">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <h3 className="text-lg font-medium">{formatGroupDate(dateStr)}</h3>
                  <Separator className="ml-4 flex-grow" />
                </div>
                
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <Card key={activity.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex p-4">
                          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted mr-4">
                            {renderActivityIcon(activity.type)}
                          </div>
                          
                          <div className="flex-grow">
                            {renderActivityContent(activity)}
                          </div>
                          
                          <div className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                            {format(new Date(activity.timestamp), "h:mm a")}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}