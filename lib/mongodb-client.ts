import { MongoClient } from "mongodb"

const options = {}

let clientPromise: Promise<MongoClient> | undefined

function getMongoUri() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable")
  }
  return uri
}

export function getMongoClientPromise() {
  if (clientPromise) return clientPromise

  const uri = getMongoUri()
  const client = new MongoClient(uri, options)

  if (process.env.NODE_ENV === "development") {
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }
    if (!globalWithMongo._mongoClientPromise) {
      globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromise = globalWithMongo._mongoClientPromise
    return clientPromise
  }

  clientPromise = client.connect()
  return clientPromise
}

export default getMongoClientPromise
