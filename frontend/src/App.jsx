import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

import ProtectedRoute from './components/ProtectedRoute';
import SignupPage from './components/SignupPage';
import LoginPage from './components/LoginPage';
import SkillsPage from './components/SkillsPage';
import SalaryPage from './components/SalaryPage';
import HomePage from './components/HomePage';
import SeekerDashboard from './components/SeekerDashboard';
import ProfilePage from './components/ProfilePage';
import AppShell from './shell/AppShell';
import { Toaster } from './ui/Toast';
import { ConfirmProvider } from './ui/ConfirmDialog';
import InvestmentAnalyzer from './components/InvestmentAnalyzer';
import EmployerProfilePage from './components/EmployerProfilePage';
import EmployerDashboard from './components/EmployerDashboard';
import JobSeekerActions from './components/JobSeekerActions';
import JobProviderActions from './components/JobProviderActions';
import JobsPage from './components/JobsPage';
import PostJobPage from './components/PostJobPage';
import MapScreen from './components/MapScreen';
import SahaayakDashboard from './components/SahaayakDashboard';
import ToolDetailsPage from './components/ToolDetailsPage';
import ToolSharingDashboard from './components/ToolSharingDashboard';
import LoanSuggestionPage from './components/LoanSuggestionPage';
import InvestorProposalPage from './components/InvestorProposalPage';
import InvestorProfileSetup from './components/InvestorProfileSetup';
import LoanDisbursalManagement from './components/LoanDisbursalManagement';
import InvestorProposalReview from './components/InvestorProposalReview';
import MyLoanOffersPage from './components/MyLoanOffersPage';
import AdminDashboard from './components/AdminDashboard';
import InvestmentOpportunitiesPage from './components/InvestmentOpportunitiesPage';
import ReportAbusePage from './components/ReportAbusePage';
import AdminReportReview from './components/AdminReportReview';
import LoanDashboard from './components/LoanDashboard';
import AdminLoginPage from './components/AdminLoginPage';
import CreditScorePage from './components/CreditScorePage';
import EmployerAgreementsPage from './components/EmployerAgreementsPage';
import UnauthorizedPage from './components/UnauthorizedPage';
import NotificationPage from './components/NotificationPage';
import JobRecommendations from './components/JobRecommendations';

import './i18n';

function AppContent() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['seeker']}><SeekerDashboard /></ProtectedRoute>} />
        <Route path="/skills" element={<ProtectedRoute allowedRoles={['seeker']}><SkillsPage /></ProtectedRoute>} />
        <Route path="/salary" element={<ProtectedRoute allowedRoles={['seeker', 'provider']}><SalaryPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['seeker', 'provider', 'investor']}><ProfilePage /></ProtectedRoute>} />
        <Route path="/investment-analyzer" element={<ProtectedRoute allowedRoles={['seeker', 'investor']}><InvestmentAnalyzer /></ProtectedRoute>} />
        <Route path="/employer-profile" element={<ProtectedRoute allowedRoles={['provider']}><EmployerProfilePage /></ProtectedRoute>} />
        <Route path="/employer-dashboard" element={<ProtectedRoute allowedRoles={['provider']}><EmployerDashboard /></ProtectedRoute>} />
        <Route path="/job-seeker-actions" element={<ProtectedRoute allowedRoles={['seeker']}><JobSeekerActions /></ProtectedRoute>} />
        <Route path="/job-provider-actions" element={<ProtectedRoute allowedRoles={['provider']}><JobProviderActions /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute allowedRoles={['seeker', 'provider']}><JobsPage /></ProtectedRoute>} />
        <Route path="/post-job" element={<ProtectedRoute allowedRoles={['provider']}><PostJobPage /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute allowedRoles={['seeker', 'provider']}><MapScreen /></ProtectedRoute>} />
        <Route path="/sahaayak-dashboard" element={<ProtectedRoute allowedRoles={['seeker', 'provider']}><SahaayakDashboard /></ProtectedRoute>} />
        <Route path="/tool/:id" element={<ProtectedRoute allowedRoles={['seeker', 'provider']}><ToolDetailsPage /></ProtectedRoute>} />
        <Route path="/tool-sharing" element={<ProtectedRoute allowedRoles={['seeker', 'provider']}><ToolSharingDashboard /></ProtectedRoute>} />
        <Route path="/loan-suggestions" element={<ProtectedRoute allowedRoles={['seeker']}><LoanSuggestionPage /></ProtectedRoute>} />
        <Route path="/investor-proposal" element={<ProtectedRoute allowedRoles={['seeker']}><InvestorProposalPage /></ProtectedRoute>} />
        <Route path="/investor-setup" element={<ProtectedRoute allowedRoles={['investor']}><InvestorProfileSetup /></ProtectedRoute>} />
        <Route path="/loan-disbursal" element={<ProtectedRoute allowedRoles={['provider']}><LoanDisbursalManagement /></ProtectedRoute>} />
        <Route path="/investor-review" element={<ProtectedRoute allowedRoles={['investor']}><InvestorProposalReview /></ProtectedRoute>} />
        <Route path="/my-loan-offers" element={<ProtectedRoute allowedRoles={['seeker']}><MyLoanOffersPage /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/investment-opportunities" element={<ProtectedRoute allowedRoles={['investor']}><InvestmentOpportunitiesPage /></ProtectedRoute>} />
        <Route path="/loan-dashboard" element={<ProtectedRoute allowedRoles={['provider']}><LoanDashboard /></ProtectedRoute>} />
        <Route path="/report-abuse" element={<ProtectedRoute allowedRoles={['seeker', 'provider']}><ReportAbusePage /></ProtectedRoute>} />
        <Route path="/admin/report-review" element={<ProtectedRoute allowedRoles={['admin']}><AdminReportReview /></ProtectedRoute>} />
        <Route path="/credit-score" element={<ProtectedRoute allowedRoles={['seeker']}><CreditScorePage /></ProtectedRoute>} />
        <Route path="/employer-agreements" element={<ProtectedRoute allowedRoles={['provider']}><EmployerAgreementsPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute allowedRoles={['seeker', 'provider']}><NotificationPage /></ProtectedRoute>} />
        <Route path="/job-recommendations" element={<ProtectedRoute allowedRoles={['seeker']}><JobRecommendations /></ProtectedRoute>} />

        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ConfirmProvider>
          <Router>
            <AppContent />
          </Router>
          <Toaster />
        </ConfirmProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;