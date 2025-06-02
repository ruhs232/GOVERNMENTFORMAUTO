// src/FormPage.jsx

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUser,
  FaAddressCard,
  FaBook,
  FaMale,
  FaFemale,
  FaBirthdayCake
} from 'react-icons/fa';

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
    backgroundColor: '#f5f5f5'
  },
  formContainer: {
    width: '100%',
    maxWidth: 900,
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '0.5rem'
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    marginLeft: '0.5rem'
  },
  textarea: {
    width: '100%',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '0.5rem',
    resize: 'none'
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1rem'
  },
  button: {
    padding: '0.75rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: '#fff',
    fontWeight: 'bold'
  }
};

export default function FormPage({ formData, setFormData }) {
  const navigate = useNavigate();

  useEffect(() => {
    const lc = sessionStorage.getItem('lc_result');
    if (lc) {
      const { caste } = JSON.parse(lc);
      setFormData(prev => ({ ...prev, caste: caste || '' }));
      sessionStorage.removeItem('lc_result');
    }
  }, [setFormData]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <h2>Job Application for Assistant Clerk</h2>

        <div>
          <div style={styles.inputGroup}>
            <FaUser />
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              type="text"
              placeholder="Name"
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <FaAddressCard />
            <input
              name="aadhaarNumber"
              value={formData.aadhaarNumber}
              onChange={handleChange}
              type="text"
              placeholder="Aadhaar Number"
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <input
              name="panNumber"
              value={formData.panNumber || ''}
              onChange={handleChange}
              type="text"
              placeholder="PAN Number"
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <FaMale />
            <input
              name="fatherName"
              value={formData.fatherName || ''}
              onChange={handleChange}
              type="text"
              placeholder="Father's Name"
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <FaBirthdayCake />
            <input
              name="dob"
              value={formData.dob || ''}
              onChange={handleChange}
              type="text"
              placeholder="Date of Birth"
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <FaFemale />
            <input
              name="motherName"
              value={formData.motherName || ''}
              onChange={handleChange}
              type="text"
              placeholder="Mother's Name"
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <input
              name="caste"
              value={formData.caste || ''}
              onChange={handleChange}
              type="text"
              placeholder="Caste"
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <FaBook />
            <input
              name="subjects"
              value={JSON.stringify(formData.subjects || [], null, 2)}
              readOnly
              type="text"
              placeholder="Subjects (JSON)"
              style={styles.input}
            />
          </div>
          <div>
            <textarea
              name="percentage"
              value={formData.percentage || ''}
              onChange={handleChange}
              placeholder="Percentage"
              style={styles.textarea}
              rows={3}
            />
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button style={styles.button} onClick={() => navigate('/extract')}>
            Extract Aadhaar Text
          </button>
          <button style={styles.button} onClick={() => navigate('/extract-pancard')}>
            Extract PAN Details
          </button>
          <button style={styles.button} onClick={() => navigate('/extract-marksheet')}>
            Extract Marksheet
          </button>
          <button style={styles.button} onClick={() => navigate('/extract-living-certificate')}>
            Extract Living Certificate
          </button>
          <button style={styles.button} onClick={() => navigate('/chat')}>
            Chat with RAG Bot
          </button>
        </div>
      </div>
    </div>
  );
}
