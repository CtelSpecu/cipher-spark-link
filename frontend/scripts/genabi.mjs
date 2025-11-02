import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Contract names to generate ABI for
const CONTRACTS = ["FHECounter", "HelpCrypt"];

// <root>/packages/fhevm-hardhat-template
const rel = "..";

// <root>/packages/site/components
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line =
  "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate ${rel}. Expecting <root>/packages/${dirname}${line}`
  );
  process.exit(1);
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}

const deploymentsDir = path.join(dir, "deployments");

function deployOnHardhatNode() {
  if (process.platform === "win32") {
    // Not supported on Windows
    return;
  }
  try {
    execSync(`./deploy-hardhat-node.sh`, {
      cwd: path.resolve("./scripts"),
      stdio: "inherit",
    });
  } catch (e) {
    console.error(`${line}Script execution failed: ${e}${line}`);
    process.exit(1);
  }
}

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);

  if (!fs.existsSync(chainDeploymentDir) && chainId === 31337) {
    // Try to auto-deploy the contract on hardhat node!
    deployOnHardhatNode();
  }

  if (!fs.existsSync(chainDeploymentDir)) {
    console.error(
      `${line}Unable to locate '${chainDeploymentDir}' directory.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
    );
    if (!optional) {
      return undefined;
    }
    return undefined;
  }

  const filePath = path.join(chainDeploymentDir, `${contractName}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`Contract ${contractName} not deployed on ${chainName}`);
    return undefined;
  }

  const jsonString = fs.readFileSync(filePath, "utf-8");

  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;

  return obj;
}

function generateAbiForContract(contractName) {
  console.log(`\nGenerating ABI for ${contractName}...`);

  // Auto deployed on Linux/Mac (will fail on windows)
  const deployLocalhost = readDeployment("localhost", 31337, contractName, true /* optional */);
  
  // Sepolia is optional
  let deploySepolia = readDeployment("sepolia", 11155111, contractName, true /* optional */);
  
  // If neither deployment exists, skip this contract
  if (!deployLocalhost && !deploySepolia) {
    console.warn(`No deployments found for ${contractName}, skipping...`);
    return false;
  }

  // Use localhost ABI as primary, or sepolia if localhost not available
  const primaryDeployment = deployLocalhost || deploySepolia;

  if (!deploySepolia) {
    deploySepolia = { abi: primaryDeployment.abi, address: "0x0000000000000000000000000000000000000000" };
  }

  if (!deployLocalhost) {
    // Create a placeholder for localhost if not deployed
    const localhostPlaceholder = { abi: deploySepolia.abi, address: "0x0000000000000000000000000000000000000000" };
    
    const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${contractName}ABI = ${JSON.stringify({ abi: deploySepolia.abi }, null, 2)} as const;
\n`;
    const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${contractName}Addresses = { 
  "11155111": { address: "${deploySepolia.address}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${localhostPlaceholder.address}", chainId: 31337, chainName: "hardhat" },
};
`;

    console.log(`Generated ${path.join(outdir, `${contractName}ABI.ts`)}`);
    console.log(`Generated ${path.join(outdir, `${contractName}Addresses.ts`)}`);

    fs.writeFileSync(path.join(outdir, `${contractName}ABI.ts`), tsCode, "utf-8");
    fs.writeFileSync(
      path.join(outdir, `${contractName}Addresses.ts`),
      tsAddresses,
      "utf-8"
    );
    return true;
  }

  if (deployLocalhost && deploySepolia) {
    if (
      JSON.stringify(deployLocalhost.abi) !== JSON.stringify(deploySepolia.abi)
    ) {
      console.warn(
        `${line}Deployments of ${contractName} on localhost and Sepolia differ. Using localhost ABI.${line}`
      );
    }
  }

  const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${contractName}ABI = ${JSON.stringify({ abi: deployLocalhost.abi }, null, 2)} as const;
\n`;
  const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${contractName}Addresses = { 
  "11155111": { address: "${deploySepolia.address}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${deployLocalhost.address}", chainId: 31337, chainName: "hardhat" },
};
`;

  console.log(`Generated ${path.join(outdir, `${contractName}ABI.ts`)}`);
  console.log(`Generated ${path.join(outdir, `${contractName}Addresses.ts`)}`);
  console.log(tsAddresses);

  fs.writeFileSync(path.join(outdir, `${contractName}ABI.ts`), tsCode, "utf-8");
  fs.writeFileSync(
    path.join(outdir, `${contractName}Addresses.ts`),
    tsAddresses,
    "utf-8"
  );
  
  return true;
}

// Generate ABI for all contracts
let hasAnyDeployment = false;
for (const contractName of CONTRACTS) {
  const generated = generateAbiForContract(contractName);
  if (generated) {
    hasAnyDeployment = true;
  }
}

if (!hasAnyDeployment) {
  console.error(
    `${line}No deployments found. Please deploy contracts first:\n\n1. Run 'npx hardhat node' in a separate terminal\n2. Run 'npx hardhat deploy --network localhost'${line}`
  );
  process.exit(1);
}

console.log("\nABI generation complete!");
