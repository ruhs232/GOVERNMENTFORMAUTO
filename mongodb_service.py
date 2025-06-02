# mongodb_service.py
from pymongo import MongoClient
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "myAppDB"
COLL_NAME = "submissions"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
coll = db[COLL_NAME]

def save_submission(data: dict) -> str:
    result = coll.insert_one(data)
    return str(result.inserted_id)
