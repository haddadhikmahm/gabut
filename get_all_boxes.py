import cv2
import numpy as np
import glob

def get_box(f):
    img = cv2.imread(f)
    if img is None: return None
    h, w = img.shape[:2]
    
    # Try pure white first (most common for placeholders)
    mask = cv2.inRange(img, np.array([230, 230, 230]), np.array([255, 255, 255]))
    # Morph close
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((11,11), np.uint8))
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    best_cnt = None
    max_area = 0
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > max_area and area > w * h * 0.05:
            max_area = area
            best_cnt = cnt
            
    if best_cnt is not None:
        x, y, cw, ch = cv2.boundingRect(best_cnt)
        return (x/w, y/h, cw/w, ch/h)
    return None

for i in range(1, 14):
    f = f"images/frame{i}.png"
    box = get_box(f)
    if box:
        print(f"if (src.includes('frame{i}.png')) {{ ctx.clearRect(w * {box[0]:.3f}, h * {box[1]:.3f}, w * {box[2]:.3f}, h * {box[3]:.3f}); return finish(cvs, src, resolve); }}")
    else:
        print(f"// frame{i}.png not found or no white box")
