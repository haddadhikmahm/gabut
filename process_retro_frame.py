import cv2
import numpy as np
import os

# Input and output paths
input_path = r'C:\Users\PC DESKTOP\.gemini\antigravity-ide\brain\19a16613-301a-4d6e-976d-ed0b1a5b9210\retro_newspaper_1787905203690.png'
output_path = r'c:\laragon\www\difotoku\images\frame14.png'

# Read image
img = cv2.imread(input_path)

if img is None:
    print("Error reading image")
    exit(1)

# Resize to 1080x1440 (crop center if aspect ratio doesn't match)
target_w, target_h = 1080, 1440
h, w = img.shape[:2]
aspect = w / h
target_aspect = target_w / target_h

if aspect > target_aspect:
    # Image is too wide, crop width
    new_w = int(h * target_aspect)
    start_x = (w - new_w) // 2
    img_cropped = img[:, start_x:start_x+new_w]
else:
    # Image is too tall, crop height
    new_h = int(w / target_aspect)
    start_y = (h - new_h) // 2
    img_cropped = img[start_y:start_y+new_h, :]

img_resized = cv2.resize(img_cropped, (target_w, target_h))

# Draw solid white rectangle for the cutout
# Similar position to frame6
x, y, w_rect, h_rect = 220, 480, 640, 500
cv2.rectangle(img_resized, (x, y), (x+w_rect, y+h_rect), (255, 255, 255), -1)

# Save the final frame
cv2.imwrite(output_path, img_resized)
print(f"Saved {output_path} with cutout at {x},{y},{w_rect},{h_rect}")
