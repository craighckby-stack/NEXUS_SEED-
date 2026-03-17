const C = {
  VERSION: "v2.1-2024Q3",
  DEPRECATION: "2025-01-01",
  TLS: {
    MIN_VERSION: "TLSv1.3",
    PFS_REQUIRED: true,
    CIPHERS: {
      PREFERRED: [
        "TLS_AES_256_GCM_SHA384",
        "TLS_CHACHA20_POLY1305_SHA256"
      ],
      BLACKLIST: ["*_CBC_*", "TLS_RSA_WITH_*"]
    }
  },
  KEYS: {
    SIGNING: {
      PRIMARY: "Ed25519",
      FALLBACK: "ECDSA_P521",
      KDF: "Argon2id",
      STORAGE: "HSM_REQUIRED",
      REVOCATION: "CRL"
    },
    ENCRYPTION: {
      ALGO: "AES-256-GCM",
      MIN_SIZE: 256,
      ROTATION: {
        SCHEDULE: "quarterly",
        LIFETIME_DAYS: 90
      }
    }
  },
  LEGACY: {
    ENABLED: false,
    BLACKLIST: ["RSA_2048", "SHA-1", "MD5", "DES/3DES"]
  }
};

/**
 * Governance Configuration: Mandatory Cryptographic Policy Standards (Test-2).
 * Unified per Lawset G0_Rules.
 */
const CRYPTO_POLICY = {
  crypto_version: C.VERSION,
  protocol_enforcement: {
    tls: {
      min_version: C.TLS.MIN_VERSION,
      preferred_ciphers: C.TLS.CIPHERS.PREFERRED,
      require_pfs: C.TLS.PFS_REQUIRED,
      blacklist_ciphers: C.TLS.CIPHERS.BLACKLIST
    }
  },
  key_management: {
    signing: {
      primary_algorithm: C.KEYS.SIGNING.PRIMARY,
      fallback_algorithm: C.KEYS.SIGNING.FALLBACK,
      key_derivation_function: C.KEYS.SIGNING.KDF,
      storage_requirements: C.KEYS.SIGNING.STORAGE,
      revocation_method: C.KEYS.SIGNING.REVOCATION
    },
    encryption: {
      algorithm: C.KEYS.ENCRYPTION.ALGO,
      minimum_key_size_bits: C.KEYS.ENCRYPTION.MIN_SIZE,
      key_rotation: {
        schedule: C.KEYS.ENCRYPTION.ROTATION.SCHEDULE,
        lifetime_days: C.KEYS.ENCRYPTION.ROTATION.LIFETIME_DAYS
      }
    }
  },
  legacy_support: {
    enabled: C.LEGACY.ENABLED,
    deprecate_after: C.DEPRECATION,
    blacklist: C.LEGACY.BLACKLIST
  }
};

export { CRYPTO_POLICY };