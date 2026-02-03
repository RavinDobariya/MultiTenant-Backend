from slowapi import Limiter
from slowapi.util import get_remote_address  # to get user ip address
from slowapi.middleware import SlowAPIMiddleware

def setup_rate_limit(app, limiter):
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)
# Uses client IP automatically
limiter = Limiter(key_func=get_remote_address)

