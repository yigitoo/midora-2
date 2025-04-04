import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  BarChart, 
  Zap, 
  Star, 
  PieChart,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

type StockRecommendation = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  reason: string;
  score: number;
  sector: string;
};

const RecommendationWidget: React.FC = () => {
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Fetch user's portfolio data to base recommendations on
  const { data: userStocks } = useQuery({
    queryKey: ['/api/watchlists/1'],
  });
  
  // Generate personalized stock recommendations based on user's portfolio
  useEffect(() => {
    const generateRecommendations = async () => {
      setIsLoading(true);
      
      try {
        // In a real application, we would have an AI model or algorithm
        // that generates personalized recommendations based on user preferences
        // For this demo, we'll simulate recommendations with predefined stocks
        
        // Sample recommendations data - in a real app this would come from backend
        const sampleRecommendations: StockRecommendation[] = [
          {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            price: 187.42,
            change: 1.87,
            changePercent: 1.01,
            recommendation: 'buy',
            reason: 'Strong ecosystem growth and services revenue acceleration',
            score: 85,
            sector: 'Technology'
          },
          {
            symbol: 'MSFT',
            name: 'Microsoft Corporation',
            price: 412.76,
            change: 2.45,
            changePercent: 0.60,
            recommendation: 'strong_buy',
            reason: 'Cloud computing dominance and AI integration across product line',
            score: 92,
            sector: 'Technology'
          },
          {
            symbol: 'GOOGL',
            name: 'Alphabet Inc.',
            price: 176.52,
            change: -1.23,
            changePercent: -0.69,
            recommendation: 'buy',
            reason: 'AI-driven advertising improvements and YouTube growth',
            score: 78,
            sector: 'Technology'
          },
          {
            symbol: 'AMZN',
            name: 'Amazon.com Inc.',
            price: 185.67,
            change: 1.12,
            changePercent: 0.61,
            recommendation: 'buy',
            reason: 'AWS leadership position and retail marketplace optimization',
            score: 83,
            sector: 'Technology'
          },
          {
            symbol: 'NVDA',
            name: 'NVIDIA Corporation',
            price: 969.89,
            change: 22.65,
            changePercent: 2.39,
            recommendation: 'strong_buy',
            reason: 'AI chip dominance and data center growth acceleration',
            score: 95,
            sector: 'Technology'
          },
          {
            symbol: 'TSM',
            name: 'Taiwan Semiconductor',
            price: 156.52,
            change: 2.34,
            changePercent: 1.52,
            recommendation: 'buy',
            reason: 'Advanced node leadership and AI chip manufacturing expansion',
            score: 87,
            sector: 'Technology'
          },
          {
            symbol: 'LLY',
            name: 'Eli Lilly and Company',
            price: 785.20,
            change: 12.45,
            changePercent: 1.61,
            recommendation: 'buy',
            reason: 'Strong drug pipeline and GLP-1 market leadership',
            score: 88,
            sector: 'Healthcare'
          },
          {
            symbol: 'COST',
            name: 'Costco Wholesale',
            price: 888.75,
            change: 5.23,
            changePercent: 0.59,
            recommendation: 'hold',
            reason: 'Premium valuation despite strong business fundamentals',
            score: 72,
            sector: 'Consumer Staples'
          },
          {
            symbol: 'META',
            name: 'Meta Platforms Inc.',
            price: 506.88,
            change: -2.34,
            changePercent: -0.46,
            recommendation: 'buy',
            reason: 'Advertising rebound and metaverse long-term potential',
            score: 80,
            sector: 'Technology'
          },
          {
            symbol: 'ABBV',
            name: 'AbbVie Inc.',
            price: 167.30,
            change: -1.85,
            changePercent: -1.09,
            recommendation: 'hold',
            reason: 'Humira patent cliff offset by promising pipeline',
            score: 68,
            sector: 'Healthcare'
          },
          {
            symbol: 'AMD',
            name: 'Advanced Micro Devices',
            price: 178.43,
            change: 3.56,
            changePercent: 2.03,
            recommendation: 'buy',
            reason: 'Market share gains in server CPUs and AI acceleration',
            score: 82,
            sector: 'Technology'
          },
          {
            symbol: 'WMT',
            name: 'Walmart Inc.',
            price: 67.89,
            change: 0.46,
            changePercent: 0.68,
            recommendation: 'hold',
            reason: 'E-commerce growth but increasing competition',
            score: 70,
            sector: 'Consumer Staples'
          },
          {
            symbol: 'DIS',
            name: 'Walt Disney Company',
            price: 108.92,
            change: -2.13,
            changePercent: -1.92,
            recommendation: 'sell',
            reason: 'Streaming competitive pressures and legacy business challenges',
            score: 45,
            sector: 'Communication Services'
          },
          {
            symbol: 'INTC',
            name: 'Intel Corporation',
            price: 32.16,
            change: -1.56,
            changePercent: -4.63,
            recommendation: 'strong_sell',
            reason: 'Manufacturing delays and market share losses',
            score: 38,
            sector: 'Technology'
          },
          {
            symbol: 'F',
            name: 'Ford Motor Company',
            price: 12.04,
            change: -0.28,
            changePercent: -2.27,
            recommendation: 'sell',
            reason: 'EV transition costs and competitive pressures',
            score: 42,
            sector: 'Consumer Discretionary'
          }
        ];
        
        // Filter out stocks the user already has in their watchlist if data is available
        let filteredRecommendations = sampleRecommendations;
        
        if (userStocks && userStocks.items) {
          const userSymbols = userStocks.items.map(item => item.symbol);
          filteredRecommendations = sampleRecommendations.filter(
            rec => !userSymbols.includes(rec.symbol)
          );
        }
        
        // Sort by score descending
        filteredRecommendations.sort((a, b) => b.score - a.score);
        
        setRecommendations(filteredRecommendations);
      } catch (error) {
        console.error('Error generating recommendations:', error);
        toast({
          title: 'Error',
          description: 'Failed to generate recommendations. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    generateRecommendations();
  }, [userStocks, toast]);
  
  const handleAddToWatchlist = async (symbol: string) => {
    try {
      // Make API request to add to watchlist
      await apiRequest('POST', '/api/watchlists/1/items', { symbol });
      
      // Remove from recommendations
      setRecommendations(prev => prev.filter(rec => rec.symbol !== symbol));
      
      toast({
        title: 'Added to Watchlist',
        description: `${symbol} has been added to your watchlist.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add stock to watchlist. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  const filteredRecommendations = recommendations.filter(rec => {
    if (filter === 'all') return true;
    if (filter === 'buy') return ['buy', 'strong_buy'].includes(rec.recommendation);
    if (filter === 'sell') return ['sell', 'strong_sell'].includes(rec.recommendation);
    return true;
  });
  
  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'strong_buy': return 'text-green-600';
      case 'buy': return 'text-green-500';
      case 'hold': return 'text-amber-500';
      case 'sell': return 'text-red-500';
      case 'strong_sell': return 'text-red-600';
      default: return '';
    }
  };
  
  const getRecommendationText = (rec: string) => {
    switch (rec) {
      case 'strong_buy': return 'Strong Buy';
      case 'buy': return 'Buy';
      case 'hold': return 'Hold';
      case 'sell': return 'Sell';
      case 'strong_sell': return 'Strong Sell';
      default: return '';
    }
  };
  
  const getBadgeColor = (rec: string) => {
    switch (rec) {
      case 'strong_buy': return 'bg-green-100 text-green-800 border-green-300';
      case 'buy': return 'bg-green-50 text-green-700 border-green-200';
      case 'hold': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'sell': return 'bg-red-50 text-red-700 border-red-200';
      case 'strong_sell': return 'bg-red-100 text-red-800 border-red-300';
      default: return '';
    }
  };
  
  const getSectorBadgeColor = (sector: string) => {
    switch (sector) {
      case 'Technology': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Healthcare': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Consumer Staples': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Consumer Discretionary': return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'Communication Services': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Financials': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Industrials': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'Energy': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Materials': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Utilities': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Real Estate': return 'bg-lime-50 text-lime-700 border-lime-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };
  
  const handleRefreshRecommendations = () => {
    // In a real app, this would trigger a fresh recommendation generation
    // For demo, we'll just show a loading state briefly
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Recommendations Refreshed',
        description: 'Stock recommendations have been updated with the latest market data.',
      });
    }, 1500);
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center text-xl">
              <Star className="mr-2 h-5 w-5 text-amber-500" />
              Personalized Stock Recommendations
            </CardTitle>
            <CardDescription>
              AI-powered recommendations based on your portfolio and market trends
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshRecommendations}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Updating...
              </span>
            ) : (
              <span className="flex items-center">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Refresh
              </span>
            )}
          </Button>
        </div>
        
        <div className="inline-flex items-center rounded-md border border-gray-200 p-1 mt-2">
          <Button
            variant={filter === 'all' ? "subtle" : "ghost"}
            size="sm"
            className="text-xs"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'buy' ? "subtle" : "ghost"}
            size="sm"
            className="text-xs"
            onClick={() => setFilter('buy')}
          >
            <TrendingUp className="h-3.5 w-3.5 mr-1 text-green-500" />
            Buy Ratings
          </Button>
          <Button
            variant={filter === 'sell' ? "subtle" : "ghost"}
            size="sm"
            className="text-xs"
            onClick={() => setFilter('sell')}
          >
            <ArrowDownRight className="h-3.5 w-3.5 mr-1 text-red-500" />
            Sell Ratings
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredRecommendations.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No recommendations match your current filters.</p>
            <Button variant="outline" className="mt-4" onClick={() => setFilter('all')}>
              View All Recommendations
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecommendations.slice(0, 5).map((stock) => (
              <div 
                key={stock.symbol} 
                className="flex flex-col p-4 border border-gray-200 rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-lg font-bold">{stock.symbol}</h3>
                      <Badge 
                        variant="outline" 
                        className={`ml-2 font-medium ${getBadgeColor(stock.recommendation)}`}
                      >
                        {getRecommendationText(stock.recommendation)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`ml-2 font-medium ${getSectorBadgeColor(stock.sector)}`}
                      >
                        {stock.sector}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{stock.name}</p>
                  </div>
                  <div className="flex items-center">
                    <div className="text-right mr-4">
                      <div className="font-bold">${stock.price.toFixed(2)}</div>
                      <div className={`text-sm flex items-center ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {stock.change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                        {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => handleAddToWatchlist(stock.symbol)}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md mt-1">
                  <div className="flex items-start">
                    <div className="bg-primary/10 p-1.5 rounded mr-3">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Recommendation Insight:</div>
                      <p className="text-sm text-muted-foreground">{stock.reason}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center">
                    <BarChart className="h-4 w-4 text-primary mr-1.5" />
                    <span className="text-sm font-medium">Confidence Score:</span>
                  </div>
                  <div className="w-full max-w-[200px] bg-gray-200 rounded-full h-2 ml-4">
                    <div 
                      className={`h-2 rounded-full ${
                        stock.score >= 80 ? 'bg-green-500' : 
                        stock.score >= 60 ? 'bg-amber-500' : 
                        'bg-red-500'
                      }`}
                      style={{ width: `${stock.score}%` }}
                    />
                  </div>
                  <span className="ml-3 text-sm font-medium">{stock.score}/100</span>
                </div>
              </div>
            ))}
            
            {filteredRecommendations.length > 5 && (
              <Button variant="outline" className="w-full">
                View More Recommendations
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendationWidget;