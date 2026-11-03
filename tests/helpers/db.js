const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

exports.connect = async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('sahaayak_test'));
};

exports.clear = async () => {
  for (const c of Object.values(mongoose.connection.collections)) {
    await c.deleteMany({});
  }
};

exports.close = async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
};
