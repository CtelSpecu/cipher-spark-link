"use client";

import { ApplicationCard } from "@/components/ApplicationCard";
import { WalletConnect } from "@/components/WalletConnect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, RefreshCw, AlertTriangle } from "lucide-react";
import { useAccount } from "wagmi";
import { useState } from "react";
import { useHelpCrypt } from "@/hooks/useHelpCrypt";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";

export const ApplicationsSection = () => {
  const { isConnected } = useAccount();
  const { accounts } = useMetaMaskEthersSigner();
  const [showForm, setShowForm] = useState(false);
  
  // Get current user address from connected accounts
  const currentUserAddress = accounts && accounts.length > 0 ? accounts[0] : undefined;
  
  const {
    applications,
    isLoading,
    isSubmitting,
    isVerifying,
    isDonating,
    isDecrypting,
    submitApplication,
    verifyApplication,
    donate,
    decryptApplication,
    refreshApplications,
    checkContractExists,
    decryptedData,
    isDeployed,
    contractExists,
    contractAddress,
    message,
  } = useHelpCrypt();

  const handleSubmitApplication = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const identity = formData.get('identity') as string;
    const reason = formData.get('reason') as string;
    const amount = parseInt(formData.get('amount') as string);
    
    await submitApplication(identity, reason, amount);
    setShowForm(false);
  };

  const handleVerify = async (id: number, approved: boolean) => {
    await verifyApplication(id, approved);
  };

  const handleDonate = async (id: number, amount: number) => {
    await donate(id, amount);
  };

  const handleDecrypt = async (id: number) => {
    await decryptApplication(id);
  };

  const handleRetryCheck = async () => {
    await checkContractExists();
    await refreshApplications();
  };

  // Show contract not deployed message
  if (contractExists === false || !isDeployed) {
    return (
      <section id="applications" className="py-24 px-4 bg-card/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <AlertTriangle className="w-16 h-16 text-primary" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Contract Not Deployed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
              HelpCrypt contract is not deployed at address:
            </p>
            <code className="text-sm bg-card/50 px-4 py-2 rounded-lg border border-primary/20 text-primary">
              {contractAddress || "No address configured"}
            </code>
            
            <div className="mt-8 space-y-4 max-w-xl mx-auto">
              <Card className="p-6 bg-card/50 border-primary/20 text-left">
                <h3 className="text-lg font-semibold text-foreground mb-4">How to fix:</h3>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Start Hardhat node in a terminal:
                    <code className="block ml-6 mt-1 text-sm bg-background/50 px-2 py-1 rounded">
                      npx hardhat node
                    </code>
                  </li>
                  <li>Deploy contracts in another terminal:
                    <code className="block ml-6 mt-1 text-sm bg-background/50 px-2 py-1 rounded">
                      npx hardhat deploy --network localhost
                    </code>
                  </li>
                  <li>Regenerate ABI files in frontend:
                    <code className="block ml-6 mt-1 text-sm bg-background/50 px-2 py-1 rounded">
                      cd frontend && pnpm run genabi
                    </code>
                  </li>
                  <li>Click the button below to retry</li>
                </ol>
              </Card>
              
              <Button 
                variant="warm" 
                size="lg"
                onClick={handleRetryCheck}
                className="w-full"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Retry Connection
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="applications" className="py-24 px-4 bg-card/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Aid Applications
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse encrypted applications. All personal details remain confidential until verification.
          </p>
        </div>

        {!isConnected ? (
          <div className="max-w-md mx-auto">
            <WalletConnect />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Button 
                variant="warm" 
                size="lg"
                onClick={() => setShowForm(!showForm)}
              >
                <Plus className="w-5 h-5" />
                Submit New Application
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={refreshApplications}
                disabled={isLoading}
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Status Message */}
            {message && (
              <div className="max-w-2xl mx-auto">
                <Card className="p-4 bg-card/50 border-primary/20">
                  <p className="text-sm text-muted-foreground text-center">{message}</p>
                </Card>
              </div>
            )}

            {/* Application Form */}
            {showForm && (
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20 max-w-2xl mx-auto">
                <form onSubmit={handleSubmitApplication} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Your Identity (will be encrypted)
                    </label>
                    <Input 
                      name="identity"
                      placeholder="e.g., John Doe"
                      required
                      className="bg-background/50"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Aid Reason (will be encrypted)
                    </label>
                    <Textarea 
                      name="reason"
                      placeholder="Describe your situation..."
                      required
                      className="bg-background/50 min-h-[100px]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Requested Amount ($)
                    </label>
                    <Input 
                      name="amount"
                      type="number"
                      placeholder="e.g., 5000"
                      required
                      min="1"
                      className="bg-background/50"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" variant="warm" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? "Encrypting & Submitting..." : "Submit Application"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Applications Grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No applications yet. Be the first to submit!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {applications.map((app) => (
                  <ApplicationCard 
                    key={app.id}
                    id={app.id}
                    applicant={app.applicant}
                    publicAmount={app.publicAmount}
                    timestamp={app.timestamp}
                    status={app.status}
                    donatedAmount={app.donatedAmount}
                    currentUserAddress={currentUserAddress}
                    onVerify={handleVerify}
                    onDonate={handleDonate}
                    onDecrypt={handleDecrypt}
                    isVerifying={isVerifying}
                    isDonating={isDonating}
                    isDecrypting={isDecrypting}
                    decryptedIdentity={decryptedData[app.id]?.identity}
                    decryptedReason={decryptedData[app.id]?.reason}
                    decryptedAmount={decryptedData[app.id]?.amount}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
