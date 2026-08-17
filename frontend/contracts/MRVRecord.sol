// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ProjectRegistry.sol";
import "./BlueCarbonToken.sol";

/**
 * @title MRVRecord
 * @dev Manages MRV audit bundle anchoring, 2-of-3 verifier multi-sig approvals, and credit minting triggers.
 * @custom:hackathon Smart India Hackathon 2026 (Team: Git Push Pray, ID: SIH2601)
 */
contract MRVRecord is Ownable {
    enum ReportStatus {
        Submitted,
        Approved,
        Rejected
    }

    struct MRVReport {
        uint256 reportId;
        uint256 projectId;
        address surveyor;
        string ipfsBundleCID;
        bytes32 bundleHash;
        uint256 carbonTonsScaled; // in 18 decimals (1 tCO2e = 10^18)
        ReportStatus status;
        uint256 approvalCount;
        uint256 submittedAt;
    }

    uint256 public constant APPROVAL_THRESHOLD = 2; // 2-of-N multi-sig requirement

    ProjectRegistry public immutable projectRegistry;
    BlueCarbonToken public immutable blueCarbonToken;

    uint256 private _reportCount;
    mapping(uint256 => MRVReport) public reports;
    mapping(uint256 => mapping(address => bool)) public hasApproved;
    mapping(uint256 => mapping(address => bool)) public hasRejected;

    mapping(address => bool) public isVerifier;
    address[] public verifiersList;

    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);
    event ReportSubmitted(
        uint256 indexed reportId,
        uint256 indexed projectId,
        address indexed surveyor,
        bytes32 bundleHash,
        string ipfsBundleCID,
        uint256 carbonTonsScaled
    );
    event ReportApprovalVoted(
        uint256 indexed reportId,
        address indexed verifier,
        uint256 currentApprovals
    );
    event ReportFinalized(uint256 indexed reportId, ReportStatus status, uint256 carbonTonsMinted);
    event ReportRejected(uint256 indexed reportId, address indexed verifier, string reason);

    modifier onlyVerifier() {
        require(isVerifier[msg.sender], "Caller is not an authorized verifier");
        _;
    }

    constructor(address _projectRegistry, address _blueCarbonToken) Ownable(msg.sender) {
        require(_projectRegistry != address(0), "Invalid ProjectRegistry address");
        require(_blueCarbonToken != address(0), "Invalid BlueCarbonToken address");
        projectRegistry = ProjectRegistry(_projectRegistry);
        blueCarbonToken = BlueCarbonToken(_blueCarbonToken);
    }

    /**
     * @notice Add an authorized regulatory / third-party verifier (e.g. MoES, NCCR).
     */
    function addVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "Invalid verifier address");
        require(!isVerifier[_verifier], "Address is already a verifier");
        isVerifier[_verifier] = true;
        verifiersList.push(_verifier);
        emit VerifierAdded(_verifier);
    }

    /**
     * @notice Remove an authorized verifier.
     */
    function removeVerifier(address _verifier) external onlyOwner {
        require(isVerifier[_verifier], "Address is not a verifier");
        isVerifier[_verifier] = false;
        emit VerifierRemoved(_verifier);
    }

    /**
     * @notice Submit a new MRV audit report anchoring an IPFS bundle.
     * @param projectId Registered project ID.
     * @param ipfsBundleCID Canonical IPFS CID of the signed MRV audit package.
     * @param bundleHash SHA-256 hash of the audit package.
     * @param carbonTonsScaled Calculated sequestered CO2e in 18 decimal precision.
     */
    function submitReport(
        uint256 projectId,
        string calldata ipfsBundleCID,
        bytes32 bundleHash,
        uint256 carbonTonsScaled
    ) external returns (uint256) {
        require(bytes(ipfsBundleCID).length > 0, "IPFS Bundle CID cannot be empty");
        require(bundleHash != bytes32(0), "Invalid bundle hash");
        require(carbonTonsScaled > 0, "Carbon tons must be greater than 0");

        // Verify project exists
        ProjectRegistry.Project memory project = projectRegistry.getProject(projectId);
        require(project.id == projectId, "Project does not exist");

        _reportCount++;
        uint256 newReportId = _reportCount;

        reports[newReportId] = MRVReport({
            reportId: newReportId,
            projectId: projectId,
            surveyor: msg.sender,
            ipfsBundleCID: ipfsBundleCID,
            bundleHash: bundleHash,
            carbonTonsScaled: carbonTonsScaled,
            status: ReportStatus.Submitted,
            approvalCount: 0,
            submittedAt: block.timestamp
        });

        emit ReportSubmitted(
            newReportId,
            projectId,
            msg.sender,
            bundleHash,
            ipfsBundleCID,
            carbonTonsScaled
        );

        return newReportId;
    }

    /**
     * @notice Cast a verifier approval vote on an MRV report.
     * Triggers token minting automatically once the approval threshold (2) is reached.
     */
    function approveReport(uint256 reportId) external onlyVerifier {
        require(reportId > 0 && reportId <= _reportCount, "Report does not exist");
        MRVReport storage report = reports[reportId];
        require(report.status == ReportStatus.Submitted, "Report is not in Submitted status");
        require(!hasApproved[reportId][msg.sender], "Verifier has already approved this report");

        hasApproved[reportId][msg.sender] = true;
        report.approvalCount++;

        emit ReportApprovalVoted(reportId, msg.sender, report.approvalCount);

        if (report.approvalCount >= APPROVAL_THRESHOLD) {
            report.status = ReportStatus.Approved;

            // Fetch developer address from ProjectRegistry
            ProjectRegistry.Project memory project = projectRegistry.getProject(report.projectId);

            // Mint BCT to developer
            blueCarbonToken.mint(project.developer, report.carbonTonsScaled, reportId);

            emit ReportFinalized(reportId, ReportStatus.Approved, report.carbonTonsScaled);
        }
    }

    /**
     * @notice Reject an MRV report.
     */
    function rejectReport(uint256 reportId, string calldata reason) external onlyVerifier {
        require(reportId > 0 && reportId <= _reportCount, "Report does not exist");
        MRVReport storage report = reports[reportId];
        require(report.status == ReportStatus.Submitted, "Report is not in Submitted status");
        require(!hasRejected[reportId][msg.sender], "Verifier has already rejected this report");

        hasRejected[reportId][msg.sender] = true;
        report.status = ReportStatus.Rejected;

        emit ReportRejected(reportId, msg.sender, reason);
        emit ReportFinalized(reportId, ReportStatus.Rejected, 0);
    }

    function getReport(uint256 reportId) external view returns (MRVReport memory) {
        require(reportId > 0 && reportId <= _reportCount, "Report does not exist");
        return reports[reportId];
    }

    function getReportCount() external view returns (uint256) {
        return _reportCount;
    }

    function getVerifiers() external view returns (address[] memory) {
        return verifiersList;
    }
}
