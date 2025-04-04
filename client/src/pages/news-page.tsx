import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewsFeed from "@/components/news/news-feed";
import { Newspaper, TrendingUp, Globe, BarChart3 } from "lucide-react";

const NewsPage = () => {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("business");
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-textDark">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Financial News</h1>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Back to Dashboard
          </Button>
        </div>
        
        {/* News Sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="business" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Business
            </TabsTrigger>
            <TabsTrigger value="technology" className="flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              Technology
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center">
              <Newspaper className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="business">
            <NewsFeed />
          </TabsContent>
          
          <TabsContent value="technology">
            <Card className="p-6 text-center">
              <CardContent>
                <h3 className="text-lg font-medium mb-2">Technology News</h3>
                <p className="text-muted-foreground mb-4">
                  Stay up-to-date with the latest in technology trends, innovations, and market impacts.
                </p>
                <Button 
                  onClick={() => setActiveTab("business")}
                  className="mx-auto"
                >
                  Switch to Business News
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="general">
            <Card className="p-6 text-center">
              <CardContent>
                <h3 className="text-lg font-medium mb-2">General News</h3>
                <p className="text-muted-foreground mb-4">
                  Catch up on general news and events that might impact financial markets.
                </p>
                <Button 
                  onClick={() => setActiveTab("business")}
                  className="mx-auto"
                >
                  Switch to Business News
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trending">
            <Card className="p-6 text-center">
              <CardContent>
                <h3 className="text-lg font-medium mb-2">Trending Topics</h3>
                <p className="text-muted-foreground mb-4">
                  Discover what's trending in the financial world and get ahead of market movements.
                </p>
                <Button 
                  onClick={() => setActiveTab("business")}
                  className="mx-auto"
                >
                  Switch to Business News
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default NewsPage;