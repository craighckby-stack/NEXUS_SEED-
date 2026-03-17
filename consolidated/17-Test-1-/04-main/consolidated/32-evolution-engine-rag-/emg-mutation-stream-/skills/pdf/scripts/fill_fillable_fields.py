import json
import sys
from typing import Union, Any

from pypdf import PdfReader, PdfWriter
from pypdf.generic import DictionaryObject
from pypdf.constants import FieldDictionaryAttributes as FA

# Assuming 'extract_form_field_info.py' is available and provides this function.
from extract_form_field_info import get_field_info


def validation_error_for_field_value(field_info: dict[str, Any], field_value: Any) -> str | None:
    """Checks if the provided field_value is valid based on the field_info (type, options)."""
    
    field_type = field_info["type"]
    field_id = field_info["field_id"]

    if field_type == "checkbox":
        checked_val = field_info["checked_value"]
        unchecked_val = field_info["unchecked_value"]
        if field_value not in (checked_val, unchecked_val):
            return (
                f'ERROR: Invalid value "{field_value}" for checkbox field "{field_id}". '
                f'The checked value is "{checked_val}" and the unchecked value is "{unchecked_val}".'
            )
    
    elif field_type == "radio_group":
        option_values = [opt["value"] for opt in field_info["radio_options"]]
        if field_value not in option_values:
            return (
                f'ERROR: Invalid value "{field_value}" for radio group field "{field_id}". '
                f"Valid values are: {option_values}."
            )
            
    elif field_type == "choice":
        # Applies to both dropdowns and selection lists
        choice_values = [opt["value"] for opt in field_info["choice_options"]]
        if field_value not in choice_values:
            return (
                f'ERROR: Invalid value "{field_value}" for choice field "{field_id}". '
                f"Valid values are: {choice_values}."
            )
            
    return None


def validate_input_fields(input_fields: list[dict], reader: PdfReader) -> list[str]:
    """Validates input fields against the structure defined in the PDF."""
    
    errors: list[str] = []
    
    pdf_field_info = get_field_info(reader)
    fields_by_id = {f["field_id"]: f for f in pdf_field_info}
    
    for input_field in input_fields:
        field_id = input_field.get("field_id")
        input_page = input_field.get("page")
        input_value = input_field.get("value")
        
        if not field_id:
            errors.append(f"ERROR: Field entry missing 'field_id'. Entry: {input_field}")
            continue

        existing_field = fields_by_id.get(field_id)
        
        if not existing_field:
            errors.append(f"ERROR: Field ID '{field_id}' is not a valid field in the PDF.")
            continue

        expected_page = existing_field["page"]
        
        if input_page is None:
            errors.append(f"ERROR: Field '{field_id}' is missing required 'page' number.")
        elif input_page != expected_page:
            errors.append(
                f"ERROR: Incorrect page number for '{field_id}' (got {input_page}, expected {expected_page})."
            )
        
        if input_value is not None:
            err = validation_error_for_field_value(existing_field, input_value)
            if err:
                errors.append(err)
                
    return errors


def fill_pdf_fields(input_pdf_path: str, fields_json_path: str, output_pdf_path: str):
    """Fills form fields in a PDF based on the provided JSON data."""

    # 1. Load Data
    try:
        with open(fields_json_path, encoding="utf-8") as f:
            fields = json.load(f)
    except FileNotFoundError:
        print(f"Error: Field values file not found at {fields_json_path}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON file: {fields_json_path}. Ensure it is valid JSON.", file=sys.stderr)
        sys.exit(1)

    # 2. Validate and Process Input
    try:
        reader = PdfReader(input_pdf_path)
    except FileNotFoundError:
        print(f"Error: Input PDF file not found at {input_pdf_path}", file=sys.stderr)
        sys.exit(1)

    errors = validate_input_fields(fields, reader)
    
    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        sys.exit(1)
        
    # Group fields by page for writing, only including fields with defined values.
    fields_to_write: dict[int, dict] = {}
    for field in fields:
        field_value = field.get("value")
        if field_value is not None:
            field_id = field["field_id"]
            page = field["page"]
            # Page is 1-indexed
            fields_to_write.setdefault(page, {})[field_id] = field_value
            
    # 3. Write PDF
    writer = PdfWriter(clone_from=reader)
    
    for page_num, field_values in fields_to_write.items():
        # pypdf uses 0-based indexing for writer.pages
        page_index = page_num - 1 

        if page_index < 0 or page_index >= len(writer.pages):
            # This check should ideally be redundant if validation passed, but provides robustness.
            print(f"Warning: Page {page_num} index out of range. Skipping fields on this page.", file=sys.stderr)
            continue

        writer.update_page_form_field_values(
            writer.pages[page_index], 
            field_values, 
            auto_regenerate=False
        )

    # Required for many viewers (e.g., Adobe Acrobat) to render form field appearances correctly.
    writer.set_need_appearances_writer(True)
    
    with open(output_pdf_path, "wb") as f:
        writer.write(f)


def monkeypatch_pydpf_method():
    """
    Applies a monkeypatch to fix a pypdf bug related to selection list fields (/Ch fields 
    which are not combos) where `get_inherited` returns a list of two-element lists for /Opt.
    """
    
    original_get_inherited = DictionaryObject.get_inherited

    def patched_get_inherited(self, key: str, default: Any = None) -> Any:
        result = original_get_inherited(self, key, default)
        
        # Check if the key is /Opt (Options)
        if key == FA.Opt:
            # Check if the result is a list of [value, text] pairs
            is_two_element_list = isinstance(result, list) and all(
                isinstance(v, list) and len(v) == 2 for v in result
            )
            if is_two_element_list:
                # We need to return only the value strings (r[0])
                result = [r[0] for r in result]
                
        return result

    DictionaryObject.get_inherited = patched_get_inherited


def main():
    if len(sys.argv) != 4:
        print("Usage: python script.py [input pdf] [field_values.json] [output pdf]", file=sys.stderr)
        sys.exit(1)
        
    # Apply patch early to ensure all pypdf operations use the corrected behavior
    monkeypatch_pydpf_method()
    
    input_pdf = sys.argv[1]
    fields_json = sys.argv[2]
    output_pdf = sys.argv[3]
    
    fill_pdf_fields(input_pdf, fields_json, output_pdf)


if __name__ == "__main__":
    main()