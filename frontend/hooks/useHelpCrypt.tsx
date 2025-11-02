"use client";

import { ethers } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useFhevm } from "@/fhevm/useFhevm";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useOperationLog } from "@/hooks/useOperationLog";

// ABI for HelpCrypt contract
import { HelpCryptAddresses } from "@/abi/HelpCryptAddresses";
import { HelpCryptABI } from "@/abi/HelpCryptABI";

export type Application = {
  id: number;
  applicant: string;
  publicAmount: number;
  timestamp: number;
  status: number;
  donatedAmount: number;
};

export type DecryptedData = {
  identity?: string;
  reason?: string;
  amount?: number;
};

type HelpCryptInfoType = {
  abi: typeof HelpCryptABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

/**
 * Resolves HelpCrypt contract metadata for the given EVM `chainId`.
 */
function getHelpCryptByChainId(
  chainId: number | undefined
): HelpCryptInfoType {
  if (!chainId) {
    return { abi: HelpCryptABI.abi };
  }

  const entry =
    HelpCryptAddresses[chainId.toString() as keyof typeof HelpCryptAddresses];

  if (!entry || !("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: HelpCryptABI.abi, chainId };
  }

  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: HelpCryptABI.abi,
  };
}

export const useHelpCrypt = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();
  const { add: addLog } = useOperationLog();

  // FHEVM instance
  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: isConnected,
  });

  // States
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDonating, setIsDonating] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [message, setMessage] = useState("");
  const [decryptedData, setDecryptedData] = useState<Record<number, DecryptedData>>({});
  const [contractExists, setContractExists] = useState<boolean | undefined>(undefined);

  const helpCryptRef = useRef<HelpCryptInfoType | undefined>(undefined);
  const isCheckingContractRef = useRef(false);

  // HelpCrypt contract info
  const helpCrypt = useMemo(() => {
    const c = getHelpCryptByChainId(chainId);
    helpCryptRef.current = c;

    if (!c.address) {
      setMessage(`HelpCrypt deployment not found for chainId=${chainId}.`);
    }

    return c;
  }, [chainId]);

  // Check if contract actually exists at the address
  const checkContractExists = useCallback(async () => {
    if (!helpCrypt.address || !ethersReadonlyProvider) {
      setContractExists(false);
      return false;
    }

    if (isCheckingContractRef.current) return contractExists;
    isCheckingContractRef.current = true;

    try {
      // Get the code at the contract address
      const provider = ethersReadonlyProvider as ethers.Provider;
      if ('getCode' in provider) {
        const code = await (provider as ethers.Provider).getCode(helpCrypt.address);
        const exists = code !== "0x" && code !== "0x0";
        setContractExists(exists);
        if (!exists) {
          setMessage(`Contract not deployed at ${helpCrypt.address}. Please run 'npx hardhat deploy --network localhost' first.`);
        }
        return exists;
      }
      return true;
    } catch (error) {
      console.error("Failed to check contract:", error);
      setContractExists(false);
      return false;
    } finally {
      isCheckingContractRef.current = false;
    }
  }, [helpCrypt.address, ethersReadonlyProvider, contractExists]);

  // Check contract exists when provider/address changes
  useEffect(() => {
    if (helpCrypt.address && ethersReadonlyProvider) {
      checkContractExists();
    }
  }, [helpCrypt.address, ethersReadonlyProvider, checkContractExists]);

  const isDeployed = useMemo(() => {
    if (!helpCrypt) {
      return false;
    }
    const hasAddress = Boolean(helpCrypt.address) && helpCrypt.address !== ethers.ZeroAddress;
    // Also check if contract actually exists
    return hasAddress && contractExists === true;
  }, [helpCrypt, contractExists]);

  // Refresh applications from contract
  const refreshApplications = useCallback(async () => {
    if (!helpCrypt.address || !ethersReadonlyProvider) {
      setApplications([]);
      return;
    }

    // First check if contract exists
    const exists = await checkContractExists();
    if (!exists) {
      setApplications([]);
      return;
    }

    setIsLoading(true);
    setMessage("Loading applications...");

    try {
      const contract = new ethers.Contract(
        helpCrypt.address,
        helpCrypt.abi,
        ethersReadonlyProvider
      );

      const count = await contract.applicationCount();
      const apps: Application[] = [];

      for (let i = 0; i < Number(count); i++) {
        const [applicant, publicAmount, timestamp, status, donatedAmount] = 
          await contract.getApplicationInfo(i);
        
        apps.push({
          id: i,
          applicant: applicant as string,
          publicAmount: Number(publicAmount),
          timestamp: Number(timestamp),
          status: Number(status),
          donatedAmount: Number(donatedAmount),
        });
      }

      setApplications(apps);
      setMessage(`Loaded ${apps.length} applications`);
      addLog({ type: "info", title: "Applications loaded", details: `Found ${apps.length} applications` });
    } catch (error: any) {
      console.error("Failed to load applications:", error);
      const errStr = String(error ?? "");
      
      // Check for common errors
      if (errStr.includes("BAD_DATA") || errStr.includes('value="0x"')) {
        setMessage("Contract not deployed. Please run 'npx hardhat deploy --network localhost' and restart.");
        setContractExists(false);
      } else if (errStr.includes("Failed to fetch") || errStr.includes("code\": -32603")) {
        setMessage("Cannot connect to Hardhat node. Please start it with 'npx hardhat node'.");
      } else {
        setMessage("Failed to load applications: " + errStr);
      }
      addLog({ type: "error", title: "Load failed", details: errStr });
    } finally {
      setIsLoading(false);
    }
  }, [helpCrypt.address, helpCrypt.abi, ethersReadonlyProvider, addLog, checkContractExists]);

  // Auto refresh on mount and chain change
  useEffect(() => {
    if (ethersReadonlyProvider && helpCrypt.address) {
      refreshApplications();
    }
  }, [ethersReadonlyProvider, helpCrypt.address, refreshApplications]);

  // Submit new application
  const submitApplication = useCallback(async (
    identity: string,
    reason: string,
    amount: number
  ) => {
    if (!helpCrypt.address || !fhevmInstance || !ethersSigner) {
      setMessage("Cannot submit: wallet not connected or contract not deployed");
      return;
    }

    // Check contract exists first
    const exists = await checkContractExists();
    if (!exists) {
      setMessage("Contract not deployed. Please deploy first.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Encrypting data with FHE...");
    addLog({ type: "application_submit", title: "Submitting application", details: "Encrypting data..." });

    try {
      const contract = new ethers.Contract(
        helpCrypt.address,
        helpCrypt.abi,
        ethersSigner
      );

      // Encrypt identity hash (as uint64)
      const identityInput = fhevmInstance.createEncryptedInput(
        helpCrypt.address,
        ethersSigner.address
      );
      // Hash the identity string to get a uint64 value
      const identityHash = BigInt(ethers.keccak256(ethers.toUtf8Bytes(identity))) % BigInt(2 ** 64);
      identityInput.add64(identityHash);
      const encryptedIdentity = await identityInput.encrypt();

      // Encrypt reason hash (as uint64)
      const reasonInput = fhevmInstance.createEncryptedInput(
        helpCrypt.address,
        ethersSigner.address
      );
      // Hash the reason string to get a uint64 value
      const reasonHash = BigInt(ethers.keccak256(ethers.toUtf8Bytes(reason))) % BigInt(2 ** 64);
      reasonInput.add64(reasonHash);
      const encryptedReason = await reasonInput.encrypt();

      // Encrypt amount (as uint32)
      const amountInput = fhevmInstance.createEncryptedInput(
        helpCrypt.address,
        ethersSigner.address
      );
      amountInput.add32(amount);
      const encryptedAmount = await amountInput.encrypt();

      setMessage("Submitting to blockchain...");

      const tx = await contract.submitApplication(
        encryptedIdentity.handles[0],
        encryptedIdentity.inputProof,
        encryptedReason.handles[0],
        encryptedReason.inputProof,
        encryptedAmount.handles[0],
        encryptedAmount.inputProof,
        amount // public amount for display
      );

      setMessage(`Waiting for tx: ${tx.hash}...`);
      await tx.wait();

      setMessage("Application submitted successfully!");
      addLog({ type: "application_submit", title: "Application submitted", details: `TX: ${tx.hash}` });
      
      await refreshApplications();
    } catch (error: any) {
      console.error("Failed to submit application:", error);
      const errStr = String(error ?? "");
      
      if (errStr.includes("Failed to fetch") || errStr.includes("code\": -32603")) {
        setMessage("RPC error: Please check if Hardhat node is running and MetaMask is connected to the correct network.");
      } else {
        setMessage("Failed to submit: " + errStr);
      }
      addLog({ type: "error", title: "Submit failed", details: errStr });
    } finally {
      setIsSubmitting(false);
    }
  }, [helpCrypt.address, helpCrypt.abi, fhevmInstance, ethersSigner, addLog, refreshApplications, checkContractExists]);

  // Verify application
  const verifyApplication = useCallback(async (id: number, approved: boolean) => {
    if (!helpCrypt.address || !ethersSigner) {
      setMessage("Cannot verify: wallet not connected");
      return;
    }

    setIsVerifying(true);
    setMessage(`${approved ? "Approving" : "Rejecting"} application #${id}...`);
    addLog({ type: "application_verify", title: "Verifying application", details: `ID: ${id}, Approved: ${approved}` });

    try {
      const contract = new ethers.Contract(
        helpCrypt.address,
        helpCrypt.abi,
        ethersSigner
      );

      const tx = await contract.verifyApplication(id, approved);
      setMessage(`Waiting for tx: ${tx.hash}...`);
      await tx.wait();

      setMessage(`Application ${approved ? "approved" : "rejected"} successfully!`);
      addLog({ type: "application_verify", title: "Verification complete", details: `TX: ${tx.hash}` });
      
      await refreshApplications();
    } catch (error: any) {
      console.error("Failed to verify application:", error);
      const errStr = String(error ?? "");
      
      if (errStr.includes("Failed to fetch") || errStr.includes("code\": -32603")) {
        setMessage("RPC error: Please check network connection.");
      } else {
        setMessage("Failed to verify: " + errStr);
      }
      addLog({ type: "error", title: "Verify failed", details: errStr });
    } finally {
      setIsVerifying(false);
    }
  }, [helpCrypt.address, helpCrypt.abi, ethersSigner, addLog, refreshApplications]);

  // Donate to application
  const donate = useCallback(async (id: number, amount: number) => {
    if (!helpCrypt.address || !ethersSigner) {
      setMessage("Cannot donate: wallet not connected");
      return;
    }

    setIsDonating(true);
    setMessage(`Donating to application #${id}...`);
    addLog({ type: "donation", title: "Making donation", details: `ID: ${id}, Amount: $${amount}` });

    try {
      const contract = new ethers.Contract(
        helpCrypt.address,
        helpCrypt.abi,
        ethersSigner
      );

      // Convert amount to wei (assuming 1 USD = some wei value for demo)
      // In production, you'd use an oracle for real conversion
      const weiAmount = ethers.parseEther((amount / 1000).toString()); // 1000 USD = 1 ETH for demo

      const tx = await contract.donate(id, { value: weiAmount });
      setMessage(`Waiting for tx: ${tx.hash}...`);
      await tx.wait();

      setMessage("Donation successful! Thank you for your generosity!");
      addLog({ type: "donation", title: "Donation complete", details: `TX: ${tx.hash}` });
      
      await refreshApplications();
    } catch (error: any) {
      console.error("Failed to donate:", error);
      const errStr = String(error ?? "");
      
      if (errStr.includes("Failed to fetch") || errStr.includes("code\": -32603")) {
        setMessage("RPC error: Please check network connection.");
      } else {
        setMessage("Failed to donate: " + errStr);
      }
      addLog({ type: "error", title: "Donation failed", details: errStr });
    } finally {
      setIsDonating(false);
    }
  }, [helpCrypt.address, helpCrypt.abi, ethersSigner, addLog, refreshApplications]);

  // Decrypt application data
  const decryptApplication = useCallback(async (id: number) => {
    if (!helpCrypt.address || !fhevmInstance || !ethersSigner) {
      setMessage("Cannot decrypt: wallet not connected");
      return;
    }

    setIsDecrypting(true);
    setMessage(`Decrypting application #${id}...`);
    addLog({ type: "decrypt", title: "Decrypting data", details: `Application ID: ${id}` });

    try {
      const contract = new ethers.Contract(
        helpCrypt.address,
        helpCrypt.abi,
        ethersReadonlyProvider
      );

      // Get encrypted handles
      const encryptedIdentity = await contract.getEncryptedIdentityHash(id);
      const encryptedReason = await contract.getEncryptedReasonHash(id);
      const encryptedAmount = await contract.getEncryptedAmount(id);

      // Get decryption signature
      const sig = await FhevmDecryptionSignature.loadOrSign(
        fhevmInstance,
        [helpCrypt.address as `0x${string}`],
        ethersSigner,
        fhevmDecryptionSignatureStorage
      );

      if (!sig) {
        setMessage("Unable to build FHEVM decryption signature");
        return;
      }

      setMessage("Decrypting with FHE...");

      // Decrypt all values
      const decrypted = await fhevmInstance.userDecrypt(
        [
          { handle: encryptedIdentity, contractAddress: helpCrypt.address },
          { handle: encryptedReason, contractAddress: helpCrypt.address },
          { handle: encryptedAmount, contractAddress: helpCrypt.address },
        ],
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );

      // Parse decrypted data
      const identityBytes = decrypted[encryptedIdentity];
      const reasonBytes = decrypted[encryptedReason];
      const amount = decrypted[encryptedAmount];

      // Convert bytes to string (removing null padding)
      const identity = typeof identityBytes === 'string' 
        ? identityBytes.replace(/\0/g, '').trim()
        : String(identityBytes);
      const reason = typeof reasonBytes === 'string'
        ? reasonBytes.replace(/\0/g, '').trim()
        : String(reasonBytes);

      setDecryptedData(prev => ({
        ...prev,
        [id]: {
          identity,
          reason,
          amount: Number(amount),
        }
      }));

      setMessage("Decryption successful!");
      addLog({ type: "decrypt", title: "Decryption complete", details: `Application #${id}` });
    } catch (error: any) {
      console.error("Failed to decrypt:", error);
      const errStr = String(error ?? "");
      setMessage("Failed to decrypt: " + errStr);
      addLog({ type: "error", title: "Decrypt failed", details: errStr });
    } finally {
      setIsDecrypting(false);
    }
  }, [helpCrypt.address, helpCrypt.abi, fhevmInstance, ethersSigner, ethersReadonlyProvider, fhevmDecryptionSignatureStorage, addLog]);

  return {
    // Data
    applications,
    decryptedData,
    contractAddress: helpCrypt.address,
    isDeployed,
    contractExists,
    message,
    
    // Loading states
    isLoading,
    isSubmitting,
    isVerifying,
    isDonating,
    isDecrypting,
    
    // Actions
    submitApplication,
    verifyApplication,
    donate,
    decryptApplication,
    refreshApplications,
    checkContractExists,
    
    // FHEVM status
    fhevmStatus,
    fhevmError,
  };
};
