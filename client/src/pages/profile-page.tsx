import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserPreferences } from "@shared/schema";

// Profile form schema
const profileFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }).optional(),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }).optional(),
  email: z.string().email({ message: "Please enter a valid email address." }).optional(),
  phone: z.string().optional(),
  avatar: z.string().optional()
});

// Preferences form schema
const preferencesFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  priceAlerts: z.boolean().default(true),
  darkMode: z.boolean().default(false)
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PreferencesFormValues = z.infer<typeof preferencesFormSchema>;

const ProfilePage = () => {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { darkMode, setDarkMode } = useTheme();
  const { toast } = useToast();
  const urlParams = new URLSearchParams(window.location.search);
  const defaultTab = urlParams.get("tab") || "personal";
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/profile?tab=${tab}`, { replace: true });
  };
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  
  // Get user preferences
  const { data: preferences, isLoading: isLoadingPreferences } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
  });
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      avatar: user?.avatar || ""
    }
  });
  
  // Preferences form
  const preferencesForm = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      emailNotifications: preferences?.emailNotifications ?? true,
      priceAlerts: preferences?.priceAlerts ?? true,
      darkMode: preferences?.darkMode ?? false
    }
  });
  
  // Update form values when preferences are loaded
  useEffect(() => {
    if (preferences) {
      preferencesForm.reset({
        emailNotifications: preferences.emailNotifications ?? true,
        priceAlerts: preferences.priceAlerts ?? true,
        darkMode: preferences.darkMode ?? false
      });
    }
  }, [preferences, preferencesForm]);
  
  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Preferences update mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: PreferencesFormValues) => {
      const res = await apiRequest("PATCH", "/api/preferences", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      toast({
        title: "Preferences updated",
        description: "Your preferences have been updated successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle profile form submission
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };
  
  // Handle preferences form submission
  const onPreferencesSubmit = (data: PreferencesFormValues) => {
    updatePreferencesMutation.mutate(data);
  };
  
  // Handle avatar change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, this would upload to a server and get a URL
      // For this demo, we'll use a data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        profileForm.setValue("avatar", result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    } else if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return "U";
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-textDark">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Your Profile</h1>
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </div>
        
        <Card>
          <div className="md:flex">
            {/* Profile Sidebar */}
            <div className="md:w-1/4 border-b md:border-b-0 md:border-r border-borderColor p-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <Avatar className="w-32 h-32">
                    {avatarPreview ? (
                      <AvatarImage src={avatarPreview} alt={user?.firstName || 'Profile'} />
                    ) : (
                      <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                        {getInitials()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer">
                    <i className="ri-camera-line"></i>
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
                <h2 className="text-xl font-semibold">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.username}
                </h2>
                <p className="text-gray-500 mb-4">{user?.email || ''}</p>
                
                <div className="w-full space-y-2">
                  <Button 
                    variant={activeTab === "personal" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handleTabChange("personal")}
                  >
                    <i className="ri-user-line mr-2"></i> Personal Info
                  </Button>
                  <Button 
                    variant={activeTab === "security" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handleTabChange("security")}
                  >
                    <i className="ri-lock-line mr-2"></i> Security
                  </Button>
                  <Button 
                    variant={activeTab === "membership" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handleTabChange("membership")}
                  >
                    <i className="ri-vip-diamond-line mr-2"></i> Membership
                  </Button>
                  <Button 
                    variant={activeTab === "preferences" ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handleTabChange("preferences")}
                  >
                    <i className="ri-settings-4-line mr-2"></i> Preferences
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Profile Content */}
            <div className="md:w-3/4 p-6">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsContent value="personal">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
                    
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={profileForm.control}
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
                            control={profileForm.control}
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
                          
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="Email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input placeholder="Phone number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex justify-end space-x-3 pt-4">
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => profileForm.reset()}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit"
                            disabled={updateProfileMutation.isPending}
                          >
                            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                </TabsContent>
                
                <TabsContent value="membership">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-4">Current Membership</h3>
                    <div className="bg-background p-4 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{user?.membershipType || "Basic"} Plan</p>
                          <p className="text-gray-500 text-sm">
                            {user?.membershipType === "Basic" 
                              ? "Upgrade to access premium features" 
                              : "Renews on June 15, 2023"}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span className="px-2 py-1 bg-secondary bg-opacity-10 text-secondary text-xs rounded-md mr-2">
                            Active
                          </span>
                          <Button size="sm" variant="link" onClick={() => navigate('/membership')}>
                            {user?.membershipType === "Basic" ? "Upgrade" : "Manage"}
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-gray-500 text-sm mb-2">Membership benefits:</p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          <li>Advanced technical analysis tools</li>
                          <li>Real-time market data</li>
                          <li>Export data to CSV</li>
                          <li>Unlimited watchlists</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="preferences">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-4">Preferences</h3>
                    
                    {isLoadingPreferences ? (
                      <div className="space-y-6">
                        {Array(3).fill(0).map((_, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div>
                              <Skeleton className="h-5 w-28 mb-1" />
                              <Skeleton className="h-4 w-48" />
                            </div>
                            <Skeleton className="h-6 w-12 rounded-full" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Form {...preferencesForm}>
                        <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)} className="space-y-4">
                          <div className="space-y-4">
                            <FormField
                              control={preferencesForm.control}
                              name="emailNotifications"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Email Notifications</FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                      Receive daily market updates
                                    </p>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={preferencesForm.control}
                              name="priceAlerts"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Price Alerts</FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                      Get notified about significant price changes
                                    </p>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={preferencesForm.control}
                              name="darkMode"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">Dark Mode</FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                      Use dark theme across the platform
                                    </p>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={(checked) => {
                                        // Update form field
                                        field.onChange(checked);
                                        // Update theme context
                                        setDarkMode(checked);
                                      }}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="flex justify-end space-x-3 pt-4">
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={() => preferencesForm.reset()}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit"
                              disabled={updatePreferencesMutation.isPending}
                            >
                              {updatePreferencesMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="security">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-4">Security Settings</h3>
                    <p className="text-muted-foreground mb-4">
                      Manage your account security settings and change your password
                    </p>
                    
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <h4 className="font-medium">Password</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Change your password to keep your account secure
                        </p>
                        <Button>Change Password</Button>
                      </div>
                      
                      <div className="rounded-lg border p-4">
                        <h4 className="font-medium">Two-Factor Authentication</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Add an extra layer of security to your account
                        </p>
                        <Button variant="outline">Enable 2FA</Button>
                      </div>
                      
                      <div className="rounded-lg border p-4">
                        <h4 className="font-medium">Login Sessions</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Manage your active sessions and sign out from other devices
                        </p>
                        <Button variant="outline">View Sessions</Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default ProfilePage;
