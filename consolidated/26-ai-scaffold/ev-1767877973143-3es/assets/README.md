# ASSET RESOURCE INDEX AND OPTIMIZATION MANIFEST

## DIRECTORY MANDATE (Target: Efficiency)

1.  **Redundancy Zero-Tolerance:** All assets must be unique. Duplicate files will be purged by the CI/CD pipeline.
2.  **Pre-Commit Optimization:** All raster assets (JPG, PNG) MUST be losslessly compressed (e.g., MozJPEG, OptiPNG) before commit. Maximum quality factor: 90%.
3.  **Format Priority:** Vector assets (SVG) preferred for scalable resources. Must be minified.
4.  **Naming Convention:** All production assets MUST utilize content-hashing for immutable caching (e.g., `asset.1a2b3c4d.png`).

## SUBDIRECTORY SCHEMA

| Folder | Required Content | Optimization Note |
| :--- | :--- | :--- |
| `/images/` | Raster and indexed image resources. | Strictly pre-optimized. |
| `/icons/ ` | Minified SVG files only. | No legacy font icons permitted. |
| `/fonts/ ` | WOFF2 format preferred. | Reduced character subset mandated if necessary. |