import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { 
  RefreshCw, 
  Search, 
  ExternalLink, 
  BarChart3, 
  TrendingUp,
  Clock,
  Newspaper,
  Globe,
  Building,
  DollarSign
} from 'lucide-react';

type NewsArticle = {
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: {
    name: string;
  };
  content: string;
  author: string;
};

type NewsFeedProps = {
  stockSymbol?: string;
};

const CATEGORIES = [
  { id: 'business', name: 'Business', icon: <Building className="h-4 w-4" /> },
  { id: 'technology', name: 'Technology', icon: <Globe className="h-4 w-4" /> },
  { id: 'general', name: 'General', icon: <Newspaper className="h-4 w-4" /> },
  { id: 'finance', name: 'Finance', icon: <DollarSign className="h-4 w-4" /> }
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  
  // Check if it's today
  const today = new Date();
  const isToday = date.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0);
  
  if (isToday) {
    return `Today at ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  }
  
  // Check if it's yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.setHours(0, 0, 0, 0) === yesterday.setHours(0, 0, 0, 0);
  
  if (isYesterday) {
    return `Yesterday at ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  }
  
  // Otherwise show full date
  return date.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const NewsFeed: React.FC<NewsFeedProps> = ({ stockSymbol }) => {
  const [selectedCategory, setSelectedCategory] = useState('business');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  
  // Define query key that updates when parameters change
  const queryKey = stockSymbol 
    ? ['/api/news/stock', stockSymbol] 
    : ['/api/news', selectedCategory, searchQuery];
  
  // Fetch news articles
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      let endpoint;
      let params = {};
      
      if (stockSymbol) {
        endpoint = `/api/news/stock/${stockSymbol}`;
      } else {
        endpoint = '/api/news';
        params = {
          category: selectedCategory
        };
        
        if (searchQuery) {
          params['query'] = searchQuery;
        }
      }
      
      try {
        const queryString = new URLSearchParams(params as Record<string, string>).toString();
        const url = `${endpoint}${queryString ? '?' + queryString : ''}`;
        const res = await apiRequest('GET', url);
        const data = await res.json();
        
        if (data.status === 'error') {
          throw new Error(data.message || 'Failed to fetch news');
        }
        
        return data;
      } catch (error) {
        console.error('Error fetching news:', error);
        throw error;
      }
    },
    enabled: true,
    refetchOnWindowFocus: false,
    staleTime: 60000 * 5, // Consider data fresh for 5 minutes
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };
  
  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Refreshing news',
      description: 'Fetching the latest financial news...',
    });
  };
  
  const articles = data?.articles || [];
  
  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center">
                <Newspaper className="mr-2 h-5 w-5 text-primary" />
                {stockSymbol ? `Latest News for ${stockSymbol}` : 'Financial News Feed'}
              </CardTitle>
              <CardDescription>
                {stockSymbol 
                  ? `Get the latest news and market insights about ${stockSymbol}`
                  : 'Breaking financial news and market analysis from trusted sources'}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1.5" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        {!stockSymbol && (
          <div className="px-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search financial news..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </form>
              
              <div className="inline-flex items-center rounded-md border border-gray-200">
                {CATEGORIES.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    size="sm"
                    className="h-9 px-3 text-xs"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <span className="mr-1.5">{category.icon}</span>
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
            <Separator />
          </div>
        )}
        
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load news</h3>
              <p className="text-gray-500 mb-4">There was an error loading the latest news articles.</p>
              <Button variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? `No results found for "${searchQuery}". Try a different search term.` 
                  : 'There are no news articles available at the moment.'}
              </p>
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {articles.slice(0, 10).map((article: NewsArticle, index: number) => (
                <div key={index} className="flex flex-col md:flex-row gap-4 pb-6">
                  {article.urlToImage && (
                    <div className="md:w-48 h-32 overflow-hidden rounded-md flex-shrink-0">
                      <img 
                        src={article.urlToImage} 
                        alt={article.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // If image fails to load, hide it
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <Badge variant="outline" className="text-xs font-medium">
                          {article.source.name}
                        </Badge>
                        <span className="ml-2 text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(article.publishedAt)}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-base font-bold mb-1">
                      {article.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {article.description || article.content?.split('[+')[0] || 'No description available.'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-muted-foreground">
                        {article.author && (
                          <span>By {article.author}</span>
                        )}
                      </div>
                      
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                      >
                        Read Full Article
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
              
              {articles.length > 10 && (
                <Button variant="outline" className="w-full">
                  Load More Articles
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsFeed;