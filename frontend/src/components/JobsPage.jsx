import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useDbTranslation, formatCurrency } from '../utils/translationHelpers';
import { getJobs, applyForJob, getApplicationsBySeeker, getJobsByEmployerId } from '../api';
import PostJobPage from './PostJobPage';
import ProviderApplicationsScreen from './ProviderApplicationsScreen';
import ApplicationStatusPage from './ApplicationStatusPage';
import EmployerProfileView from './EmployerProfileView';
import MyJobsList from './MyJobsList';
import PreviousJobsPage from './PreviousJobsPage';
import OffersPage from './OffersPage';
import VoiceAssistant from './VoiceAssistant';
import JobCard from './JobCard';
import PageHeader from '../ui/PageHeader';
import Tabs from '../ui/Tabs';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import Skeleton from '../ui/Skeleton';
import Modal from '../ui/Modal';
import { notify } from '../ui/toastBus';

const Fact = ({ label, children }) => (
    <div>
        <dt className="text-muted">{label}</dt>
        <dd className="text-ink">{children}</dd>
    </div>
);

const JobsPage = () => {
    const { t } = useTranslation();
    const { currentLanguage } = useLanguage();
    const { translateJobType, translateWageType, translateApplicationStatus, translateJobTitle, translateCityName, translateSkillName } = useDbTranslation();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPostJobModal, setShowPostJobModal] = useState(false);
    const [showApplicationsModal, setShowApplicationsModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [appliedJobStatuses, setAppliedJobStatuses] = useState(new Map());
    const [searchParams] = useSearchParams();
    // /jobs?view=applications opens "My applications" directly (linked from the dashboard)
    const [showApplicationStatus, setShowApplicationStatus] = useState(searchParams.get('view') === 'applications');
    const [showEmployerProfileModal, setShowEmployerProfileModal] = useState(false);
    const [selectedEmployerUserId, setSelectedEmployerUserId] = useState(null);
    const [activeTab, setActiveTab] = useState('availableJobs'); // 'availableJobs' or 'myJobs' or 'previousJobs'

    const user = JSON.parse(localStorage.getItem('user'));
    const userRole = user ? user.role : null;

    const fetchJobs = async () => {
        try {
            let response;
            
            if (userRole === 'provider') {
                // For employers, use the specific employer endpoint
                if (user && user._id) {
                    console.log(`Fetching jobs for employer: ${user._id}`);
                    response = await getJobsByEmployerId(user._id);
                    
                    // Filter by archived status if needed
                    let jobs = response.data;
                    if (activeTab === 'archivedJobs') {
                        jobs = jobs.filter(job => job.is_archived === true);
                    } else {
                        jobs = jobs.filter(job => job.is_archived === false);
                    }
                    setJobs(jobs);
                } else {
                    setJobs([]);
                }
            } else if (userRole === 'seeker') {
                // For seekers, use the general jobs endpoint with location filtering
                const params = {};
                
                if (activeTab === 'archivedJobs') {
                    params.showArchived = true;
                } else {
                    params.showArchived = false;
                }
                
                let latitude = null;
                let longitude = null;
                if (navigator.geolocation) {
                    await new Promise((resolve) => {
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                latitude = position.coords.latitude;
                                longitude = position.coords.longitude;
                                resolve();
                            },
                            (err) => {
                                console.warn(`ERROR(${err.code}): ${err.message}`);
                                resolve();
                            }
                        );
                    });
                }
                if (latitude !== null && longitude !== null) {
                    params.latitude = latitude;
                    params.longitude = longitude;
                }
                console.log('Sending params to getJobs:', params);
                
                response = await getJobs(params);
                setJobs(response.data);
            } else {
                // No user role, show empty
                setJobs([]);
            }
        } catch (err) {
            console.error('Error fetching jobs:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAppliedJobs = async () => {
        if (userRole === 'seeker' && user && user._id) {
            try {
                const response = await getApplicationsBySeeker(user._id);
                const statuses = new Map();
                response.data.forEach(app => {
                    statuses.set(app.job_id._id, app.status);
                });
                setAppliedJobStatuses(statuses);
            } catch (error) {
                console.error('Error fetching applied jobs:', error);
            }
        }
    };

    useEffect(() => {
        fetchJobs();
        fetchAppliedJobs();
    }, [activeTab, userRole]); // Re-fetch jobs when activeTab or userRole changes

    const handleJobPosted = () => {
        setShowPostJobModal(false);
        fetchJobs();
    };

    const handleApply = async (jobId) => {
        try {
            const seekerId = user ? user._id : null;
            if (!seekerId) {
                notify.auto(t('jobs.pleaseLoginAsSeeker') || 'Please log in as a seeker to apply for jobs.');
                return;
            }
            await applyForJob(seekerId, jobId);
            notify.auto(t('jobs.applicationSubmitted') || 'Application submitted successfully!');
            fetchAppliedJobs();
            setSelectedJob(null);
        } catch (error) {
            console.error('Error applying for job:', error);
            notify.auto(t('jobs.applicationFailed') || 'Failed to submit application. You might have already applied for this job.');
        }
    };

    const handleViewDetails = (job) => {
        setSelectedJob(job);
    };

    const handleCloseModal = () => {
        setSelectedJob(null);
    };

    const handleViewEmployerProfile = (employerUserId) => {
        setSelectedEmployerUserId(employerUserId);
        setShowEmployerProfileModal(true);
    };

    if (showApplicationStatus) {
        return <ApplicationStatusPage />;
    }

    const isListTab = activeTab === 'availableJobs' || activeTab === 'archivedJobs';
    const tabs = userRole === 'provider'
        ? [
            { id: 'availableJobs', label: t('jobs.myPostedJobs', { defaultValue: 'My posted jobs' }) },
            { id: 'archivedJobs', label: t('jobs.archivedJobs', { defaultValue: 'Archived' }) },
        ]
        : userRole === 'seeker'
            ? [
                { id: 'availableJobs', label: t('jobs.availableJobs', { defaultValue: 'Available' }) },
                { id: 'myJobs', label: t('jobs.myJobs', { defaultValue: 'My jobs' }) },
                { id: 'archivedJobs', label: t('jobs.archivedJobs', { defaultValue: 'Archived' }) },
                { id: 'previousJobs', label: t('jobs.previousJobs', { defaultValue: 'Previous' }) },
                { id: 'offers', label: t('offers.title', { defaultValue: 'Offers' }) },
            ]
            : null;

    const openingsLeft = selectedJob ? selectedJob.number_of_openings - selectedJob.openings_hired : 0;
    const employer = selectedJob && selectedJob.employer_id;

    return (
        <div>
            <VoiceAssistant context="jobs" />

            <PageHeader
                title={t('jobs.title', { defaultValue: 'Jobs' })}
                action={
                    userRole === 'provider'
                        ? <Button onClick={() => setShowPostJobModal(true)}>{t('jobs.createJob', { defaultValue: 'Add new job' })}</Button>
                        : userRole === 'seeker'
                            ? <Button variant="secondary" onClick={() => setShowApplicationStatus(true)}>{t('jobs.viewMyApplications', { defaultValue: 'My applications' })}</Button>
                            : null
                }
            />

            {tabs && <Tabs label={t('jobs.title', { defaultValue: 'Jobs' })} tabs={tabs} value={activeTab} onChange={setActiveTab} />}

            {isListTab && (
                loading ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
                    </div>
                ) : error ? (
                    <EmptyState title={`${t('common.error', { defaultValue: 'Error loading jobs' })}: ${error.message}`} />
                ) : jobs.length === 0 ? (
                    <EmptyState title={activeTab === 'archivedJobs'
                        ? t('jobs.noArchivedJobs', { defaultValue: 'No archived jobs.' })
                        : t('jobs.noJobsFound', { defaultValue: 'No jobs available right now.' })} />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {jobs.map((job) => (
                            <JobCard
                                key={job._id} job={job} userRole={userRole} archived={activeTab === 'archivedJobs'}
                                applied={appliedJobStatuses.has(job._id)}
                                onApply={handleApply} onViewDetails={handleViewDetails}
                                onSeeApplications={() => setShowApplicationsModal(true)}
                            />
                        ))}
                    </div>
                )
            )}

            {activeTab === 'myJobs' && userRole === 'seeker' && <MyJobsList seekerId={user._id} />}
            {activeTab === 'previousJobs' && userRole === 'seeker' && <PreviousJobsPage seekerId={user._id} />}
            {activeTab === 'offers' && userRole === 'seeker' && <OffersPage seekerId={user._id} />}

            <Modal open={showPostJobModal} onClose={() => setShowPostJobModal(false)} title={t('jobs.createJob', { defaultValue: 'Add new job' })} size="lg">
                <PostJobPage onClose={handleJobPosted} />
            </Modal>

            <Modal open={showApplicationsModal} onClose={() => setShowApplicationsModal(false)} title={t('jobs.seeApplications', { defaultValue: 'Applications' })} size="lg">
                <ProviderApplicationsScreen employerId={user ? user._id : null} />
            </Modal>

            <Modal open={!!selectedJob} onClose={handleCloseModal} title={selectedJob ? translateJobTitle(selectedJob.title) : ''} size="lg">
                {selectedJob && (
                    <div className="space-y-5 text-sm">
                        <p className="text-ink">{selectedJob.description}</p>
                        {selectedJob.responsibilities && (
                            <Fact label={t('jobs.responsibilities', { defaultValue: 'Responsibilities' })}>{selectedJob.responsibilities}</Fact>
                        )}

                        {selectedJob.skills_required && selectedJob.skills_required.length > 0 && (
                            <div>
                                <p className="mb-2 text-muted">{t('jobs.skillsRequired', { defaultValue: 'Skills required' })}</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedJob.skills_required.map((skill) => (
                                        <Badge key={skill._id} tone="primary">{translateSkillName(skill.name)}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <dl className="grid gap-4 sm:grid-cols-2">
                            <Fact label={t('jobs.experienceRequired', { defaultValue: 'Experience required' })}>
                                {selectedJob.experience_required} {t('jobs.years', { defaultValue: 'years' })}
                            </Fact>
                            <Fact label={t('jobs.numberOfOpenings', { defaultValue: 'Openings' })}>
                                {openingsLeft} ({t('jobs.outOf', { defaultValue: 'out of' })} {selectedJob.number_of_openings})
                            </Fact>
                            <Fact label={t('jobs.jobType', { defaultValue: 'Job type' })}><Badge tone="primary">{translateJobType(selectedJob.job_type)}</Badge></Fact>
                            <Fact label={t('jobs.wageType', { defaultValue: 'Wage type' })}><Badge>{translateWageType(selectedJob.wage_type)}</Badge></Fact>
                            <Fact label={t('jobs.salaryRange', { defaultValue: 'Salary range' })}>
                                {formatCurrency(selectedJob.salary_min, currentLanguage)} – {formatCurrency(selectedJob.salary_max, currentLanguage)}
                            </Fact>
                            <Fact label={t('common.city', { defaultValue: 'City' })}>{translateCityName(selectedJob.city)}</Fact>
                            {selectedJob.leaves_allowed && (
                                <Fact label={t('jobs.leavesAllowed', { defaultValue: 'Leaves allowed' })}>{selectedJob.leaves_allowed}</Fact>
                            )}
                        </dl>

                        {employer && (
                            <div className="rounded-xl border border-line p-4">
                                <h3 className="mb-3 text-base font-semibold text-ink">{t('jobs.employerDetails', { defaultValue: 'Employer details' })}</h3>
                                <dl className="grid gap-3 sm:grid-cols-2">
                                    <Fact label={t('common.name', { defaultValue: 'Name' })}>{employer.name}</Fact>
                                    <Fact label={t('common.phone', { defaultValue: 'Phone' })}>{employer.phone_number}</Fact>
                                    {employer.email && <Fact label={t('common.email', { defaultValue: 'Email' })}>{employer.email}</Fact>}
                                    {employer.employer_profile && (
                                        <>
                                            <Fact label={t('jobs.company', { defaultValue: 'Company' })}>{employer.employer_profile.company_name}</Fact>
                                            <Fact label={t('jobs.companyType', { defaultValue: 'Company type' })}>{employer.employer_profile.company_type}</Fact>
                                            <Fact label={t('jobs.gstin', { defaultValue: 'GSTIN' })}>{employer.employer_profile.gstin_number}</Fact>
                                            <Fact label={t('jobs.verified', { defaultValue: 'Verified' })}>
                                                <Badge tone={employer.employer_profile.is_verified ? 'success' : 'neutral'}>
                                                    {employer.employer_profile.is_verified ? t('common.yes', { defaultValue: 'Yes' }) : t('common.no', { defaultValue: 'No' })}
                                                </Badge>
                                            </Fact>
                                        </>
                                    )}
                                </dl>
                                {(employer.false_accusation_count > 0 || employer.abuse_true_count > 0) && (
                                    <div className="mt-3 space-y-1 text-sm text-danger">
                                        {employer.false_accusation_count > 0 && <p>{t('profile.falseAccusations', { defaultValue: 'False accusations' })}: {employer.false_accusation_count}</p>}
                                        {employer.abuse_true_count > 0 && <p>{t('profile.abuseConfirmed', { defaultValue: 'Abuse confirmed' })}: {employer.abuse_true_count}</p>}
                                    </div>
                                )}
                            </div>
                        )}

                        {userRole === 'seeker' && (
                            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
                                {selectedJob.is_archived || openingsLeft <= 0 ? (
                                    <p className="font-semibold text-danger">{t('jobs.jobArchivedNoOpenings', { defaultValue: 'Job archived / no openings left' })}</p>
                                ) : appliedJobStatuses.has(selectedJob._id) ? (
                                    <p className="font-semibold text-success">
                                        {t('jobs.applicationStatus', { defaultValue: 'Application status' })}:{' '}
                                        <span className="capitalize">{translateApplicationStatus(appliedJobStatuses.get(selectedJob._id))}</span>
                                    </p>
                                ) : (
                                    <>
                                        <Button onClick={() => handleApply(selectedJob._id)}>{t('jobs.applyNow', { defaultValue: 'Apply now' })}</Button>
                                        {employer && (
                                            <Button variant="secondary" onClick={() => handleViewEmployerProfile(employer._id)}>
                                                {t('jobs.viewEmployerProfile', { defaultValue: 'View employer profile' })}
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {showEmployerProfileModal && (
                <EmployerProfileView
                    employerUserId={selectedEmployerUserId}
                    onClose={() => setShowEmployerProfileModal(false)}
                />
            )}
        </div>
    );
};

export default JobsPage;