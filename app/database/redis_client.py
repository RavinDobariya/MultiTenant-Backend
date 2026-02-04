import redis.asyncio as redis
from app.utils.config import settings


REDIS_URL = settings.REDIS_URL

redis_client = redis.from_url(REDIS_URL,decode_responses=True) # decode_responses=True => return string not bytes

#redis connect once on first .set(key,val) request (Lazy connection) and then reuse connection
#reconnect only when => app restarts/crash