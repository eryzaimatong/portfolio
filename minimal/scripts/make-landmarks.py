"""
Precompute face landmarks for the hero portrait. Run once; the site only animates the stored JSON (no ML in the browser).

    python -m venv venv && venv/Scripts/pip install mediapipe
    venv/Scripts/python make-landmarks.py <photo.jpg> <face_landmarker.task> <out.json>

The model is MediaPipe's official face_landmarker.task:
https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

The hero shows a 4:5 crop of the photo (x0 = 660 px from the left, full height). Landmarks are returned in that crop's
coordinate space, 0..1, so the overlay maps straight onto the displayed image. The face is small in the frame, so if the
full image gives no detection the script retries on zoomed windows and maps the landmarks back.
"""
import json, sys
import numpy as np
from PIL import Image
import mediapipe as mp
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision

photo, model, out = sys.argv[1:4]
CROP_X0 = 660

src = Image.open(photo).convert("RGB")
W, H = src.size
CW = int(H * 4 / 5)

opts = vision.FaceLandmarkerOptions(base_options=mpt.BaseOptions(model_asset_path=model), num_faces=1,
                                    min_face_detection_confidence=0.2, min_face_presence_confidence=0.2)
lm = vision.FaceLandmarker.create_from_options(opts)

def detect(im):
    return lm.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(np.asarray(im))))

found = None
r = detect(src)
if r.face_landmarks:
    found = [(l.x * W, l.y * H) for l in r.face_landmarks[0]]
else:
    # zoomed windows over the cropped area: size as a fraction of the height, 50% overlap, upscaled to 1024
    for frac in (0.5, 0.38, 0.3, 0.24):
        win = int(H * frac); step = max(1, win // 2)
        for y in range(0, H - win + 1, step):
            for x in range(CROP_X0, min(W - win, CROP_X0 + CW - win) + 1, step):
                tile = src.crop((x, y, x + win, y + win)).resize((1024, 1024), Image.LANCZOS)
                rr = detect(tile)
                if rr.face_landmarks:
                    found = [(x + l.x * win, y + l.y * win) for l in rr.face_landmarks[0]]
                    print(f"found in window frac={frac} at ({x},{y}) size {win}")
                    break
            if found: break
        if found: break
if not found:
    sys.exit("no face found")

pts = [[round((px - CROP_X0) / CW, 4), round(py / H, 4)] for px, py in found]
# the face is small in the frame, so the full tessellation would be a solid blob: keep the contours (oval, eyes, brows, lips, nose)
# plus every 4th tessellation edge for a light mesh texture
C = vision.FaceLandmarksConnections
seen, edges = set(), []
for c in list(C.FACE_LANDMARKS_CONTOURS) + list(C.FACE_LANDMARKS_TESSELATION)[::4]:
    k = (min(c.start, c.end), max(c.start, c.end))
    if k not in seen: seen.add(k); edges.append([c.start, c.end])
xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
json.dump({"points": pts, "edges": edges, "bbox": [min(xs), min(ys), max(xs), max(ys)]}, open(out, "w"), separators=(",", ":"))
print(f"{len(pts)} points, {len(edges)} edges, face box x {min(xs):.3f}-{max(xs):.3f} y {min(ys):.3f}-{max(ys):.3f}")
