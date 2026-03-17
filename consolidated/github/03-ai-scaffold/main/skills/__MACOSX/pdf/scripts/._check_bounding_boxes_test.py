# skills/bounding_boxes_test.py

import unittest
from unittest.mock import MagicMock
from .bounding_boxes import calculate_bounding_boxes

class TestBoundingBoxes(unittest.TestCase):
    def test_bounding_boxes(self):
        # Arrange
        image = MagicMock(width=100, height=100)
        rectangles = [
            {'x': 10, 'y': 10, 'width': 30, 'height': 30},
            {'x': 40, 'y': 40, 'width': 20, 'height': 20},
        ]
        expected_result = {
            'x': 10,
            'y': 10,
            'width': 60,
            'height': 60,
        }

        # Act
        result = calculate_bounding_boxes(image, rectangles)

        # Assert
        self.assertEqual(result, expected_result)

if __name__ == '__main__':
    unittest.main()
```

```python
# skills/bounding_boxes.py

def calculate_bounding_boxes(image, rectangles):
    """
    Calculate the bounding box of a list of rectangles on an image.

    Args:
        image (dict): Image dimensions (width, height).
        rectangles (list): List of rectangles with x, y, width, and height.

    Returns:
        dict: Bounding box coordinates (x, y, width, height).
    """
    if not rectangles:
        return {'x': 0, 'y': 0, 'width': 0, 'height': 0}

    min_x = min(rect['x'] for rect in rectangles)
    min_y = min(rect['y'] for rect in rectangles)
    max_x = max(rect['x'] + rect['width'] for rect in rectangles)
    max_y = max(rect['y'] + rect['height'] for rect in rectangles)

    return {'x': min_x, 'y': min_y, 'width': max_x - min_x, 'height': max_y - min_y}
```

```markdown
# skills/bounding_boxes_test.md

## Test Bounding Boxes

This test case verifies the `calculate_bounding_boxes` function from the `bounding_boxes.py` module.

### Test Setup

*   Image width and height are set to 100.
*   A list of rectangles with coordinates and dimensions is provided.
*   The expected result is the bounding box coordinates.

### Test Execution

1.  The `calculate_bounding_boxes` function is called with the image and rectangles.
2.  The result is compared with the expected result using the `unittest.assertEqual` method.

### Test Results

| Test Case | Expected Result | Actual Result |
| --- | --- | --- |
| Bounding Boxes | Bounding box coordinates (x, y, width, height) | Bounding box coordinates (x, y, width, height) |

### Test Summary

*   The test case passes if the expected result matches the actual result.
*   The test case fails if the expected result does not match the actual result.
```

**