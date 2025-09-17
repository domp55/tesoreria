#!/usr/bin/env python3
"""
Script to create a test user for the Sistema de Aportes
"""
import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
import hashlib
import uuid
from datetime import datetime, timezone

# Add the backend directory to the path
sys.path.append('/app/backend')

# MongoDB connection
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

async def create_test_user():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Test user data
    user_data = {
        "id": str(uuid.uuid4()),
        "username": "tesorero1",
        "password": hash_password("password123"),
        "paralelo_name": "8vo Año A",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Check if user already exists
    existing_user = await db.users.find_one({"username": user_data["username"]})
    if existing_user:
        print(f"User '{user_data['username']}' already exists!")
        return
    
    # Create the user
    await db.users.insert_one(user_data)
    print(f"Created test user:")
    print(f"  Username: {user_data['username']}")
    print(f"  Password: password123")
    print(f"  Paralelo: {user_data['paralelo_name']}")
    print(f"  User ID: {user_data['id']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_test_user())