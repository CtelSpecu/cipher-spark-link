// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, externalEuint32, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title HelpCrypt - Encrypted Aid Application Platform
/// @author HelpCrypt Team
/// @notice A privacy-preserving aid platform using FHE encryption
/// @dev Beneficiaries submit encrypted applications, donors verify needs without exposing personal details
contract HelpCrypt is SepoliaConfig {
    /// @notice Application status enum
    enum ApplicationStatus {
        Pending,
        Verified,
        Rejected,
        Funded
    }

    /// @notice Structure to store an aid application
    struct Application {
        address applicant;
        euint64 encryptedIdentityHash; // Encrypted hash of identity
        euint64 encryptedReasonHash;   // Encrypted hash of reason
        euint32 encryptedAmount;       // Encrypted requested amount
        uint256 publicAmount;          // Public amount for display
        uint256 timestamp;
        ApplicationStatus status;
        address verifier;
        uint256 donatedAmount;
    }

    /// @notice Total number of applications
    uint256 public applicationCount;

    /// @notice Mapping from application ID to Application
    mapping(uint256 => Application) private applications;

    /// @notice Mapping from applicant address to their application IDs
    mapping(address => uint256[]) private applicantApplications;

    /// @notice Event emitted when a new application is submitted
    event ApplicationSubmitted(
        uint256 indexed applicationId,
        address indexed applicant,
        uint256 publicAmount,
        uint256 timestamp
    );

    /// @notice Event emitted when an application is verified
    event ApplicationVerified(
        uint256 indexed applicationId,
        address indexed verifier,
        bool approved
    );

    /// @notice Event emitted when a donation is made
    event DonationMade(
        uint256 indexed applicationId,
        address indexed donor,
        uint256 amount
    );

    /// @notice Submit a new aid application with encrypted data
    /// @param encryptedIdentityHash The encrypted hash of applicant identity
    /// @param identityProof The proof for the encrypted identity hash
    /// @param encryptedReasonHash The encrypted hash of aid reason
    /// @param reasonProof The proof for the encrypted reason hash
    /// @param encryptedAmount The encrypted requested amount
    /// @param amountProof The proof for the encrypted amount
    /// @param publicAmount The public amount for display (can be approximate)
    function submitApplication(
        externalEuint64 encryptedIdentityHash,
        bytes calldata identityProof,
        externalEuint64 encryptedReasonHash,
        bytes calldata reasonProof,
        externalEuint32 encryptedAmount,
        bytes calldata amountProof,
        uint256 publicAmount
    ) external {
        // Convert external encrypted values to internal encrypted values
        euint64 internalIdentityHash = FHE.fromExternal(encryptedIdentityHash, identityProof);
        euint64 internalReasonHash = FHE.fromExternal(encryptedReasonHash, reasonProof);
        euint32 internalAmount = FHE.fromExternal(encryptedAmount, amountProof);

        // Create new application
        uint256 applicationId = applicationCount;
        applications[applicationId] = Application({
            applicant: msg.sender,
            encryptedIdentityHash: internalIdentityHash,
            encryptedReasonHash: internalReasonHash,
            encryptedAmount: internalAmount,
            publicAmount: publicAmount,
            timestamp: block.timestamp,
            status: ApplicationStatus.Pending,
            verifier: address(0),
            donatedAmount: 0
        });

        // Allow contract and applicant to access encrypted data
        FHE.allowThis(internalIdentityHash);
        FHE.allow(internalIdentityHash, msg.sender);
        
        FHE.allowThis(internalReasonHash);
        FHE.allow(internalReasonHash, msg.sender);
        
        FHE.allowThis(internalAmount);
        FHE.allow(internalAmount, msg.sender);

        // Track applicant's applications
        applicantApplications[msg.sender].push(applicationId);

        applicationCount++;

        emit ApplicationSubmitted(applicationId, msg.sender, publicAmount, block.timestamp);
    }

    /// @notice Verify an application (mark as verified or rejected)
    /// @param applicationId The ID of the application to verify
    /// @param approved Whether the application is approved
    function verifyApplication(uint256 applicationId, bool approved) external {
        require(applicationId < applicationCount, "Application does not exist");
        Application storage app = applications[applicationId];
        require(app.status == ApplicationStatus.Pending, "Application not pending");
        require(app.applicant != msg.sender, "Cannot verify own application");

        app.status = approved ? ApplicationStatus.Verified : ApplicationStatus.Rejected;
        app.verifier = msg.sender;

        // Allow verifier to access encrypted data for verification
        if (approved) {
            FHE.allow(app.encryptedIdentityHash, msg.sender);
            FHE.allow(app.encryptedReasonHash, msg.sender);
            FHE.allow(app.encryptedAmount, msg.sender);
        }

        emit ApplicationVerified(applicationId, msg.sender, approved);
    }

    /// @notice Donate to a verified application
    /// @param applicationId The ID of the application to donate to
    function donate(uint256 applicationId) external payable {
        require(applicationId < applicationCount, "Application does not exist");
        Application storage app = applications[applicationId];
        require(app.status == ApplicationStatus.Verified, "Application not verified");
        require(msg.value > 0, "Donation must be greater than 0");

        app.donatedAmount += msg.value;

        // Transfer funds to applicant
        (bool success, ) = payable(app.applicant).call{value: msg.value}("");
        require(success, "Transfer failed");

        // Mark as funded if target reached
        if (app.donatedAmount >= app.publicAmount) {
            app.status = ApplicationStatus.Funded;
        }

        // Allow donor to access encrypted data
        FHE.allow(app.encryptedIdentityHash, msg.sender);
        FHE.allow(app.encryptedReasonHash, msg.sender);
        FHE.allow(app.encryptedAmount, msg.sender);

        emit DonationMade(applicationId, msg.sender, msg.value);
    }

    /// @notice Get application public info
    /// @param applicationId The ID of the application
    /// @return applicant The applicant address
    /// @return publicAmount The public amount
    /// @return timestamp The submission timestamp
    /// @return status The application status
    /// @return donatedAmount The total donated amount
    function getApplicationInfo(uint256 applicationId)
        external
        view
        returns (
            address applicant,
            uint256 publicAmount,
            uint256 timestamp,
            ApplicationStatus status,
            uint256 donatedAmount
        )
    {
        require(applicationId < applicationCount, "Application does not exist");
        Application storage app = applications[applicationId];
        return (
            app.applicant,
            app.publicAmount,
            app.timestamp,
            app.status,
            app.donatedAmount
        );
    }

    /// @notice Get encrypted identity hash for an application (only accessible by authorized users)
    /// @param applicationId The ID of the application
    /// @return The encrypted identity hash
    function getEncryptedIdentityHash(uint256 applicationId) external view returns (euint64) {
        require(applicationId < applicationCount, "Application does not exist");
        return applications[applicationId].encryptedIdentityHash;
    }

    /// @notice Get encrypted reason hash for an application (only accessible by authorized users)
    /// @param applicationId The ID of the application
    /// @return The encrypted reason hash
    function getEncryptedReasonHash(uint256 applicationId) external view returns (euint64) {
        require(applicationId < applicationCount, "Application does not exist");
        return applications[applicationId].encryptedReasonHash;
    }

    /// @notice Get encrypted amount for an application (only accessible by authorized users)
    /// @param applicationId The ID of the application
    /// @return The encrypted amount
    function getEncryptedAmount(uint256 applicationId) external view returns (euint32) {
        require(applicationId < applicationCount, "Application does not exist");
        return applications[applicationId].encryptedAmount;
    }

    /// @notice Get all application IDs for an applicant
    /// @param applicant The applicant address
    /// @return Array of application IDs
    function getApplicantApplications(address applicant) external view returns (uint256[] memory) {
        return applicantApplications[applicant];
    }

    /// @notice Get the verifier of an application
    /// @param applicationId The ID of the application
    /// @return The verifier address
    function getVerifier(uint256 applicationId) external view returns (address) {
        require(applicationId < applicationCount, "Application does not exist");
        return applications[applicationId].verifier;
    }
}
