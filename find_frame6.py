import cv2
import numpy as np

img = cv2.imread('images/frame6.png')
# Pure white box
mask = cv2.inRange(img, np.array([240, 240, 240]), np.array([255, 255, 255]))
contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
h, w = img.shape[:2]
for cnt in contours:
    if cv2.contourArea(cnt) > w * h * 0.05:
        x, y, cw, ch = cv2.boundingRect(cnt)
        print(f"frame6: x={x/w:.3f}, y={y/h:.3f}, w={cw/w:.3f}, h={ch/h:.3f}")
