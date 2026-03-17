import json
from dataclasses import dataclass
import sys


@dataclass
class RectAndField:
    rect: list[float]
    rect_type: str
    field: dict


def load_fields_json(fields_json_stream) -> dict:
    """Load the fields JSON data."""
    return json.load(fields_json_stream)


def get_bounding_box_messages(fields_json_data: dict) -> list[str]:
    """Return a list of messages that are printed to stdout for Claude to read."""
    messages: list[str] = []
    fields = fields_json_data["form_fields"]
    messages.append(f"Read {len(fields)} fields")

    def are_rects_intersecting(r1, r2) -> bool:
        """Check if two rectangles intersect."""
        return not (r1[0] >= r2[2] or r1[2] <= r2[0] or r1[1] >= r2[3] or r1[3] <= r2[1])

    has_error = False
    for i, f in enumerate(fields):
        rects_and_fields = [
            RectAndField(f["label_bounding_box"], "label", f),
            RectAndField(f["entry_bounding_box"], "entry", f),
        ]
        for ri, rj in zip(rects_and_fields, rects_and_fields[i + 1 :]):
            if ri.field["page_number"] == rj.field["page_number"] and are_rects_intersecting(ri.rect, rj.rect):
                has_error = True
                if ri.field == rj.field:
                    messages.append(
                        f"FAILURE: intersection between label and entry bounding boxes for `{ri.field['description']}` ({ri.rect}, {rj.rect})"
                    )
                else:
                    messages.append(
                        f"FAILURE: intersection between {ri.rect_type} bounding box for `{ri.field['description']}` ({ri.rect}) and {rj.rect_type} bounding box for `{rj.field['description']}` ({rj.rect})"
                    )
                if len(messages) >= 20:
                    messages.append("Aborting further checks; fix bounding boxes and try again")
                    return messages
        if ri.rect_type == "entry":
            if "entry_text" in ri.field:
                font_size = ri.field["entry_text"].get("font_size", 14)
                entry_height = ri.rect[3] - ri.rect[1]
                if entry_height < font_size:
                    has_error = True
                    messages.append(
                        f"FAILURE: entry bounding box height ({entry_height}) for `{ri.field['description']}` is too short for the text content (font size: {font_size}). Increase the box height or decrease the font size."
                    )
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
        messages = get_bounding_box_messages(load_fields_json(f))
    for msg in messages:
        print(msg)