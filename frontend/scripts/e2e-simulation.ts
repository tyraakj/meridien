import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  console.log("\n=======================================================");
  console.log("🌊 MERIDIEN PROTOCOL - END-TO-END VERIFICATION & SETTLEMENT");
  console.log("=======================================================\n");

  const [deployer, developer, surveyor, moesVerifier, nccrVerifier, buyer] =
    await ethers.getSigners();

  console.log("👥 Protocol Participants Initialized:");
  console.log(`  - Deployer / Admin: ${deployer.address}`);
  console.log(`  - Project Developer: ${developer.address}`);
  console.log(`  - Field Surveyor:    ${surveyor.address}`);
  console.log(`  - MoES Verifier:     ${moesVerifier.address}`);
  console.log(`  - NCCR Verifier:     ${nccrVerifier.address}`);
  console.log(`  - Credit Buyer:      ${buyer.address}\n`);

  // Stage 1: Deploy Contracts
  console.log("📦 Stage 1: Deploying Smart Contracts...");
  const ProjectRegistry = await ethers.getContractFactory("ProjectRegistry");
  const projectRegistry = await ProjectRegistry.deploy();
  await projectRegistry.waitForDeployment();

  const BlueCarbonToken = await ethers.getContractFactory("BlueCarbonToken");
  const blueCarbonToken = await BlueCarbonToken.deploy();
  await blueCarbonToken.waitForDeployment();

  const MRVRecord = await ethers.getContractFactory("MRVRecord");
  const mrvRecord = await MRVRecord.deploy(
    await projectRegistry.getAddress(),
    await blueCarbonToken.getAddress()
  );
  await mrvRecord.waitForDeployment();

  await blueCarbonToken.setMRVController(await mrvRecord.getAddress());
  await mrvRecord.addVerifier(moesVerifier.address);
  await mrvRecord.addVerifier(nccrVerifier.address);
  console.log("  ✓ Contracts Deployed & Verifier Roles Configured.\n");

  // Stage 2: Register Restoration Plot
  console.log("🗺️ Stage 2: Registering Sundarbans Mangrove Plot (42.5 Ha)...");
  const boundaryHash = ethers.keccak256(
    ethers.toUtf8Bytes("sundarbans_boundary_ring_coords_geojson")
  );
  const metadataCID = "QmZtmD2qt8fJpq3CLDHVbmSc34B64ioEBVtxwTRPfWaxNW";
  const areaScaled = ethers.parseUnits("42.5", 2);

  const txReg = await projectRegistry
    .connect(developer)
    .registerProject(metadataCID, boundaryHash, areaScaled);
  await txReg.wait();
  console.log("  ✓ Plot #1 Registered with Canonical Boundary Hash.\n");

  // Stage 3: Field MRV Submission
  console.log("📱 Stage 3: Submitting Field MRV Package (IPCC Biomass: 612.4 tCO2e)...");
  const bundleCID = "QmMRVAuditBundleSundarbans2026";
  const bundleHash = ethers.keccak256(ethers.toUtf8Bytes("canonical_mrv_json_bundle"));
  const carbonAmount = ethers.parseEther("612.4");

  const txSub = await mrvRecord
    .connect(surveyor)
    .submitReport(1, bundleCID, bundleHash, carbonAmount);
  await txSub.wait();
  console.log("  ✓ MRV Audit Report #1 Submitted & Anchored to IPFS.\n");

  // Stage 4: Verifier Multi-Sig Sign-Off (2-of-3 Gate)
  console.log("🛡️ Stage 4: Executing 2-of-3 Regulatory Multi-Sig Verification Gate...");

  console.log("  1. MoES Lead Verifier reviews IPFS package & signs...");
  const txApprove1 = await mrvRecord.connect(moesVerifier).approveReport(1);
  await txApprove1.wait();
  console.log("     ✓ Signature 1/2 Recorded on-chain.");

  console.log("  2. NCCR Regional Verifier reviews spatial boundary & signs...");
  const txApprove2 = await mrvRecord.connect(nccrVerifier).approveReport(1);
  await txApprove2.wait();
  console.log("     ✓ Signature 2/2 Recorded on-chain (Threshold Reached!).");
  console.log("     🎉 AUTOMATIC MINT TRIGGERED: 612.4 BCT Minted to Project Developer.\n");

  const devBal = await blueCarbonToken.balanceOf(developer.address);
  console.log(`💰 Developer BCT Balance: ${ethers.formatEther(devBal)} BCT\n`);

  // Stage 5: Secondary Market & On-Chain Credit Retirement
  console.log("🔥 Stage 5: Corporate Buyer Retires 10.0 BCT for ESG Compliance...");
  await blueCarbonToken.connect(developer).transfer(buyer.address, ethers.parseEther("10.0"));

  const txRetire = await blueCarbonToken
    .connect(buyer)
    .retire(
      ethers.parseEther("10.0"),
      "Tata Sustainability Initiative",
      "Scope 1 Coastal Mangrove Offsetting"
    );
  const rcptRetire = await txRetire.wait();
  console.log(`  ✓ 10.0 BCT Permanently Burned on-chain (Tx: ${rcptRetire?.hash})`);

  const totalRetired = await blueCarbonToken.totalCarbonRetired();
  console.log(`  ✓ Total National BCT Retired: ${ethers.formatEther(totalRetired)} tCO2e\n`);

  console.log("=======================================================");
  console.log("✅ PROTOCOL VERIFICATION & SETTLEMENT PIPELINE PASSED SUCCESSFULLY");
  console.log("=======================================================\n");
}

main().catch((err) => {
  console.error("Simulation error:", err);
  process.exit(1);
});
