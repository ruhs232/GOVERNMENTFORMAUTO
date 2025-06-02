import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ExtractPanCard({ formData, setFormData }) {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Name verification
  const [verifyingName, setVerifyingName] = useState(false);
  const [nameVerified, setNameVerified] = useState(false);
  const [nameInvalid, setNameInvalid] = useState(false);

  // PAN verification
  const [verifyingPan, setVerifyingPan] = useState(false);
  const [panVerified, setPanVerified] = useState(false);
  const [panInvalid, setPanInvalid] = useState(false);

  const [error, setError] = useState('');

  const handleFileChange = e => {
    setFile(e.target.files[0]);
    setData(null);
    setNameVerified(false);
    setNameInvalid(false);
    setPanVerified(false);
    setPanInvalid(false);
    setError('');
  };

  const handleExtract = async e => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file first.');
      return;
    }
    setLoading(true);
    setError('');
    setData(null);
    setNameVerified(false);
    setNameInvalid(false);
    setPanVerified(false);
    setPanInvalid(false);

    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/vision-extract', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Extraction failed');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // improved name verification
  const handleVerifyName = async () => {
    if (!data?.name) return;
    setVerifyingName(true);
    setError('');
    setNameVerified(false);
    setNameInvalid(false);

    try {
      console.log('Verifying name:', data.name);
      const res = await fetch('/api/classify-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name })
      });
      const json = await res.json();
      console.log('API classify-name response:', json.response);
      const resp = String(json.response || '').trim().toUpperCase();
      if (!res.ok) throw new Error(resp || 'Name verification endpoint error');

      if (resp === 'Y') {
        setNameVerified(true);
        setNameInvalid(false);
      } else {
        setNameVerified(false);
        setNameInvalid(true);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setVerifyingName(false);
    }
  };

  // improved PAN verification
  const handleVerifyPan = async () => {
    if (!data?.pan_number) return;
    setVerifyingPan(true);
    setError('');
    setPanVerified(false);
    setPanInvalid(false);

    try {
      console.log('Verifying PAN:', data.pan_number);
      const res = await fetch('/api/classify-pan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pan_number: data.pan_number })
      });
      const json = await res.json();
      console.log('API classify-pan response:', json.response);
      const resp = String(json.response || '').trim().toUpperCase();
      if (!res.ok) throw new Error(resp || 'PAN verification endpoint error');

      if (resp === 'Y') {
        setPanVerified(true);
        setPanInvalid(false);
      } else {
        setPanVerified(false);
        setPanInvalid(true);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setVerifyingPan(false);
    }
  };

  const handleFillForm = () => {
    // compare formData.name & data.name similar to Aadhaar logic…
    const aadhaarName = (formData.name || '').trim();
    const panName     = (data.name || '').trim();
    if (!aadhaarName || !panName) {
      setError('Both Aadhaar name and PAN name must be present to compare.');
      return;
    }

    const aParts = aadhaarName.split(/\s+/);
    const pParts = panName.split(/\s+/);
    const firstMatch = aParts[0].toLowerCase() === pParts[0].toLowerCase();
    const lastMatch  = aParts[aParts.length - 1].toLowerCase() ===
                       pParts[pParts.length - 1].toLowerCase();

    if (!firstMatch || !lastMatch) {
      setError(
        `Name mismatch!\nAadhaar: "${aadhaarName}"\nPAN:     "${panName}".`
      );
      setFormData(prev => ({
        ...prev,
        panNumber: '',
        fatherName: '',
        dob: ''
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      panNumber:   data.pan_number,
      fatherName:  data.father_name,
      dob:         data.dob
    }));
    navigate('/');
  };

  return (
    <div className="container" style={{ maxWidth: 500, margin: '2rem auto' }}>
      <h2>PAN Card Extraction & Verification</h2>

      <form onSubmit={handleExtract}>
        <div className="mb-3">
          <label htmlFor="panImage">Upload PAN Image</label>
          <input
            type="file"
            id="panImage"
            className="form-control"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? 'Extracting…' : 'Extract & Parse'}
        </button>
      </form>

      {error && (
        <div className="alert alert-danger mt-3">
          {error.split('\n').map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}

      {data && (
        <div className="mt-4">
          <h5>Full Extracted Text:</h5>
          <pre style={{
            whiteSpace: 'pre-wrap',
            background: '#f8f9fa',
            padding: '1rem',
            borderRadius: '4px'
          }}>
            {data.extracted_text}
          </pre>

          <h5 className="mt-4">Parsed Details:</h5>
          <ul>
            <li><strong>PAN Number:</strong> {data.pan_number}</li>
            <li><strong>Name:</strong> {data.name}</li>
            <li><strong>Father's Name:</strong> {data.father_name}</li>
            <li><strong>Date of Birth:</strong> {data.dob}</li>
          </ul>

          <div className="d-grid gap-2 mt-3">
            <button
              className={`btn btn-outline-success ${nameVerified ? 'btn-success' : nameInvalid ? 'btn-danger' : ''}`}
              onClick={handleVerifyName}
              disabled={verifyingName || nameVerified}
            >
              {verifyingName
                ? 'Verifying Name…'
                : nameVerified
                  ? 'Name Verified ✅'
                  : nameInvalid
                    ? 'Invalid Name ❌'
                    : 'Verify Name'}
            </button>

            <button
              className={`btn btn-outline-success ${panVerified ? 'btn-success' : panInvalid ? 'btn-danger' : ''}`}
              onClick={handleVerifyPan}
              disabled={!nameVerified || verifyingPan || panVerified}
            >
              {verifyingPan
                ? 'Verifying PAN…'
                : panVerified
                  ? 'PAN Verified ✅'
                  : panInvalid
                    ? 'Invalid PAN ❌'
                    : 'Verify PAN'}
            </button>
          </div>

          {nameVerified && panVerified && (
            <button
              className="btn btn-success mt-3 w-100"
              onClick={handleFillForm}
            >
              Fill Form
            </button>
          )}
        </div>
      )}
    </div>
  );
}
