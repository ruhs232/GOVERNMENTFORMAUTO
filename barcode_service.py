# barcode_service.py
import logging
from pyzbar.pyzbar import decode
from PIL import Image
import tempfile

def extract_barcodes_pyzbar(flask_file) -> list:
    """
    Reads a Flask FileStorage image via pyzbar and returns
    a list of { format: str, value: str }.
    """
    # 1) Save to temp file
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
    flask_file.save(tmp.name)

    try:
        img = Image.open(tmp.name)
        decoded = decode(img)
        results = []
        for obj in decoded:
            results.append({
                "format": obj.type,        # e.g. 'CODE128', 'QRCODE'
                "value": obj.data.decode() # the payload
            })
        return results
    except Exception as e:
        logging.error(f"[barcode_service] error: {e}")
        return []
