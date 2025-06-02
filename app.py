import os
import uuid
import logging
import tempfile
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from ocr import allowed_file, process_image
from classifier import classify_name
from pan_classifier import classify_pan
from rag.chain import rag_query
from vision_api import extract_barcodes
from pan_service import process_pan_image
from marksheet_service import extract_marksheet_data
from living_certificate_service import extract_text_from_document

app = Flask(__name__)
CORS(app)
app.config["UPLOAD_FOLDER"] = "static"
logging.basicConfig(level=logging.INFO)

@app.route("/api/extract", methods=["POST"])
def api_extract():
    file = request.files.get("image")
    if not file or not allowed_file(file.filename):
        return jsonify({"error": "No or invalid file"}), 400
    try:
        return jsonify(process_image(file))
    except Exception as e:
        logging.error(f"[OCR] error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/api/rag-query", methods=["POST"])
def api_rag_query():
    q = (request.get_json(silent=True) or {}).get("question", "").strip()
    if not q:
        return jsonify({"error": "No question provided"}), 400
    try:
        return jsonify({"answer": rag_query(q)})
    except Exception as e:
        logging.error(f"[RAG] error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/api/classify-name", methods=["POST"])
def api_classify_name():
    name = (request.get_json(silent=True) or {}).get("name", "").strip()
    if not name:
        return jsonify({"error": "No name provided"}), 400
    try:
        return jsonify({"response": classify_name(name)})
    except Exception as e:
        logging.error(f"[Name Classify] error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/api/classify-pan", methods=["POST"])
def api_classify_pan():
    pan = (request.get_json(silent=True) or {}).get("pan_number", "").strip()
    if not pan:
        return jsonify({"error": "No PAN number provided"}), 400
    try:
        return jsonify({"response": classify_pan(pan)})
    except Exception as e:
        logging.error(f"[PAN Classify] error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/api/vision-extract", methods=["POST"])
def api_vision_extract():
    file = request.files.get("image")
    if not file or not allowed_file(file.filename):
        return jsonify({"error": "No or invalid file"}), 400
    try:
        result = process_pan_image(file)
        return jsonify(result)
    except Exception as e:
        logging.error(f"[Vision Extract] error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/api/marksheet-extract", methods=["POST"])
def api_marksheet_extract():
    file = request.files.get("image")
    if not file or not allowed_file(file.filename):
        return jsonify({"error": "No or invalid file"}), 400
    try:
        result = extract_marksheet_data(file)
        return jsonify(result)
    except Exception as e:
        logging.error(f"[Marksheet Extract] error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/api/barcode-extract", methods=["POST"])
def api_barcode_extract():
    file = request.files.get("image")
    if not file or not allowed_file(file.filename):
        return jsonify({"error": "No or invalid file"}), 400
    try:
        ext = os.path.splitext(file.filename)[1]
        tmp_path = os.path.join(app.config["UPLOAD_FOLDER"], f"{uuid.uuid4()}{ext}")
        file.save(tmp_path)
        codes = extract_barcodes(tmp_path)
        os.remove(tmp_path)
        return jsonify({"barcodes": codes})
    except Exception as e:
        logging.error(f"[Barcode Extract] error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/api/living-certificate-extract", methods=["POST"])
def api_living_certificate_extract():
    file = request.files.get("image")
    if not file or not allowed_file(file.filename):
        return jsonify({"error": "No or invalid file"}), 400
    ext = os.path.splitext(file.filename)[1].lower()
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            file.save(tmp.name)
            result = extract_text_from_document(tmp.name)
        os.remove(tmp.name)
        return jsonify(result)
    except Exception as e:
        logging.error(f"[Living Certificate Extract] error: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/static/<path:fn>")
def static_files(fn):
    return send_from_directory(app.config["UPLOAD_FOLDER"], fn)

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=True
    )  # App startup
