# living_certificate_parser.py

import re

def parse_living_certificate_text(text: str) -> dict:
    """
    Given the full OCR’d text of a Living Certificate,
    returns a dict with the four requested fields.
    """
    result = {
        "uid": None,
        "candidate_name": None,
        "mother_name": None,
        "caste": None,
    }

    # 1) Find the first 12-digit Aadhaar (4 4 4)
    #    e.g. "3160 9723 2695"
    uid_match = re.search(r'\b(\d{4}\s+\d{4}\s+\d{4})\b', text)
    if not uid_match:
        return result  # nothing to do if no UID found

    result["uid"] = ' '.join(uid_match.group(1).split())

    # 2) Now split into clean lines and find which line had the UID
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    # locate the line index containing that exact UID
    try:
        uid_line_idx = next(
            i for i, ln in enumerate(lines) if result["uid"] == ' '.join(ln.split())
        )
    except StopIteration:
        return result

    # 3) Candidate Name = the very next non-empty line
    if uid_line_idx + 1 < len(lines):
        result["candidate_name"] = lines[uid_line_idx + 1]

    # 4) Mother’s Name = the line after candidate
    if result["candidate_name"] and uid_line_idx + 2 < len(lines):
        result["mother_name"] = lines[uid_line_idx + 2]

    # 5) Caste = the line after mother
    if result["mother_name"] and uid_line_idx + 3 < len(lines):
        result["caste"] = lines[uid_line_idx + 3]

    return result
