import json
import sys
import logging
import argparse
from typing import Dict, Any, List, Optional, Union, Tuple

from pypdf import PdfReader
from pypdf.generic import DictionaryObject, ArrayObject, NameObject

# --- Configuration & Setup ---

# Set up logging for production elegance instead of raw 'print' statements
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# --- Constants ---

# Field Type Names (as found in /FT entry of a field dictionary)
FT_TEXT = NameObject("/Tx")
FT_BUTTON = NameObject("/Btn")
FT_CHOICE = NameObject("/Ch")

# Standard values
STATE_OFF = NameObject("/Off")

# --- Types ---
FieldDict = Dict[str, Any]
Rect = List[Union[int, float]]


# --- Helpers ---

def get_full_annotation_field_id(annotation: DictionaryObject) -> Optional[str]:
    """
    Recursively determines the fully qualified field ID (TName.ParentName...)
    from an annotation dictionary by traversing the '/Parent' chain.
    """
    components: List[str] = []
    current_annotation: Optional[DictionaryObject] = annotation
    
    while current_annotation:
        # T is the terminal field name component
        field_name = current_annotation.get(NameObject("/T"))
        
        if field_name:
            # Handle potential NameObject conversion
            components.append(str(field_name))

        # Move up the hierarchy
        parent = current_annotation.get(NameObject("/Parent"))
        if isinstance(parent, DictionaryObject):
            current_annotation = parent
        else:
            current_annotation = None

    # Components are collected from leaf up, so reverse them.
    # We strip the leading '/' from the NameObject string representation if present.
    clean_components = [c.lstrip('/') for c in components]
    
    return ".".join(reversed(clean_components)) if clean_components else None


def _normalize_rect(rect_obj: Any) -> Optional[Rect]:
    """Ensures the rect object is a list of four numbers, or None."""
    if isinstance(rect_obj, ArrayObject) and len(rect_obj) == 4:
        return [float(x) for x in rect_obj]
    return None


def make_field_dict(field: DictionaryObject, field_id: str) -> FieldDict:
    """
    Creates the base field dictionary structure based on the PDF field type (/FT).
    Handles standard field types (Text, Checkbox, Choice).
    """
    field_dict: FieldDict = {"field_id": field_id}
    ft = field.get(NameObject("/FT"))

    if ft == FT_TEXT:
        field_dict["type"] = "text"
    
    elif ft == FT_BUTTON:
        # Checkboxes and potential radio buttons
        states = field.get(NameObject("/_States_"), ArrayObject())
        
        if len(states) == 2:
            field_dict["type"] = "checkbox"
            
            # Find the checked value (the one not /Off)
            on_states = [s for s in states if s != STATE_OFF]
            
            if len(on_states) == 1:
                field_dict["checked_value"] = str(on_states[0])
                field_dict["unchecked_value"] = str(STATE_OFF)
            else:
                # Fallback warning if states are irregular
                logger.warning(
                    f"Irregular state values detected for checkbox '{field_id}'. "
                    f"Checked and unchecked values may be incorrect."
                )
                field_dict["type"] = "checkbox (unverified)"
                field_dict["checked_value"] = str(states[0])
                field_dict["unchecked_value"] = str(states[1])
        else:
             # Buttons that aren't clear checkboxes (e.g., containers, simple buttons)
             field_dict["type"] = "button (deferred_or_skipped)"

    elif ft == FT_CHOICE:
        field_dict["type"] = "choice"
        states = field.get(NameObject("/_States_"), ArrayObject())
        
        options = []
        for state in states:
            if isinstance(state, ArrayObject) and len(state) == 2:
                options.append({
                    "value": str(state[0]),
                    "text": str(state[1]),
                })
        
        field_dict["choice_options"] = options

    else:
        field_dict["type"] = f"unknown ({ft})"
        
    return field_dict


# --- Core Logic ---

