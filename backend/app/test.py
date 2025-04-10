import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the MongoDB connection URL and DB name from environment
MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")

print("MongoDB URL:", MONGODB_URL)
print("Database Name:", DATABASE_NAME)

client = MongoClient(
    MONGODB_URL,
    ssl=True,
    tlsAllowInvalidCertificates=True
)
print(client.list_database_names())
