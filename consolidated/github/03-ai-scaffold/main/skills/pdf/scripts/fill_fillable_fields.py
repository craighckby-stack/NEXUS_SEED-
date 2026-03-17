import json
from pathlib import Path
from typing import Dict, Any
from pypdf import PdfReader, PdfWriter
from extract_form_field_info import get_field_info

def fill_pdf_fields(input_pdf_path: Path, fields_json_path: Path, output_pdf_path: Path) -> None:
    """Fill fillable fields in a PDF with JSON-formatted field values."""
    fields_by_page: Dict[int, Dict[str, str]] = {}

    # Load JSON-formatted field values and group them by page
    with fields_json_path.open('r') as f:
        fields: Dict[str, Any] = json.load(f)
    for field in fields:
        if "value" in field and field["field_id"]:
            field_id = field["field_id"]
            page = field["page"]
            if page not in fields_by_page:
                fields_by_page[page] = {}
            fields_by_page[page][field_id] = field["value"]

    # Validate field values based on expected field types
    field_info = get_field_info(PdfReader(input_pdf_path))
    fields_by_ids = {f["field_id"]: f for f in field_info}
    validation_errors: List[str] = []
    for field in fields:
        existing_field = fields_by_ids.get(field["field_id"])
        if not existing_field:
            validation_errors.append(f"ERROR: `{field['field_id']}` is not a valid field ID")
        elif field["page"] != existing_field["page"]:
            validation_errors.append(f"ERROR: Incorrect page number for `{field['field_id']}` (got {field['page']}, expected {existing_field['page']})")
        else:
            if "value" in field:
                validation_error = validation_error_for_field_value(existing_field, field["value"])
                if validation_error:
                    validation_errors.append(validation_error)

    # If any validation errors were found, exit with a non-zero status
    if validation_errors:
        for error in validation_errors:
            print(error)
        sys.exit(1)

    # Clone the input PDF and update its form field values
    reader = PdfReader(input_pdf_path)
    writer = PdfWriter.clone_from(reader)
    for page, field_values in fields_by_page.items():
        writer.update_page_form_field_values(writer.pages[page - 1], field_values, auto_regenerate=False)

    # Ensure that the PDF has need_appearances_writer set to True for correct viewer formatting
    writer.set_need_appearances_writer(True)

    # Save the modified PDF to the output path
    output_pdf_path.write_bytes(writer.write(dest="rawbytes"))


def validation_error_for_field_value(field_info: Dict[str, Any], field_value: str) -> str:
    """Return an error message if the provided field value is invalid for the given field."""
    field_type = field_info["type"]
    field_id = field_info["field_id"]
    if field_type == "checkbox":
        checked_val = field_info["checked_value"]
        unchecked_val = field_info["unchecked_value"]
        if field_value not in [checked_val, unchecked_val]:
            return f"ERROR: Invalid value '{field_value}' for checkbox field '{field_id}'. The checked value is '{checked_val}' and the unchecked value is '{unchecked_val}'"
    elif field_type == "radio_group":
        option_values = [opt["value"] for opt in field_info["radio_options"]]
        if field_value not in option_values:
            return f"ERROR: Invalid value '{field_value}' for radio group field '{field_id}'. Valid values are: {option_values}"
    elif field_type == "choice":
        choice_values = [opt["value"] for opt in field_info["choice_options"]]
        if field_value not in choice_values:
            return f"ERROR: Invalid value '{field_value}' for choice field '{field_id}'. Valid values are: {choice_values}"
    return ""


def main() -> None:
    """Parse command-line arguments and fill the PDF fields accordingly."""
    if len(sys.argv) != 4:
        print("Usage: fill_fillable_fields.py [input pdf] [field_values.json] [output pdf]")
        sys.exit(1)

    input_pdf = Path(sys.argv[1])
    fields_json = Path(sys.argv[2])
    output_pdf = Path(sys.argv[3])
    fill_pdf_fields(input_pdf, fields_json, output_pdf)


if __name__ == "__main__":
    main()
```

**