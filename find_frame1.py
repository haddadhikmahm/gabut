import cv2
import numpy as np

img = cv2.imread('images/frame1.png')
# checkerboard has 73,73,73
mask = cv2.inRange(img, np.array([65, 65, 65]), np.array([85, 85, 85]))
mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((25,25), np.uint8))
contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
h, w = img.shape[:2]
for cnt in contours:
    if cv2.contourArea(cnt) > w * h * 0.05:
        x, y, cw, ch = cv2.boundingRect(cnt)
        print(f"frame1: x={x/w:.3f}, y={y/h:.3f}, w={cw/w:.3f}, h={ch/h:.3f}")
