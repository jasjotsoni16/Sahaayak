import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJob, getSkills } from '../api';
import LocationPickerModal from './LocationPickerModal';
import { notify } from '../ui/toastBus';

const PostJobPage = ({ onClose }) => {
    const navigate = useNavigate();
    // Inside the Jobs popup the parent passes onClose; on the standalone /post-job page there is no
    // parent, so finishing means going back to the jobs list.
    const finish = onClose || (() => navigate('/jobs'));
    const [jobData, setJobData] = useState({
        employer_id: '',
        title: '',
        description: '',
        responsibilities: '',
        skills_required: [],
        experience_required: 0,
        assessment_required: false,
        number_of_openings: 1,
        job_type: 'full_time',
        duration: '',
        wage_type: 'monthly',
        salary_min: 0,
        salary_max: 0,
        negotiable: false,
        leaves_allowed: 0,
        city: '', // New field for city name
        coordinates_display: '', // For displaying coordinates, read-only
        pincode: '',
        coordinates: { lat: null, lng: null }, // Actual coordinates to send to backend
    });
    const [skills, setSkills] = useState([]);
    const [isLocationPickerOpen, setLocationPickerOpen] = useState(false);

    useEffect(() => {
        const fetchSkills = async () => {
            try {
                const response = await getSkills();
                setSkills(response.data);
            } catch (error) {
                console.error("Error fetching skills:", error);
            }
        };
        fetchSkills();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'skill_required') {
            setJobData(prevData => ({
                ...prevData,
                skills_required: [value]
            }));
        } else {
            setJobData(prevData => ({
                ...prevData,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleLocationSelect = (locationData) => {
        setJobData(prevData => ({
            ...prevData,
            city: locationData.city, // Set city from map
            coordinates_display: `Lat: ${locationData.lat.toFixed(4)}, Lng: ${locationData.lng.toFixed(4)}`, // Display coordinates
            pincode: locationData.pincode,
            coordinates: { lat: locationData.lat, lng: locationData.lng }, // Actual coordinates
        }));
        setLocationPickerOpen(false);
    };

    const handleNumericChange = (name, delta) => {
        setJobData(prevData => ({
            ...prevData,
            [name]: Math.max(0, (prevData[name] || 0) + delta)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user._id) {
                jobData.employer_id = user._id;
            } else {
                notify.auto('Employer ID not found. Please log in as an employer.');
                return;
            }

            // Prepare data for backend, ensuring coordinates and city are sent
            const dataToSend = {
                ...jobData,
                city: jobData.city, // Send city to backend
                location: {
                    type: 'Point',
                    coordinates: [jobData.coordinates.lng, jobData.coordinates.lat] // Send as [longitude, latitude]
                },
                // Remove coordinates_display and pincode if not needed by backend directly
                coordinates_display: undefined, 
                pincode: undefined,
                coordinates: undefined // Remove the coordinates object as it's now part of location
            };

            await createJob(dataToSend);
            notify.auto('Job posted successfully!');
            finish();
        } catch (error) {
            notify.auto('Error posting job: ' + error.message);
        }
    };

    return (
        <>
            <div className="w-full max-w-4xl mx-auto font-sans">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Post a New Job</h2>
                <p className="text-center text-gray-600 mb-8">Fill out the form below to post a job opening.</p>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                            <div className="form-group">
                                <label htmlFor="title" className="block text-lg font-semibold text-gray-700 mb-2">Job Title</label>
                                <input type="text" id="title" name="title" value={jobData.title} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="description" className="block text-lg font-semibold text-gray-700 mb-2">Job Description</label>
                                <textarea id="description" name="description" value={jobData.description} onChange={handleChange} required rows="4" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"></textarea>
                            </div>
                            <div className="form-group">
                                <label htmlFor="responsibilities" className="block text-lg font-semibold text-gray-700 mb-2">Responsibilities</label>
                                <textarea id="responsibilities" name="responsibilities" value={jobData.responsibilities} onChange={handleChange} rows="4" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"></textarea>
                            </div>
                            <div className="form-group">
                                <label htmlFor="skill_required" className="block text-lg font-semibold text-gray-700 mb-2">Skill Required</label>
                                <select id="skill_required" name="skill_required" value={jobData.skills_required[0] || ''} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition">
                                    <option value="" disabled>Select a skill</option>
                                    {skills.map(skill => (
                                        <option key={skill._id} value={skill._id}>{skill.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label className="block text-lg font-semibold text-gray-700 mb-2">Experience (Years)</label>
                                    <div className="flex items-center border border-gray-300 rounded-lg">
                                        <button type="button" onClick={() => handleNumericChange('experience_required', -1)} className="px-4 py-2 bg-gray-200 text-lg font-bold">-</button>
                                        <input type="text" name="experience_required" value={jobData.experience_required} readOnly className="w-full p-3 text-center border-l border-r" />
                                        <button type="button" onClick={() => handleNumericChange('experience_required', 1)} className="px-4 py-2 bg-gray-200 text-lg font-bold">+</button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="block text-lg font-semibold text-gray-700 mb-2">Number of Openings</label>
                                    <div className="flex items-center border border-gray-300 rounded-lg">
                                        <button type="button" onClick={() => handleNumericChange('number_of_openings', -1)} className="px-4 py-2 bg-gray-200 text-lg font-bold">-</button>
                                        <input type="text" name="number_of_openings" value={jobData.number_of_openings} readOnly className="w-full p-3 text-center border-l border-r" />
                                        <button type="button" onClick={() => handleNumericChange('number_of_openings', 1)} className="px-4 py-2 bg-gray-200 text-lg font-bold">+</button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label htmlFor="job_type" className="block text-lg font-semibold text-gray-700 mb-2">Job Type</label>
                                    <select id="job_type" name="job_type" value={jobData.job_type} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition">
                                        <option value="full_time">Full-time</option>
                                        <option value="part_time">Part-time</option>
                                        <option value="gig">Gig</option>
                                        <option value="contract">Contract</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="wage_type" className="block text-lg font-semibold text-gray-700 mb-2">Wage Type</label>
                                    <select id="wage_type" name="wage_type" value={jobData.wage_type} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition">
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="per_task">Per Task</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label htmlFor="salary_min" className="block text-lg font-semibold text-gray-700 mb-2">Min Salary</label>
                                    <input type="number" id="salary_min" name="salary_min" value={jobData.salary_min} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="salary_max" className="block text-lg font-semibold text-gray-700 mb-2">Max Salary</label>
                                    <input type="number" id="salary_max" name="salary_max" value={jobData.salary_max} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="block text-lg font-semibold text-gray-700 mb-2">Leaves Allowed</label>
                                <div className="flex items-center border border-gray-300 rounded-lg">
                                    <button type="button" onClick={() => handleNumericChange('leaves_allowed', -1)} className="px-4 py-2 bg-gray-200 text-lg font-bold">-</button>
                                    <input type="text" name="leaves_allowed" value={jobData.leaves_allowed} readOnly className="w-full p-3 text-center border-l border-r" />
                                    <button type="button" onClick={() => handleNumericChange('leaves_allowed', 1)} className="px-4 py-2 bg-gray-200 text-lg font-bold">+</button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="city" className="block text-lg font-semibold text-gray-700 mb-2">City</label>
                                <input type="text" id="city" name="city" value={jobData.city} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="coordinates_display" className="block text-lg font-semibold text-gray-700 mb-2">Coordinates</label>
                                <div className="flex gap-2">
                                    <input type="text" id="coordinates_display" name="coordinates_display" value={jobData.coordinates_display} readOnly className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed" />
                                    <button type="button" onClick={() => setLocationPickerOpen(true)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">
                                        Pick from Map
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="form-group flex items-center">
                                    <input type="checkbox" id="assessment_required" name="assessment_required" checked={jobData.assessment_required} onChange={handleChange} className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                    <label htmlFor="assessment_required" className="ml-2 text-lg font-semibold text-gray-700">Assessment Required</label>
                                </div>
                                <div className="form-group flex items-center">
                                    <input type="checkbox" id="negotiable" name="negotiable" checked={jobData.negotiable} onChange={handleChange} className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                    <label htmlFor="negotiable" className="ml-2 text-lg font-semibold text-gray-700">Salary Negotiable</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center pt-6 col-span-2">
                        <button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-12 rounded-lg shadow-lg transition-transform transform hover:scale-105">
                            Post Job
                        </button>
                    </div>
                </form>
            </div>
            {isLocationPickerOpen && (
                <LocationPickerModal 
                    onSelect={handleLocationSelect} 
                    onClose={() => setLocationPickerOpen(false)} 
                />
            )}
        </>
    );
};

export default PostJobPage;
