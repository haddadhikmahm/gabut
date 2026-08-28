import cv2
import numpy as np

img = cv2.imread('images/frame1.png')
b, g, r = cv2.split(img)
diff_rg = cv2.absdiff(r, g)
diff_gb = cv2.absdiff(g, b)
diff_rb = cv2.absdiff(r, b)

# Dark checkerboard is neutral and dark (e.g. < 100)
mask = (diff_rg < 10) & (diff_gb < 10) & (diff_rb < 10) & (r < 100)
mask = mask.astype(np.uint8) * 255

kernel = np.ones((15,15), np.uint8)
closed = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
h, w = img.shape[:2]
for cnt in contours:
    if cv2.contourArea(cnt) > w * h * 0.05:
        x, y, cw, ch = cv2.boundingRect(cnt)
        print(f"frame1: x={x/w:.3f}, y={y/h:.3f}, w={cw/w:.3f}, h={ch/h:.3f}")
