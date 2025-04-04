import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { StockNewsItem } from "@/types/stock";
import { useToast } from "@/hooks/use-toast";
import { formatRelativeTime } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

const NewsPage = () => {
  const [location] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("trending");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch trending news
  const { data: trendingNews, isLoading: isLoadingTrending } = useQuery<StockNewsItem[]>({
    queryKey: ["/api/news/trending"],
  });
  
  // Fetch market news
  const { data: marketNews, isLoading: isLoadingMarket } = useQuery<StockNewsItem[]>({
    queryKey: ["/api/news/market"],
  });
  
  // Fetch economy news
  const { data: economyNews, isLoading: isLoadingEconomy } = useQuery<StockNewsItem[]>({
    queryKey: ["/api/news/economy"],
  });
  
  // Fetch search results
  const { data: searchResults, isLoading: isLoadingSearch, refetch: refetchSearch } = useQuery<StockNewsItem[]>({
    queryKey: ["/api/news/search", searchTerm],
    enabled: false,
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      toast({
        title: "Search term required",
        description: "Please enter a search term",
        variant: "destructive"
      });
      return;
    }
    setActiveTab("search");
    refetchSearch();
  };
  
  // Function to render news list
  const renderNewsList = (newsList: StockNewsItem[] | undefined, isLoading: boolean) => {
    if (isLoading) {
      return <div className="py-8 text-center text-gray-500">Loading news articles...</div>;
    }
    
    if (!newsList || newsList.length === 0) {
      return <div className="py-8 text-center text-gray-500">No news articles found</div>;
    }
    
    return (
      <div className="space-y-6">
        {newsList.map((news, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {news.thumbnail && (
                  <div className="w-20 h-20 flex-shrink-0">
                    <img 
                      src={news.thumbnail} 
                      alt={news.title}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                )}
                <div className="flex-grow">
                  <a 
                    href={news.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block mb-2 font-semibold hover:text-primary"
                  >
                    {news.title}
                  </a>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-2">{news.summary}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{news.publisher}</span>
                    <span>{formatRelativeTime(new Date(news.publishedAt).getTime())}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-textDark">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Market News</h1>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Back to Dashboard
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search for news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" disabled={isLoadingSearch}>Search</Button>
          </form>
        </div>
        
        {/* News Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="economy">Economy</TabsTrigger>
            {searchResults && <TabsTrigger value="search">Search Results</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="trending">
            {renderNewsList(trendingNews, isLoadingTrending)}
          </TabsContent>
          
          <TabsContent value="market">
            {renderNewsList(marketNews, isLoadingMarket)}
          </TabsContent>
          
          <TabsContent value="economy">
            {renderNewsList(economyNews, isLoadingEconomy)}
          </TabsContent>
          
          <TabsContent value="search">
            {renderNewsList(searchResults, isLoadingSearch)}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default NewsPage;