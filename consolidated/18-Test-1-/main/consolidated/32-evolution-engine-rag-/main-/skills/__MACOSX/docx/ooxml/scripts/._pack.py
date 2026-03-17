# skills/__MACOSX/docx/ooxml/scripts/pack.py

"""
Module for packing and unpacking files.

Classes:
    Pack: A class for reading and writing files.
"""

class Pack:
    """
    A class for reading and writing files.

    Attributes:
        file_path (str): The path to the file.
    """

    def __init__(self, file_path: str) -> None:
        """
        Initialize the Pack class.

        Args:
            file_path (str): The path to the file.
        """
        self.file_path = file_path

    def read_file(self) -> str:
        """
        Read the contents of the file.

        Returns:
            str: The contents of the file.
        """
        try:
            with open(self.file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except FileNotFoundError:
            return "File not found."
        except Exception as e:
            return f"An error occurred: {str(e)}"

    def write_file(self, content: str) -> None:
        """
        Write content to the file.

        Args:
            content (str): The content to be written.
        """
        try:
            with open(self.file_path, 'w', encoding='utf-8') as file:
                file.write(content)
        except Exception as e:
            print(f"An error occurred: {str(e)}")

def main() -> None:
    """
    The main function.
    """
    pack = Pack('example.txt')
    print(pack.read_file())
    pack.write_file('Hello, World!')

if __name__ == "__main__":
    main()