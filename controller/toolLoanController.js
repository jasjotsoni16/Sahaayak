const ToolLoan = require('../Model/ToolLoan');
const Tool = require('../Model/Tool');
const User = require('../Model/User');
const Agreement = require('../Model/Agreement'); // Import Agreement model
const PDFDocument = require('pdfkit');
const { PassThrough } = require('stream');

// Request a tool loan
exports.requestToolLoan = async (req, res) => {
  try {
    const { tool_id, start_date, end_date, agreed_price } = req.body;
    const borrower_id = req.user._id; // Assuming borrower is the authenticated user

    const tool = await Tool.findById(tool_id);
    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }

    if (tool.owner_id.toString() === borrower_id.toString()) {
      return res.status(400).json({ message: 'Cannot request to borrow your own tool' });
    }

    // Check for overlapping loans
    const newStartDate = new Date(start_date);
    const newEndDate = new Date(end_date);

    const overlappingLoans = await ToolLoan.find({
      tool_id,
      status: { $in: ['accepted', 'ongoing'] },
      $or: [
        { start_date: { $lte: newEndDate, $gte: newStartDate } }, // Existing loan starts within new request
        { end_date: { $lte: newEndDate, $gte: newStartDate } },   // Existing loan ends within new request
        { start_date: { $lte: newStartDate }, end_date: { $gte: newEndDate } } // Existing loan encompasses new request
      ]
    });

    if (overlappingLoans.length > 0) {
      return res.status(400).json({ message: 'Tool is already booked for some part of the requested dates.' });
    }

    const newLoan = new ToolLoan({
      tool_id,
      borrower_id,
      lender_id: tool.owner_id,
      start_date,
      end_date,
      agreed_price,
      status: 'pending',
    });

    const loan = await newLoan.save();
    res.status(201).json(loan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Accept a tool loan request
exports.acceptToolLoan = async (req, res) => {
  try {
    const loan = await ToolLoan.findById(req.params.id)
      .populate('tool_id')
      .populate('borrower_id')
      .populate('lender_id');

    if (!loan) {
      return res.status(404).json({ message: 'Tool loan not found' });
    }

    // Ensure the lender is the owner of the tool
    if (loan.lender_id._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({ message: 'Loan is not in pending status' });
    }

    loan.status = 'accepted';
    await loan.save();

    // Generate agreement content
    const agreementContent = `
      TOOL LOAN AGREEMENT\n\n
      This Tool Loan Agreement ("Agreement") is made and entered into on ${new Date().toLocaleDateString()} 

      BETWEEN:

      Lender: ${loan.lender_id.name} (ID: ${loan.lender_id._id})

      AND

      Borrower: ${loan.borrower_id.name} (ID: ${loan.borrower_id._id})


      WHEREAS, Lender agrees to lend the Tool to Borrower, and Borrower agrees to borrow the Tool from Lender, upon the terms and conditions hereinafter set forth.\n
      NOW, THEREFORE, in consideration of the mutual covenants and promises herein contained, the parties hereto agree as follows:\n
      1. Tool: The Tool being loaned is ${loan.tool_id.name} (ID: ${loan.tool_id._id}).\n
      2. Loan Period: The loan shall commence on ${new Date(loan.start_date).toLocaleDateString()} and end on ${new Date(loan.end_date).toLocaleDateString()}.\n
      3. Agreed Price: The agreed price for the loan is ₹${loan.agreed_price}.\n
      4. Condition of Tool: The Borrower acknowledges receipt of the Tool in good working condition.\n
      5. Return: The Borrower agrees to return the Tool to the Lender at the end of the loan period in the same condition as received, reasonable wear and tear excepted.\n
      6. Governing Law: This Agreement shall be governed by and construed in accordance with the laws of India.\n
      IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.\n
      _________________________                _________________________

      Lender Signature                         Borrower Signature\n
      ${loan.lender_id.name}                   ${loan.borrower_id.name}
    `;

    // Generate PDF
    const doc = new PDFDocument();
    const stream = new PassThrough();
    let pdfBuffer = Buffer.from('');

    doc.pipe(stream);

    doc.fontSize(24).font('Helvetica-Bold').text('TOOL LOAN AGREEMENT', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(12).font('Helvetica').text(`This Tool Loan Agreement ("Agreement") is made and entered into on ${new Date().toLocaleDateString()}.`);
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('BETWEEN:');
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`Lender: ${loan.lender_id.name} (ID: ${loan.lender_id._id})`);
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('AND', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold').text('Borrower:');
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`Borrower: ${loan.borrower_id.name} (ID: ${loan.borrower_id._id})`);
    doc.moveDown(1.5);

    doc.fontSize(12).font('Helvetica').text('WHEREAS, Lender agrees to lend the Tool to Borrower, and Borrower agrees to borrow the Tool from Lender, upon the terms and conditions hereinafter set forth.');
    doc.moveDown();

    doc.fontSize(12).font('Helvetica').text('NOW, THEREFORE, in consideration of the mutual covenants and promises herein contained, the parties hereto agree as follows:');
    doc.moveDown();

    // Clauses
    doc.fontSize(12).font('Helvetica-Bold').text('1. Tool:');
    doc.fontSize(12).font('Helvetica').text(`   The Tool being loaned is ${loan.tool_id.name} (ID: ${loan.tool_id._id}).`);
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('2. Loan Period:');
    doc.fontSize(12).font('Helvetica').text(`   The loan shall commence on ${new Date(loan.start_date).toLocaleDateString()} and end on ${new Date(loan.end_date).toLocaleDateString()}.`);
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('3. Agreed Price:');
    doc.fontSize(12).font('Helvetica').text(`   The agreed price for the loan is ₹${loan.agreed_price}.`);
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('4. Condition of Tool:');
    doc.fontSize(12).font('Helvetica').text('   The Borrower acknowledges receipt of the Tool in good working condition.');
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('5. Return:');
    doc.fontSize(12).font('Helvetica').text('   The Borrower agrees to return the Tool to the Lender at the end of the loan period in the same condition as received, reasonable wear and tear excepted.');
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
    doc.text('Lender Signature', col1X, doc.y);
    doc.text('Borrower Signature', col2X, doc.y);
    doc.moveDown(0.5);
    doc.text(`${loan.lender_id.name}`, col1X, doc.y);
    doc.text(`${loan.borrower_id.name}`, col2X, doc.y);

    doc.end();

    stream.on('data', chunk => {
      pdfBuffer = Buffer.concat([pdfBuffer, chunk]);
    });

    stream.on('end', async () => {
      const agreement_pdf_base64 = pdfBuffer.toString('base64');

      const newAgreement = new Agreement({
        job_id: loan.tool_id._id, // Using tool_id as job_id for agreement context
        seeker_id: loan.borrower_id._id,
        employer_id: loan.lender_id._id,
        agreement_content: agreementContent,
        agreement_pdf_base64: agreement_pdf_base64,
        status: 'pending_signing',
      });
      await newAgreement.save();

      // Update the ToolLoan with the agreement ID
      loan.agreement_id = newAgreement._id;
      await loan.save();

      res.status(200).json({ message: 'Tool loan accepted and agreement generated', loan, agreement: newAgreement });
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Reject a tool loan request
exports.rejectToolLoan = async (req, res) => {
  try {
    const loan = await ToolLoan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Tool loan not found' });
    }

    // Ensure the lender is the owner of the tool
    if (loan.lender_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({ message: 'Loan is not in pending status' });
    }

    loan.status = 'rejected';
    await loan.save();

    res.status(200).json({ message: 'Tool loan rejected', loan });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Confirm tool return (by lender)
exports.confirmToolReturn = async (req, res) => {
  try {
    const loan = await ToolLoan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Tool loan not found' });
    }

    // Ensure the lender is confirming the return
    if (loan.lender_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (loan.status !== 'ongoing') {
      return res.status(400).json({ message: 'Loan is not in ongoing status' });
    }

    loan.return_confirmed = true;
    loan.status = 'completed';
    await loan.save();

    // Optionally, handle deposit refund here

    res.status(200).json({ message: 'Tool return confirmed', loan });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all loans for a borrower
exports.getBorrowerLoans = async (req, res) => {
  try {
    const loans = await ToolLoan.find({ borrower_id: req.params.userId })
      .populate('tool_id')
      .populate('lender_id', 'name email')
      .populate('agreement_id');
    res.status(200).json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all loans for a lender
exports.getLenderLoans = async (req, res) => {
  try {
    const loans = await ToolLoan.find({ lender_id: req.params.userId })
      .populate('tool_id')
      .populate('borrower_id', 'name email')
      .populate('agreement_id');
    res.status(200).json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLoanByToolAndBorrower = async (req, res) => {
  try {
    const { toolId, borrowerId } = req.params;
    const loan = await ToolLoan.findOne({ tool_id: toolId, borrower_id: borrowerId, status: { $in: ['pending', 'accepted', 'ongoing'] } })
      .populate('tool_id')
      .populate('lender_id', 'name email');
    res.status(200).json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

