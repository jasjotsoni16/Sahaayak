const Offer = require('../Model/Offer');
const UserApplication = require('../Model/UserApplication');
const UserExperience = require('../Model/UserExperience');
const Agreement = require('../Model/Agreement');
const Job = require('../Model/Job');
const User = require('../Model/User');
const PDFDocument = require('pdfkit');
const { PassThrough } = require('stream');
const NotificationService = require('../services/notificationService');

exports.createOffer = async (req, res) => {
  try {
    const { job_id, seeker_id, employer_id, offered_wage, offered_wage_type } = req.body;

    // Check if an offer already exists for this job and seeker
    const existingOffer = await Offer.findOne({ job_id, seeker_id });
    if (existingOffer) {
      return res.status(400).json({ message: 'An offer already exists for this job and seeker.' });
    }

    const newOffer = new Offer({
      job_id,
      seeker_id,
      employer_id,
      offered_wage,
      offered_wage_type,
      negotiation_history: [{
        offered_wage,
        offered_wage_type,
        offered_by: 'employer',
      }],
    });

    await newOffer.save();

    // Update UserApplication status to 'offered'
    await UserApplication.findOneAndUpdate(
      { job_id, seeker_id },
      { status: 'offered' }
    );

    res.status(201).json({ message: 'Offer created successfully', offer: newOffer });
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ message: 'Error creating offer', error: error.message });
  }
};

