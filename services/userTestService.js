const UserTest = require('../Model/UserTest');
 
exports.assignTest = (data) => UserTest.create(data);
exports.completeTest = (testId, data) =>
  UserTest.findByIdAndUpdate(testId, { ...data, status: 'completed', taken_on: new Date() }, { new: true }); 