import os
import re
import cv2
import numpy as np
import easyocr
import logging
from inference_sdk import InferenceHTTPClient
from werkzeug.utils import secure_filename

# Setup
UPLOAD_FOLDER = "static"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Roboflow Client
CLIENT = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key="i0ugmlchLJbER91K6IjS"
)

# EasyOCR Reader
reader = easyocr.Reader(['en'])

# Allowed file types
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_image(image_path):
    original_img = cv2.imread(image_path)
    gray_img = cv2.cvtColor(original_img, cv2.COLOR_BGR2GRAY)
    denoised_img = cv2.fastNlMeansDenoising(gray_img, None, h=30)
    clahe = cv2.createCLAHE(clipLimit=2.0)
    enhanced_img = clahe.apply(denoised_img)
    _, thresh_img = cv2.threshold(enhanced_img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    kernel = np.ones((3, 3), np.uint8)
    closed_img = cv2.morphologyEx(thresh_img, cv2.MORPH_CLOSE, kernel)
    sharpen_kernel = np.array([[-1,-1,-1],[-1,9,-1],[-1,-1,-1]])
    sharpened_img = cv2.filter2D(closed_img, -1, sharpen_kernel)
    processed_path = os.path.join(UPLOAD_FOLDER, "preprocessed.jpg")
    cv2.imwrite(processed_path, sharpened_img)
    return processed_path

def extract_text_from_image(image_path):
    return reader.readtext(image_path, detail=0)

def extract_name_and_aadhaar(text_list):
    aadhaar_number = None
    name = None
    combined_text = " ".join(text_list)
    match = re.search(r"(\d{4}\s?\d{4}\s?\d{4})", combined_text)
    if match:
        aadhaar_number = match.group(1).replace(" ", "")
    candidates = [t for t in text_list if not re.search(r"\d", t) and len(t.split()) >= 2]
    if candidates:
        name = max(candidates, key=len)
    return name, aadhaar_number

def process_image(file):
    filename = secure_filename(file.filename)
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(save_path)
    logging.info(f"Saved upload to {save_path}")

    pre = preprocess_image(save_path)

    try:
        result = CLIENT.infer(pre, model_id="ourproject-ouuvb/1")
    except Exception as e:
        logging.error(f"Inference error: {e}")
        raise RuntimeError("Roboflow inference failed") from e

    img = cv2.imread(pre)
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    texts = []

    for p in result.get("predictions", []):
        x, y, w, h = map(int, (p["x"], p["y"], p["width"], p["height"]))
        x1, y1 = max(0, x - w//2), max(0, y - h//2)
        x2, y2 = min(rgb.shape[1], x + w//2), min(rgb.shape[0], y + h//2)
        crop = rgb[y1:y2, x1:x2]
        crop_path = os.path.join(UPLOAD_FOLDER, f"crop_{x1}_{y1}.jpg")
        cv2.imwrite(crop_path, cv2.cvtColor(crop, cv2.COLOR_RGB2BGR))
        ocr_res = extract_text_from_image(crop_path)
        texts.extend(ocr_res)
        cv2.rectangle(rgb, (x1, y1), (x2, y2), (255, 0, 0), 2)

    annotated = os.path.join(UPLOAD_FOLDER, "annotated.jpg")
    cv2.imwrite(annotated, cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))

    name, aadhaar = extract_name_and_aadhaar(texts)

    return {
        "detected_texts": texts,
        "name": name,
        "aadhaar_number": aadhaar,
        "annotated_url": f"/static/{os.path.basename(annotated)}"
    }
