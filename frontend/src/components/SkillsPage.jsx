import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useDbTranslation } from '../utils/translationHelpers';
import API, { BACKEND_ORIGIN } from '../api';
import DocumentUploadModal from './DocumentUploadModal';
import AssessmentModal from './AssessmentModal';
import { useRef } from 'react';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import Modal from '../ui/Modal';
import { Input, Select } from '../ui/Field';
import { useConfirm } from '../ui/ConfirmDialog';

export default function SkillsPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { currentLanguage } = useLanguage();
  const { translateUserRole } = useDbTranslation();
  const user = JSON.parse(localStorage.getItem('user'));
  const [skills, setSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [form, setForm] = useState({ skill: '', category: [], experience: 0 });
  const [showAdd, setShowAdd] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDocModal, setShowDocModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [activeSkill, setActiveSkill] = useState(null);
  const [assessmentResults, setAssessmentResults] = useState({});
  const [documents, setDocuments] = useState([]);
  const [docUploading, setDocUploading] = useState(false);
  const [docError, setDocError] = useState('');
  const [docType, setDocType] = useState('aadhaar');
  const [docFile, setDocFile] = useState(null);
  const dropRef = useRef();

  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (!user) return window.location.href = '/login';
    fetchSkills();
    API.get('/skills').then(res => setAllSkills(res.data));
    fetchDocuments();
    fetchAssessmentResults();
    // eslint-disable-next-line
  }, []); // Only run once on mount

  const fetchSkills = () => {
    API.get(`/user-skills/${user._id}`)
      .then(res => {
        setSkills(res.data.map(s => ({
          ...s,
          color: s.skill_id?.color || '#3b82f6',
          skill: s.skill_id?.name || '',
          category: s.category || []
        })));
        setShowAdd(res.data.length === 0);
      })
      .catch(() => setError(t('skills.failedToLoadSkills') || 'Failed to load skills'));
  };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleCategoryCheckboxChange = (e) => {
    const value = e.target.value;
    setForm(prev => ({
      ...prev,
      category: prev.category.includes(value)
        ? prev.category.filter(c => c !== value)
        : [...prev.category, value]
    }));
  };

  const handleAddSkill = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await API.post(`/user-skills/${user._id}`, {
        skill_id: form.skill, // This is now the ObjectId
        proficiency: '',
        experience_years: form.experience,
        category: form.category,
      });
      fetchSkills();
      setShowAdd(false);
    } catch (err) {
      setError(t('skills.failedToAddSkill') || 'Failed to add skill');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSkill = async (userSkillId) => {
    const ok = await confirm({
      title: t('skills.deleteSkillQuestion', { defaultValue: 'Delete skill?' }),
      message: t('skills.deleteSkillConfirmation', { defaultValue: 'Are you sure you want to delete this skill? This action cannot be undone.' }),
      confirmLabel: t('common.delete', { defaultValue: 'Delete' }),
      cancelLabel: t('common.cancel', { defaultValue: 'Cancel' }),
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await API.delete(`/user-skills/delete-skill/${userSkillId}`);
      fetchSkills(); // Refresh the skills list
    } catch (err) {
      setError(t('skills.failedToDeleteSkill') || 'Failed to delete skill');
    }
  };

  const handleOpenDocModal = skill => {
    setActiveSkill(skill);
    setShowDocModal(true);
  };
  const handleOpenAssessmentModal = skill => {
    setActiveSkill(skill);
    setShowAssessmentModal(true);
  };

  const fetchAssessmentResults = async () => {
    try {
      const response = await API.get(`/assessments/user/${user._id}`);
      const results = {};
      response.data.forEach(assessment => {
        if (assessment.status === 'completed') {
          results[assessment.skill_id._id] = {
            percentage: assessment.percentage,
            score: assessment.correct_answers,
            total: assessment.total_questions,
            completed_at: assessment.completed_at
          };
        }
      });
      setAssessmentResults(results);
    } catch (error) {
      console.error('Error fetching assessment results:', error);
    }
  };

  const selectedSkillObj = allSkills.find(s => s._id === form.skill);
  const categories = selectedSkillObj && selectedSkillObj.category ? selectedSkillObj.category : [];

  // Add a helper to check if driving license is uploaded for a skill
  const hasDrivingLicense = (skill) => {
    if (skill.skill !== 'Driving') return true;
    if (!skill.documents) return false;
    return skill.documents.some(doc => doc.type === 'driving_license');
  };

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      const res = await API.get(`/user-documents/${user._id}`);
      setDocuments(res.data);
    } catch {
      setDocuments([]);
    }
  };

  // Drag and drop handlers
  const handleDrop = e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && !['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setDocError('Only JPG and PNG photographs are allowed.');
      setDocFile(null);
      return;
    }
    setDocError('');
    setDocFile(file);
  };
  const handleDragOver = e => e.preventDefault();
  const handleDocFileChange = e => {
    const file = e.target.files[0];
    if (file && !['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setDocError('Only JPG and PNG photographs are allowed.');
      setDocFile(null);
      return;
    }
    setDocError('');
    setDocFile(file);
  };
  const handleDocTypeChange = e => setDocType(e.target.value);

  const handleDocUpload = async e => {
    e.preventDefault();
    if (!docFile) return setDocError('Please select a file');
    setDocUploading(true);
    setDocError('');
    try {
      const formData = new FormData();
      formData.append('file', docFile);
      formData.append('document_type', docType);
      formData.append('document_number', '');
      await API.post(`/user-documents/${user._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocFile(null);
      fetchDocuments();
    } catch {
      setDocError('Upload failed');
    } finally {
      setDocUploading(false);
    }
  };

  // Determine required documents
  const hasDriving = skills.some(s => (s.skill || '').toLowerCase() === 'driving');
  const requiredDocs = ['aadhaar', 'pcc'];
  if (hasDriving) requiredDocs.push('license');
  const docLabels = { aadhaar: 'Aadhaar', pcc: 'Police Clearance Certificate', license: 'Driving License', certificate: 'Skill Certificate' };
  const uploadedTypes = documents.map(d => d.document_type);
  const missingDocs = requiredDocs.filter(type => !uploadedTypes.includes(type));

  const hasPendingAssessments = skills.some((sk) => sk.assessment_status === 'pending');

  const assessmentTone = (skill) => {
    if (skill.assessment_status === 'pending') return 'border-warning text-warning';
    if (skill.assessment_status === 'passed') return 'border-success text-success';
    if (skill.assessment_status === 'failed') return 'border-danger text-danger';
    return '';
  };
  const assessmentLabel = (skill) => {
    if (skill.assessment_status === 'passed') return t('skills.assessmentPassed', { defaultValue: 'Assessment passed' });
    if (skill.assessment_status === 'failed') return t('skills.assessmentFailed', { defaultValue: 'Assessment failed' });
    return t('skills.takeAssessment', { defaultValue: 'Take assessment' });
  };
  const assessmentBlocked = (skill) =>
    (skill.assessment_status !== 'pending' && !skill.is_verified) || (skill.skill === 'Driving' && !hasDrivingLicense(skill));
  const startAssessment = (skill) => {
    if (skill.skill === 'Driving' && !hasDrivingLicense(skill)) {
      setError(t('skills.uploadDrivingLicenseError') || 'Please upload your Driving License to proceed with assessment.');
      return;
    }
    // Allow assessment if it's pending (job-required) or if the skill is verified
    if (skill.assessment_status === 'pending' || skill.is_verified) handleOpenAssessmentModal(skill);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title={t('skills.mySkills', { defaultValue: 'My skills' })}
        action={!showAdd && skills.length > 0 ? (
          <Button variant="secondary" onClick={() => setShowAdd(true)}>+ {t('skills.addAnotherSkill', { defaultValue: 'Add another skill' })}</Button>
        ) : null}
      />

      {hasPendingAssessments && (
        <div role="status" className="rounded-xl bg-warning-tint px-4 py-3 text-sm text-warning">
          <strong>{t('skills.assessmentRequired', { defaultValue: 'Assessment required!' })}</strong>{' '}
          {t('skills.pendingAssessmentMessage', { defaultValue: 'You have pending assessments for job requirements. Complete them to proceed with your applications.' })}
        </div>
      )}

      {error && <p role="alert" className="rounded-xl bg-danger-tint px-4 py-3 text-sm text-danger">{error}</p>}

      {showAdd ? (
        <Card title={t('skills.addSkill', { defaultValue: 'Add a skill' })}>
          <form onSubmit={handleAddSkill} className="space-y-4">
            <Select label={t('skills.skill', { defaultValue: 'Skill' })} name="skill" value={form.skill} onChange={handleChange} required>
              <option value="">{t('skills.selectSkill', { defaultValue: 'Select skill' })}</option>
              {allSkills.map((sk) => <option key={sk._id} value={sk._id}>{sk.name}</option>)}
            </Select>
            {categories.length > 0 && (
              <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-ink">{t('common.category', { defaultValue: 'Category' })}</legend>
                <div className="grid grid-cols-2 gap-1">
                  {categories.map((cat) => (
                    <label key={cat} className="flex min-h-[44px] items-center gap-3 text-sm text-ink">
                      <input type="checkbox" name="category" value={cat} checked={form.category.includes(cat)}
                        onChange={handleCategoryCheckboxChange} className="h-5 w-5 accent-primary" />
                      {cat}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <Input label={t('skills.yearsOfExperience', { defaultValue: 'Years of experience' })} name="experience" type="number" min={0}
              value={form.experience} onChange={handleChange} />
            <div className="flex gap-2">
              <Button type="submit" loading={loading}>
                {loading ? t('skills.adding', { defaultValue: 'Adding…' }) : t('skills.addSkill', { defaultValue: 'Add skill' })}
              </Button>
              {skills.length > 0 && <Button variant="secondary" onClick={() => setShowAdd(false)}>{t('common.cancel', { defaultValue: 'Cancel' })}</Button>}
            </div>
          </form>
        </Card>
      ) : skills.length === 0 ? (
        <Card><EmptyState title={t('skills.noSkillsAdded', { defaultValue: 'No skills added yet.' })} /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {skills.map((skill) => (
            <Card key={skill._id} as="article">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-ink">{skill.skill}</h3>
                  <p className="text-sm text-muted">
                    {Array.isArray(skill.category) && skill.category.length > 0 ? skill.category.join(', ') : skill.category}
                  </p>
                </div>
                <Badge tone={skill.is_verified ? 'success' : 'warning'}>
                  {skill.is_verified ? t('skills.verified', { defaultValue: 'Verified' }) : t('skills.pending', { defaultValue: 'Pending' })}
                </Badge>
              </div>

              <p className="mt-2 text-sm text-ink">
                {t('skills.exp', { defaultValue: 'Experience' })}: {skill.experience_years} {t('skills.yrs', { defaultValue: 'yrs' })}
              </p>

              <div className="mt-3">
                <p className="mb-1 text-xs text-muted">{t('skills.requiredDocuments', { defaultValue: 'Required documents' })}</p>
                <ul className="list-disc space-y-0.5 pl-5 text-xs text-ink">
                  <li>{t('skills.aadhaar', { defaultValue: 'Aadhaar' })}</li>
                  <li>{t('skills.policeClearanceCertificate', { defaultValue: 'Police Clearance Certificate' })}</li>
                  {(skill.skill || '').toLowerCase() === 'driving' && <li>{t('skills.drivingLicense', { defaultValue: 'Driving License' })}</li>}
                </ul>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" className={assessmentTone(skill)} disabled={assessmentBlocked(skill)} onClick={() => startAssessment(skill)}>
                  {assessmentLabel(skill)}
                </Button>
                <Button size="sm" variant="ghost" className="text-danger hover:bg-danger-tint" onClick={() => handleDeleteSkill(skill._id)}>
                  {t('common.delete', { defaultValue: 'Delete' })}
                </Button>
              </div>
              {skill.skill === 'Driving' && !hasDrivingLicense(skill) && (
                <p className="mt-2 text-xs text-danger">{t('skills.drivingLicenseMandatory', { defaultValue: 'Driving License upload is mandatory for the Driving skill.' })}</p>
              )}

              {assessmentResults[skill.skill_id?._id] && (
                <div className="mt-4 rounded-xl bg-success-tint p-3 text-sm text-success">
                  <p className="font-semibold">{t('assessment.lastScore', { defaultValue: 'Last score' })}: {assessmentResults[skill.skill_id._id].percentage}%</p>
                  <p className="text-xs">
                    {assessmentResults[skill.skill_id._id].score}/{assessmentResults[skill.skill_id._id].total} {t('assessment.correct', { defaultValue: 'correct' })}
                    {' · '}{t('assessment.completedOn', { defaultValue: 'Completed on' })} {new Date(assessmentResults[skill.skill_id._id].completed_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Card title={t('skills.documents', { defaultValue: 'Documents' })}>
        <form onSubmit={handleDocUpload} className="space-y-4">
          <div
            ref={dropRef} role="button" tabIndex={0} onDrop={handleDrop} onDragOver={handleDragOver}
            onClick={() => dropRef.current.querySelector('input[type=file]').click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dropRef.current.querySelector('input[type=file]').click(); } }}
            className="flex min-h-[96px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line p-4 text-center transition-colors hover:border-primary"
          >
            <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={handleDocFileChange} className="hidden" />
            {docFile
              ? <span className="font-medium text-success">{docFile.name}</span>
              : <span className="text-muted">{t('skills.dragDropPhoto', { defaultValue: 'Drag and drop a photo here, or tap to choose one' })}</span>}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[12rem] flex-1">
              <Select label={t('common.type', { defaultValue: 'Document type' })} value={docType} onChange={handleDocTypeChange}>
                <option value="aadhaar">{t('skills.aadhaar', { defaultValue: 'Aadhaar' })}</option>
                <option value="pcc">{t('skills.policeClearanceCertificate', { defaultValue: 'Police Clearance Certificate' })}</option>
                {hasDriving && <option value="license">{t('skills.drivingLicense', { defaultValue: 'Driving License' })}</option>}
                <option value="certificate">{t('skills.skillCertificate', { defaultValue: 'Skill Certificate' })}</option>
              </Select>
            </div>
            <Button type="submit" loading={docUploading}>
              {docUploading ? t('skills.uploading', { defaultValue: 'Uploading…' }) : t('skills.upload', { defaultValue: 'Upload' })}
            </Button>
          </div>
          {docError && <p role="alert" className="text-sm text-danger">{docError}</p>}
        </form>

        <div className="mt-6">
          <h4 className="mb-2 text-sm font-semibold text-ink">{t('skills.uploadedDocuments', { defaultValue: 'Uploaded documents' })}</h4>
          {documents.length === 0 ? (
            <p className="text-sm text-muted">{t('skills.noDocumentsUploaded', { defaultValue: 'No documents uploaded yet.' })}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {documents.map((doc) => (
                <li key={doc._id}>
                  <button type="button" onClick={() => setSelectedImage(`${BACKEND_ORIGIN}/${doc.file_url}`)}
                    className="flex w-full flex-col items-center gap-1 rounded-xl border border-line p-2 text-center hover:bg-page">
                    <img src={`${BACKEND_ORIGIN}/${doc.file_url}`} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    <span className="text-xs font-medium text-ink">{docLabels[doc.document_type] || doc.document_type}</span>
                    <Badge tone={doc.verified ? 'success' : 'warning'}>
                      {doc.verified ? t('skills.verified', { defaultValue: 'Verified' }) : t('skills.pending', { defaultValue: 'Pending' })}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {missingDocs.length > 0 && (
          <div className="mt-4 rounded-xl bg-warning-tint p-3 text-sm text-warning">
            <p className="mb-1 font-medium">{t('skills.pleaseUploadToGetVerified', { defaultValue: 'Please upload these to get verified' })}:</p>
            <ul className="list-disc pl-5">{missingDocs.map((type) => <li key={type}>{docLabels[type]}</li>)}</ul>
          </div>
        )}
      </Card>

      <Modal open={!!selectedImage} onClose={() => setSelectedImage(null)} size="lg" title={t('skills.documents', { defaultValue: 'Documents' })}>
        {selectedImage && <img src={selectedImage} alt="" className="mx-auto max-h-[70vh] max-w-full" />}
      </Modal>

      <DocumentUploadModal
        open={showDocModal}
        onClose={() => setShowDocModal(false)}
        userId={user._id}
        skill={activeSkill}
        onUploaded={fetchSkills}
      />
      <AssessmentModal
        open={showAssessmentModal}
        onClose={() => setShowAssessmentModal(false)}
        userId={user._id}
        skill={activeSkill}
        onCompleted={() => {
          fetchSkills();
          fetchAssessmentResults();
        }}
      />
    </div>
  );
}
