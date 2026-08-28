import cv2
import numpy as np
import glob
import os

def process_frame(img_path):
    print(f"Processing {img_path}...")
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print("Failed to load")
        return False
        
    if img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
        
    # Mask neutral pixels
    b, g, r, a = cv2.split(img)
    
    # Calculate differences between channels
    diff_rg = cv2.absdiff(r, g)
    diff_gb = cv2.absdiff(g, b)
    diff_rb = cv2.absdiff(r, b)
    
    # A pixel is neutral if the differences are small
    neutral_mask = (diff_rg < 15) & (diff_gb < 15) & (diff_rb < 15)
    
    # Convert to uint8
    neutral_mask = neutral_mask.astype(np.uint8) * 255
    
    # Morphological closing to fill gaps in checkerboard (if any)
    kernel = np.ones((9,9), np.uint8)
    closed = cv2.morphologyEx(neutral_mask, cv2.MORPH_CLOSE, kernel)
    
    # Morphological opening to remove small noise (like text)
    opened = cv2.morphologyEx(closed, cv2.MORPH_OPEN, kernel)
    
    # Find contours
    contours, _ = cv2.findContours(opened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    h, w = img.shape[:2]
    total_area = w * h
    
    modified = False
    
    for cnt in contours:
        area = cv2.contourArea(cnt)
        # If the contour is large enough (e.g. > 5% of the image)
        if area > total_area * 0.05:
            # Check solidity (to avoid masking complex gray frames)
            hull = cv2.convexHull(cnt)
            hull_area = cv2.contourArea(hull)
            solidity = float(area) / hull_area if hull_area > 0 else 0
            
            # Checkerboard cutouts are usually rectangular, so high solidity.
            if solidity > 0.8:
                # We found a cutout! Draw it as transparent on the alpha channel
                cv2.drawContours(a, [cnt], -1, 0, -1)
                modified = True
                print(f"  Found cutout: area={area}, solidity={solidity:.2f}")

    if modified:
        # Merge back
        img = cv2.merge((b, g, r, a))
        cv2.imwrite(img_path, img)
        print("  Saved!")
        return True
    else:
        print("  No cutout found.")
        return False

for f in glob.glob("images/frame*.png"):
    process_frame(f)
