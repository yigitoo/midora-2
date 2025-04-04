import React from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building,
  CircleDollarSign,
  Clock,
  ExternalLink,
  Gem,
  Heart,
  Info,
  Languages,
  LineChart,
  MessageSquare,
  Shield,
  User,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function AboutPage() {
  const [, navigate] = useLocation();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <section className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <Info className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl font-bold">About Midora</h1>
          </div>
          
          <p className="text-lg text-center mb-8">
            Midora is a comprehensive stock market analysis platform designed to help investors
            make informed decisions through powerful visualization tools, real-time data,
            and an engaged community.
          </p>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <LineChart className="h-5 w-5 mr-2 text-primary" />
                  Data-Driven
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Powered by real-time market data from Yahoo Finance, ensuring you have the most
                  accurate information.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Users className="h-5 w-5 mr-2 text-primary" />
                  Community-Focused
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Join thousands of investors sharing insights, strategies, and analysis in our
                  active forum.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Shield className="h-5 w-5 mr-2 text-primary" />
                  Secure & Private
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your data is protected with industry-standard security practices and encryption.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Our Mission</h2>
          
          <Card className="bg-muted/50 mb-8">
            <CardContent className="pt-6">
              <p className="text-lg leading-relaxed">
                We believe that financial literacy and access to quality market analysis tools
                should be available to everyone. Our mission is to democratize stock market
                analysis by providing powerful tools that were once only available to
                institutional investors.
              </p>
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                  Detailed Analysis
                </CardTitle>
                <CardDescription>
                  We provide comprehensive tools to analyze stocks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <span>Real-time market data and historical charts</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <span>Technical indicators and pattern recognition</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <span>Fundamental analysis with key financial metrics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                  Knowledge Sharing
                </CardTitle>
                <CardDescription>
                  Learn from other investors in our community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <span>Active forum with categorized discussions</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <span>Share investment strategies and insights</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <span>Get feedback on your investment ideas</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Membership Plans</h2>
          
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Free</span>
                  <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
                </CardTitle>
                <CardDescription>Basic access to our platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <span>Basic stock information and charts</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <span>Limited watchlists</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <span>Read-only forum access</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                  Sign Up Free
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-primary">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Premium</CardTitle>
                  <Gem className="h-5 w-5 text-primary" />
                </div>
                <CardDescription>For serious investors</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <span>Everything in Free plan</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <span>Advanced technical indicators</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <span>Unlimited watchlists</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <span>Full forum participation</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <span>CSV export for data analysis</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => navigate("/membership")}>
                  Get Premium
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Pro</CardTitle>
                  <Building className="h-5 w-5 text-amber-500" />
                </div>
                <CardDescription>For professional traders</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <span>Everything in Premium plan</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <span>Real-time data streaming</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <span>Advanced screening tools</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <span>Portfolio analysis and backtesting</span>
                  </li>
                  <li className="flex items-start">
                    <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <span>API access for custom analysis</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate("/membership")}>
                  Get Pro
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="text-center mt-4">
            <Button variant="link" onClick={() => navigate("/membership")}>
              Compare all plans
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>

        <Separator className="my-8" />

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How accurate is the stock data?</AccordionTrigger>
              <AccordionContent>
                Our stock data is sourced from Yahoo Finance, one of the most trusted providers
                of financial market data. The data is real-time or slightly delayed based on
                exchange rules and your membership level. We ensure that all data is kept as
                accurate and up-to-date as possible.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>Can I export data for my own analysis?</AccordionTrigger>
              <AccordionContent>
                Yes, Premium and Pro members can export stock data to CSV format for further
                analysis in other tools like Excel or Python. This feature allows you to perform
                custom analysis and integrate our data into your own models.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>How do I cancel my subscription?</AccordionTrigger>
              <AccordionContent>
                You can cancel your subscription at any time from your account settings. Once
                cancelled, your premium access will remain active until the end of your current
                billing period. We don't offer refunds for partial billing periods.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>Is my financial data secure?</AccordionTrigger>
              <AccordionContent>
                Yes, we take security very seriously. We use industry-standard encryption for
                all data transmission and storage. We never share your personal or financial
                information with third parties without your explicit consent. Our systems are
                regularly audited for security compliance.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger>Can I use Midora on mobile devices?</AccordionTrigger>
              <AccordionContent>
                Yes, our platform is fully responsive and works on mobile devices, tablets, and
                desktop computers. We're also developing native mobile apps for iOS and Android
                which will be released in the near future for an even better mobile experience.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator className="my-8" />

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">About The Team</h2>
          
          <p className="text-center text-lg mb-8">
            Midora was founded by a team of financial analysts, data scientists, and software
            engineers passionate about making professional-grade financial analysis accessible
            to everyone.
          </p>
          
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  Yigit Gumus
                </CardTitle>
                <CardDescription>Founder & CEO</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Former quantitative analyst with 10+ years of experience in financial markets
                  and machine learning applications for stock analysis.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Languages className="h-5 w-5 mr-2 text-primary" />
                  Technical Expertise
                </CardTitle>
                <CardDescription>Our Development Focus</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our platform leverages cutting-edge technologies including React, TypeScript,
                  Node.js, and advanced data visualization libraries.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-primary" />
                  Founded 2025
                </CardTitle>
                <CardDescription>Our Journey</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Launched in 2025, Midora has grown rapidly to serve thousands of investors
                  with powerful analysis tools and a thriving community.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        <section className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          
          <p className="text-lg mb-8">
            Join thousands of investors who are already using Midora to make more informed
            investment decisions.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Sign Up Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/membership")}>
              Explore Premium Features
            </Button>
          </div>
        </section>

        <footer className="mt-12 border-t pt-8 text-center">
          <p className="flex items-center justify-center mb-4">
            <Heart className="h-4 w-4 mr-1 text-destructive" />
            <span>Made with passion for investors worldwide</span>
          </p>
          
          <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
            <Button variant="link" className="h-auto p-0" onClick={() => navigate("/terms")}>
              Terms of Service
            </Button>
            <span>•</span>
            <Button variant="link" className="h-auto p-0" onClick={() => navigate("/privacy")}>
              Privacy Policy
            </Button>
            <span>•</span>
            <Button variant="link" className="h-auto p-0" onClick={() => navigate("/contact")}>
              Contact Us
            </Button>
          </div>
          
          <p className="mt-6 text-sm text-muted-foreground">
            © {new Date().getFullYear()} Midora Financial Technologies. All rights reserved.
          </p>
          
          <div className="mt-4 flex items-center justify-center text-xs text-muted-foreground">
            <BookOpen className="h-3 w-3 mr-1" />
            <span>
              Stock data provided by Yahoo Finance
              <a 
                href="https://finance.yahoo.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center ml-1 text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3 ml-0.5" />
              </a>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}