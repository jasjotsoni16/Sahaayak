import axios from 'axios';
// REACT_APP_BACKEND_URL includes the /api prefix; BACKEND_ORIGIN is the bare host (for /uploads etc.)
export const BACKEND_ORIGIN = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/api\/?$/, '');
const API = axios.create({ baseURL: process.env.REACT_APP_BACKEND_URL });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A 401 on a protected call means the token is missing/expired: clear it and go to login.
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const onAuthPage = ['/login', '/signup', '/admin/login'].includes(window.location.pathname);
    if (err.response?.status === 401 && !onAuthPage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const applyForJob = (seeker_id, job_id) => API.post('/applications', { seeker_id, job_id });
export const negotiateOffer = (userJobId, newTerms) => API.post('/user-jobs/negotiate', { userJob_id: userJobId, new_terms: newTerms });
export const recommendJob = (jobId, peerPhoneNumber) => API.post('/user-jobs/recommend', { job_id: jobId, peer_phone_number: peerPhoneNumber });
export const viewApplications = (jobId) => API.get(`/user-jobs/applications/${jobId}`);
export const makeOffer = (offerData) => API.post('/user-jobs/make-offer', offerData);
export const getOffersForSeeker = (seekerId) => API.get(`/offers/seeker/${seekerId}`);
export const getOffersForEmployer = (employerId) => API.get(`/offers/employer/${employerId}`);
export const acceptOffer = (offerId) => API.put(`/offers/${offerId}/accept`);
export const rejectOffer = (offerId) => API.put(`/offers/${offerId}/reject`);
export const counterOffer = (offerId, counterData) => API.put(`/offers/${offerId}/counter`, counterData);
export const getJobs = (params) => API.get('/jobs', { params });
export const createJob = (jobData) => API.post('/jobs', jobData);
export const getSkills = () => API.get('/skills');
export const getApplicationsBySeeker = (seekerId) => API.get(`/applications/seeker/${seekerId}`);
export const getUserById = (userId) => API.get(`/users/${userId}`);
export const getEmployerByUserId = (userId) => API.get(`/employer/user/${userId}`);
export const getJobsByEmployerId = (employerId) => API.get(`/jobs/employer/${employerId}/public`);
export const getCurrentJobs = (seekerId) => API.get(`/user-experiences/current-jobs/${seekerId}`);
export const leaveJob = (experienceId) => API.put(`/user-experiences/leave-job/${experienceId}`);

export const getHiredSeekers = (employerId) => API.get(`/user-experiences/hired-seekers/${employerId}`);
export const getArchivedSeekers = (employerId) => API.get(`/user-experiences/archived-seekers/${employerId}`);
export const submitRating = (ratingData) => API.post('/ratings', ratingData);
// Geocoding (public; used on signup)
export const searchPlaces = (q) => API.get('/geo/search', { params: { q } });
export const reverseGeocode = (lat, lng) => API.get('/geo/reverse', { params: { lat, lng } });

// Salary records (no money moves through Sahayak: employers record, employees confirm)
export const createSalaryAgreement = (data) => API.post('/salary', data);
export const getEmployerSalaryAgreements = () => API.get('/salary/employer');
export const getMySalaryAgreements = () => API.get('/salary/employee');
export const setSalaryAgreementStatus = (id, status) => API.put(`/salary/${id}/status`, { status });
export const recordSalaryPayment = (id, data = {}) => API.post(`/salary/${id}/payments`, data);
export const confirmSalaryPayment = (id, paymentId) => API.post(`/salary/${id}/payments/${paymentId}/confirm`);
export const disputeSalaryPayment = (id, paymentId, reason) => API.post(`/salary/${id}/payments/${paymentId}/dispute`, { reason });

// Savings goal (stored on the user profile)
export const updateSavingsGoal = (monthly_savings_goal) => API.put('/users/savings-goal', { monthly_savings_goal });

// Credit Score APIs
export const getCreditScore = () => API.get('/credit-scores');
export const updateCreditScore = () => API.put('/credit-scores');

// Loan APIs
export const createLoanApplication = (loanData) => API.post('/loans', loanData);

// Applications and agreements
export const updateApplicationStatus = (id, status) => API.put(`/applications/${id}`, { status });
export const getAgreement = (agreementId) => API.get(`/agreements/${agreementId}`);
export const signAgreement = (agreementId, userId, role) => API.put(`/agreements/${agreementId}/sign`, { userId, role });

// User profile and language APIs
export const getCurrentUser = () => API.get('/users/me');
export const updateLanguage = (language) => API.put('/users/update-language', { language });

// Assessment APIs
export const createSkillAssessment = (userId, skillId) => API.post('/assessments/create-skill-assessment', { user_id: userId, skill_id: skillId });
export const startAssessment = (assessmentId) => API.post(`/assessments/${assessmentId}/start`);
export const getFilteredAssessments = (filters) => API.get('/assessments/filtered', { params: filters });

export default API; 