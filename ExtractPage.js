import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ExtractPage({ setFormData }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extractedName, setExtractedName] = useState('');
  const [extractedAadhaar, setExtractedAadhaar] = useState('');
  const [responseText, setResponseText] = useState('');

  const navigate = useNavigate();

  // ★ ONLY change: enable Fill button only when model replied exactly "Y"
  const canFill = (extractedName || extractedAadhaar) && responseText === "Y";

  const onFileChange = e => {
    const f = e.target.files[0];
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
    setError('');
    setExtractedName('');
    setExtractedAadhaar('');
    setResponseText('');
  };

  const onExtract = async e => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image first');
      return;
    }
    setLoading(true);
    setError('');
    setExtractedName('');
    setExtractedAadhaar('');
    setResponseText('');

    try {
      // 1) OCR
      const fd = new FormData();
      fd.append('image', file);
      const extractRes = await fetch('http://localhost:5000/api/extract', {
        method: 'POST',
        body: fd
      });
      const body = await extractRes.json();
      if (!extractRes.ok) throw new Error(body.error || 'OCR failed');

      const name    = body.name?.trim();
      const aadhaar = body.aadhaar_number?.trim();

      if (!name && !aadhaar) {
        setError('No name or Aadhaar number found in OCR output');
        return;
      }
      if (name)    setExtractedName(name);
      if (aadhaar) setExtractedAadhaar(aadhaar);

      // 2) Classification: expect "Y" or "N"
      const classRes = await fetch('http://localhost:5000/api/classify-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const classBody = await classRes.json();
      if (!classRes.ok) throw new Error(classBody.error || 'Model call failed');

      setResponseText(classBody.response);
    } catch (err) {
      console.error('Error in extract/classify flow:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onFill = () => {
    setFormData(prev => ({
      ...prev,
      name: extractedName,
      aadhaarNumber: extractedAadhaar
    }));
    navigate('/');
  };

  return (
    <div className="container" style={{ maxWidth: 600, margin: '2rem auto', textAlign: 'center' }}>
      <h2>Extract & View Model Response</h2>
      <form onSubmit={onExtract}>
        <input
          type="file"
          accept="image/png, image/jpeg"
          onChange={onFileChange}
          className="form-control mb-3"
        />
        {preview && (
          <img
            src={preview}
            alt="preview"
            style={{ maxWidth: '100%', maxHeight: 300, margin: '1rem 0' }}
          />
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Processing…' : 'Extract & Query Model'}
        </button>
      </form>

      {error && <p style={{ color: 'crimson', marginTop: '1rem' }}>⚠️ {error}</p>}

      {(extractedName || extractedAadhaar) && (
        <div style={{ marginTop: '2rem', textAlign: 'left' }}>
          {extractedName && <p><strong>Extracted Name:</strong> {extractedName}</p>}
          {extractedAadhaar && <p><strong>Extracted Aadhaar Number:</strong> {extractedAadhaar}</p>}
          <p><strong>Model Response:</strong></p>
          <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: 4 }}>
            {responseText}
          </pre>
          <button
            className="btn btn-success"
            onClick={onFill}
            disabled={!canFill}
          >
            Fill into Form
          </button>
        </div>
      )}
    </div>
  );
}
