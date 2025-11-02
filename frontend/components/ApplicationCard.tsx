"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, User, DollarSign, FileText, CheckCircle, XCircle, Clock, Lock, AlertCircle } from "lucide-react";
import { useState } from "react";

interface ApplicationCardProps {
  id: number;
  applicant: string;
  publicAmount: number;
  timestamp: number;
  status: number; // 0: Pending, 1: Verified, 2: Rejected, 3: Funded
  donatedAmount: number;
  currentUserAddress?: string; // Current connected wallet address
  onVerify?: (id: number, approved: boolean) => void;
  onDonate?: (id: number, amount: number) => void;
  onDecrypt?: (id: number) => void;
  isVerifying?: boolean;
  isDonating?: boolean;
  isDecrypting?: boolean;
  decryptedIdentity?: string;
  decryptedReason?: string;
  decryptedAmount?: number;
}

const statusConfig = {
  0: { label: "Pending", icon: Clock, className: "text-muted-foreground" },
  1: { label: "Verified", icon: CheckCircle, className: "text-primary" },
  2: { label: "Rejected", icon: XCircle, className: "text-destructive" },
  3: { label: "Funded", icon: CheckCircle, className: "text-green-400" },
};

export const ApplicationCard = ({ 
  id, 
  applicant,
  publicAmount, 
  timestamp,
  status,
  donatedAmount,
  currentUserAddress,
  onVerify,
  onDonate,
  onDecrypt,
  isVerifying = false,
  isDonating = false,
  isDecrypting = false,
  decryptedIdentity,
  decryptedReason,
  decryptedAmount,
}: ApplicationCardProps) => {
  const [showDecrypted, setShowDecrypted] = useState(false);
  const statusInfo = statusConfig[status as keyof typeof statusConfig] || statusConfig[0];
  const StatusIcon = statusInfo.icon;

  // Check if current user is the applicant (case-insensitive comparison)
  const isOwnApplication = currentUserAddress && 
    applicant.toLowerCase() === currentUserAddress.toLowerCase();

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatTimestamp = (ts: number) => {
    const date = new Date(ts * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const handleDecrypt = () => {
    if (onDecrypt) {
      onDecrypt(id);
      setShowDecrypted(true);
    }
  };

  return (
    <Card className={`p-6 bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 group ${isOwnApplication ? 'ring-2 ring-primary/30' : ''}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center warm-pulse">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Application #{id}
                {isOwnApplication && (
                  <span className="ml-2 text-xs text-primary">(Your Application)</span>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">{formatTimestamp(timestamp)}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1 text-xs ${statusInfo.className}`}>
            <StatusIcon className="w-4 h-4" />
            <span>{statusInfo.label}</span>
          </div>
        </div>

        {/* Encrypted Fields */}
        <div className="space-y-3">
          <div className="gradient-card rounded-lg p-3 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Identity (Encrypted)</span>
            </div>
            <p className="text-sm font-mono text-foreground">
              {showDecrypted && decryptedIdentity ? decryptedIdentity : `********${formatAddress(applicant)}`}
            </p>
          </div>

          <div className="gradient-card rounded-lg p-3 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Aid Reason (Encrypted)</span>
            </div>
            <p className="text-sm font-mono text-foreground">
              {showDecrypted && decryptedReason ? decryptedReason : "********encrypted"}
            </p>
          </div>

          <div className="gradient-card rounded-lg p-3 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Requested Amount</span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              ${(showDecrypted && decryptedAmount ? decryptedAmount : publicAmount).toLocaleString()}
            </p>
            {donatedAmount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Donated: ${donatedAmount.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-border/50 space-y-2">
          {/* Decrypt Button */}
          {onDecrypt && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleDecrypt}
              disabled={isDecrypting || showDecrypted}
            >
              <Lock className="w-4 h-4 mr-2" />
              {isDecrypting ? "Decrypting via FHE..." : showDecrypted ? "Decrypted" : "Decrypt Data"}
            </Button>
          )}

          {/* Verify Buttons (for pending applications, but not for own applications) */}
          {status === 0 && onVerify && !isOwnApplication && (
            <div className="flex gap-2">
              <Button 
                variant="warm" 
                className="flex-1"
                onClick={() => onVerify(id, true)}
                disabled={isVerifying}
              >
                {isVerifying ? "Verifying..." : "Approve"}
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => onVerify(id, false)}
                disabled={isVerifying}
              >
                Reject
              </Button>
            </div>
          )}

          {/* Message for own pending application */}
          {status === 0 && isOwnApplication && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-md p-2">
              <AlertCircle className="w-4 h-4" />
              <span>Waiting for verification by another user</span>
            </div>
          )}

          {/* Donate Button (for verified applications) */}
          {status === 1 && onDonate && (
            <Button 
              variant="warm" 
              className="w-full"
              onClick={() => onDonate(id, publicAmount)}
              disabled={isDonating}
            >
              {isDonating ? "Processing..." : `Donate $${publicAmount.toLocaleString()}`}
            </Button>
          )}

          {/* Status Messages */}
          {status === 2 && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md p-2">
              <XCircle className="w-4 h-4" />
              <span>Verification failed - inconsistent data</span>
            </div>
          )}

          {status === 3 && (
            <div className="flex items-center gap-2 text-sm text-green-400 bg-green-400/10 rounded-md p-2">
              <CheckCircle className="w-4 h-4" />
              <span>Fully funded - Thank you!</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
