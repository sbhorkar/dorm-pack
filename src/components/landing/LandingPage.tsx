import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { colleges } from '@/lib/colleges';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Share2, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [showAuth, setShowAuth] = useState(false);

  if (user) {
    navigate('/dashboard');
    return null;
  }

  const features = [
    {
      icon: Package,
      title: 'Smart Organization',
      description: 'Create categories, add items, and track what you\'ve bought and packed.',
    },
    {
      icon: Share2,
      title: 'Share & Collaborate',
      description: 'Share your list with family and friends. Accept suggestions from others.',
    },
    {
      icon: CheckCircle,
      title: 'Progress Tracking',
      description: 'Visual indicators show what\'s bought and packed at a glance.',
    },
    {
      icon: Sparkles,
      title: 'Smart Templates',
      description: 'Start with pre-made templates for common dorm essentials.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Made for college students
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Pack Smart for
                <br />
                <span className="text-primary">Dorm Life</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-md">
                Create organized packing lists, share with family, and never forget essential items. 
                The ultimate tool for moving into your college dorm.
              </p>

              <div className="space-y-4">
                <Select value={selectedCollege} onValueChange={setSelectedCollege}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Select your college" />
                  </SelectTrigger>
                  <SelectContent>
                    {colleges.map((college) => (
                      <SelectItem key={college.name} value={college.name}>
                        {college.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-4">
                  <Button size="lg" onClick={() => setShowAuth(true)} className="gap-2">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </div>
              </div>
            </div>

            <div className={showAuth ? 'block' : 'hidden lg:block'}>
              <AuthForm />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Everything You Need</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            DormPack helps you stay organized from start to finish
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50 hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Mobile Auth Section */}
      <div className={`lg:hidden container mx-auto px-4 pb-16 ${showAuth ? 'hidden' : 'block'}`}>
        <Button className="w-full" size="lg" onClick={() => setShowAuth(true)}>
          Create Your First List
        </Button>
      </div>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 DormPack. Made for college students.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">Privacy</a>
              <a href="#" className="hover:text-foreground">Terms</a>
              <a href="#" className="hover:text-foreground">Help</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
