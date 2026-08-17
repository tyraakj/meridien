import { ethers } from "hardhat";

async function main() {
  console.log("=================================================");
  console.log("  Deploying Meridien Core Smart Contracts        ");
  console.log("  SIH 2026 - Team: Git Push Pray (SIH2601)       ");
  console.log("=================================================");

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // 1. Deploy ProjectRegistry
  const ProjectRegistryFactory = await ethers.getContractFactory("ProjectRegistry");
  const projectRegistry = await ProjectRegistryFactory.deploy();
  await projectRegistry.waitForDeployment();
  const projectRegistryAddress = await projectRegistry.getAddress();
  console.log(`[+] ProjectRegistry deployed at: ${projectRegistryAddress}`);

  // 2. Deploy BlueCarbonToken
  const BlueCarbonTokenFactory = await ethers.getContractFactory("BlueCarbonToken");
  const blueCarbonToken = await BlueCarbonTokenFactory.deploy();
  await blueCarbonToken.waitForDeployment();
  const tokenAddress = await blueCarbonToken.getAddress();
  console.log(`[+] BlueCarbonToken (BCT) deployed at: ${tokenAddress}`);

  // 3. Deploy MRVRecord
  const MRVRecordFactory = await ethers.getContractFactory("MRVRecord");
  const mrvRecord = await MRVRecordFactory.deploy(projectRegistryAddress, tokenAddress);
  await mrvRecord.waitForDeployment();
  const mrvRecordAddress = await mrvRecord.getAddress();
  console.log(`[+] MRVRecord deployed at: ${mrvRecordAddress}`);

  // 4. Link MRV Controller
  const setControllerTx = await blueCarbonToken.setMRVController(mrvRecordAddress);
  await setControllerTx.wait();
  console.log(`[+] BlueCarbonToken MRVController set to MRVRecord`);

  console.log("\n=================================================");
  console.log("  Deployment Addresses Summary (Add to .env):    ");
  console.log("=================================================");
  console.log(`PROJECT_REGISTRY_ADDRESS=${projectRegistryAddress}`);
  console.log(`MRV_RECORD_ADDRESS=${mrvRecordAddress}`);
  console.log(`BLUE_CARBON_TOKEN_ADDRESS=${tokenAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
