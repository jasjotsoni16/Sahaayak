import React, { useState } from 'react';
import { applyForJob, negotiateOffer, recommendJob } from '../api';
import { notify } from '../ui/toastBus';

const JobSeekerActions = () => {
    const [userId, setUserId] = useState('');
    const [jobId, setJobId] = useState('');
    const [userJobId, setUserJobId] = useState('');
    const [newTerms, setNewTerms] = useState('');
    const [peerPhoneNumber, setPeerPhoneNumber] = useState('');

    const handleApply = async () => {
        try {
            await applyForJob(userId, jobId);
            notify.auto('Applied for job!');
        } catch (error) {
            notify.auto('Error applying for job: ' + error.message);
        }
    };

    const handleNegotiate = async () => {
        try {
            await negotiateOffer(userJobId, JSON.parse(newTerms));
            notify.auto('Negotiation initiated!');
        } catch (error) {
            notify.auto('Error negotiating: ' + error.message);
        }
    };

    const handleRecommend = async () => {
        try {
            await recommendJob(jobId, peerPhoneNumber);
            notify.auto('Job recommended!');
        } catch (error) {
            notify.auto('Error recommending job: ' + error.message);
        }
    };

    return (
        <div style={{ border: '1px solid black', padding: '20px', margin: '20px' }}>
            <h3>Job Seeker Actions</h3>
            <div>
                <h4>Apply for Job</h4>
                <input type="text" placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
                <input type="text" placeholder="Job ID" value={jobId} onChange={(e) => setJobId(e.target.value)} />
                <button onClick={handleApply}>Apply</button>
            </div>
            <div>
                <h4>Negotiate Offer</h4>
                <input type="text" placeholder="UserJob ID" value={userJobId} onChange={(e) => setUserJobId(e.target.value)} />
                <input type="text" placeholder="New Terms (JSON)" value={newTerms} onChange={(e) => setNewTerms(e.target.value)} />
                <button onClick={handleNegotiate}>Negotiate</button>
            </div>
            <div>
                <h4>Recommend Job</h4>
                <input type="text" placeholder="Job ID" value={jobId} onChange={(e) => setJobId(e.target.value)} />
                <input type="text" placeholder="Peer Phone Number" value={peerPhoneNumber} onChange={(e) => setPeerPhoneNumber(e.target.value)} />
                <button onClick={handleRecommend}>Recommend</button>
            </div>
        </div>
    );
};

export default JobSeekerActions;
