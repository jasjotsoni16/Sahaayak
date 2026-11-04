const Investor = require('../Model/Investor');
const InvestorProposal = require('../Model/InvestorProposal');
const User = require('../Model/User');
const Agreement = require('../Model/Agreement'); // Import Agreement model
const PDFDocument = require('pdfkit');
const { PassThrough } = require('stream');
const creditScoreService = require('../services/creditScoreService');

// Create Investor Profile
exports.createInvestorProfile = async (req, res) => {
  try {
    const { user_id, investment_categories, preferred_equity_range, available_funds } = req.body;
    const newInvestor = new Investor({ user_id, investment_categories, preferred_equity_range, available_funds });
    const investor = await newInvestor.save();
    res.status(201).json(investor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get Investor Profile by User ID
exports.getInvestorProfileByUserId = async (req, res) => {
  try {
    const investor = await Investor.findOne({ user_id: req.params.userId });
    if (!investor) {
      return res.status(404).json({ message: 'Investor profile not found' });
    }
    res.status(200).json(investor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Investor Profile
exports.updateInvestorProfile = async (req, res) => {
  try {
    const updatedInvestor = await Investor.findOneAndUpdate({ user_id: req.params.userId }, req.body, { new: true });
    if (!updatedInvestor) {
      return res.status(404).json({ message: 'Investor profile not found' });
    }
    res.status(200).json(updatedInvestor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Create Investor Proposal
exports.createInvestorProposal = async (req, res) => {
  try {
    const { user_id, suggested_amount, offered_equity_percentage, business_idea, expected_monthly_revenue, expected_roi_months, pitch_video_url } = req.body;
    const newProposal = new InvestorProposal({ user_id, suggested_amount, offered_equity_percentage, business_idea, expected_monthly_revenue, expected_roi_months, pitch_video_url });
    const proposal = await newProposal.save();
    const creditScore = await creditScoreService.calculateCreditScore(user_id);
    res.status(201).json({ ...proposal.toObject(), creditScore });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get Investor Proposals by User ID
exports.getInvestorProposalsByUserId = async (req, res) => {
  try {
    const proposals = await InvestorProposal.find({ user_id: req.params.userId })
      .populate('user_id', 'name email')
      .populate('agreement_id')
      .populate({ 
        path: 'user_id',
        populate: {
          path: 'credit_score',
          model: 'CreditScore',
          select: 'score'
        }
      });
    res.status(200).json(proposals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all Investor Proposals (for admin/investor browsing)
exports.getAllInvestorProposals = async (req, res) => {
  try {
    const proposals = await InvestorProposal.find()
      .populate('user_id', 'name email')
      .populate('agreement_id')
      .populate({ 
        path: 'user_id',
        populate: {
          path: 'credit_score',
          model: 'CreditScore',
          select: 'score'
        }
      });
    res.status(200).json(proposals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single Investor Proposal by ID
exports.getInvestorProposalById = async (req, res) => {
  try {
    const proposal = await InvestorProposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ message: 'Investor proposal not found' });
    }
    res.status(200).json(proposal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Investor Proposal Status
exports.updateInvestorProposalStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const proposal = await InvestorProposal.findById(req.params.id).populate('user_id');

    if (!proposal) {
      return res.status(404).json({ message: 'Investor proposal not found' });
    }

    if (status === 'funded' && proposal.status !== 'funded') {
      // Generate Investment Agreement PDF
      const agreementContent = `
        INVESTMENT AGREEMENT\n\n
        This Investment Agreement ("Agreement") is made and entered into on ${new Date().toLocaleDateString()} 

        BETWEEN:

        Investor: ${req.user.name} (ID: ${req.user._id}) // Assuming authenticated user is the investor

        AND

        Investee: ${proposal.user_id.name} (ID: ${proposal.user_id._id})


        WHEREAS, Investor desires to invest in Investee's business, and Investee desires to accept such investment, upon the terms and conditions hereinafter set forth.\n
        NOW, THEREFORE, in consideration of the mutual covenants and promises herein contained, the parties hereto agree as follows:\n
        1. Investment Amount: The investment amount is ₹${proposal.suggested_amount}.\n
        2. Equity Percentage: The Investor shall receive ${proposal.offered_equity_percentage}% equity in the business.\n
        3. Business Idea: The investment is for the business idea: ${proposal.business_idea}.\n
        4. Expected Monthly Revenue: Expected monthly revenue is ₹${proposal.expected_monthly_revenue || 'N/A'}.\n
        5. Expected ROI Months: Expected return on investment in ${proposal.expected_roi_months || 'N/A'} months.\n
        6. Governing Law: This Agreement shall be governed by and construed in accordance with the laws of India.\n
        IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.\n
        _________________________                _________________________

        Investor Signature                       Investee Signature

        ${req.user.name}                         ${proposal.user_id.name}
      `;

      const doc = new PDFDocument();
      const stream = new PassThrough();
      let pdfBuffer = Buffer.from('');

      doc.pipe(stream);

      doc.fontSize(24).font('Helvetica-Bold').text('INVESTMENT AGREEMENT', { align: 'center' });
      doc.moveDown(1.5);

      doc.fontSize(12).font('Helvetica').text(`This Investment Agreement ("Agreement") is made and entered into on ${new Date().toLocaleDateString()}.`);
      doc.moveDown();

      doc.fontSize(14).font('Helvetica-Bold').text('BETWEEN:');
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Investor: ${req.user.name} (ID: ${req.user._id})`);
      doc.moveDown();

      doc.fontSize(14).font('Helvetica-Bold').text('AND', { align: 'center' });
      doc.moveDown();

      doc.fontSize(14).font('Helvetica-Bold').text('Investee:');
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Investee: ${proposal.user_id.name} (ID: ${proposal.user_id._id})`);
      doc.moveDown(1.5);

      doc.fontSize(12).font('Helvetica').text('WHEREAS, Investor desires to invest in Investee\'s business, and Investee desires to accept such investment, upon the terms and conditions hereinafter set forth.');
      doc.moveDown();

      doc.fontSize(12).font('Helvetica').text('NOW, THEREFORE, in consideration of the mutual covenants and promises herein contained, the parties hereto agree as follows:');
      doc.moveDown();

      // Clauses
      doc.fontSize(12).font('Helvetica-Bold').text('1. Investment Amount:');
      doc.fontSize(12).font('Helvetica').text(`   The investment amount is ₹${proposal.suggested_amount}.`);
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('2. Equity Percentage:');
      doc.fontSize(12).font('Helvetica').text(`   The Investor shall receive ${proposal.offered_equity_percentage}% equity in the business.`);
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('3. Business Idea:');
      doc.fontSize(12).font('Helvetica').text(`   The investment is for the business idea: ${proposal.business_idea}.`);
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('4. Expected Monthly Revenue:');
      doc.fontSize(12).font('Helvetica').text(`   Expected monthly revenue is ₹${proposal.expected_monthly_revenue || 'N/A'}.`);
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('5. Expected ROI Months:');
      doc.fontSize(12).font('Helvetica').text(`   Expected return on investment in ${proposal.expected_roi_months || 'N/A'} months.`);
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
      doc.text('Investor Signature', col1X, doc.y);
      doc.text('Investee Signature', col2X, doc.y);
      doc.moveDown(0.5);
      doc.text(`${req.user.name}`, col1X, doc.y);
      doc.text(`${proposal.user_id.name}`, col2X, doc.y);

      doc.end();

      stream.on('data', chunk => {
        pdfBuffer = Buffer.concat([pdfBuffer, chunk]);
      });

      stream.on('end', async () => {
        const agreement_pdf_base64 = pdfBuffer.toString('base64');

        const newAgreement = new Agreement({
          job_id: null, // No direct job_id for investment agreements
          seeker_id: proposal.user_id._id, // Investee is the seeker
          employer_id: req.user._id, // Investor is the employer
          investment_proposal_id: proposal._id, // Link to InvestorProposal
          agreement_content: agreementContent,
          agreement_pdf_base64: agreement_pdf_base64,
          status: 'pending_signing',
        });
        await newAgreement.save();

        // Update InvestorProposal with agreement ID
        proposal.agreement_id = newAgreement._id;
        await proposal.save();

        res.status(200).json(proposal);
      });
    } else {
      // If status is not 'funded' or already 'funded', just update status
      proposal.status = status;
      await proposal.save();
      res.status(200).json(proposal);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
