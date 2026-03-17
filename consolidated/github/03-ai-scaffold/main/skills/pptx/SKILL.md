import os
import pathlib
import re

SCRIPTS_DIR = pathlib.Path('scripts')
DEPENDENCIES_SECTION = '# Dependencies:'

def refactor_script(script_name):
    script_path = SCRIPTS_DIR / script_name
    if script_path.exists():
        with open(script_path, 'r') as f:
            content = f.read()
        # Remove notes and empty lines
        content = '\n'.join(line for line in content.split('\n') if line.strip() and not re.match('^# Note', line))
        with open(script_path, 'w') as f:
            f.write(content)

def refactor_dependencies():
    dependencies_path = SCRIPTS_DIR / 'refactor-dependencies.py'
    with open(dependencies_path, 'w') as f:
        f.write('// Dependencies\n')
        f.write('  markitdown: pip install "markitdown[pptx]"\n')
        f.write('  pptxgenjs: npm install -g pptxgenjs\n')
        f.write('  playwright: npm install -g playwright\n')
        f.write('  react-icons: npm install -g react-icons react react-dom\n')
        f.write('  sharp: npm install -g sharp\n')
        f.write('  LibreOffice: sudo apt-get install libreoffice\n')
        f.write('  Poppler: sudo apt-get install poppler-utils\n')
        f.write('  defusedxml: pip install defusedxml\n')

def refactor_converting_slides_to_images():
    converting_slides_to_images_path = SCRIPTS_DIR / 'refactor-converting-slides-to-images.py'
    with open(converting_slides_to_images_path, 'w') as f:
        f.write('// Converting slides to images\n')
        f.write('  1. Convert PPTX to PDF\n')
        f.write('    # Convert PPTX to PDF\n')
        f.write('    soffice --headless --convert-to pdf template.pptx\n')
        f.write('  2. Convert PDF pages to JPEG images\n')
        f.write('    # Convert PDF pages to JPEG images\n')
        f.write('    pdftoppm -jpeg -r 150 template.pdf slide\n')

def refactor_entire_script():
    with open('SKILL.md', 'r') as f:
        content = f.read()
    content = content.replace('# Converting Slides to Images', '# Converting Slides to Images:\n')
    with open('SKILL-refactored.md', 'w') as f:
        f.write(content)
    with open('SKILL-refactored.md', 'a') as f:
        f.write('\n## Converting Slides to Images\n')
        f.write('  This section is now refactored into: scripts/refactor-converting-slides-to-images.py\n')

def main():
    refactor_script('unpack.py')
    refactor_script('validate.py')
    refactor_script('thumbnail.py')
    refactor_script('inventory.py')
    refactor_script('replace.py')
    refactor_script('thumbnail.py')
    refactor_script('refactor-thumbnails.py')
    refactor_dependencies()
    refactor_converting_slides_to_images()
    refactor_entire_script()

if __name__ == '__main__':
    main()