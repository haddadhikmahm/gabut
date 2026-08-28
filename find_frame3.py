import cv2
import numpy as np

img = cv2.imread('images/frame3.png')
# Frame 3 is probably checkerboard or dark. Let's look for dark gray like frame 1.
mask = cv2.inRange(img, np.array([50, 50, 50]), np.array([120, 120, 120]))
mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((25,25), np.uint8))
contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
h, w = img.shape[:2]
for cnt in contours:
    if cv2.contourArea(cnt) > w * h * 0.05:
        x, y, cw, ch = cv2.boundingRect(cnt)
        print(f"frame3: x={x/w:.3f}, y={y/h:.3f}, w={cw/w:.3f}, h={ch/h:.3f}")
