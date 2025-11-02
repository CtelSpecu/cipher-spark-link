"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ArrowRight, Shield, Heart, Lock } from "lucide-react";

export const HeroSection = () => {
  const scrollToApplications = () => {
    document.getElementById('applications')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToHow = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card opacity-50" />
      
      {/* Warm Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" 
           style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10 container mx-auto px-4">
        <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">
          {/* Logo */}
          <div className="mb-4 animate-scale-in">
            <Logo />
          </div>
          
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="block text-foreground mb-2">HelpCrypt</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
              Compassion with Confidentiality
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            Aid platform using FHE encryption. Beneficiaries submit encrypted applications, 
            donors verify needs without exposing personal hardship details.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button variant="warm" size="lg" className="text-base" onClick={scrollToApplications}>
              View Applications
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="text-base border-primary/30 hover:border-primary/50" onClick={scrollToHow}>
              How It Works
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
              <Shield className="w-4 h-4" />
              <span>FHE Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse-glow" 
                   style={{ animationDelay: '0.5s' }} />
              <Lock className="w-4 h-4" />
              <span>Privacy Protected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse-glow" 
                   style={{ animationDelay: '1s' }} />
              <Heart className="w-4 h-4" />
              <span>Verified Compassion</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

