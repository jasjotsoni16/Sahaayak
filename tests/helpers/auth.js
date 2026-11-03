const jwt = require('jsonwebtoken');
const User = require('../../Model/User');

let counter = 0;

exports.makeUser = async (role = 'seeker', overrides = {}) => {
  counter += 1;
  const user = await User.create({
    name: `Test ${role} ${counter}`,
    phone_number: String(9000000000 + counter),
    password: 'not-a-real-hash',
    role,
    ...overrides,
  });
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { user, token, auth: { Authorization: `Bearer ${token}` } };
};
