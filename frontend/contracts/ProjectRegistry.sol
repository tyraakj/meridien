// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProjectRegistry
 * @dev Manages registered coastal blue carbon restoration projects and plot boundary hashes.
 * @custom:hackathon Smart India Hackathon 2026 (Team: Git Push Pray, ID: SIH2601)
 */
contract ProjectRegistry is Ownable {
    enum ProjectStatus {
        Pending,
        Approved,
        Active,
        Suspended
    }

    struct Project {
        uint256 id;
        address developer;
        string ipfsMetadataCID;
        bytes32 boundaryHash;
        uint256 areaHectaresScaled; // area in ha * 100 (e.g. 42.5 ha = 4250)
        ProjectStatus status;
        uint256 registeredAt;
    }

    uint256 private _projectCount;
    mapping(uint256 => Project) public projects;
    mapping(bytes32 => bool) public boundaryHashExists;
    mapping(address => uint256[]) public developerProjects;

    event ProjectRegistered(
        uint256 indexed projectId,
        address indexed developer,
        bytes32 indexed boundaryHash,
        string ipfsMetadataCID,
        uint256 areaHectaresScaled
    );
    event ProjectStatusUpdated(uint256 indexed projectId, ProjectStatus status);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Register a new blue carbon project plot.
     * @param ipfsMetadataCID The IPFS CID containing project documentation and GeoJSON geometry.
     * @param boundaryHash SHA-256 hash of the canonical plot boundary coordinates.
     * @param areaHectaresScaled Plot area in hectares multiplied by 100 (2 decimal precision).
     */
    function registerProject(
        string calldata ipfsMetadataCID,
        bytes32 boundaryHash,
        uint256 areaHectaresScaled
    ) external returns (uint256) {
        require(bytes(ipfsMetadataCID).length > 0, "IPFS CID cannot be empty");
        require(boundaryHash != bytes32(0), "Invalid boundary hash");
        require(!boundaryHashExists[boundaryHash], "Boundary hash already registered");
        require(areaHectaresScaled > 0, "Area must be greater than 0");

        _projectCount++;
        uint256 newProjectId = _projectCount;

        projects[newProjectId] = Project({
            id: newProjectId,
            developer: msg.sender,
            ipfsMetadataCID: ipfsMetadataCID,
            boundaryHash: boundaryHash,
            areaHectaresScaled: areaHectaresScaled,
            status: ProjectStatus.Pending,
            registeredAt: block.timestamp
        });

        boundaryHashExists[boundaryHash] = true;
        developerProjects[msg.sender].push(newProjectId);

        emit ProjectRegistered(
            newProjectId,
            msg.sender,
            boundaryHash,
            ipfsMetadataCID,
            areaHectaresScaled
        );

        return newProjectId;
    }

    /**
     * @notice Update project status (e.g., approve or suspend a project).
     */
    function setProjectStatus(uint256 projectId, ProjectStatus status) external onlyOwner {
        require(projectId > 0 && projectId <= _projectCount, "Project does not exist");
        projects[projectId].status = status;
        emit ProjectStatusUpdated(projectId, status);
    }

    function getProject(uint256 projectId) external view returns (Project memory) {
        require(projectId > 0 && projectId <= _projectCount, "Project does not exist");
        return projects[projectId];
    }

    function getProjectCount() external view returns (uint256) {
        return _projectCount;
    }

    function getDeveloperProjects(address developer) external view returns (uint256[] memory) {
        return developerProjects[developer];
    }
}
