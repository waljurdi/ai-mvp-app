import os
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the MongoDB connection URL and DB name from environment
MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")

# Create a new client and connect to the server
client = MongoClient(MONGODB_URL, server_api=ServerApi('1'))
# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)

# Example function to get a product by barcode
db = client[DATABASE_NAME]
product = db.products.find_one({"barcode": "9780141033570"})
print(product)
