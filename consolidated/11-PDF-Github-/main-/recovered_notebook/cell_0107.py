import os
import difflib

def compare_codebases(current_dir='current_code', previous_dir='previous_code'):
    """
    Compare the current codebase with the previous version.

    Args:
        current_dir (str): Path to the current codebase.
        previous_dir (str): Path to the previous codebase.

    Returns:
        dict: A dictionary containing the differences between the codebases.
    """
    # Get the list of files in the current and previous codebases
    current_code = os.listdir(current_dir or '.')
    previous_code = os.listdir(previous_dir or '.')

    # Use difflib to compare the two lists of files
    diff = difflib.Differ().compare(previous_code, current_code)

    # Analyze the diff and generate a dictionary with the results
    analysis = {}
    for line in diff:
        if line.startswith('+ '):  # New files in the current codebase
            analysis['added'] = analysis.get('added', []) + [line[2:]]
        elif line.startswith('- '):  # Removed files in the previous codebase
            analysis['removed'] = analysis.get('removed', []) + [line[2:]]
        elif line.startswith('? '):  # Changed files in the current codebase
            analysis['changed'] = analysis.get('changed', []) + [line[2:]]

    return analysis

def main():
    analysis = compare_codebases()
    print(analysis)

if __name__ == "__main__":
    main()
```

**