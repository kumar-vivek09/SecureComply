require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Client = require('./models/Client');
const Log = require('./models/Log');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cyber-soc';

const seed = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding.');

    const adminPassword = await bcrypt.hash('Admin123!', 10);

    await User.updateOne(
      { username: 'admin' },
      { username: 'admin', password: adminPassword, role: 'admin' },
      { upsert: true }
    );

    const sampleClients = [
      { clientId: 'Client-01', status: 'connected', complianceStatus: 'compliant', score: 95 },
      { clientId: 'Client-02', status: 'connected', complianceStatus: 'non-compliant', score: 62 },
      { clientId: 'Client-03', status: 'connected', complianceStatus: 'compliant', score: 88 },
      { clientId: 'Client-04', status: 'disconnected', complianceStatus: 'non-compliant', score: 0 },
      { clientId: 'Client-05', status: 'connected', complianceStatus: 'compliant', score: 91 },
      { clientId: 'Client-06', status: 'connected', complianceStatus: 'warning', score: 74 },
    ];

    await Client.deleteMany({});
    await Client.insertMany(sampleClients);

    const sampleLogs = [
      { message: 'System boot completed.', level: 'info', timestamp: new Date(Date.now() - 1000 * 60 * 25) },
      { message: 'Compliance scan completed successfully.', level: 'info', timestamp: new Date(Date.now() - 1000 * 60 * 20) },
      { message: 'Client-04 reported disconnected status.', level: 'warning', timestamp: new Date(Date.now() - 1000 * 60 * 15) },
      { message: 'Port scan detected suspicious service on Client-06.', level: 'warning', timestamp: new Date(Date.now() - 1000 * 60 * 10) },
      { message: 'Admin user logged in successfully.', level: 'info', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
    ];

    await Log.deleteMany({});
    await Log.insertMany(sampleLogs);

    console.log('Seeding completed. Admin credentials: admin / Admin123!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
