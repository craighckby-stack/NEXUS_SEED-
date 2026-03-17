# Import required modules
import os
import plistlib
import pathlib

# Define constants
MAC_OS_X_ATTRIBUTE = 0x1
COMPUTER_FILE = 0x20

def unpack_mac_os_x_attribute(file_path):
    """
    Unpacks Mac OS X quarantine attribute from a file.

    Args:
        file_path (str): Path to the file with quarantine attribute.

    Returns:
        None
    """
    # Check if file is on macOS platform
    if os.name != 'posix':
        raise OSError("This function is only supported on macOS.")

    # Get file attributes
    file_attributes = os.stat(file_path)

    # Check if file has quarantine attribute
    if file_attributes.st_flags & MAC_OS_X_ATTRIBUTE:
        # Get quarantine attribute
        quarantine_attribute = plistlib.load(pathlib.Path(file_path).open('rb'))

        # Print quarantine attribute information
        print(f"Quarantine attribute found on file {file_path}:")
        print(f"  Version: {quarantine_attribute['QuarantineVersion']}")
        print(f"  Timestamp: {quarantine_attribute['QuarantineDate']}")
        print(f"  Name: {quarantine_attribute['QuarantineAgentName']}")
        print(f"  URL: {quarantine_attribute['QuarantineExtendedSeedURL']}")
        print(f"  Seed: {quarantine_attribute['QuarantineSeedPath']}")
        print(f"  Flags: {quarantine_attribute['QuarantineFlags']}")

        # Remove quarantine attribute
        os.chflags(file_path, COMPUTER_FILE)

    else:
        print(f"No quarantine attribute found on file {file_path}.")

# Example usage
unpack_mac_os_x_attribute('/path/to/file')