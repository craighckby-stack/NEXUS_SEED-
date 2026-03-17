class GovernanceManifestVerifier:
    def __init__(self, crot_pub_key, artifact_loader):
        self.crot_pub_key = crot_pub_key
        self.loader = artifact_loader

    def verify_manifest(self, gsm_manifest):
        # 1. Schema Validation (assumed prior step)

        # 2. Hash Verification: Ensure the signed_manifest_hash is correct
        calculated_hash = self._calculate_canonical_hash(gsm_manifest)
        if calculated_hash != gsm_manifest['signed_manifest_hash']:
            raise IntegrityError("Manifest hash mismatch.")

        # 3. Signature Verification: Verify CRoT's signature
        if not self._verify_signature(calculated_hash, gsm_manifest['signed_by_root']):
            raise SignatureError("Invalid CRoT signature.")

        # 4. Artifact Content Verification (Core Compliance)
        for artifact in gsm_manifest['governance_artifacts']:
            content = self.loader.load_artifact(artifact['path'])
            calculated_checksum = self._hash_content(content, artifact['hash_type'])
            if calculated_checksum != artifact['checksum']:
                raise ArtifactChecksumError(f"Checksum failure for {artifact['acronym']}.")
        
        return True

    def _calculate_canonical_hash(self, gsm):
        # Implementation required to serialize the GSM object consistently (excluding signature fields) and hash it.
        pass

    def _verify_signature(self, payload_hash, signature):
        # Implementation required to verify signature using self.crot_pub_key
        pass

    def _hash_content(self, content, hash_type):
        # Implementation required to generate hash based on hash_type
        pass