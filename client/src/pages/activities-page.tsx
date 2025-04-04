import React from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchHistory } from "@shared/schema";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { ShieldCheck, AlertCircle, Loader2, ArrowUpRight, Search, Clock } from "lucide-react";
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

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch user's activity history (search history)
  const {
    data: activities,
    isLoading,
    error,
  } = useQuery<SearchHistory[]>({
    queryKey: ["/api/activity"],
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
            <CardDescription>You need to be logged in to view this page</CardDescription>
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
              Error Loading Activities
            </CardTitle>
            <CardDescription>
              There was a problem loading your recent activities
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/")}>Return to Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Group activities by date for better organization
  const groupedActivities: { [key: string]: SearchHistory[] } = {};
  
  activities?.forEach((activity) => {
    const date = new Date(activity.timestamp);
    const dateKey = format(date, "yyyy-MM-dd");
    
    if (!groupedActivities[dateKey]) {
      groupedActivities[dateKey] = [];
    }
    
    groupedActivities[dateKey].push(activity);
  });

  // Sort dates in descending order (most recent first)
  const sortedDates = Object.keys(groupedActivities).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Recent Activities</h1>
        <Badge variant="outline" className="px-3 py-1">
          <ShieldCheck className="mr-1 h-4 w-4" />
          {user.membershipType} User
        </Badge>
      </div>

      <Tabs defaultValue="all" className="w-full mb-8">
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-3">
          <TabsTrigger value="all">All Activities</TabsTrigger>
          <TabsTrigger value="searches">Searches</TabsTrigger>
          <TabsTrigger value="views">Stock Views</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {activities?.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Activities Found</CardTitle>
                <CardDescription>
                  You haven't performed any actions yet. Try searching for stocks or viewing stock details.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={() => navigate("/market")}>Explore Market</Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="space-y-8">
              {sortedDates.map((dateKey) => (
                <div key={dateKey} className="space-y-4">
                  <h2 className="text-xl font-semibold border-b pb-2">
                    {format(new Date(dateKey), "MMMM d, yyyy")}
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groupedActivities[dateKey].map((activity) => (
                      <Card key={activity.id} className="hover:border-primary transition-colors">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-medium">{activity.symbol}</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <CardDescription className="flex items-center">
                            <Search className="mr-1 h-3 w-3" />
                            Searched
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(activity.timestamp), "h:mm a")}
                          </p>
                        </CardContent>
                        <CardFooter className="pt-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-between hover:bg-accent"
                            onClick={() => navigate(`/stocks/${activity.symbol}`)}
                          >
                            <span>View Details</span>
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="searches" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Search History</CardTitle>
              <CardDescription>
                Your recent stock searches are shown here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities?.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">No searches found</p>
              ) : (
                <ul className="space-y-2">
                  {activities?.map((activity) => (
                    <li
                      key={activity.id}
                      className="flex items-center justify-between border-b pb-2"
                    >
                      <div className="flex items-center">
                        <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{activity.symbol}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {format(new Date(activity.timestamp), "MMM d, yyyy h:mm a")}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="views" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Stock View History</CardTitle>
              <CardDescription>
                Stocks you've viewed in detail will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-6">
                This feature is coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}