import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { config } from './index.js';

let mongodInstance: MongoMemoryServer | null = null;
let activeMemoryUri: string | null = null;

export const connectDatabase = async (uriOverride?: string): Promise<typeof mongoose> => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (activeMemoryUri && !uriOverride) {
    return await mongoose.connect(activeMemoryUri);
  }

  const uri = uriOverride || config.mongodbUri;

  try {
    // If local without auth credentials, probe with standalone client to avoid dirtying Mongoose pool
    if (!uri.includes('@') && uri.includes('27017')) {
      const probeClient = new MongoClient(uri, { serverSelectionTimeoutMS: 500 });
      try {
        await probeClient.connect();
        await probeClient.db().command({ ping: 1 });
        await probeClient.db().listCollections().toArray();
        await probeClient.close();
      } catch (probeErr: any) {
        await probeClient.close().catch(() => {});
        throw new Error(`MongoDB probe failed: ${probeErr.message}`);
      }
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log('[Database] 🟢 Connected to configured MongoDB');
    return conn;
  } catch (err: any) {
    console.warn(`[Database] ⚠️ Configured MongoDB (${uri}) not accessible (${err.message}). Starting in-memory MongoDB engine...`);

    if (!mongodInstance) {
      mongodInstance = await MongoMemoryServer.create();
      activeMemoryUri = mongodInstance.getUri();
    }

    console.log(`[Database] 🟢 Connected to in-memory MongoDB engine: ${activeMemoryUri}`);
    return await mongoose.connect(activeMemoryUri!);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
    activeMemoryUri = null;
  }
  console.log('[Database] ⚪ MongoDB connection closed');
};
