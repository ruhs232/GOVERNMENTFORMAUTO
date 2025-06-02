# living_certificate_service.py

import os
import mimetypes
from google.cloud import documentai_v1 as documentai
from living_certificate_parser import parse_living_certificate_text

# ─── CONFIG ───────────────────────────────────────────────────────────────────
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "docai-460614-2c271e90ff8a.json"
PROJECT_ID   = "844875745491"
LOCATION     = "us"
PROCESSOR_ID = "e8ccf7eeea048b92"
PROCESSOR_NAME = f"projects/{PROJECT_ID}/locations/{LOCATION}/processors/{PROCESSOR_ID}"
# ────────────────────────────────────────────────────────────────────────────────

def extract_text_from_document(file_path: str) -> dict:
    """
    Sends the file to Document AI, then returns both raw_text
    and parsed fields.
    """
    client = documentai.DocumentProcessorServiceClient()
    with open(file_path, "rb") as f:
        content = f.read()

    mime_type, _ = mimetypes.guess_type(file_path)
    mime_type = mime_type or "application/octet-stream"

    raw_doc = documentai.RawDocument(content=content, mime_type=mime_type)
    req = documentai.ProcessRequest(name=PROCESSOR_NAME, raw_document=raw_doc)
    resp = client.process_document(request=req)

    raw_text = resp.document.text or ""
    parsed = parse_living_certificate_text(raw_text)

    return {
        "raw_text": raw_text,
        **parsed
    }


