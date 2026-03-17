"""
PSR Governance - Backwards Compatibility Setup
=============================================

For Python versions <3.10 that don't support pyproject.toml
"""

from setuptools import setup, find_packages

setup(
    name="psr-governance",
    version="1.0.0",
    author="Craig Huckerby",
    description="Governance framework for self-modifying systems",
    long_description=open('README.md').read(),
    long_description_content_type='text/markdown',
    url="https://github.com/craighckby-stack/psr-governance",
    packages=find_packages(where='src'),
    package_dir={'': 'src'},
    python_requires='>=3.8',
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Testing",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
    ],
    keywords=[
        "self-modifying",
        "adaptive-systems",
        "governance",
        "performance-testing",
        "chaos-engineering",
        "ml-governance",
        "ai-safety",
    ],
)
