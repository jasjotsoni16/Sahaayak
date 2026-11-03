const UserDocument = require('../Model/UserDocument');
 
exports.getUserDocuments = (userId) => UserDocument.find({ user_id: userId });
exports.uploadDocument = (userId, data) => UserDocument.create({ ...data, user_id: userId });
exports.verifyDocument = (docId, adminId) =>
  UserDocument.findByIdAndUpdate(docId, { verified: true, verified_by: adminId, verified_at: new Date() }, { new: true }); 