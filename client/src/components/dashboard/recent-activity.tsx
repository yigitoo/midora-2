import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchHistory } from "@shared/schema";
import { formatRelativeTime } from "@/lib/utils";

const RecentActivity = () => {
  const { data: activities, isLoading } = useQuery<SearchHistory[]>({
    queryKey: ["/api/activity"],
  });

  const getIconForActivity = (activity: SearchHistory) => {
    return "ri-search-line";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <button className="text-primary text-sm font-medium">View All</button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          Array(4).fill(0).map((_, index) => (
            <div key={index} className="py-3 border-b border-borderColor">
              <div className="flex items-center">
                <Skeleton className="h-5 w-5 mr-2 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-48 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          ))
        ) : activities && activities.length > 0 ? (
          activities.map((activity, index) => (
            <div 
              key={index} 
              className={`py-3 ${index < activities.length - 1 ? 'border-b border-borderColor' : ''}`}
            >
              <div className="flex items-center">
                <i className={`${getIconForActivity(activity)} text-gray-500 mr-2`}></i>
                <div>
                  <p className="font-medium">Searched for {activity.symbol}</p>
                  <p className="text-gray-500 text-sm">{formatRelativeTime(new Date(activity.timestamp))}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">
            <i className="ri-history-line text-2xl mb-2"></i>
            <p>No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
