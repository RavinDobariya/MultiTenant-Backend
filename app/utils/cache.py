import json
from app.database.redis_client import redis_client
from app.utils.config import settings
from app.utils.logger import logger
import random

DEFAULT_TTL = settings.DEFAULT_TTL  # 5 minutes
# json.dumps(value) => convert python object to JSON string
# json.loads(value) => convert JSON string to a python object
# Redis does NOT understand Python objects
# Redis stores only => Strings, Bytes, Numbers (as string)

async def cache_get(key: str):
    """
    Get value from Redis by key
    """
    try:
        #print(key)
        data = await redis_client.get(key)

        if data:
            logger.info(f"\n\nRedis => Cache hit: key={key}\n")
            return json.loads(data)
        logger.info(f"\n\nRedis => Cache miss: key={key}\n")
        return None

    except Exception:       # If Redis fails → don't break app
        return None

                                     # ttl = DEFAULT_TTL => on cache expire thousand of requests will be made to DB => DB overload
async def cache_set(key: str, value):
    """
    Save value in Redis with TTL
    """
    try:
        #print(key)                                         # Cannot convert datetime to JSON => so use default=str
        ttl = random.randint(60, 120)
        data = json.dumps(value, default=str)               # If you find any object you don’t understand, convert it to string
        logger.info(f"Redis => Saving to cache: key={key}")
        await redis_client.set(key, data, ex=ttl)       #ex = Redis parameter expiry

    except Exception as e:       # Ignore cache failure
        logger.error(f"Redis => Failed to save to cache: key={key} || error={e}")
        pass


async def cache_delete(key: str):
    """
    Delete key from Redis
    """
    try:
        await redis_client.delete(key)
        logger.info(f"Redissss => Deleting from cache: key={key}")


    except Exception as e:
        logger.error(f"Redis => Failed to delete from cache: key={key}|| error={e}")
        pass

async def cache_delete_pattern(pattern: str):
    """
    Delete multiple keys by pattern
    """

    try:
        keys = await redis_client.keys(pattern)     # Get all keys that match this pattern

        if keys:
            await redis_client.delete(*keys)        # delete key (K1,K2,K3)

    except Exception:
        pass

"""
KEYS docs:company_5:documents:list*
keys =[
  "docs:company_5:documents:list:page_1",
  "docs:company_5:documents:list:page_2",
  "docs:company_5:documents:list:status_active"
]

"""