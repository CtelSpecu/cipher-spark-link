"use client";

import { Hand, Heart, Lock } from "lucide-react";

export const Logo = () => {
  return (
    <div className="relative flex items-center justify-center">
      <div className="relative">
        {/* Helping Hand */}
        <Hand 
          className="w-16 h-16 text-primary warm-pulse"
          strokeWidth={1.5}
        />
        
        {/* Heart Lock - positioned in the palm */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <Heart 
              className="w-8 h-8 fill-accent text-accent"
              strokeWidth={1.5}
            />
            <Lock 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-warm-glow drop-shadow-lg"
              strokeWidth={2}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

