import React, { useState } from 'react';
import { viewApplications } from '../api';
import { notify } from '../ui/toastBus';

const JobProviderActions = () => {
    const [jobId, setJobId] = useState('');
    
    const [applications, setApplications] = useState([]);

    const handleViewApplications = async () => {
        try {
            const response = await viewApplications(jobId);
            setApplications(response.data.applications);
            notify.auto('Applications fetched!');
        } catch (error) {
            notify.auto('Error fetching applications: ' + error.message);
        }
    };

    

    return (
        <div style={{ border: '1px solid black', padding: '20px', margin: '20px' }}>
            <h3>Job Provider Actions</h3>
            <div>
                <h4>View Applications</h4>
                <input type="text" placeholder="Job ID" value={jobId} onChange={(e) => setJobId(e.target.value)} />
                <button onClick={handleViewApplications}>View Applications</button>
                <div>
                    {applications.map(app => (
                        <p key={app._id}>{app.user_id.name} - {app.status}</p>
                    ))}
                </div>
            </div>
            
        </div>
    );
};

export default JobProviderActions;
