import json
from app.database.redis_client import redis_client
from app.utils.config import settings

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
        data = await redis_client.get(key)

        if data:
            return json.loads(data)

        return None

    except Exception:       # If Redis fails → don't break app
        return None


async def cache_set(key: str, value, ttl: int = DEFAULT_TTL):
    """
    Save value in Redis with TTL
    """
    try:
        data = json.dumps(value)

        await redis_client.set(key, data, ex=ttl)       #ex = Redis parameter expiry

    except Exception:       # Ignore cache failure
        pass


async def cache_delete(key: str):
    """
    Delete key from Redis
    """
    try:
        await redis_client.delete(key)

    except Exception:
        pass
