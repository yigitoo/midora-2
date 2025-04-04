import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [location] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4 shadow-lg border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">404 - Page Not Found</h1>
            <div className="w-16 h-1 bg-primary my-4"></div>
            <p className="text-muted-foreground mb-2">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <p className="text-sm text-muted-foreground bg-secondary p-2 rounded-md mt-4 w-full">
              <code className="font-mono">Path: {location}</code>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4 pb-6">
          <Button variant="outline" onClick={() => window.history.back()} className="flex gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button onClick={() => window.location.href="/"} className="flex gap-2">
            <Home className="h-4 w-4" />
            Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
