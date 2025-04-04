import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Search,
  FileText,
  ChevronRight,
  PlusCircle,
  Filter,
  Tag,
  TrendingUp,
  Users,
  Clock,
  Star,
  Menu,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ForumCategory } from '@shared/schema';
import Header from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

type CategoryItemProps = {
  category: ForumCategory;
  subcategories?: ForumCategory[];
  activeTab: string;
};

const CategoryItem = ({ category, subcategories = [], activeTab }: CategoryItemProps) => {
  const [location, navigate] = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);

  // Format ISO date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch (e) {
      return 'Unknown date';
    }
  };

  const handleCategoryClick = () => {
    navigate(`/forum/category/${category.id}`);
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mb-4">
      <Card 
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        onClick={handleCategoryClick}
      >
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-2 md:gap-0">
            <div className="flex-1">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {category.name}
                </h3>
                {subcategories.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="ml-2 p-0 h-8 w-8"
                    onClick={toggleExpand}
                  >
                    {isExpanded ? 
                      <ChevronUp className="h-4 w-4" /> : 
                      <ChevronDown className="h-4 w-4" />
                    }
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{category.description}</p>
            </div>
            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 text-sm text-gray-500">
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                <span>{category.topicCount || 0} topics</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>Last updated {category.lastActivity ? formatDate(category.lastActivity) : 'Never'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {subcategories.length > 0 && isExpanded && (
        <div className="ml-8 mt-2 space-y-2">
          {subcategories.map((subcat) => (
            <Card 
              key={subcat.id} 
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors border-l-4 border-l-primary"
              onClick={() => navigate(`/forum/category/${subcat.id}`)}
            >
              <CardContent className="p-3">
                <div className="flex flex-col md:flex-row gap-2 md:gap-0">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 text-primary" />
                      <h4 className="text-base font-medium text-gray-900 dark:text-gray-100">
                        {subcat.name}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{subcat.description}</p>
                  </div>
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 text-xs text-gray-500">
                    <div className="flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      <span>{subcat.topicCount || 0} topics</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const CategoryListSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="flex items-center">
                <Skeleton className="h-5 w-5 mr-2 rounded-full" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default function EnhancedForumCategoriesPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState<number | null>(null);

  // Fetch forum categories
  const {
    data: categories,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['/api/forum/categories'],
  });

  // Handle create category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/forum/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName,
          description: newCategoryDescription,
          parentId: parentCategoryId,
          isSubcategory: parentCategoryId !== null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      toast({
        title: 'Success',
        description: 'Category created successfully',
      });

      // Reset form and close dialog
      setNewCategoryName('');
      setNewCategoryDescription('');
      setParentCategoryId(null);
      setCreateDialogOpen(false);

      // Refetch categories
      refetch();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create category',
        variant: 'destructive',
      });
    }
  };

  // Organize categories by parent/child relationship
  const organizedCategories = React.useMemo(() => {
    if (!categories) return [];

    // Get main categories
    const mainCategories = categories.filter((cat: any) => !cat.isSubcategory && !cat.parentId);
    
    // Get subcategories
    const subcategories = categories.filter((cat: any) => cat.isSubcategory || cat.parentId);
    
    // Group subcategories by parent ID
    const subcategoriesByParent: Record<number, ForumCategory[]> = {};
    subcategories.forEach((subcat: any) => {
      const parentId = subcat.parentId || 0;
      if (!subcategoriesByParent[parentId]) {
        subcategoriesByParent[parentId] = [];
      }
      subcategoriesByParent[parentId].push(subcat);
    });
    
    return mainCategories.map((cat: any) => ({
      ...cat,
      subcategories: subcategoriesByParent[cat.id] || []
    }));
  }, [categories]);

  // Filter categories based on search and active tab
  const filteredCategories = React.useMemo(() => {
    if (!organizedCategories) return [];
    
    let result = [...organizedCategories];
    
    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        cat => cat.name.toLowerCase().includes(searchLower) || 
               cat.description?.toLowerCase().includes(searchLower) ||
               cat.subcategories.some(
                 subcat => subcat.name.toLowerCase().includes(searchLower) || 
                           subcat.description?.toLowerCase().includes(searchLower)
               )
      );
    }
    
    // Filter by tab
    if (activeTab !== 'all') {
      // Implement tab filtering logic here
      // For example: filter by recent activity, most topics, etc.
    }
    
    return result;
  }, [organizedCategories, search, activeTab]);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Forum</h1>
          </div>
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="text-center py-8">
                <h2 className="text-xl font-semibold mb-2">Error Loading Forum Categories</h2>
                <p className="text-muted-foreground mb-4">
                  There was a problem loading the forum categories. Please try again later.
                </p>
                <Button onClick={() => refetch()}>Retry</Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Forum</h1>
            <p className="text-muted-foreground">
              Discuss stocks, market trends, and investment strategies
            </p>
          </div>
          
          <div className="flex gap-2">
            {user && (
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Category</DialogTitle>
                    <DialogDescription>
                      Create a new category for discussions
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 my-4">
                    <div className="space-y-2">
                      <label htmlFor="category-name" className="text-sm font-medium">
                        Name
                      </label>
                      <Input
                        id="category-name"
                        placeholder="Category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="category-description" className="text-sm font-medium">
                        Description
                      </label>
                      <Input
                        id="category-description"
                        placeholder="Category description (optional)"
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="parent-category" className="text-sm font-medium">
                        Parent Category (optional)
                      </label>
                      <select
                        id="parent-category"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={parentCategoryId || ''}
                        onChange={(e) => setParentCategoryId(e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">None (Create as main category)</option>
                        {organizedCategories && organizedCategories.length > 0 && organizedCategories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                        If selected, this will create a subcategory
                      </p>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateCategory}>Create Category</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Categories</SheetTitle>
                  <SheetDescription>
                    Customize your forum browsing experience
                  </SheetDescription>
                </SheetHeader>
                
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">View Options</h3>
                    <div className="flex flex-col space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300" />
                        <span>Show locked topics</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300" checked />
                        <span>Show subcategories</span>
                      </label>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Sort By</h3>
                    <div className="flex flex-col space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="sort" className="rounded-full border-gray-300" checked />
                        <span>Most recent activity</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="sort" className="rounded-full border-gray-300" />
                        <span>Most topics</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="sort" className="rounded-full border-gray-300" />
                        <span>Alphabetical</span>
                      </label>
                    </div>
                  </div>
                  
                  <Button className="w-full" onClick={() => setIsFilterOpen(false)}>
                    Apply Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories and discussions..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="sm:w-auto w-full flex items-center justify-center">
                    <Menu className="h-4 w-4 mr-2" />
                    Quick Navigation
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate("/forum")}>
                    Forum Home
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/forum/recent")}>
                    Recent Discussions
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/forum/my-posts")}>
                    My Posts
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/forum/bookmarks")}>
                    Bookmarked Discussions
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
        
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start overflow-auto">
              <TabsTrigger value="all" className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                All Categories
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="popular" className="flex items-center">
                <Star className="h-4 w-4 mr-2" />
                Popular
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Recent Activity
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              {isLoading ? (
                <CategoryListSkeleton />
              ) : filteredCategories && filteredCategories.length > 0 ? (
                filteredCategories.map((category: any) => (
                  <CategoryItem 
                    key={category.id} 
                    category={category} 
                    subcategories={category.subcategories}
                    activeTab={activeTab}
                  />
                ))
              ) : (
                <Card className="p-6 text-center">
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {search ? 'No categories match your search' : 'No categories found'}
                    </p>
                    {search && (
                      <Button variant="outline" onClick={() => setSearch('')}>
                        Clear Search
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Content for other tabs would go here */}
            <TabsContent value="trending">
              <Card className="p-6 text-center">
                <CardContent>
                  <p className="text-muted-foreground">
                    Trending categories feature coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="popular">
              <Card className="p-6 text-center">
                <CardContent>
                  <p className="text-muted-foreground">
                    Popular categories feature coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="recent">
              <Card className="p-6 text-center">
                <CardContent>
                  <p className="text-muted-foreground">
                    Recent activity feature coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Forum Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50">
                <Users className="h-8 w-8 mb-2 text-primary" />
                <span className="text-xl font-bold">54</span>
                <span className="text-sm text-muted-foreground">Active Users</span>
              </div>
              
              <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50">
                <MessageSquare className="h-8 w-8 mb-2 text-primary" />
                <span className="text-xl font-bold">{categories?.length || 0}</span>
                <span className="text-sm text-muted-foreground">Categories</span>
              </div>
              
              <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50">
                <FileText className="h-8 w-8 mb-2 text-primary" />
                <span className="text-xl font-bold">186</span>
                <span className="text-sm text-muted-foreground">Topics</span>
              </div>
              
              <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/50">
                <CalendarDays className="h-8 w-8 mb-2 text-primary" />
                <span className="text-xl font-bold">{format(new Date(), 'MMM dd')}</span>
                <span className="text-sm text-muted-foreground">Latest Activity</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-center text-muted-foreground border-t px-6 py-4">
            <p>
              Please be respectful and follow our <a href="#" className="text-primary underline">community guidelines</a>.
              For any issues, contact the <a href="#" className="text-primary underline">forum administrators</a>.
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}