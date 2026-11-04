const Agreement = require('../Model/Agreement');
const User = require('../Model/User');
const NotificationService = require('../services/notificationService');

exports.getAgreement = async (req, res) => {
  try {
    const { agreementId } = req.params;
    const agreement = await Agreement.findById(agreementId);

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found.' });
    }

    res.status(200).json(agreement);
  } catch (error) {
    console.error('Error fetching agreement:', error);
    res.status(500).json({ message: 'Error fetching agreement', error: error.message });
  }
};

exports.signAgreement = async (req, res) => {
  try {
    const { agreementId } = req.params;
    const { userId, role } = req.body; // userId of the signer, and their role (seeker/employer)

    const agreement = await Agreement.findById(agreementId);

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found.' });
    }

    // Check if the user is authorized to sign this agreement
    if (role === 'seeker' && agreement.seeker_id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to sign this agreement as seeker.' });
    }
    if (role === 'provider' && agreement.employer_id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to sign this agreement as employer.' });
    }

    if (role === 'seeker') {
      agreement.status = 'signed_by_seeker';
    } else if (role === 'provider') {
      agreement.status = 'signed_by_employer';
    }

    // If both have signed, set status to fully_signed
    const currentAgreement = await Agreement.findById(agreementId);
    if ((currentAgreement.status === 'signed_by_employer' && role === 'seeker') || 
        (currentAgreement.status === 'signed_by_seeker' && role === 'provider')) {
      agreement.status = 'fully_signed';
    }

    await agreement.save();
    
    // Send notification to employer when seeker signs agreement
    if (role === 'seeker') {
      // Populate agreement details for notification
      await agreement.populate('seeker_id', 'name email');
      await agreement.populate('job_id', 'title');
      
      try {
        await NotificationService.notifyAgreementSigned(agreement.employer_id, agreement);
      } catch (notificationError) {
        console.error('Error sending agreement signed notification:', notificationError);
      }
    }

    res.status(200).json({ message: 'Agreement signed successfully', agreement });
  } catch (error) {
    console.error('Error signing agreement:', error);
    res.status(500).json({ message: 'Error signing agreement', error: error.message });
  }
};