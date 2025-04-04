import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import ProfilePage from "@/pages/profile-page";
import AuthPage from "@/pages/auth-page";
import MembershipPage from "@/pages/membership-page";
import WatchlistPage from "@/pages/watchlist-page";
import MarketPage from "@/pages/market-page";
import NewsPage from "@/pages/news-page";
import StockDetailPage from "@/pages/stock-detail-page";
import ActivitiesPage from "@/pages/activities-page";
import ManageWatchlistsPage from "@/pages/manage-watchlists-page";
import AboutPage from "@/pages/about-page";
// Forum pages
import ForumCategoriesPage from "./pages/forum/categories-page";
import ForumTopicsPage from "./pages/forum/topics-page";
import ForumTopicPage from "./pages/forum/topic-page";
import EnhancedForumCategoriesPage from "./pages/forum/enhanced-categories-page";
import MyPostsPage from "./pages/forum/my-posts-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/membership" component={MembershipPage} />
      <ProtectedRoute path="/watchlist" component={WatchlistPage} />
      <ProtectedRoute
        path="/watchlist/manage"
        component={ManageWatchlistsPage}
      />
      <ProtectedRoute path="/market" component={MarketPage} />
      <ProtectedRoute path="/news" component={NewsPage} />
      <ProtectedRoute path="/stocks/:symbol" component={StockDetailPage} />
      <ProtectedRoute path="/activities" component={ActivitiesPage} />
      {/* Forum routes */}
      <ProtectedRoute path="/forum" component={EnhancedForumCategoriesPage} />
      <ProtectedRoute
        path="/forum/categories"
        component={EnhancedForumCategoriesPage}
      />
      <ProtectedRoute path="/forum/category/:id" component={ForumTopicsPage} />
      <ProtectedRoute path="/forum/topic/:id" component={ForumTopicPage} />
      <ProtectedRoute path="/forum/my-posts" component={MyPostsPage} />

      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/about" component={AboutPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <Router />
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
