// MarksheetExtractor.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MarksheetExtractor({ formData, setFormData }) {
  const navigate = useNavigate();

  // Raw OCR states
  const [marksFile, setMarksFile] = useState(null);
  const [marksText, setMarksText] = useState('');
  const [barcodes, setBarcodes] = useState([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const [error, setError] = useState('');

  // Parsed data
  const [structured, setStructured] = useState(null);

  // Verification states
  const [verifyingCandidate, setVerifyingCandidate] = useState(false);
  const [candidateVerified, setCandidateVerified] = useState(false);
  const [candidateInvalid, setCandidateInvalid] = useState(false);

  const [verifyingMother, setVerifyingMother] = useState(false);
  const [motherVerified, setMotherVerified] = useState(false);
  const [motherInvalid, setMotherInvalid] = useState(false);

  // Handlers
  const onMarksChange = e => {
    setMarksFile(e.target.files[0]);
    setMarksText('');
    setStructured(null);
    setBarcodes([]);
    setError('');
    setCandidateVerified(false);
    setCandidateInvalid(false);
    setMotherVerified(false);
    setMotherInvalid(false);
  };

  const onMarksSubmit = async e => {
    e.preventDefault();
    if (!marksFile) {
      setError('Please select a marksheet image.');
      return;
    }
    setMarksLoading(true);
    setError('');

    const body = new FormData();
    body.append('image', marksFile);

    try {
      const res = await fetch('/api/marksheet-extract', {
        method: 'POST',
        body
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Extraction failed');

      setMarksText(json.extracted_text);
      setBarcodes(json.barcodes || []);
      setStructured(json.structured_data);
      setCandidateVerified(false);
      setCandidateInvalid(false);
      setMotherVerified(false);
      setMotherInvalid(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setMarksLoading(false);
    }
  };

  // Improved verify handler with trimming, uppercasing, and logging
  const handleVerify = async which => {
    if (!structured) return;
    const nameKey = which === 'candidate' ? 'candidate_name' : 'mother_name';
    const nameToCheck = structured[nameKey];
    if (!nameToCheck) {
      setError(`No ${which} name extracted to verify.`);
      return;
    }

    const setLoading = which === 'candidate'
      ? setVerifyingCandidate
      : setVerifyingMother;
    const setOK      = which === 'candidate'
      ? setCandidateVerified
      : setMotherVerified;
    const setBad     = which === 'candidate'
      ? setCandidateInvalid
      : setMotherInvalid;

    // reset
    setLoading(true);
    setOK(false);
    setBad(false);
    setError('');

    try {
      console.log(`Verifying ${which} name:`, nameToCheck);
      const res = await fetch('/api/classify-name', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ name: nameToCheck })
      });
      const json = await res.json();
      console.log('API classify-name response:', json.response);
      const resp = String(json.response || '').trim().toUpperCase();

      if (!res.ok) {
        throw new Error(resp || 'Verification endpoint error');
      }

      if (resp === 'Y') {
        setOK(true);
        setBad(false);
      } else {
        setOK(false);
        setBad(true);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFillForm = () => {
    // Defensive checks
    if (!formData) {
      setError('Main form data is not available.');
      return;
    }
    if (!formData.name) {
      setError('Please fill in the Name field in the main form before verifying.');
      return;
    }
    if (!structured?.candidate_name) {
      setError('No extracted candidate name to compare.');
      return;
    }

    // Rotate surname-first
    const parts = structured.candidate_name.split(/\s+/);
    if (parts.length < 2) {
      setError('Cannot rotate extracted name for comparison.');
      return;
    }
    const rotated = [...parts.slice(1), parts[0]].join(' ').toLowerCase().trim();
    const formName = formData.name.toLowerCase().trim();

    if (rotated !== formName) {
      setError(`Name mismatch!\nForm: "${formData.name}"\nExtracted: "${rotated}"`);
      return;
    }

    // Fill extra fields and navigate back
    setFormData(prev => ({
      ...prev,
      motherName:  structured.mother_name,
      percentage:  structured.percentage,
      subjects:    structured.subjects
    }));
    navigate('/');
  };

  return (
    <div className="container" style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h2>Marksheet Extraction & Barcode Scan</h2>

      <form onSubmit={onMarksSubmit}>
        <div className="mb-3">
          <label className="form-label">Upload Marksheet</label>
          <input
            type="file"
            accept="image/*"
            className="form-control"
            onChange={onMarksChange}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary mb-4"
          disabled={marksLoading}
        >
          {marksLoading ? 'Extracting Text…' : 'Extract Marksheet Text'}
        </button>
      </form>

      {marksText && (
        <div className="mb-5">
          <h5>Extracted Text:</h5>
          <pre style={{
            whiteSpace: 'pre-wrap',
            background: '#f8f9fa',
            padding: '1rem',
            borderRadius: '4px'
          }}>
            {marksText}
          </pre>
        </div>
      )}

      {structured && (
        <div className="mb-5">
          <h5>Parsed Fields</h5>
          <p><strong>Candidate Name:</strong> {structured.candidate_name}</p>
          <p><strong>Mother's Name:</strong> {structured.mother_name}</p>

          <h6>Subjects & Marks</h6>
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Subject</th><th>Obtained</th><th>Max</th>
              </tr>
            </thead>
            <tbody>
              {structured.subjects.map((s, i) => (
                <tr key={i}>
                  <td>{s.subject}</td>
                  <td>{s.marks_obtained}</td>
                  <td>{s.max_marks}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p><strong>Percentage:</strong> {structured.percentage}%</p>
          <p><strong>Result:</strong> {structured.result}</p>
        </div>
      )}

      {structured && (
        <div className="mb-4">
          <button
            className={`btn btn-sm me-2 ${
              candidateVerified ? 'btn-success'
              : candidateInvalid ? 'btn-danger'
              : 'btn-outline-secondary'
            }`}
            onClick={() => handleVerify('candidate')}
            disabled={verifyingCandidate || candidateVerified}
          >
            {verifyingCandidate
              ? 'Verifying…'
              : candidateVerified
                ? 'Candidate ✓'
                : candidateInvalid
                  ? 'Candidate ✗'
                  : 'Verify Candidate Name'}
          </button>

          <button
            className={`btn btn-sm me-2 ${
              motherVerified ? 'btn-success'
              : motherInvalid ? 'btn-danger'
              : 'btn-outline-secondary'
            }`}
            onClick={() => handleVerify('mother')}
            disabled={verifyingMother || motherVerified}
          >
            {verifyingMother
              ? 'Verifying…'
              : motherVerified
                ? 'Mother ✓'
                : motherInvalid
                  ? 'Mother ✗'
                  : 'Verify Mother Name'}
          </button>

          <button
            className="btn btn-primary"
            disabled={!(candidateVerified && motherVerified)}
            onClick={handleFillForm}
          >
            Fill Main Form
          </button>
        </div>
      )}

      {barcodes.length > 0 && (
        <div className="mb-4">
          <h5>Decoded Barcode{barcodes.length > 1 ? 's' : ''}:</h5>
          <ul>
            {barcodes.map((bc, i) => (
              <li key={i}>
                <strong>{bc.format}</strong>: {bc.value}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!marksLoading && marksFile && barcodes.length === 0 && !error && (
        <div className="alert alert-warning">
          No barcode detected in that image.
        </div>
      )}

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      <button
        className="btn btn-secondary mt-3"
        onClick={() => navigate('/')}
      >
        Back to Form
      </button>
    </div>
  );
}
