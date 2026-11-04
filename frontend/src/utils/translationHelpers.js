import { useTranslation } from 'react-i18next';

// Hook for translating database values
export const useDbTranslation = () => {
  const { t } = useTranslation();

  const translateJobType = (jobType) => {
    if (!jobType) return '';
    const normalizedType = jobType.toLowerCase().replace(/\s+/g, '_');
    const jobTypeMap = {
      'full_time': t('jobTypes.fullTime') || 'Full Time',
      'part_time': t('jobTypes.partTime') || 'Part Time',
      'contract': t('jobTypes.contract') || 'Contract',
      'freelance': t('jobTypes.freelance') || 'Freelance',
      'temporary': t('jobTypes.temporary') || 'Temporary',
      'internship': t('jobTypes.internship') || 'Internship',
      'fulltime': t('jobTypes.fullTime') || 'Full Time',
      'parttime': t('jobTypes.partTime') || 'Part Time',
    };
    return jobTypeMap[normalizedType] || jobType;
  };

  const translateWageType = (wageType) => {
    if (!wageType) return '';
    const normalizedType = wageType.toLowerCase().replace(/\s+/g, '_');
    const wageTypeMap = {
      'hourly': t('wageTypes.hourly') || 'Hourly',
      'daily': t('wageTypes.daily') || 'Daily',
      'weekly': t('wageTypes.weekly') || 'Weekly',
      'monthly': t('wageTypes.monthly') || 'Monthly',
      'yearly': t('wageTypes.yearly') || 'Yearly',
      'per_project': t('wageTypes.perProject') || 'Per Project',
      'per_hour': t('wageTypes.hourly') || 'Hourly',
      'per_day': t('wageTypes.daily') || 'Daily',
      'per_month': t('wageTypes.monthly') || 'Monthly',
      'per_year': t('wageTypes.yearly') || 'Yearly',
    };
    return wageTypeMap[normalizedType] || wageType;
  };

  const translateApplicationStatus = (status) => {
    if (!status) return '';
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
    const statusMap = {
      'pending': t('applicationStatus.pending') || 'Pending',
      'accepted': t('applicationStatus.accepted') || 'Accepted',
      'rejected': t('applicationStatus.rejected') || 'Rejected',
      'under_review': t('applicationStatus.underReview') || 'Under Review',
      'shortlisted': t('applicationStatus.shortlisted') || 'Shortlisted',
      'interviewed': t('applicationStatus.interviewed') || 'Interviewed',
      'approved': t('applicationStatus.accepted') || 'Accepted',
      'declined': t('applicationStatus.rejected') || 'Rejected',
    };
    return statusMap[normalizedStatus] || status;
  };

  const translateOfferStatus = (status) => {
    const statusMap = {
      'pending': t('offerStatus.pending') || 'Pending',
      'accepted': t('offerStatus.accepted') || 'Accepted',
      'rejected': t('offerStatus.rejected') || 'Rejected',
      'countered': t('offerStatus.countered') || 'Countered',
      'expired': t('offerStatus.expired') || 'Expired',
      'withdrawn': t('offerStatus.withdrawn') || 'Withdrawn',
    };
    return statusMap[status] || status;
  };

  const translateAgreementStatus = (status) => {
    const statusMap = {
      'pending_signing': t('agreementStatus.pendingSigning') || 'Pending Signing',
      'signed_by_employer': t('agreementStatus.signedByEmployer') || 'Signed by Employer',
      'signed_by_seeker': t('agreementStatus.signedBySeeker') || 'Signed by Employee',
      'fully_signed': t('agreementStatus.fullySigned') || 'Fully Signed',
      'cancelled': t('agreementStatus.cancelled') || 'Cancelled',
    };
    return statusMap[status] || status;
  };

  const translateLoanStatus = (status) => {
    const statusMap = {
      'pending': t('loanStatus.pending') || 'Pending',
      'approved': t('loanStatus.approved') || 'Approved',
      'rejected': t('loanStatus.rejected') || 'Rejected',
      'under_review': t('loanStatus.underReview') || 'Under Review',
      'disbursed': t('loanStatus.disbursed') || 'Disbursed',
      'repaid': t('loanStatus.repaid') || 'Repaid',
      'defaulted': t('loanStatus.defaulted') || 'Defaulted',
    };
    return statusMap[status] || status;
  };

  const translateTransactionType = (type) => {
    const typeMap = {
      'credit': t('transactionTypes.credit') || 'Credit',
      'debit': t('transactionTypes.debit') || 'Debit',
      'transfer': t('transactionTypes.transfer') || 'Transfer',
      'payment': t('transactionTypes.payment') || 'Payment',
      'refund': t('transactionTypes.refund') || 'Refund',
      'fee': t('transactionTypes.fee') || 'Fee',
    };
    return typeMap[type] || type;
  };

  const translateTransactionStatus = (status) => {
    const statusMap = {
      'pending': t('transactionStatus.pending') || 'Pending',
      'completed': t('transactionStatus.completed') || 'Completed',
      'failed': t('transactionStatus.failed') || 'Failed',
      'cancelled': t('transactionStatus.cancelled') || 'Cancelled',
      'processing': t('transactionStatus.processing') || 'Processing',
    };
    return statusMap[status] || status;
  };

  const translateUserRole = (role) => {
    const roleMap = {
      'seeker': t('userRoles.seeker') || 'Job Seeker',
      'provider': t('userRoles.provider') || 'Job Provider',
      'investor': t('userRoles.investor') || 'Investor',
      'admin': t('userRoles.admin') || 'Admin',
    };
    return roleMap[role] || role;
  };

  const translateCompanyType = (type) => {
    const typeMap = {
      'individual': t('companyTypes.individual') || 'Individual',
      'business': t('companyTypes.business') || 'Business',
      'enterprise': t('companyTypes.enterprise') || 'Enterprise',
      'startup': t('companyTypes.startup') || 'Startup',
      'ngo': t('companyTypes.ngo') || 'NGO',
      'government': t('companyTypes.government') || 'Government',
    };
    return typeMap[type] || type;
  };

  const translatePriority = (priority) => {
    const priorityMap = {
      'low': t('priority.low') || 'Low',
      'medium': t('priority.medium') || 'Medium',
      'high': t('priority.high') || 'High',
      'urgent': t('priority.urgent') || 'Urgent',
    };
    return priorityMap[priority] || priority;
  };

  // Translate skill names (common skills)
  const translateSkillName = (skillName) => {
    if (!skillName) return '';
    const normalizedSkill = skillName.toLowerCase().trim();
    const skillMap = {
      'driving': t('skills.driving') || 'Driving',
      'cooking': t('skills.cooking') || 'Cooking',
      'cleaning': t('skills.cleaning') || 'Cleaning',
      'gardening': t('skills.gardening') || 'Gardening',
      'plumbing': t('skills.plumbing') || 'Plumbing',
      'electrical': t('skills.electrical') || 'Electrical',
      'carpentry': t('skills.carpentry') || 'Carpentry',
      'painting': t('skills.painting') || 'Painting',
      'welding': t('skills.welding') || 'Welding',
      'masonry': t('skills.masonry') || 'Masonry',
      'tailoring': t('skills.tailoring') || 'Tailoring',
      'computer': t('skills.computer') || 'Computer',
      'teaching': t('skills.teaching') || 'Teaching',
      'nursing': t('skills.nursing') || 'Nursing',
      'security': t('skills.security') || 'Security',
      'delivery': t('skills.delivery') || 'Delivery',
      'sales': t('skills.sales') || 'Sales',
      'customer service': t('skills.customerService') || 'Customer Service',
      'data entry': t('skills.dataEntry') || 'Data Entry',
      'accounting': t('skills.accounting') || 'Accounting',
    };
    return skillMap[normalizedSkill] || skillName;
  };

  // Translate job titles (common job titles)
  const translateJobTitle = (title) => {
    if (!title) return '';
    const normalizedTitle = title.toLowerCase().trim();
    const titleMap = {
      'driver': t('jobTitles.driver') || 'Driver',
      'cook': t('jobTitles.cook') || 'Cook',
      'cleaner': t('jobTitles.cleaner') || 'Cleaner',
      'gardener': t('jobTitles.gardener') || 'Gardener',
      'plumber': t('jobTitles.plumber') || 'Plumber',
      'electrician': t('jobTitles.electrician') || 'Electrician',
      'carpenter': t('jobTitles.carpenter') || 'Carpenter',
      'painter': t('jobTitles.painter') || 'Painter',
      'welder': t('jobTitles.welder') || 'Welder',
      'mason': t('jobTitles.mason') || 'Mason',
      'tailor': t('jobTitles.tailor') || 'Tailor',
      'teacher': t('jobTitles.teacher') || 'Teacher',
      'nurse': t('jobTitles.nurse') || 'Nurse',
      'security guard': t('jobTitles.securityGuard') || 'Security Guard',
      'delivery boy': t('jobTitles.deliveryBoy') || 'Delivery Boy',
      'salesperson': t('jobTitles.salesperson') || 'Salesperson',
      'data entry operator': t('jobTitles.dataEntryOperator') || 'Data Entry Operator',
      'accountant': t('jobTitles.accountant') || 'Accountant',
      'helper': t('jobTitles.helper') || 'Helper',
      'assistant': t('jobTitles.assistant') || 'Assistant',
    };
    return titleMap[normalizedTitle] || title;
  };

  // Translate city names (major Indian cities)
  const translateCityName = (city) => {
    if (!city) return '';
    const normalizedCity = city.toLowerCase().trim();
    const cityMap = {
      'mumbai': t('cities.mumbai') || 'Mumbai',
      'delhi': t('cities.delhi') || 'Delhi',
      'bangalore': t('cities.bangalore') || 'Bangalore',
      'hyderabad': t('cities.hyderabad') || 'Hyderabad',
      'ahmedabad': t('cities.ahmedabad') || 'Ahmedabad',
      'chennai': t('cities.chennai') || 'Chennai',
      'kolkata': t('cities.kolkata') || 'Kolkata',
      'surat': t('cities.surat') || 'Surat',
      'pune': t('cities.pune') || 'Pune',
      'jaipur': t('cities.jaipur') || 'Jaipur',
      'lucknow': t('cities.lucknow') || 'Lucknow',
      'kanpur': t('cities.kanpur') || 'Kanpur',
      'nagpur': t('cities.nagpur') || 'Nagpur',
      'indore': t('cities.indore') || 'Indore',
      'thane': t('cities.thane') || 'Thane',
      'bhopal': t('cities.bhopal') || 'Bhopal',
      'visakhapatnam': t('cities.visakhapatnam') || 'Visakhapatnam',
      'pimpri': t('cities.pimpri') || 'Pimpri',
      'patna': t('cities.patna') || 'Patna',
      'vadodara': t('cities.vadodara') || 'Vadodara',
    };
    return cityMap[normalizedCity] || city;
  };

  return {
    translateJobType,
    translateWageType,
    translateApplicationStatus,
    translateOfferStatus,
    translateAgreementStatus,
    translateLoanStatus,
    translateTransactionType,
    translateTransactionStatus,
    translateUserRole,
    translateCompanyType,
    translatePriority,
    translateSkillName,
    translateJobTitle,
    translateCityName,
  };
};

// Utility function for formatting dates in user's locale
export const formatDate = (date, locale = 'en') => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  const localeMap = {
    'en': 'en-US',
    'hi': 'hi-IN',
    'pa': 'pa-IN',
    'mr': 'mr-IN',
    'ta': 'ta-IN',
    'te': 'te-IN',
    'ml': 'ml-IN',
    'kn': 'kn-IN',
    'bn': 'bn-IN',
    'gu': 'gu-IN',
  };
  
  return dateObj.toLocaleDateString(localeMap[locale] || 'en-US');
};

// Utility function for formatting currency
export const formatCurrency = (amount, locale = 'en') => {
  if (!amount && amount !== 0) return '';
  
  const localeMap = {
    'en': 'en-IN',
    'hi': 'hi-IN',
    'pa': 'pa-IN',
    'mr': 'mr-IN',
    'ta': 'ta-IN',
    'te': 'te-IN',
    'ml': 'ml-IN',
    'kn': 'kn-IN',
    'bn': 'bn-IN',
    'gu': 'gu-IN',
  };
  
  return new Intl.NumberFormat(localeMap[locale] || 'en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};