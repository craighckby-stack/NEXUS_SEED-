
import os
import cv2
import numpy as np
from typing import List

class ObjectTracker:
    """Tracks objects across frames in a video."""
    def __init__(self):
        self.video_capture = cv2.VideoCapture('video.mp4')
        self.object_detector = cv2.createBackgroundSubtractorMOG2()
        self.tracked_objects = []

    def detect_objects(self, frame: np.ndarray) -> List[np.ndarray]:
        """Detect objects in a frame."""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh = cv2.threshold(blurred, 60, 255, cv2.THRESH_BINARY)[1]
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        return contours

    def track_objects(self, frame: np.ndarray) -> None:
        """Track objects across frames."""
        objects = self.detect_objects(frame)
        for obj in objects:
            x, y, w, h = cv2.boundingRect(obj)
            self.tracked_objects.append((x, y, w, h))
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
        cv2.imshow('Frame', frame)

    def run(self) -> None:
        """Run the object tracker."""
        while True:
            ret, frame = self.video_capture.read()
            if not ret:
                break
            self.track_objects(frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        self.video_capture.release()
        cv2.destroyAllWindows()

if __name__ == ""__main__"":
    tracker = ObjectTracker()
    tracker.run()
