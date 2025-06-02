// src/App.jsx

import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';

import FormPage from './FormPage';
import ExtractPage from './ExtractPage';
import ExtractPanCard from './ExtractPanCard';
import MarksheetExtractor from './MarksheetExtractor';
import LivingCertificateExtractor from './LivingCertificateExtractor';
import ChatPage from './ChatPage';

function App() {
  const [formData, setFormData] = useState({
    name: '',
    aadhaarNumber: '',
    address: '',
    field3: '',
    field4: '',
    panNumber: '',
    fatherName: '',
    dob: '',
    motherName: '',
    percentage: '',
    subjects: []
  });

  return (
    <Routes>
      <Route
        path="/"
        element={<FormPage formData={formData} setFormData={setFormData} />}
      />
      <Route
        path="/extract"
        element={<ExtractPage formData={formData} setFormData={setFormData} />}
      />
      <Route
        path="/extract-pancard"
        element={<ExtractPanCard formData={formData} setFormData={setFormData} />}
      />
      <Route
        path="/extract-marksheet"
        element={<MarksheetExtractor formData={formData} setFormData={setFormData} />}
      />
      <Route
        path="/extract-living-certificate"
        element={<LivingCertificateExtractor />}
      />
      <Route
        path="/chat"
        element={<ChatPage />}
      />
    </Routes>
  );
}

export default App;

