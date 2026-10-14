import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

const testMongo = async (): Promise<void> => {
  let uri = process.env.MONGODB_URI || '';
  // Clean quotes if present
  uri = uri.replace(/^["']|["']$/g, '');

  console.log('========================================================');
  console.log('🔍 Testing MongoDB Atlas Connection');
  console.log('========================================================');
  console.log(`- Connection String: ${uri.replace(/:([^@]+)@/, ':****@')}`);

  if (!uri.includes('/nexora_erp') && !uri.includes('/?')) {
    // Append default database name if missing
    if (uri.endsWith('/')) {
      uri += 'nexora_erp?retryWrites=true&w=majority';
    } else {
      uri += '/nexora_erp?retryWrites=true&w=majority';
    }
  }

  try {
    console.log('\n[Step 1] Attempting native client connection to Atlas cluster...');
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    await client.connect();
    console.log('  ✅ Native MongoClient connected successfully!');

    const pingRes = await client.db().command({ ping: 1 });
    console.log('  ✅ Ping command response:', pingRes);

    const dbs = await client.db().admin().listDatabases();
    console.log(`  ✅ Successfully authenticated! Available databases (${dbs.databases.length}):`);
    dbs.databases.forEach((db: any) => console.log(`     - ${db.name} (${db.sizeOnDisk || 0} bytes)`));

    await client.close();

    console.log('\n[Step 2] Testing Mongoose connection and model operation...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('  ✅ Mongoose connected successfully!');

    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log(`  ✅ Existing collections in nexora_erp: ${collections?.length || 0}`);

    await mongoose.disconnect();

    console.log('\n========================================================');
    console.log('🎉 MONGODB ATLAS CONNECTION VERIFIED & WORKING 100%!');
    console.log('========================================================\n');
  } catch (err: any) {
    console.error('\n❌ MongoDB Connection Error:', err.message);
    console.error('\nTips for MongoDB Atlas:');
    console.error('1. Check Network Access in Atlas dashboard: Ensure 0.0.0.0/0 (Allow access from anywhere) or your current IP is whitelisted.');
    console.error('2. Check Database User privileges: Ensure user has readWriteAnyDatabase or atlasAdmin permissions.');
    process.exit(1);
  }
};

testMongo();
