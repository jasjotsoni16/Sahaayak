const Job = require('../Model/Job');
const { resolveLocation } = require('../services/geocoding');
const { haversineKm } = require('../utils/geo');
const userSkillService = require('../services/userSkillService');
const NotificationService = require('../services/notificationService');

exports.getAllJobs = async (req, res) => {
    try {
        const { latitude, longitude, userId, showArchived, userRole } = req.query;
        let query = {};

        if (showArchived === 'true') {
            // If showArchived is true, fetch only archived jobs
            query.is_archived = true;
        } else {
            // By default, only fetch non-archived jobs
            query.is_archived = false;
        }
        
        // If user is a provider (employer), only show their own jobs
        if (userRole === 'provider' && userId) {
            query.employer_id = userId;
        }

        // Temporarily commenting out location and skill filters for debugging
        /*
        // Filter by skills if userId is provided
        if (userId) {
            const userSkills = await userSkillService.getUserSkills(userId);
            const userSkillIds = userSkills.map(us => us.skill_id._id);
            if (userSkillIds.length > 0) {
                query.skills_required = { $in: userSkillIds };
            }
        }
        console.log('==================================');
        console.log('Latitude:', latitude);
        console.log('Longitude:', longitude);
        console.log('==================================');
        // Filter by location if latitude and longitude are provided
        if (latitude && longitude) {
            const maxDistance = 55000; // Default to 25 km radius
            query.location = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: maxDistance
                }
            };
            console.log('==================================');
            console.log('Query:', query.location);
            console.log('==================================');
        }
        */

        // Newest first, with the business name so seekers see "Sharma Canteen" rather than the owner's name
        const jobs = await Job.find(query).sort({ createdAt: -1 }).populate({
            path: 'employer_id',
            select: 'name email phone_number false_accusation_count abuse_true_count',
            populate: { path: 'employer_profile', model: 'Employer', select: 'company_name' },
        });
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching jobs', error: error.message });
    }
};

exports.createJob = async (req, res) => {
    try {
        const { city, location, ...jobData } = req.body;

        if (!location || !location.type || !location.coordinates || location.coordinates.length !== 2) {
            return res.status(400).json({ message: 'Location (type and coordinates) is required for job creation.' });
        }

        jobData.location = location;
        
        // Use the supplied city, otherwise derive it from the coordinates
        const resolved = await resolveLocation({ city, location });
        if (!resolved.city) {
            return res.status(400).json({ message: 'Could not determine the job city from its location. Please enter the city.' });
        }
        jobData.city = resolved.city;

        const newJob = new Job(jobData);
        await newJob.save();
        
        // Populate skills_required for notification
        await newJob.populate('skills_required', 'name');
        
        // Send notifications to matching seekers
        try {
            await NotificationService.notifyJobMatch(newJob);
        } catch (notificationError) {
            console.error('Error sending job match notifications:', notificationError);
            // Don't fail job creation if notification fails
        }
        
        res.status(201).json({ message: 'Job created successfully', job: newJob });
    } catch (error) {
        res.status(500).json({ message: 'Error creating job', error: error.message });
    }
};

const MAX_RADIUS_RESULTS = 200;
const DEFAULT_RADIUS_KM = 10;

// center and radius are validated by radiusQuery (validators/jobSchemas.js)
exports.getJobsInRadius = async (req, res) => {
    try {
        const { center: [longitude, latitude], radius = DEFAULT_RADIUS_KM } = req.validQuery;

        const jobs = await Job.find({
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [longitude, latitude] },
                    $maxDistance: radius * 1000, // km -> metres
                },
            },
        }).limit(MAX_RADIUS_RESULTS).populate({
            path: 'employer_id',
            select: 'name email phone_number false_accusation_count abuse_true_count',
            populate: {
                path: 'employer_profile',
                model: 'Employer',
                select: 'company_name company_type gstin_number is_verified'
            }
        });

        // $near already returns nearest-first; add the distance for display
        res.status(200).json(jobs.map((job) => {
            const [jobLng, jobLat] = job.location.coordinates;
            return { ...job.toJSON(), distance_km: Math.round(haversineKm(latitude, longitude, jobLat, jobLng) * 10) / 10 };
        }));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching jobs in radius', error: error.message });
    }
};

exports.getJobsByEmployer = async (req, res) => {
    try {
        const { employerId } = req.params;
        
        // Security check: Ensure the requesting user is the employer (if authenticated)
        if (req.user && req.user.role === 'provider' && req.user._id.toString() !== employerId) {
            return res.status(403).json({ 
                message: 'Access denied. You can only view your own jobs.',
                error: 'UNAUTHORIZED_ACCESS'
            });
        }
        
        const jobs = await Job.find({ employer_id: employerId }).populate('employer_id', 'name email');
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching jobs for employer', error: error.message });
    }
};

// Public method to view employer's jobs (for profile viewing)
exports.getPublicJobsByEmployer = async (req, res) => {
    try {
        const { employerId } = req.params;
        
        // Only show active (non-archived) jobs for public viewing
        const jobs = await Job.find({ 
            employer_id: employerId,
            is_archived: false 
        })
        .populate('employer_id', 'name email')
        .populate('skills_required', 'name')
        .select('-internal_notes -private_data') // Exclude sensitive fields
        .sort({ created_at: -1 })
        .limit(20); // Limit to recent 20 jobs
        
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching public jobs for employer', error: error.message });
    }
};