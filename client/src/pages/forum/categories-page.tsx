import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function ForumCategoriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['/api/forum/categories'],
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-xl text-destructive">Error loading forum categories</p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  const handleCreateCategory = () => {
    if (user?.membershipType !== 'Pro') {
      toast({
        title: "Pro membership required",
        description: "Only Pro members can create forum categories",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, we would show a modal or navigate to a create form
    toast({
      title: "Feature coming soon",
      description: "Creating new categories will be available soon",
    });
  };
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Midora Forums</h1>
        {user?.membershipType === 'Pro' && (
          <Button onClick={handleCreateCategory}>
            Create Category
          </Button>
        )}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories && categories.length > 0 ? (
          categories.map((category) => (
            <Link key={category.id} href={`/forum/category/${category.id}`}>
              <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                  <CardDescription>
                    {category.description || 'No description provided'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Discuss all things related to {category.name.toLowerCase()}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    <span>Topics: {category.topicCount || 0}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created {new Date(category.createdAt).toLocaleDateString()}
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-xl text-muted-foreground">No forum categories found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back soon or contact an administrator
            </p>
          </div>
        )}
      </div>
    </div>
  );
}