def get_field_info(reader: PdfReader) -> List[FieldDict]:
    """
    Extracts comprehensive information about fillable form fields, combining 
    high-level field definitions with page-specific annotation data (location).
    """
    fields = reader.get_fields()

    field_info_by_id: Dict[str, FieldDict] = {}
    possible_radio_parents: set[str] = set()
    radio_groups: Dict[str, FieldDict] = {}

    # --- Phase 1: Process high-level field definitions ---
    for field_id, field in fields.items():
        field_id_str = str(field_id)
        
        # Identify container fields.
        if field.get(NameObject("/Kids")):
            # If it's a button container, it might be a radio group parent.
            if field.get(NameObject("/FT")) == FT_BUTTON:
                possible_radio_parents.add(field_id_str)
            continue
            
        # Process standard fields (Text, Checkbox, Choice)
        field_info_by_id[field_id_str] = make_field_dict(field, field_id_str)

    # --- Phase 2: Find locations and radio options via annotations ---

    for page_index, page in enumerate(reader.pages):
        page_num = page_index + 1
        annotations = page.get(NameObject('/Annots'), ArrayObject())
        
        for ann in annotations:
            if not isinstance(ann, DictionaryObject):
                continue

            field_id = get_full_annotation_field_id(ann)
            if not field_id:
                continue

            rect = _normalize_rect(ann.get(NameObject('/Rect')))

            # 2a: Standard Fields (assign location)
            if field_id in field_info_by_id:
                field_info = field_info_by_id[field_id]
                field_info["page"] = page_num
                field_info["rect"] = rect
                
            # 2b: Radio Options (Annotations belonging to a tracked container/parent)
            elif field_id in possible_radio_parents:
                
                # Appearance stream dictionary contains the possible states
                appearance = ann.get(NameObject("/AP"))
                normal_appearance = appearance.get(NameObject("/N")) if isinstance(appearance, DictionaryObject) else None
                
                if isinstance(normal_appearance, DictionaryObject):
                    # Keys in /N are the states, usually /Off and the specific value
                    on_values = [
                        str(v) for v in normal_appearance.keys() if v != STATE_OFF
                    ]
                else:
                    continue

                if len(on_values) == 1:
                    if field_id not in radio_groups:
                        radio_groups[field_id] = {
                            "field_id": field_id,
                            "type": "radio_group",
                            "radio_options": [],
                        }
                    
                    # Store option details
                    radio_groups[field_id]["radio_options"].append({
                        "value": on_values[0],
                        "rect": rect,
                        "page": page_num,
                    })

    # --- Phase 3: Final Filtering and Sorting ---
    
    fields_with_location = []
    
    # Filter standard fields, ignoring those without location or internal button types
    for field_info in field_info_by_id.values():
        if "page" in field_info and not field_info["type"].startswith("button ("):
            fields_with_location.append(field_info)
        else:
            if field_info["type"] not in ["button (deferred_or_skipped)"]:
                logger.warning(
                    f"Location missing for field: {field_info.get('field_id')} ({field_info['type']}). Ignoring."
                )

    # Finalize radio groups
    final_radio_groups = []
    for group_id, group in radio_groups.items():
        if group["radio_options"]:
            # Set the group's page based on the first encountered option for sorting
            group["page"] = group["radio_options"][0]["page"]
            final_radio_groups.append(group)
        else:
             logger.warning(f"Radio group '{group_id}' found, but no options attached. Ignoring.")


    # Combine and sort
    sorted_fields = fields_with_location + final_radio_groups
    
    def sort_key(f: FieldDict) -> Tuple[int, float, float]:
        """
        Sorts fields primarily by Page, then Y position (top-to-bottom), then X.
        """
        page = f.get("page", 0)
        
        # Determine the rect used for sorting
        if f["type"] == "radio_group":
            rect = f["radio_options"][0]["rect"] if f["radio_options"] and f["radio_options"][0]["rect"] else [0, 0, 0, 0]
        else:
            rect = f.get("rect") or [0, 0, 0, 0]
            
        # Fallback for missing rect: push to the end of the page list
        if rect == [0, 0, 0, 0]:
            return (page, float('inf'), 0.0) 
            
        # PDF coordinates: [llx, lly, urx, ury]. Y increases upwards.
        ury = rect[3] # Upper Y coordinate
        llx = rect[0] # Lower left X coordinate
        
        # Negate ury for stable top-to-bottom reading order
        return (page, -ury, llx)
    
    sorted_fields.sort(key=sort_key)

    return sorted_fields


def write_field_info(pdf_path: str, json_output_path: str):
    """Reads PDF fields, extracts info, and writes the result to JSON."""
    try:
        reader = PdfReader(pdf_path)
    except Exception as e:
        logger.error(f"Failed to read PDF file '{pdf_path}': {e}")
        sys.exit(1)
        
    field_info = get_field_info(reader)
    
    try:
        with open(json_output_path, "w", encoding="utf-8") as f:
            json.dump(field_info, f, indent=2)
        logger.info(f"Successfully wrote {len(field_info)} fields to {json_output_path}")
    except IOError as e:
        logger.error(f"Failed to write output JSON to '{json_output_path}': {e}")
        sys.exit(1)


def main():
    """Main function to handle command-line arguments using argparse."""
    parser = argparse.ArgumentParser(
        description="Extracts fillable form field information from a PDF and outputs JSON.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument(
        "input_pdf", 
        help="Path to the input PDF file."
    )
    parser.add_argument(
        "output_json", 
        help="Path to the output JSON file."
    )
    
    args = parser.parse_args()
    
    write_field_info(args.input_pdf, args.output_json)


if __name__ == "__main__":
    main()