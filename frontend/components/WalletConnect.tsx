"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card } from "@/components/ui/card";
import { Wallet, Shield, Lock } from "lucide-react";

export const WalletConnect = () => {
  return (
    <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/20">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative">
          <Wallet className="w-16 h-16 text-primary warm-pulse" />
          <Shield className="absolute -top-2 -right-2 w-6 h-6 text-accent" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">
            Connect Your Wallet
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Wallet required to submit applications, donate, or verify beneficiaries. 
            All data remains encrypted with FHE technology.
          </p>
        </div>
        
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  style: {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
                className="w-full max-w-xs"
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 warm-glow transition-all duration-300 h-11 rounded-md px-8 inline-flex items-center justify-center gap-2 font-medium"
                      >
                        <Wallet className="w-5 h-5" />
                        Connect Wallet
                      </button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <button 
                        onClick={openChainModal}
                        className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 rounded-md px-8 font-medium"
                      >
                        Wrong network
                      </button>
                    );
                  }

                  return (
                    <div className="flex gap-3 w-full">
                      <button
                        onClick={openChainModal}
                        className="flex items-center gap-2 bg-card border border-border hover:bg-muted/50 h-11 rounded-md px-4 transition-colors"
                      >
                        {chain.hasIcon && (
                          <div
                            style={{
                              background: chain.iconBackground,
                              width: 24,
                              height: 24,
                              borderRadius: 999,
                              overflow: 'hidden',
                            }}
                          >
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                style={{ width: 24, height: 24 }}
                              />
                            )}
                          </div>
                        )}
                        <span className="text-sm font-medium">{chain.name}</span>
                      </button>

                      <button
                        onClick={openAccountModal}
                        className="flex-1 bg-primary/10 border border-primary/30 hover:bg-primary/20 h-11 rounded-md px-4 font-medium text-sm transition-colors"
                      >
                        {account.displayName}
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3 h-3" />
          <span>Encrypted data storage with FHE</span>
        </div>
      </div>
    </Card>
  );
};

