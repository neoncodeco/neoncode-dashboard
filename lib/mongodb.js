
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not defined");

let cached = global._mongoClientPromise;

if (!cached) {
  const client = new MongoClient(uri, { 
    maxPoolSize: 5,
  minPoolSize: 1
   });
  cached = client.connect();
  global._mongoClientPromise = cached;
}

export default async function getDB() {
  const client = await cached;
  const db = client.db("neoncode_dashboard_db");
  return { client, db };
}