exports.acceptOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const offer = await Offer.findById(offerId).populate('job_id').populate('seeker_id').populate('employer_id');

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found.' });
    }

    if (offer.status === 'accepted') {
      return res.status(400).json({ message: 'Offer already accepted.' });
    }

    const existingAgreement = await Agreement.findOne({ job_id: offer.job_id._id });
    if (existingAgreement) {
      return res.status(400).json({ message: 'An agreement already exists for this job.' });
    }

    offer.status = 'accepted';
    await offer.save();
    
    // Send notification to employer about offer acceptance
    try {
      await NotificationService.notifyOfferResponse(offer.employer_id._id, offer, 'accepted');
    } catch (notificationError) {
      console.error('Error sending offer acceptance notification:', notificationError);
    }

    // Create UserExperience record (will be updated with agreement_id later)
    const newExperience = new UserExperience({
      seeker_id: offer.seeker_id._id,
      job_id: offer.job_id._id,
      employer_id: offer.employer_id._id,
      date_joined: new Date(),
      job_description: offer.job_id.title,
      });
    await newExperience.save();

    // Generate agreement content
    const agreementContent = `
      EMPLOYMENT AGREEMENT\n\n
      This Employment Agreement ("Agreement") is made and entered into on ${new Date().toLocaleDateString()} 

      BETWEEN:

      Employer: ${offer.employer_id.name} (ID: ${offer.employer_id._id})

      AND

      Employee: ${offer.seeker_id.name} (ID: ${offer.seeker_id._id})


      WHEREAS, Employer desires to employ Employee, and Employee desires to be employed by Employer, upon the terms and conditions hereinafter set forth.


      NOW, THEREFORE, in consideration of the mutual covenants and promises herein contained, the parties hereto agree as follows:


      1. Position: The Employer agrees to employ the Employee in the position of ${offer.job_id.title}.

      2. Compensation: The Employee shall be compensated at a rate of ₹${offer.offered_wage} ${offer.offered_wage_type}.

      3. Start Date: The employment shall commence on ${new Date().toLocaleDateString()}.

      4. Duties: The Employee shall perform such duties as are customarily performed by someone in Employee’s position, and such other duties as may be assigned by Employer.

      5. Term: This Agreement shall continue until terminated by either party in accordance with the terms of this Agreement.\n
      6. Governing Law: This Agreement shall be governed by and construed in accordance with the laws of India.\n

      IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.\n

      _________________________                _________________________

      Employer Signature                       Employee Signature

      ${offer.employer_id.name}                 ${offer.seeker_id.name}
    `;

    // Generate PDF
    const doc = new PDFDocument();
    const stream = new PassThrough();
    let pdfBuffer = Buffer.from('');

    doc.pipe(stream);

    // Set document metadata
    doc.info.Title = 'Employment Agreement';
    doc.info.Author = 'Sahayak';

    // Add content to the PDF
    doc.fontSize(24).font('Helvetica-Bold').text('EMPLOYMENT AGREEMENT', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(12).font('Helvetica').text(`This Employment Agreement ("Agreement") is made and entered into on ${new Date().toLocaleDateString()}.`);
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('BETWEEN:');
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`Employer: ${offer.employer_id.name} (ID: ${offer.employer_id._id})`);
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('AND', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Employee:');
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`Employee: ${offer.seeker_id.name} (ID: ${offer.seeker_id._id})`);
    doc.moveDown(1.5);

    doc.fontSize(12).font('Helvetica').text('WHEREAS, Employer desires to employ Employee, and Employee desires to be employed by Employer, upon the terms and conditions hereinafter set forth.');
    doc.moveDown();

    doc.fontSize(12).font('Helvetica').text('NOW, THEREFORE, in consideration of the mutual covenants and promises herein contained, the parties hereto agree as follows:');
    doc.moveDown();

    // Clauses
    doc.fontSize(12).font('Helvetica-Bold').text('1. Position:');
    doc.fontSize(12).font('Helvetica').text(`   The Employer agrees to employ the Employee in the position of ${offer.job_id.title}.`);
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('2. Compensation:');
    doc.fontSize(12).font('Helvetica').text(`   The Employee shall be compensated at a rate of ₹${offer.offered_wage} ${offer.offered_wage_type}.`);
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('3. Start Date:');
    doc.fontSize(12).font('Helvetica').text(`   The employment shall commence on ${new Date().toLocaleDateString()}.`);
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('4. Duties:');
    doc.fontSize(12).font('Helvetica').text('   The Employee shall perform such duties as are customarily performed by someone in Employee’s position, and such other duties as may be assigned by Employer.');
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('5. Term:');
    doc.fontSize(12).font('Helvetica').text('   This Agreement shall continue until terminated by either party in accordance with the terms of this Agreement.');
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('6. Governing Law:');
    doc.fontSize(12).font('Helvetica').text('   This Agreement shall be governed by and construed in accordance with the laws of India.');
    doc.moveDown(2);

    doc.fontSize(12).font('Helvetica').text('IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.');
    doc.moveDown(3);

    // Signature lines
    const signatureY = doc.y;
    const col1X = 50;
    const col2X = 350;

    doc.font('Helvetica').text('_________________________', col1X, signatureY);
    doc.text('_________________________', col2X, signatureY);
    doc.moveDown(0.5);
    doc.text('Employer Signature', col1X, doc.y);
    doc.text('Employee Signature', col2X, doc.y);
    doc.moveDown(0.5);
    doc.text(`${offer.employer_id.name}`, col1X, doc.y);
    doc.text(`${offer.seeker_id.name}`, col2X, doc.y);

    doc.end();

    stream.on('data', chunk => {
      pdfBuffer = Buffer.concat([pdfBuffer, chunk]);
    });

    stream.on('end', async () => {
      const agreement_pdf_base64 = pdfBuffer.toString('base64');

      const newAgreement = new Agreement({
        job_id: offer.job_id._id,
        seeker_id: offer.seeker_id._id,
        employer_id: offer.employer_id._id,
        agreement_content: agreementContent, // Keep original content for reference if needed
        agreement_pdf_base64: agreement_pdf_base64,
        status: 'pending_signing',
      });
      await newAgreement.save();
      console.log('Backend: New Agreement saved with ID:', newAgreement._id);
      console.log('Backend: Agreement status:', newAgreement.status);
      console.log('Backend: Agreement has PDF:', !!newAgreement.agreement_pdf_base64);

      // Update the offer with the agreement ID
      offer.agreement_id = newAgreement._id;
      console.log('Backend: Offer agreement_id set to:', offer.agreement_id);
      await offer.save();
      console.log('Backend: Offer saved with updated agreement_id.', offer.agreement_id);
      
      // Update UserExperience with agreement_id
      newExperience.agreement_id = newAgreement._id;
      await newExperience.save();
      console.log('Backend: UserExperience updated with agreement_id:', newAgreement._id);

      // Update UserApplication status to 'hired'
      await UserApplication.findOneAndUpdate(
        { job_id: offer.job_id._id, seeker_id: offer.seeker_id._id },
        { status: 'hired' }
      );

      res.status(200).json({ 
        message: 'Offer accepted successfully and agreement generated', 
        offer: offer.toObject(), 
        agreement: {
          _id: newAgreement._id,
          status: newAgreement.status,
          created_at: newAgreement.created_at
        }
      });
    });

  } catch (error) {
    console.error('Error accepting offer:', error);
    res.status(500).json({ message: 'Error accepting offer', error: error.message });
  }
};

