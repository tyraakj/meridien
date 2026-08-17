import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ProjectRegistry, BlueCarbonToken, MRVRecord } from "../typechain-types";

describe("Meridien Core Smart Contract Suite", function () {
  let projectRegistry: ProjectRegistry;
  let blueCarbonToken: BlueCarbonToken;
  let mrvRecord: MRVRecord;

  let owner: HardhatEthersSigner;
  let developer: HardhatEthersSigner;
  let surveyor: HardhatEthersSigner;
  let moesVerifier: HardhatEthersSigner;
  let nccrVerifier: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;
  let unauthorized: HardhatEthersSigner;

  const sampleMetadataCID = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
  const sampleBoundaryHash = ethers.keccak256(
    ethers.toUtf8Bytes("Sundarbans-Delta-Plot-B14-Coordinates")
  );
  const sampleAreaScaled = 4250; // 42.50 hectares

  const sampleMRVBundleCID = "QmZtmD2qt8STMQNd6C69u1CvHgDN43DT55KL5sTVZ32mA9";
  const sampleBundleHash = ethers.keccak256(
    ethers.toUtf8Bytes("Canonical-MRV-Audit-Bundle-Sundarbans-2026")
  );
  const sampleCarbonAmount = ethers.parseEther("348.75"); // 348.75 tCO2e (18 decimals)

  beforeEach(async function () {
    [owner, developer, surveyor, moesVerifier, nccrVerifier, buyer, unauthorized] =
      await ethers.getSigners();

    // 1. Deploy ProjectRegistry
    const ProjectRegistryFactory = await ethers.getContractFactory("ProjectRegistry");
    projectRegistry = (await ProjectRegistryFactory.deploy()) as unknown as ProjectRegistry;
    await projectRegistry.waitForDeployment();

    // 2. Deploy BlueCarbonToken
    const BlueCarbonTokenFactory = await ethers.getContractFactory("BlueCarbonToken");
    blueCarbonToken = (await BlueCarbonTokenFactory.deploy()) as unknown as BlueCarbonToken;
    await blueCarbonToken.waitForDeployment();

    // 3. Deploy MRVRecord
    const MRVRecordFactory = await ethers.getContractFactory("MRVRecord");
    mrvRecord = (await MRVRecordFactory.deploy(
      await projectRegistry.getAddress(),
      await blueCarbonToken.getAddress()
    )) as unknown as MRVRecord;
    await mrvRecord.waitForDeployment();

    // 4. Set MRV Controller on Token
    await blueCarbonToken.setMRVController(await mrvRecord.getAddress());

    // 5. Register Authorized Verifiers
    await mrvRecord.addVerifier(moesVerifier.address);
    await mrvRecord.addVerifier(nccrVerifier.address);
  });

  describe("1. Deployment & Permissions", function () {
    it("should initialize contracts with correct owner and controllers", async function () {
      expect(await projectRegistry.owner()).to.equal(owner.address);
      expect(await blueCarbonToken.owner()).to.equal(owner.address);
      expect(await blueCarbonToken.mrvController()).to.equal(await mrvRecord.getAddress());
      expect(await mrvRecord.isVerifier(moesVerifier.address)).to.be.true;
      expect(await mrvRecord.isVerifier(nccrVerifier.address)).to.be.true;
      expect(await mrvRecord.isVerifier(unauthorized.address)).to.be.false;
    });

    it("should reject direct unauthorized token minting", async function () {
      await expect(
        blueCarbonToken
          .connect(unauthorized)
          .mint(unauthorized.address, ethers.parseEther("100"), 1)
      ).to.be.revertedWith("Caller is not MRV Controller");
    });
  });

  describe("2. Project Registration (ProjectRegistry)", function () {
    it("should allow a project developer to register a plot", async function () {
      const tx = await projectRegistry
        .connect(developer)
        .registerProject(sampleMetadataCID, sampleBoundaryHash, sampleAreaScaled);

      await expect(tx)
        .to.emit(projectRegistry, "ProjectRegistered")
        .withArgs(1, developer.address, sampleBoundaryHash, sampleMetadataCID, sampleAreaScaled);

      const project = await projectRegistry.getProject(1);
      expect(project.id).to.equal(1n);
      expect(project.developer).to.equal(developer.address);
      expect(project.ipfsMetadataCID).to.equal(sampleMetadataCID);
      expect(project.boundaryHash).to.equal(sampleBoundaryHash);
      expect(project.areaHectaresScaled).to.equal(sampleAreaScaled);
      expect(project.status).to.equal(0); // Pending
    });

    it("should reject duplicate boundary hash registrations (Anti-Double-Counting)", async function () {
      await projectRegistry
        .connect(developer)
        .registerProject(sampleMetadataCID, sampleBoundaryHash, sampleAreaScaled);

      await expect(
        projectRegistry
          .connect(unauthorized)
          .registerProject("QmDifferentCID", sampleBoundaryHash, 5000)
      ).to.be.revertedWith("Boundary hash already registered");
    });
  });

  describe("3. MRV Report Submission & Multi-Sig Verification (MRVRecord)", function () {
    let projectId: number;

    beforeEach(async function () {
      await projectRegistry
        .connect(developer)
        .registerProject(sampleMetadataCID, sampleBoundaryHash, sampleAreaScaled);
      projectId = 1;
    });

    it("should allow surveyor to submit an MRV audit report", async function () {
      const tx = await mrvRecord
        .connect(surveyor)
        .submitReport(projectId, sampleMRVBundleCID, sampleBundleHash, sampleCarbonAmount);

      await expect(tx)
        .to.emit(mrvRecord, "ReportSubmitted")
        .withArgs(
          1,
          projectId,
          surveyor.address,
          sampleBundleHash,
          sampleMRVBundleCID,
          sampleCarbonAmount
        );

      const report = await mrvRecord.getReport(1);
      expect(report.reportId).to.equal(1n);
      expect(report.projectId).to.equal(1n);
      expect(report.surveyor).to.equal(surveyor.address);
      expect(report.carbonTonsScaled).to.equal(sampleCarbonAmount);
      expect(report.status).to.equal(0); // Submitted
      expect(report.approvalCount).to.equal(0n);
    });

    it("should require 2 verifier approvals before minting Blue Carbon Tokens (BCT)", async function () {
      await mrvRecord
        .connect(surveyor)
        .submitReport(projectId, sampleMRVBundleCID, sampleBundleHash, sampleCarbonAmount);

      // Verifier 1 (MoES) approves
      const vote1Tx = await mrvRecord.connect(moesVerifier).approveReport(1);
      await expect(vote1Tx)
        .to.emit(mrvRecord, "ReportApprovalVoted")
        .withArgs(1, moesVerifier.address, 1);

      let report = await mrvRecord.getReport(1);
      expect(report.status).to.equal(0); // Still Submitted
      expect(report.approvalCount).to.equal(1n);
      expect(await blueCarbonToken.balanceOf(developer.address)).to.equal(0n);

      // Verifier 1 cannot vote twice
      await expect(mrvRecord.connect(moesVerifier).approveReport(1)).to.be.revertedWith(
        "Verifier has already approved this report"
      );

      // Verifier 2 (NCCR) approves -> Reaches threshold (2) -> Auto-mints credits
      const vote2Tx = await mrvRecord.connect(nccrVerifier).approveReport(1);
      await expect(vote2Tx)
        .to.emit(mrvRecord, "ReportFinalized")
        .withArgs(1, 1, sampleCarbonAmount); // 1 = Approved

      report = await mrvRecord.getReport(1);
      expect(report.status).to.equal(1); // Approved
      expect(report.approvalCount).to.equal(2n);

      // Verify tokens minted to developer
      const developerBalance = await blueCarbonToken.balanceOf(developer.address);
      expect(developerBalance).to.equal(sampleCarbonAmount);
    });

    it("should reject approvals from non-verifiers", async function () {
      await mrvRecord
        .connect(surveyor)
        .submitReport(projectId, sampleMRVBundleCID, sampleBundleHash, sampleCarbonAmount);

      await expect(mrvRecord.connect(unauthorized).approveReport(1)).to.be.revertedWith(
        "Caller is not an authorized verifier"
      );
    });
  });

  describe("4. Credit Settlement & Voluntary Retirement (BlueCarbonToken)", function () {
    beforeEach(async function () {
      // Register project
      await projectRegistry
        .connect(developer)
        .registerProject(sampleMetadataCID, sampleBoundaryHash, sampleAreaScaled);

      // Submit MRV
      await mrvRecord
        .connect(surveyor)
        .submitReport(1, sampleMRVBundleCID, sampleBundleHash, sampleCarbonAmount);

      // Approve (2-of-2)
      await mrvRecord.connect(moesVerifier).approveReport(1);
      await mrvRecord.connect(nccrVerifier).approveReport(1);

      // Developer transfers 100 BCT to Buyer
      await blueCarbonToken.connect(developer).transfer(buyer.address, ethers.parseEther("100"));
    });

    it("should allow buyer to permanently retire (burn) verified carbon credits", async function () {
      const retireAmount = ethers.parseEther("50");
      const beneficiary = "Tata Steel Sustainability Division";
      const reason = "Offset Scope 1 Emissions Q3 FY2026 - Sundarbans Blue Carbon";

      const tx = await blueCarbonToken.connect(buyer).retire(retireAmount, beneficiary, reason);

      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(blueCarbonToken, "CarbonRetired")
        .withArgs(buyer.address, retireAmount, beneficiary, reason, block!.timestamp);

      expect(await blueCarbonToken.balanceOf(buyer.address)).to.equal(ethers.parseEther("50"));
      expect(await blueCarbonToken.totalCarbonRetired()).to.equal(retireAmount);
    });

    it("should reject retirement if balance is insufficient", async function () {
      await expect(
        blueCarbonToken
          .connect(buyer)
          .retire(ethers.parseEther("200"), "Some Corp", "Over-budget offset")
      ).to.be.revertedWith("Insufficient BCT balance to retire");
    });
  });
});
