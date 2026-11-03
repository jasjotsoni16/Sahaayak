const UserExperience = require('../Model/UserExperience');
const Job = require('../Model/Job');
const Agreement = require('../Model/Agreement'); // Import Agreement model
const { PassThrough } = require('stream');

exports.addExperience = async (req, res) => {
  try {
    const { seeker_id, job_description, description, date_joined, date_left, location } = req.body;

    const newExperience = new UserExperience({
      seeker_id,
      job_description,
      description,
      date_joined,
      date_left,
      location,
      job_id: null, // Manually added experience has null job_id
    });

    await newExperience.save();
    res.status(201).json({ message: 'Experience added successfully', experience: newExperience });
  } catch (error) {
    res.status(500).json({ message: 'Error adding experience', error: error.message });
  }
};

exports.getCurrentJobs = async (req, res) => {
  try {
    const { seekerId } = req.params;
    const currentJobs = await UserExperience.find({ seeker_id: seekerId, date_left: null })
      .populate('agreement_id') // Add this line
      .populate({
        path: 'job_id',
        select: 'title employer_id',
        populate: {
          path: 'employer_id',
          select: 'name email',
          populate: {
            path: 'employer_profile',
            model: 'Employer',
            select: 'company_name',
          },
        },
      });
    res.status(200).json(currentJobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching current jobs', error: error.message });
  }
};

exports.leaveJob = async (req, res) => {
  try {
    const { experienceId } = req.params;
    const experience = await UserExperience.findById(experienceId);

    if (!experience) {
      return res.status(404).json({ message: 'Experience not found.' });
    }

    if (experience.date_left) {
      return res.status(400).json({ message: 'Job already left.' });
    }

    experience.date_left = new Date();
    await experience.save();

    // Optionally, update the corresponding UserApplication status to 'left' if it exists
    if (experience.job_id) {
      const UserApplication = require('../Model/UserApplication'); // Import here to avoid circular dependency
      await UserApplication.findOneAndUpdate(
        { seeker_id: experience.seeker_id, job_id: experience.job_id },
        { status: 'left', date_left: new Date() }
      );
    }

    res.status(200).json({ message: 'Job left successfully', experience });
  } catch (error) {
    res.status(500).json({ message: 'Error leaving job', error: error.message });
  }
};

exports.raiseIssue = async (req, res) => {
  try {
    const { experienceId } = req.params;
    const { issueDescription } = req.body;
    // In a real application, you would save this issue to a database,
    // notify an admin, etc.
    console.log(`Issue raised for experience ${experienceId}: ${issueDescription}`);
    res.status(200).json({ message: 'Issue raised successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error raising issue', error: error.message });
  }
};

exports.getHiredSeekers = async (req, res) => {
  try {
    const { employerId } = req.params;
    const jobs = await Job.find({ employer_id: employerId });
    const jobIds = jobs.map(job => job._id);
    const hiredSeekers = await UserExperience.find({ job_id: { $in: jobIds }, date_left: null })
      .populate('seeker_id', 'name phone_number email')
      .populate({
        path: 'job_id',
        select: 'title employer_id',
        populate: {
          path: 'employer_id',
          select: 'name email',
        },
      });
    res.status(200).json(hiredSeekers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching hired seekers', error: error.message });
  }
};

exports.getArchivedSeekers = async (req, res) => {
  try {
    const { employerId } = req.params;
    const jobs = await Job.find({ employer_id: employerId });
    const jobIds = jobs.map(job => job._id);
    const archivedSeekers = await UserExperience.find({ job_id: { $in: jobIds }, date_left: { $exists: true } })
      .populate('seeker_id', 'name phone_number email')
      .populate({
        path: 'job_id',
        select: 'title employer_id',
        populate: {
          path: 'employer_id',
          select: 'name email',
          populate: {
            path: 'employer_profile',
            model: 'Employer',
            select: 'company_name company_type gstin_number is_verified',
          },
        },
      });
    res.status(200).json(archivedSeekers);
  } catch (error) {
    console.error('Error fetching archived seekers:', error);
    res.status(500).json({ message: 'Error fetching archived seekers', error: error.message });
  }
};

exports.getAllUserExperiencesForSeeker = async (req, res) => {
  try {
    const { seekerId } = req.params;
    const userExperiences = await UserExperience.find({ seeker_id: seekerId })
      .populate({
        path: 'job_id',
        select: 'title description job_type wage_type salary_min salary_max negotiable city employer_id',
        populate: {
          path: 'employer_id',
          select: 'name phone_number email employer_profile',
          populate: {
            path: 'employer_profile',
            model: 'Employer',
            select: 'company_name company_type gstin_number is_verified',
          },
        },
      });
    res.status(200).json(userExperiences);
  } catch (error) {
    console.error('Error fetching all user experiences for seeker:', error);
    res.status(500).json({ message: 'Error fetching all user experiences for seeker', error: error.message });
  }
};