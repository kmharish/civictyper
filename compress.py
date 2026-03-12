import cv2
import os

frames_dir = "frames"
output_dir = "frames_webp"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

frame_files = [f for f in os.listdir(frames_dir) if f.endswith(".jpg")]
frame_files.sort()

# Target width for resizing (e.g., 1280px for 720p equivalent to save massive size)
TARGET_WIDTH = 1280

print(f"Compressing {len(frame_files)} frames to WebP...")

for i, filename in enumerate(frame_files):
    filepath = os.path.join(frames_dir, filename)
    img = cv2.imread(filepath)
    if img is not None:
        # Resize image maintaining aspect ratio
        height, width = img.shape[:2]
        if width > TARGET_WIDTH:
            scale = TARGET_WIDTH / width
            new_height = int(height * scale)
            img = cv2.resize(img, (TARGET_WIDTH, new_height), interpolation=cv2.INTER_AREA)

        # Save as WebP with 50% quality (WebP 50% looks great and is tiny)
        out_name = filename.replace(".jpg", ".webp")
        out_path = os.path.join(output_dir, out_name)
        cv2.imwrite(out_path, img, [cv2.IMWRITE_WEBP_QUALITY, 50])
        
    if i % 100 == 0:
        print(f"Processed {i} frames...")

print("Compression complete!")
