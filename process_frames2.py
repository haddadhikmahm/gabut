import cv2
import numpy as np

def process_frame(img_path):
    print(f"Processing {img_path}...")
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    if img is None: return False
        
    if img.shape[2] == 3: img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
        
    b, g, r, a = cv2.split(img)
    diff_rg = cv2.absdiff(r, g)
    diff_gb = cv2.absdiff(g, b)
    diff_rb = cv2.absdiff(r, b)
    
    # Very lenient neutrality check (allow slight tints)
    neutral_mask = (diff_rg < 30) & (diff_gb < 30) & (diff_rb < 30)
    neutral_mask = neutral_mask.astype(np.uint8) * 255
    
    kernel = np.ones((15,15), np.uint8) # larger kernel for ripped edges
    closed = cv2.morphologyEx(neutral_mask, cv2.MORPH_CLOSE, kernel)
    opened = cv2.morphologyEx(closed, cv2.MORPH_OPEN, kernel)
    
    contours, _ = cv2.findContours(opened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    h, w = img.shape[:2]
    total_area = w * h
    modified = False
    
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > total_area * 0.05:
            hull = cv2.convexHull(cnt)
            hull_area = cv2.contourArea(hull)
            solidity = float(area) / hull_area if hull_area > 0 else 0
            
            # Lower solidity for jagged/ripped paper frames
            if solidity > 0.4:
                cv2.drawContours(a, [cnt], -1, 0, -1)
                modified = True
                print(f"  Found cutout: area={area}, solidity={solidity:.2f}")

    if modified:
        img = cv2.merge((b, g, r, a))
        cv2.imwrite(img_path, img)
        print("  Saved!")

process_frame("images/frame1.png")
process_frame("images/frame11.png")
