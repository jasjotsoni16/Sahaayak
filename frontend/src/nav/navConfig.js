// The single source of truth for navigation. The top bar and the bottom tab bar both render from this.
// `key` is the i18n key, `label` the English default used when a translation is missing.
const item = (to, key, label, icon) => ({ to, key: `navigation.${key}`, label, icon });

const NAV = {
  seeker: {
    primary: [item('/dashboard', 'dashboard', 'Dashboard', 'dashboard'), item('/jobs', 'jobs', 'Jobs', 'jobs'),
      item('/skills', 'skills', 'Skills', 'skills'), item('/salary', 'salary', 'Salary', 'salary')],
    more: [item('/notifications', 'notifications', 'Alerts', 'bell'),
      item('/job-recommendations', 'recommended', 'Recommended', 'chart'), item('/tool-sharing', 'tools', 'Tools', 'tools'),
      item('/loan-suggestions', 'loans', 'Loans', 'money'), item('/credit-score', 'creditScore', 'Credit score', 'chart'),
      item('/profile', 'profile', 'Profile', 'user')],
  },
  provider: {
    primary: [item('/employer-dashboard', 'dashboard', 'Dashboard', 'dashboard'), item('/jobs', 'jobs', 'Jobs', 'jobs'),
      item('/salary', 'salary', 'Salary', 'salary'), item('/notifications', 'notifications', 'Alerts', 'bell')],
    more: [item('/employer-agreements', 'agreements', 'Agreements', 'document'), item('/profile', 'profile', 'Profile', 'user')],
  },
  investor: {
    primary: [item('/investment-opportunities', 'investments', 'Opportunities', 'chart'), item('/investor-setup', 'investorProfile', 'Setup', 'dashboard'),
      item('/notifications', 'notifications', 'Alerts', 'bell'), item('/profile', 'profile', 'Profile', 'user')],
    more: [],
  },
  admin: {
    primary: [item('/admin/dashboard', 'adminDashboard', 'Dashboard', 'dashboard'), item('/admin/report-review', 'reviewReports', 'Reports', 'flag')],
    more: [item('/profile', 'profile', 'Profile', 'user')],
  },
};

const HOME = { seeker: '/dashboard', provider: '/employer-dashboard', investor: '/investment-opportunities', admin: '/admin/dashboard' };

export const navFor = (role) => NAV[role] || { primary: [], more: [] };
export const homeFor = (role) => HOME[role] || '/login';
