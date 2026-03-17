interface IRuleVersioning {
    function getActiveVersionHash(bytes32 policyID) external view returns (bytes32);
    function retrievePolicyDefinition(bytes32 versionHash) external view returns (string memory definitionURI);
    function certifyNewPolicySet(bytes32 policyID, bytes32 newVersionHash, string memory definitionURI) external;

    event PolicySetCertified(bytes32 indexed policyID, bytes32 indexed versionHash);
}

// RPVC (Rule and Policy Versioning Contract) manages the canonical, immutable versions 
// of policy sets used by PVLM (L1) and metric equations used by MEE (L6).