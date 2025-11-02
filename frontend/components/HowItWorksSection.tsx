"use client";

import { Card } from "@/components/ui/card";
import { Upload, Search, CheckCircle, Heart } from "lucide-react";

export const HowItWorksSection = () => {
  const steps = [
    {
      icon: Upload,
      title: "Submit Application",
      description: "Beneficiaries submit aid requests with encrypted personal details using FHE technology.",
    },
    {
      icon: Search,
      title: "FHE Verification",
      description: "Donors verify need validity through encrypted computation without seeing raw data.",
    },
    {
      icon: CheckCircle,
      title: "Approve & Verify",
      description: "System validates applications using homomorphic encryption algorithms.",
    },
    {
      icon: Heart,
      title: "Donate Securely",
      description: "Donors contribute directly to verified beneficiaries with full privacy protection.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 relative">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Fully Homomorphic Encryption (FHE) enables verification without exposure
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card 
                key={index}
                className="p-6 bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 
                           transition-all duration-300 hover:scale-105 group relative"
              >
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground 
                                flex items-center justify-center font-bold text-sm warm-glow">
                  {index + 1}
                </div>

                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center 
                                  group-hover:bg-primary/20 transition-colors warm-pulse">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 max-w-3xl mx-auto">
          <Card className="p-8 bg-card/30 backdrop-blur-sm border-primary/20">
            <div className="space-y-4 text-center">
              <h3 className="text-2xl font-semibold text-foreground">
                What is FHE?
              </h3>
              <p className="text-muted-foreground">
                Fully Homomorphic Encryption allows computations to be performed on encrypted data 
                without decrypting it first. This means donors can verify the legitimacy of aid 
                applications without ever seeing the beneficiary&apos;s personal information, medical 
                records, or financial details.
              </p>
              <div className="pt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">100%</div>
                  <div className="text-muted-foreground">Private</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">Zero</div>
                  <div className="text-muted-foreground">Data Exposure</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">Full</div>
                  <div className="text-muted-foreground">Verification</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

