import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

type PlanType = "basic" | "pro" | "premium";
type PaymentMethod = "card" | "paypal";

interface PlanDetails {
  name: string;
  price: number;
  description: string;
  features: { included: string[]; excluded: string[] };
}

const plans: Record<PlanType, PlanDetails> = {
  basic: {
    name: "Basic",
    price: 9,
    description: "Get started with essential tools",
    features: {
      included: [
        "Basic stock data",
        "Limited historical data",
        "Standard charts",
        "5 watchlists"
      ],
      excluded: [
        "Advanced analytics",
        "CSV export"
      ]
    }
  },
  pro: {
    name: "Pro",
    price: 29,
    description: "Advanced tools for serious investors",
    features: {
      included: [
        "Real-time stock data",
        "Full historical data",
        "Advanced charts",
        "20 watchlists",
        "Advanced analytics",
        "CSV export"
      ],
      excluded: []
    }
  },
  premium: {
    name: "Premium",
    price: 49,
    description: "Ultimate tools for professionals",
    features: {
      included: [
        "All Pro features",
        "API access",
        "Quantitative analysis",
        "Unlimited watchlists",
        "Priority support",
        "Custom reports"
      ],
      excluded: []
    }
  }
};

const paymentSchema = z.object({
  plan: z.enum(["basic", "pro", "premium"]),
  paymentMethod: z.enum(["card", "paypal"]),
  cardNumber: z.string().regex(/^\d{16}$/, { message: "Card number must be 16 digits" }).optional(),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, { message: "Expiry date must be in MM/YY format" }).optional(),
  cvc: z.string().regex(/^\d{3}$/, { message: "CVC must be 3 digits" }).optional(),
  cardholderName: z.string().min(2, { message: "Cardholder name is required" }).optional(),
}).refine(data => {
  // If payment method is card, require card details
  if (data.paymentMethod === "card") {
    return !!data.cardNumber && !!data.expiryDate && !!data.cvc && !!data.cardholderName;
  }
  return true;
}, {
  message: "Card details are required",
  path: ["cardNumber"]
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const MembershipPage = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("pro");

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      plan: "pro",
      paymentMethod: "card",
      cardNumber: "",
      expiryDate: "",
      cvc: "",
      cardholderName: ""
    }
  });

  const watchPaymentMethod = form.watch("paymentMethod");

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      // Create payment intent
      const paymentRes = await apiRequest("POST", "/api/create-payment-intent", {
        plan: data.plan,
        amount: plans[data.plan].price
      });
      const { clientSecret } = await paymentRes.json();

      // In a real app, we would use Stripe.js to confirm the payment
      // For this mock, we'll just wait and then update the membership
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update membership type
      const membershipRes = await apiRequest("POST", "/api/update-membership", {
        membershipType: data.plan.charAt(0).toUpperCase() + data.plan.slice(1)
      });
      return await membershipRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Payment successful",
        description: `Your ${selectedPlan} plan is now active!`
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: PaymentFormValues) => {
    paymentMutation.mutate(data);
  };

  const handlePlanSelect = (plan: PlanType) => {
    setSelectedPlan(plan);
    form.setValue("plan", plan);
  };

  const calculateTotal = (plan: PlanType) => {
    const price = plans[plan].price;
    const tax = price * 0.1; // 10% tax
    return (price + tax).toFixed(2);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-textDark">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Choose Your Membership</h1>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Dashboard
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Basic Plan */}
          <Card 
            className={`border-2 ${selectedPlan === 'basic' ? 'border-primary' : 'border-transparent hover:border-primary'}`}
            onClick={() => handlePlanSelect('basic')}
          >
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold">Basic</h3>
                <p className="text-gray-500 text-sm mb-4">Get started with essential tools</p>
                <div className="flex items-center justify-center">
                  <span className="text-3xl font-bold">$9</span>
                  <span className="text-gray-500 ml-1">/month</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                {plans.basic.features.included.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <i className="ri-check-line text-secondary mt-1 mr-2"></i>
                    <span>{feature}</span>
                  </li>
                ))}
                {plans.basic.features.excluded.map((feature, index) => (
                  <li key={index} className="flex items-start text-gray-400">
                    <i className="ri-close-line mt-1 mr-2"></i>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                variant={selectedPlan === 'basic' ? 'default' : 'outline'} 
                className="w-full"
                onClick={() => handlePlanSelect('basic')}
              >
                {selectedPlan === 'basic' ? 'Selected' : 'Select Basic'}
              </Button>
            </CardContent>
          </Card>
          
          {/* Pro Plan */}
          <Card 
            className={`border-2 ${selectedPlan === 'pro' ? 'border-primary' : 'border-transparent hover:border-primary'} relative`}
            onClick={() => handlePlanSelect('pro')}
          >
            <div className="absolute top-0 right-0 bg-primary text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
              Popular
            </div>
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold">Pro</h3>
                <p className="text-gray-500 text-sm mb-4">Advanced tools for serious investors</p>
                <div className="flex items-center justify-center">
                  <span className="text-3xl font-bold">$29</span>
                  <span className="text-gray-500 ml-1">/month</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                {plans.pro.features.included.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <i className="ri-check-line text-secondary mt-1 mr-2"></i>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                variant={selectedPlan === 'pro' ? 'default' : 'outline'} 
                className="w-full"
                onClick={() => handlePlanSelect('pro')}
              >
                {selectedPlan === 'pro' ? 'Selected' : 'Select Pro'}
              </Button>
            </CardContent>
          </Card>
          
          {/* Premium Plan */}
          <Card 
            className={`border-2 ${selectedPlan === 'premium' ? 'border-primary' : 'border-transparent hover:border-primary'}`}
            onClick={() => handlePlanSelect('premium')}
          >
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold">Premium</h3>
                <p className="text-gray-500 text-sm mb-4">Ultimate tools for professionals</p>
                <div className="flex items-center justify-center">
                  <span className="text-3xl font-bold">$49</span>
                  <span className="text-gray-500 ml-1">/month</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                {plans.premium.features.included.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <i className="ri-check-line text-secondary mt-1 mr-2"></i>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                variant={selectedPlan === 'premium' ? 'default' : 'outline'} 
                className="w-full"
                onClick={() => handlePlanSelect('premium')}
              >
                {selectedPlan === 'premium' ? 'Selected' : 'Select Premium'}
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Payment Section */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Complete Your Purchase</h3>
            
            <div className="mb-6">
              <h4 className="font-medium mb-2">Order Summary</h4>
              <div className="bg-background p-4 rounded-md">
                <div className="flex justify-between mb-2">
                  <span>{plans[selectedPlan].name} Membership (Monthly)</span>
                  <span>${plans[selectedPlan].price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-sm mb-3">
                  <span>Tax</span>
                  <span>${(plans[selectedPlan].price * 0.1).toFixed(2)}</span>
                </div>
                <div className="border-t border-borderColor pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${calculateTotal(selectedPlan)}</span>
                </div>
              </div>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Payment Method</h4>
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup 
                            className="flex space-x-4 mb-4" 
                            value={field.value} 
                            onValueChange={field.onChange}
                          >
                            <div className={`border rounded-md px-4 py-2 ${field.value === 'card' ? 'bg-primary bg-opacity-10 border-primary' : ''}`}>
                              <RadioGroupItem value="card" id="card" className="sr-only" />
                              <label htmlFor="card" className="flex items-center cursor-pointer">
                                <i className="ri-bank-card-line mr-1"></i> Credit Card
                              </label>
                            </div>
                            <div className={`border rounded-md px-4 py-2 ${field.value === 'paypal' ? 'bg-primary bg-opacity-10 border-primary' : ''}`}>
                              <RadioGroupItem value="paypal" id="paypal" className="sr-only" />
                              <label htmlFor="paypal" className="flex items-center cursor-pointer">
                                <i className="ri-paypal-line mr-1"></i> PayPal
                              </label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {watchPaymentMethod === "card" && (
                  <>
                    <FormField
                      control={form.control}
                      name="cardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Number</FormLabel>
                          <FormControl>
                            <Input placeholder="1234 5678 9012 3456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiration Date</FormLabel>
                            <FormControl>
                              <Input placeholder="MM/YY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="cvc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CVC</FormLabel>
                            <FormControl>
                              <Input placeholder="123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="cardholderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cardholder Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                
                {watchPaymentMethod === "paypal" && (
                  <div className="p-4 bg-gray-50 rounded-md text-center">
                    <p className="text-gray-500 mb-2">
                      You will be redirected to PayPal to complete your payment.
                    </p>
                    <p className="text-sm text-gray-400">
                      PayPal securely processes payments for millions of users.
                    </p>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full py-3 font-medium"
                  disabled={paymentMutation.isPending}
                >
                  {paymentMutation.isPending ? "Processing..." : "Complete Payment"}
                </Button>
                
                <p className="text-center text-gray-500 text-sm mt-4">
                  You'll be charged ${calculateTotal(selectedPlan)} for your first month. You can cancel anytime.
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MembershipPage;
