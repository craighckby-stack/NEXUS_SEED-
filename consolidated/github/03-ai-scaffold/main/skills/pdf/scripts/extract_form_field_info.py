import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

from PyPDF2 import PdfReader


@dataclass
class Field:
    field_id: str
    page: int
    rect: Dict[str, float]
    type: str
    choice_options: List[Dict[str, str]] = None
    checked_value: str = None
    unchecked_value: str = None


def get_field_info(reader: PdfReader) -> List[Field]:
    fields = reader.get_fields()

    field_info_by_id = {}
    possible_radio_names = set()

    for field_id, field in fields.items():
        # Skip if this is a container field with children, except that it might be
        # a parent group for radio button options.
        if field.get("/Kids"):
            if field.get("/FT") == "/Btn":
                possible_radio_names.add(field_id)
            continue
        field_info_by_id[field_id] = make_field_dict(field, field_id)

    radio_fields_by_id = {}

    for page_index, page in enumerate(reader.pages):
        annotations = page.get('/Annots', [])
        for annotation in annotations:
            field_id = get_full_annotation_field_id(annotation)
            if field_id in field_info_by_id:
                field_info_by_id[field_id]["page"] = page_index + 1
                field_info_by_id[field_id]["rect"] = annotation.get('/Rect', {})
            elif field_id in possible_radio_names:
                try:
                    # ann['/AP']['/N'] should have two items. One of them is '/Off',
                    # the other is the active value.
                    on_values = [v for v in annotation["/AP"]["/N"] if v != "/Off"]
                except KeyError:
                    continue
                if len(on_values) == 1:
                    rect = annotation.get("/Rect", {})
                    if field_id not in radio_fields_by_id:
                        radio_fields_by_id[field_id] = Field(
                            field_id=field_id,
                            type="radio_group",
                            page=page_index + 1,
                            radio_options=[],
                        )
                    # Note: at least on macOS 15.7, Preview.app doesn't show selected
                    # radio buttons correctly. (It does if you remove the leading slash
                    # from the value, but that causes them not to appear correctly in
                    # Chrome/Firefox/Acrobat/etc).
                    radio_fields_by_id[field_id].radio_options.append(
                        {"value": on_values[0], "rect": rect}
                    )

    fields_with_location = []
    for field_info in field_info_by_id.values():
        if "page" in field_info:
            fields_with_location.append(field_info)
        else:
            print(f"Unable to determine location for field id: {field_info.get('field_id')}, ignoring")

    sorted_fields = fields_with_location + [v for v in radio_fields_by_id.values()]
    sorted_fields.sort(key=lambda f: (f.page, f.rect.get("y", 0) * -1, f.rect.get("x", 0)))

    return sorted_fields


def make_field_dict(field, field_id):
    field_dict = Field(
        field_id=field_id,
        type="text",
    )
    ft = field.get("/FT")
    if ft == "/Tx":
        pass
    elif ft == "/Btn":
        field_dict.type = "checkbox"
        states = field.get("/_States_", [])
        if len(states) == 2:
            # "/Off" seems to always be the unchecked value, as suggested by
            # https://opensource.adobe.com/dc-acrobat-sdk-docs/standards/pdfstandards/pdf/PDF32000_2008.pdf#page=448
            # It can be either first or second in the "/_States_" list.
            if "/Off" in states:
                field_dict.checked_value = states[0] if states[0] != "/Off" else states[1]
                field_dict.unchecked_value = "/Off"
            else:
                print(
                    f"Unexpected state values for checkbox `${field_id}`. "
                    f"Its checked and unchecked values may not be correct; if you're trying to check it, visually verify the results."
                )
                field_dict.checked_value = states[0]
                field_dict.unchecked_value = states[1]
    elif ft == "/Ch":
        field_dict.type = "choice"
        field_dict.choice_options = [
            {"value": state[0], "text": state[1]} for state in field.get("/_States_", [])
        ]
    return field_dict


def get_full_annotation_field_id(annotation):
    components = []
    while annotation:
        field_name = annotation.get("/T")
        if field_name:
            components.append(field_name)
        annotation = annotation.get("/Parent")
    return ".".join(reversed(components)) if components else None


def write_field_info(pdf_path: str, json_output_path: str):
    reader = PdfReader(pdf_path)
    field_info = get_field_info(reader)
    with open(json_output_path, "w") as f:
        json.dump([vars(f) for f in field_info], f, indent=2)
    print(f"Wrote {len(field_info)} fields to {json_output_path}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: extract_form_field_info.py [input pdf] [output json]")
        sys.exit(1)
    write_field_info(sys.argv[1], sys.argv[2])
```

**