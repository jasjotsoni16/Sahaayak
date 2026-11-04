const userDocumentService = require('../services/userDocumentService');
const Tesseract = require('tesseract.js');
const path = require('path');

const sharp = require('sharp');

exports.getUserDocuments = async (req, res) => {
  const docs = await userDocumentService.getUserDocuments(req.params.userId);
  res.json(docs);
};
exports.uploadDocument = async (req, res) => {
  let document_number = '';
  let filePath = req.file ? req.file.path : req.body.file_url;
  const documentType = req.body.document_type;

  // Only run OCR for images
  if (req.file && ['image/jpeg', 'image/png', 'image/jpg'].includes(req.file.mimetype)) {
    try {
      const image = sharp(path.resolve(filePath));
      const preprocessedImageBuffer = await image
        .grayscale()
        .linear(1.5, -128) // Increase contrast
        .toBuffer();

      const { data: { text } } = await Tesseract.recognize(preprocessedImageBuffer, 'eng');
      if (documentType === 'aadhaar') {
        // Aadhaar: 12 digits
        const match = text.replace(/\s/g, '').match(/\d{12}/);
        if (match) document_number = match[0];
      } else if (documentType === 'license') {
        // State-wise regex patterns for Indian DL numbers
        const stateDlPatterns = {
          AN: /AN[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          AP: /AP[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          AR: /AR[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          AS: /AS[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          BR: /BR[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          CH: /CH[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          CG: /CG[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          DD: /DD[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          DL: /DL[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          DN: /DN[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          GA: /GA[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          GJ: /GJ[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          HP: /HP[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          HR: /HR[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          JH: /JH[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          JK: /JK[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          KA: /KA[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          KL: /KL[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          LA: /LA[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          LD: /LD[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          MH: /MH[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          ML: /ML[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          MN: /MN[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          MP: /MP[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          MZ: /MZ[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          NL: /NL[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          OD: /OD[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          PB: /PB[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          PY: /PY[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          RJ: /RJ[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          SK: /SK[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          TN: /TN[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          TR: /TR[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          TS: /TS[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          UK: /UK[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          UP: /UP[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
          WB: /WB[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g,
        };
        const ocrCorrections = {
          'MM': 'MH', 'M1': 'MH', 'NH': 'MH', 'D1': 'DL', 'DI': 'DL', 'OL': 'DL',
          'K4': 'KA', 'VP': 'UP', 'UR': 'UP', 'R1': 'RJ', 'TH': 'TN', 'TV': 'TN',
          'G1': 'GJ', '6J': 'GJ', 'P8': 'PB', 'W8': 'WB', 'C1': 'CH',
          'OD1': 'OD', '0D': 'OD'
        };
        function correctOcrText(text) {
          let corrected = text;
          for (const [wrong, right] of Object.entries(ocrCorrections)) {
            const regex = new RegExp('\\b' + wrong, 'g');
            corrected = corrected.replace(regex, right);
          }
          return corrected;
        }
        let correctedText = correctOcrText(text);
        let found = false;
        let state = 'UNKNOWN';
        let dlNumber = '';
        for (const [st, pattern] of Object.entries(stateDlPatterns)) {
          const matches = correctedText.match(pattern);
          if (matches && matches.length > 0) {
            dlNumber = matches[0].replace(/[-\s]/g, '');
            state = st;
            found = true;
            break;
          }
        }
        if (!found) {
          // Fallback generic pattern
          const genericDlPattern = /[A-Z]{2}[-\s]?[0-9OIl]{2}[-\s]?[0-9OIl]{4}[-\s]?[0-9OIl]{7}/g;
          const matches = correctedText.match(genericDlPattern);
          if (matches && matches.length > 0) {
            dlNumber = matches[0].replace(/[-\s]/g, '');
            state = 'UNKNOWN';
          }
        }
        console.log('DL Extraction:', { state, dlNumber });
        if (dlNumber) document_number = dlNumber;
      } else if (documentType === 'pcc') {
        // PCC: Try to find a long number (8+ digits)
        const match = text.replace(/\s/g, '').match(/\d{8,}/);
        if (match) document_number = match[0];
      } else if (documentType === 'certificate') {
        // Certificate: Look for keywords and then extract the number.
        const nsdcKeywords = ['Certificate No', 'Certificate Number', 'Credential ID', 'Certiicate ID'];
        const itiKeywords = ['Certificate Number', 'Registration Number', 'NTC No'];

        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check for NSDC keywords
            for (const keyword of nsdcKeywords) {
                if (line.includes(keyword)) {
                    const match = line.match(new RegExp(keyword + '\\s*[:\\s-]?\\s*([A-Z0-9\\/-]+)'));
                    if (match && match[1]) {
                        document_number = match[1];
                        break;
                    }
                }
            }
            if (document_number) break;

            // Check for ITI keywords
            for (const keyword of itiKeywords) {
                if (line.includes(keyword)) {
                    const match = line.match(new RegExp(keyword + '\\s*[:\\s-]?\\s*([A-Z0-9\\/-]+)'));
                    if (match && match[1]) {
                        document_number = match[1];
                        break;
                    }
                }
            }
            if (document_number) break;
        }

        // Fallback if no keywords are found
        if (!document_number) {
            const fallbackPattern = /([A-Z0-9\/-]{10,})/;
            const match = text.match(fallbackPattern);
            if (match) {
                document_number = match[0];
            }
        }
      } else {
        // Fallback: Try to find any long number
        const match = text.replace(/\s/g, '').match(/\d{8,}/);
        if (match) document_number = match[0];
      }
    } catch (err) {
      // OCR failed, leave document_number blank
    }
  }

  const doc = await userDocumentService.uploadDocument(req.params.userId, {
    document_type: documentType,
    file_url: filePath,
    document_number
  });
  res.status(201).json(doc);
};
exports.verifyDocument = async (req, res) => {
  // Assume req.user._id is admin
  const doc = await userDocumentService.verifyDocument(req.params.docId, req.user._id);
  res.json(doc);
}; 