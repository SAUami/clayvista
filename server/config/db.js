const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clayvista';

  // Attempt connecting to the configured URI with a quick 3-second timeout
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`\x1b[32m✔ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}\x1b[0m`);
    return conn;
  } catch (primaryErr) {
    console.warn(`\x1b[33m⚠ Primary MongoDB connection at ${uri} was not reachable (${primaryErr.message}).\x1b[0m`);

    // In development or test, automatically launch in-memory MongoDB so the entire application runs with zero configuration friction
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log(`\x1b[36mℹ Initializing auto-managed in-memory MongoDB engine for seamless development...\x1b[0m`);
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const memUri = mongodInstance.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`\x1b[32m✔ In-Memory MongoDB Started & Connected: ${memUri}\x1b[0m`);
        return conn;
      } catch (memErr) {
        console.error(`\x1b[31m✖ In-Memory MongoDB could not be started: ${memErr.message}\x1b[0m`);
        console.error(`Please ensure MongoDB is running or specify a valid MONGODB_URI in your .env file.`);
        throw primaryErr;
      }
    } else {
      throw primaryErr;
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };
