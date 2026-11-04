import React, { useState } from 'react';
import { motion } from 'framer-motion';
import API from '../api';

export default function DocumentUploadModal({ open, onClose, userId, skill, onUploaded }) {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('aadhaar');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleFileChange = e => {
    const selected = e.target.files[0];
    if (selected && !['image/jpeg', 'image/png', 'image/jpg'].includes(selected.type)) {
      setError('Only JPG and PNG photographs are allowed.');
      setFile(null);
      return;
    }
    setError('');
    setFile(selected);
  };
  const handleDocType = e => setDocType(e.target.value);

  const handleUpload = async e => {
    e.preventDefault();
    if (!file) return setError('Please select a file');
    setUploading(true);
    setError('');
    setProgress(10);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', docType);
      formData.append('document_number', '');
      setProgress(40);
      await API.post(`/user-documents/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => setProgress(Math.round((e.loaded * 100) / e.total)),
      });
      setProgress(100);
      setTimeout(() => {
        setUploading(false);
        setFile(null);
        setProgress(0);
        onUploaded && onUploaded();
        onClose();
      }, 800);
    } catch (err) {
      setError('Upload failed');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative" initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
        <button className="absolute top-3 right-3 text-gray-400 hover:text-red-500" onClick={onClose}>✕</button>
        <h2 className="text-xl font-bold mb-4 text-primary">Upload Document</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select value={docType} onChange={handleDocType} className="w-full border rounded px-2 py-1">
              <option value="aadhaar">Aadhaar</option>
              <option value="pcc">Police Clearance Certificate</option>
              {skill?.skill === 'Driving' && <option value="license">Driving License</option>}
              <option value="certificate">Skill Certificate</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
            <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={handleFileChange} className="w-full" />
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button type="submit" className="w-full py-2 px-4 bg-primary hover:bg-blue-600 text-white font-semibold rounded-lg shadow transition" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
          {uploading && (
            <div className="w-full bg-gray-200 rounded h-2 mt-2 overflow-hidden">
              <motion.div className="bg-primary h-2 rounded" style={{ width: `${progress}%` }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
            </div>
          )}
        </form>
      </motion.div>
    </motion.div>
  );
} 