const Report = require('../Model/Report');
const User = require('../Model/User'); // Import User model

exports.createReport = async (req, res) => {
  try {
    const { reported_user_id, reported_job_id, reported_tool_id, report_type, reason, description } = req.body;
    const reporter_id = req.user._id; // User making the report

    const newReport = new Report({
      reporter_id,
      reported_user_id,
      reported_job_id,
      reported_tool_id,
      report_type,
      reason,
      description,
    });

    const report = await newReport.save();
    res.status(201).json({ message: 'Report submitted successfully.', report });
  } catch (error) {
    res.status(400).json({ message: 'Error submitting report.', error: error.message });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    // Only allow admins to view all reports
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    const reports = await Report.find()
      .populate('reporter_id', 'name email')
      .populate({
        path: 'reported_user_id',
        select: 'name email role skill_set income_history credit_score',
        populate: {
          path: 'employer_profile',
          model: 'Employer',
          select: 'company_name company_type gstin_number is_verified',
        },
      })
      .populate('reported_job_id', 'title')
      .populate('reported_tool_id', 'name');
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reports.', error: error.message });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    // Only allow admins to update report status
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const { id } = req.params;
    const { status } = req.body;
    const resolved_by = req.user._id;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    // Update user counts based on resolution status
    if (status === 'false_accusation') {
      await User.findByIdAndUpdate(report.reporter_id, { $inc: { false_accusation_count: 1 } });
    } else if (status === 'abuse_true') {
      if (report.reported_user_id) {
        await User.findByIdAndUpdate(report.reported_user_id, { $inc: { abuse_true_count: 1 } });
      }
    }

    report.status = status;
    report.resolved_by = resolved_by;
    report.resolved_at = new Date();

    await report.save();
    res.status(200).json({ message: 'Report status updated successfully.', report });
  } catch (error) {
    res.status(400).json({ message: 'Error updating report status.', error: error.message });
  }
};
