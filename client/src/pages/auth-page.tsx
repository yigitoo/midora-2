import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  username: z.string().min(2, { message: "Username must be at least 2 characters." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." })
});

const registerSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  username: z.string().min(2, { message: "Username must be at least 2 characters." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." })
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;
type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

const AuthPage = () => {
  const [authView, setAuthView] = useState<"login" | "register" | "forgot">("login");
  const [location] = useLocation();
  const { toast } = useToast();
  const { user, loginMutation, registerMutation } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      location('/');
    }
  }, [user, location]);
  
  // Login form
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });
  
  // Register form
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: ""
    }
  });
  
  // Forgot password form
  const forgotPasswordForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });
  
  // Handle login form submission
  const onLoginSubmit = (data: LoginValues) => {
    loginMutation.mutate(data);
  };
  
  // Handle register form submission
  const onRegisterSubmit = (data: RegisterValues) => {
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData);
  };
  
  // Handle forgot password form submission
  const onForgotPasswordSubmit = (data: ForgotPasswordValues) => {
    toast({
      title: "Reset link sent",
      description: `Instructions to reset your password have been sent to ${data.email}`
    });
    setAuthView("login");
  };
  
  if (user) {
    return null; // Will redirect in the useEffect
  }
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Auth Form Section */}
      <div className="flex flex-col items-center justify-center w-full lg:w-1/2 p-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center">
            <i className="ri-line-chart-fill text-5xl text-primary"></i>
          </div>
          <h2 className="text-2xl font-semibold mt-2">FinAnalytics</h2>
          <p className="text-gray-500">Advanced Stock Market Analysis</p>
        </div>
        
        {/* Login Form */}
        {authView === "login" && (
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-4">Log in to your account</h3>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Logging in..." : "Log In"}
                  </Button>
                  
                  <div className="flex justify-between text-sm pt-2">
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 text-primary"
                      onClick={() => setAuthView("forgot")}
                    >
                      Forgot password?
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 text-primary"
                      onClick={() => setAuthView("register")}
                    >
                      Create an account
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
        
        {/* Register Form */}
        {authView === "register" && (
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-4">Create an account</h3>
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="First name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Choose a username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Create a password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Creating account..." : "Create Account"}
                  </Button>
                  
                  <div className="text-center text-sm pt-2">
                    <span className="text-gray-500">Already have an account?</span>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 text-primary"
                      onClick={() => setAuthView("login")}
                    >
                      Log in
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
        
        {/* Forgot Password Form */}
        {authView === "forgot" && (
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-4">Reset your password</h3>
              <p className="text-gray-500 mb-4">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
              <Form {...forgotPasswordForm}>
                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={forgotPasswordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">
                    Send Reset Link
                  </Button>
                  
                  <div className="text-center text-sm pt-2">
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 text-primary"
                      onClick={() => setAuthView("login")}
                    >
                      Back to login
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Hero Section - Only visible on larger screens */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold mb-4">Unlock the Power of Financial Data</h1>
          <p className="text-lg mb-6">
            Get access to professional-grade stock analysis tools, real-time market data, and customizable dashboards.
          </p>
          <div className="space-y-4 text-left">
            <div className="flex items-start">
              <i className="ri-line-chart-line text-2xl mr-3 mt-1"></i>
              <div>
                <h3 className="font-semibold text-lg">Comprehensive Stock Analysis</h3>
                <p>Access detailed financial metrics and historical data for informed decisions.</p>
              </div>
            </div>
            <div className="flex items-start">
              <i className="ri-bar-chart-grouped-line text-2xl mr-3 mt-1"></i>
              <div>
                <h3 className="font-semibold text-lg">Advanced Visualization</h3>
                <p>Interactive charts and graphs for technical and fundamental analysis.</p>
              </div>
            </div>
            <div className="flex items-start">
              <i className="ri-file-list-3-line text-2xl mr-3 mt-1"></i>
              <div>
                <h3 className="font-semibold text-lg">Customizable Watchlists</h3>
                <p>Track your favorite stocks and receive real-time price alerts.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
