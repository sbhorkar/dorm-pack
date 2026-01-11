import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import { Package, Share2, CheckCircle, Sparkles, ArrowRight, GraduationCap, Heart } from "lucide-react";
import { useEffect } from "react";

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  if (user) {
    return null;
  }

  const features = [
    {
      icon: Package,
      title: "Smart Organization",
      description: "Create categories, add items, and track what you've bought and packed.",
      gradient: "from-purple-500 to-indigo-500",
    },
    {
      icon: Share2,
      title: "Share & Collaborate",
      description: "Share your list with family and friends. Accept suggestions from others.",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      icon: CheckCircle,
      title: "Progress Tracking",
      description: "Visual indicators show what's bought and packed at a glance.",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      icon: Sparkles,
      title: "Smart Templates",
      description: "Start with pre-made templates for common dorm essentials.",
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 to-accent/20 text-primary px-4 py-2 rounded-full text-sm font-semibold border border-primary/20">
                <GraduationCap className="h-4 w-4" />
                Made for college students
              </div>

              {/* Headline */}
              <h1 className="text-4xl lg:text-6xl font-extrabold text-foreground leading-tight">
                Pack Smart for
                <br />
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Dorm Life
                </span>
              </h1>

              {/* Description */}
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                Create organized packing lists, share with family, and never forget essential items. The ultimate tool
                for moving into your college dorm.
              </p>

              {/* Stats */}
              <div className="flex gap-8 py-4">
                <div>
                  <p className="text-3xl font-bold text-primary">500+</p>
                  <p className="text-sm text-muted-foreground">Items tracked</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">50+</p>
                  <p className="text-sm text-muted-foreground">Universities</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">100%</p>
                  <p className="text-sm text-muted-foreground">Free</p>
                </div>
              </div>

              {/* Mobile CTA */}
              <div className="lg:hidden">
                <AuthForm />
              </div>
            </div>

            {/* Auth Form - Desktop */}
            <div className="hidden lg:block">
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
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="border-2 border-transparent hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 group overflow-hidden"
            >
              <CardContent className="p-6 text-center relative">
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-4 group-hover:scale-110 transition-transform shadow-lg`}
                >
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>© 2026 DormPack.</span>
              <span className="flex items-center gap-1">
                Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> for students
              </span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Help
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
