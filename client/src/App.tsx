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
      <ProtectedRoute path="/market" component={MarketPage} />
      <ProtectedRoute path="/news" component={NewsPage} />
      <Route path="/auth" component={AuthPage} />
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
