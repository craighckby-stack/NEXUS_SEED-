from dataclasses import dataclass
import json
import sys

@dataclass
class BoundingBox:
    """Represents a bounding box with its coordinates and type."""
    rect: list[float]
    rect_type: str
    field: dict

def intersect(rect1: list[float], rect2: list[float]) -> bool:
    """
    Checks if two rectangles intersect.

    Args:
    rect1 (list[float]): The first rectangle's coordinates.
    rect2 (list[float]): The second rectangle's coordinates.

    Returns:
    bool: True if the rectangles intersect, False otherwise.
    """
    disjoint_horizontal = rect1[0] >= rect2[2] or rect1[2] <= rect2[0]
    disjoint_vertical = rect1[1] >= rect2[3] or rect1[3] <= rect2[1]
    return not (disjoint_horizontal or disjoint_vertical)

def check_bounding_box_height(field: dict, rect: list[float]) -> bool:
    """
    Checks if the entry bounding box height is sufficient for the text content.

    Args:
    field (dict): The field containing the entry text and font size.
    rect (list[float]): The entry bounding box coordinates.

    Returns:
    bool: True if the height is sufficient, False otherwise.
    """
    if "entry_text" in field:
        font_size = field["entry_text"].get("font_size", 14)
        entry_height = rect[3] - rect[1]
        return entry_height >= font_size
    return True

def get_bounding_box_messages(fields_json_stream) -> list[str]:
    """
    Checks the fields.json file for overlapping bounding boxes and returns a list of messages.

    Args:
    fields_json_stream: The input stream containing the fields.json data.

    Returns:
    list[str]: A list of messages indicating the result of the check.
    """
    messages = []
    fields = json.load(fields_json_stream)
    messages.append(f"Read {len(fields['form_fields'])} fields")

    bounding_boxes = []
    for field in fields["form_fields"]:
        bounding_boxes.append(BoundingBox(field["label_bounding_box"], "label", field))
        bounding_boxes.append(BoundingBox(field["entry_bounding_box"], "entry", field))

    has_error = False
    for i, box1 in enumerate(bounding_boxes):
        for box2 in bounding_boxes[i + 1:]:
            if box1.field["page_number"] == box2.field["page_number"] and intersect(box1.rect, box2.rect):
                has_error = True
                if box1.field is box2.field:
                    messages.append(f"FAILURE: intersection between label and entry bounding boxes for `{box1.field['description']}` ({box1.rect}, {box2.rect})")
                else:
                    messages.append(f"FAILURE: intersection between {box1.rect_type} bounding box for `{box1.field['description']}` ({box1.rect}) and {box2.rect_type} bounding box for `{box2.field['description']}` ({box2.rect})")
                if len(messages) >= 20:
                    messages.append("Aborting further checks; fix bounding boxes and try again")
                    return messages
        if box1.rect_type == "entry" and not check_bounding_box_height(box1.field, box1.rect):
            has_error = True
            font_size = box1.field["entry_text"].get("font_size", 14)
            entry_height = box1.rect[3] - box1.rect[1]
            messages.append(f"FAILURE: entry bounding box height ({entry_height}) for `{box1.field['description']}` is too short for the text content (font size: {font_size}). Increase the box height or decrease the font size.")
            if len(messages) >= 20:
                messages.append("Aborting further checks; fix bounding boxes and try again")
                return messages

    if not has_error:
        messages.append("SUCCESS: All bounding boxes are valid")
    return messages

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: check_bounding_boxes.py [fields.json]")
        sys.exit(1)
    with open(sys.argv[1]) as f:
        messages = get_bounding_box_messages(f)
    for msg in messages:
        print(msg)