exports.rejectOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const offer = await Offer.findById(offerId);

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found.' });
    }

    if (offer.status === 'rejected') {
      return res.status(400).json({ message: 'Offer already rejected.' });
    }

    offer.status = 'rejected';
    await offer.save();
    
    // Populate offer details for notification
    await offer.populate('job_id', 'title');
    await offer.populate('seeker_id', 'name');
    
    // Send notification to employer about offer rejection
    try {
      await NotificationService.notifyOfferResponse(offer.employer_id, offer, 'rejected');
    } catch (notificationError) {
      console.error('Error sending offer rejection notification:', notificationError);
    }

    // Optionally, update UserApplication status to 'rejected'
    await UserApplication.findOneAndUpdate(
      { job_id: offer.job_id._id, seeker_id: offer.seeker_id._id },
      { status: 'rejected' }
    );

    res.status(200).json({ message: 'Offer rejected successfully', offer });
  } catch (error) {
    console.error('Error rejecting offer:', error);
    res.status(500).json({ message: 'Error rejecting offer', error: error.message });
  }
};

exports.counterOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { offered_wage, offered_wage_type, offered_by } = req.body;

    const offer = await Offer.findById(offerId);

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found.' });
    }

    if (offer.status === 'accepted' || offer.status === 'rejected') {
      return res.status(400).json({ message: 'Cannot counter an accepted or rejected offer.' });
    }

    if (offered_by === 'employer') {
      if (offer.employer_counter_offer_count >= 1) {
        return res.status(400).json({ message: 'Employer has already made their counter offer.' });
      }
      offer.employer_counter_offer_count += 1;
      offer.status = 'employer_countered';
    } else if (offered_by === 'seeker') {
      if (offer.seeker_counter_offer_count >= 1) {
        return res.status(400).json({ message: 'Seeker has already made their counter offer.' });
      }
      offer.seeker_counter_offer_count += 1;
      offer.status = 'seeker_countered';
    } else {
      return res.status(400).json({ message: 'Invalid offered_by value. Must be employer or seeker.' });
    }

    offer.offered_wage = offered_wage;
    offer.offered_wage_type = offered_wage_type;
    offer.negotiation_history.push({
      offered_wage,
      offered_wage_type,
      offered_by,
    });

    await offer.save();
    
    // Populate offer details for notification
    await offer.populate('job_id', 'title');
    await offer.populate('seeker_id', 'name');
    
    // Send notification to employer about negotiation
    if (offered_by === 'seeker') {
      try {
        await NotificationService.notifyOfferResponse(offer.employer_id, offer, 'negotiation');
      } catch (notificationError) {
        console.error('Error sending offer negotiation notification:', notificationError);
      }
    }
    
    res.status(200).json({ message: 'Counter offer submitted successfully', offer });
  } catch (error) {
    console.error('Error countering offer:', error);
    res.status(500).json({ message: 'Error countering offer', error: error.message });
  }
};

exports.getOffersForSeeker = async (req, res) => {
  try {
    const { seekerId } = req.params;
    const offers = await Offer.find({ seeker_id: seekerId })
      .populate('job_id')
      .populate('employer_id')
      .populate('agreement_id'); // Populate agreement_id
    res.status(200).json(offers);
  } catch (error) {
    console.error('Error fetching offers for seeker:', error);
    res.status(500).json({ message: 'Error fetching offers for seeker', error: error.message });
  }
};

exports.getOffersForEmployer = async (req, res) => {
  try {
    const { employerId } = req.params;
    const offers = await Offer.find({ employer_id: employerId })
      .populate('job_id')
      .populate('seeker_id')
      .populate('agreement_id');
    res.status(200).json(offers);
  } catch (error) {
    console.error('Error fetching offers for employer:', error);
    res.status(500).json({ message: 'Error fetching offers for employer', error: error.message });
  }
};
