from dataclasses import dataclass, field
from typing import List, TextIO, Dict, Any, Union
import json
import sys
from pathlib import Path

# --- Type Aliases and Constants ---
Rect = List[float]  # [x1, y1, x2, y2]
FieldData = Dict[str, Any]

MAX_MESSAGES = 20
DEFAULT_FONT_SIZE = 14.0
RECT_TYPE_LABEL = "label"
RECT_TYPE_ENTRY = "entry"


@dataclass(frozen=True)
class BoxContext:
    """Represents a single bounding box and its context for intersection checks."""
    rect: Rect
    rect_type: str  # 'label' or 'entry'
    page_number: int
    description: str
    # Reference to the original dictionary, used specifically for identity checks
    original_field: FieldData = field(repr=False, compare=False)


def rects_intersect(r1: Rect, r2: Rect) -> bool:
    """Checks if two rectangles [x1, y1, x2, y2] intersect."""
    # Disjoint if r1 is entirely left/right or above/below r2
    disjoint_horizontal = r1[0] >= r2[2] or r1[2] <= r2[0]
    disjoint_vertical = r1[1] >= r2[3] or r1[3] <= r2[1]
    return not (disjoint_horizontal or disjoint_vertical)


def _format_intersection_message(ri: BoxContext, rj: BoxContext) -> str:
    """Generates a standardized message for an intersection failure."""
    if ri.original_field is rj.original_field:
        # Intersection between label and entry of the *same* field
        return (
            f"FAILURE: intersection between {RECT_TYPE_LABEL} and {RECT_TYPE_ENTRY} bounding boxes "
            f"for `{ri.description}` ({ri.rect}, {rj.rect})"
        )
    else:
        # Intersection between boxes of *different* fields
        return (
            f"FAILURE: intersection between {ri.rect_type} bounding box for `{ri.description}` ({ri.rect}) "
            f"and {rj.rect_type} bounding box for `{rj.description}` ({rj.rect})"
        )


def collect_boxes(fields: List[FieldData]) -> List[BoxContext]:
    """Extracts all bounding boxes into a flat list of BoxContext objects."""
    box_contexts = []
    for f in fields:
        page_number = f.get("page_number", -1)
        description = f.get("description", "Unnamed Field")

        # 1. Label bounding box
        if "label_bounding_box" in f:
            box_contexts.append(BoxContext(
                rect=f["label_bounding_box"],
                rect_type=RECT_TYPE_LABEL,
                page_number=page_number,
                description=description,
                original_field=f
            ))

        # 2. Entry bounding box
        if "entry_bounding_box" in f:
            box_contexts.append(BoxContext(
                rect=f["entry_bounding_box"],
                rect_type=RECT_TYPE_ENTRY,
                page_number=page_number,
                description=description,
                original_field=f
            ))
            
    return box_contexts


def validate_intersections(box_contexts: List[BoxContext], messages: List[str]) -> bool:
    """
    Checks for O(N^2) overlaps between bounding boxes on the same page.
    Returns True if an error was found and messages were logged.
    """
    has_error = False
    N = len(box_contexts)
    
    for i in range(N):
        ri = box_contexts[i]
        
        for j in range(i + 1, N):
            rj = box_contexts[j]
            
            if ri.page_number != rj.page_number:
                continue

            if rects_intersect(ri.rect, rj.rect):
                has_error = True
                msg = _format_intersection_message(ri, rj)
                messages.append(msg)
                
                if len(messages) >= MAX_MESSAGES:
                    messages.append("Aborting further checks; fix bounding boxes and try again")
                    return True

    return has_error


def validate_entry_heights(fields: List[FieldData], messages: List[str]) -> bool:
    """
    Checks if entry bounding box height is sufficient for the specified font size.
    Returns True if an error was found and messages were logged.
    """
    has_error = False
    
    for f in fields:
        description = f.get("description", "Unnamed Field")
        
        if "entry_bounding_box" in f and "entry_text" in f:
            entry_rect = f["entry_bounding_box"]
            font_size = f["entry_text"].get("font_size", DEFAULT_FONT_SIZE)
            
            # entry_rect is [x1, y1, x2, y2]. Height is y2 - y1.
            entry_height = entry_rect[3] - entry_rect[1]
            
            if entry_height < font_size:
                has_error = True
                msg = (
                    f"FAILURE: entry bounding box height ({entry_height:.2f}) for `{description}` "
                    f"is too short for the text content (font size: {font_size:.2f}). "
                    "Increase the box height or decrease the font size."
                )
                messages.append(msg)
                
                if len(messages) >= MAX_MESSAGES:
                    messages.append("Aborting further checks; fix bounding boxes and try again")
                    return True
                    
    return has_error


def get_bounding_box_messages(fields_json_stream: TextIO) -> List[str]:
    """
    Main validation routine. Loads fields and runs all checks.
    """
    messages: List[str] = []
    
    try:
        data = json.load(fields_json_stream)
    except json.JSONDecodeError as e:
        messages.append(f"FAILURE: Could not parse JSON file. Error: {e}")
        return messages
        
    fields = data.get("form_fields", [])
    
    messages.append(f"Read {len(fields)} fields")

    box_contexts = collect_boxes(fields)
    
    overall_error = False
    
    # Check 1: Intersection checks (O(N^2))
    if validate_intersections(box_contexts, messages):
        overall_error = True
        if len(messages) >= MAX_MESSAGES:
            return messages
    
    # Check 2: Entry height validation
    if validate_entry_heights(fields, messages):
        overall_error = True
        if len(messages) >= MAX_MESSAGES:
            return messages

    if not overall_error:
        messages.append("SUCCESS: All bounding boxes are valid")
        
    return messages


def main():
    """Entry point for the command line interface."""
    if len(sys.argv) != 2:
        print("Usage: python check_bounding_boxes.py [fields.json]")
        sys.exit(1)
        
    file_path = Path(sys.argv[1])
    
    if not file_path.exists():
        print(f"Error: File not found at {file_path}")
        sys.exit(1)

    try:
        with file_path.open('r', encoding='utf-8') as f:
            messages = get_bounding_box_messages(f)
    except Exception as e:
        print(f"An unexpected error occurred during file processing: {e}", file=sys.stderr)
        sys.exit(1)

    exit_code = 0
    for msg in messages:
        print(msg)
        if msg.startswith("FAILURE:"):
            exit_code = 1
            
    sys.exit(exit_code)


if __name__ == "__main__":
    main()