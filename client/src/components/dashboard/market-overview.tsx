import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatPercentage } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type MarketIndex = {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketPreviousClose: number;
  market: string;
};

const generateSparkline = (trend: "up" | "down") => {
  const path = trend === "up" 
    ? "M0,10 L10,8 L20,12 L30,7 L40,9 L50,5 L60,8 L70,4 L80,6 L90,2 L100,5" 
    : "M0,5 L10,7 L20,4 L30,6 L40,4 L50,8 L60,10 L70,9 L80,11 L90,12 L100,14";
  
  const strokeColor = trend === "up" ? "#36B37E" : "#FF5630";
  
  return (
    <svg viewBox="0 0 100 20" className="w-full h-full">
      <path d={path} fill="none" stroke={strokeColor} strokeWidth="1.5"></path>
    </svg>
  );
};

const MarketOverview = () => {
  const { data: indices, isLoading, error } = useQuery<MarketIndex[]>({
    queryKey: ["/api/market/indices"],
  });

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 text-accent">
        Error loading market data
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {isLoading ? (
        Array(3).fill(0).map((_, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <Skeleton className="h-5 w-24 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="mt-2">
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="h-16 mt-2">
                <Skeleton className="h-full w-full" />
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        indices?.map((index, i) => {
          const isPositive = index.regularMarketChangePercent > 0;
          
          const indexNames: Record<string, string> = {
            "^GSPC": "S&P 500",
            "^DJI": "Dow Jones",
            "^IXIC": "NASDAQ"
          };
          
          return (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{indexNames[index.symbol] || index.shortName}</h3>
                    <p className="text-gray-500 text-sm">US Stock Market</p>
                  </div>
                  <span className={isPositive ? "text-secondary font-medium" : "text-accent font-medium"}>
                    {formatPercentage(index.regularMarketChangePercent)}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-semibold">{formatNumber(index.regularMarketPrice)}</p>
                  <p className={isPositive ? "text-secondary text-sm" : "text-accent text-sm"}>
                    {isPositive ? "+" : ""}{formatNumber(index.regularMarketChange)} today
                  </p>
                </div>
                <div className="h-16 mt-2">
                  {generateSparkline(isPositive ? "up" : "down")}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default MarketOverview;
