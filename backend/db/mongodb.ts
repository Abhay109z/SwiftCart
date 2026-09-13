import { MongoClient, Db } from 'mongodb';
import { mockProducts } from '../data/products.js';
import { mockDarkStores } from '../data/darkStores.js';

let client: MongoClient | null = null;
let db: Db | null = null;
let connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
let lastError: string | null = null;
let pingLatencyMs: number | null = null;

function normalizeMongoUri(rawUri?: string): string | null {
  if (!rawUri) return null;
  let uri = rawUri.trim();
  // Fix cases where mongodb+srv: was written without double slashes
  if (uri.startsWith('mongodb+srv:') && !uri.startsWith('mongodb+srv://')) {
    uri = uri.replace('mongodb+srv:', 'mongodb+srv://');
  } else if (uri.startsWith('mongodb:') && !uri.startsWith('mongodb://')) {
    uri = uri.replace('mongodb:', 'mongodb://');
  }
  return uri;
}

export async function getMongoDb(): Promise<Db | null> {
  if (db && connectionStatus === 'connected') {
    return db;
  }

  const rawUri = process.env.MONGODB_URI || 'mongodb+srv://abhayk78554_db_user:Bra10ORCKO6oSnTC@cluster0.a8jwybm.mongodb.net/swiftcart?retryWrites=true&w=majority';
  const uri = normalizeMongoUri(rawUri);

  if (!uri) {
    connectionStatus = 'disconnected';
    return null;
  }

  try {
    connectionStatus = 'connecting';
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    const start = Date.now();
    await client.connect();
    pingLatencyMs = Date.now() - start;

    db = client.db('swiftcart');
    connectionStatus = 'connected';
    lastError = null;

    // Seed collections if empty in background
    seedInitialData(db).catch((err) => {
      console.warn('[MongoDB] Seed error:', err);
    });

    console.log(`[MongoDB] Successfully connected to MongoDB Atlas (swiftcart) in ${pingLatencyMs}ms`);
    return db;
  } catch (err: unknown) {
    connectionStatus = 'error';
    lastError = err instanceof Error ? err.message : 'Unknown MongoDB connection error';
    console.warn('[MongoDB] Connection failed, continuing with in-memory resilient fallback:', lastError);
    return null;
  }
}

async function seedInitialData(database: Db) {
  try {
    const productsColl = database.collection('products');
    const count = await productsColl.countDocuments();
    if (count === 0) {
      await productsColl.insertMany(mockProducts.map((p) => ({ ...p, _seededAt: new Date() })));
      console.log(`[MongoDB] Initialized ${mockProducts.length} products in MongoDB`);
    }

    const storesColl = database.collection('dark_stores');
    const storeCount = await storesColl.countDocuments();
    if (storeCount === 0) {
      await storesColl.insertMany(mockDarkStores.map((s) => ({ ...s, _seededAt: new Date() })));
      console.log(`[MongoDB] Initialized ${mockDarkStores.length} dark stores in MongoDB`);
    }
  } catch (err) {
    console.warn('[MongoDB] Background seeding notice:', err);
  }
}

export async function persistOrderToMongo(order: any) {
  try {
    const database = await getMongoDb();
    if (!database) return;
    const ordersColl = database.collection('orders');
    await ordersColl.updateOne(
      { id: order.id },
      { $set: { ...order, updatedAt: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.warn('[MongoDB] Order persist notice:', err);
  }
}

export async function persistPartnerApplicationToMongo(application: any) {
  try {
    const database = await getMongoDb();
    if (!database) return;
    const partnersColl = database.collection('delivery_partners');
    await partnersColl.updateOne(
      { id: application.id },
      { $set: { ...application, updatedAt: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.warn('[MongoDB] Partner application persist notice:', err);
  }
}

export function getMongoTelemetry() {
  return {
    status: connectionStatus,
    database: 'swiftcart',
    cluster: 'cluster0.a8jwybm.mongodb.net',
    pingLatencyMs,
    lastError,
  };
}
