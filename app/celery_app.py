from celery import Celery
from app.utils.config import settings
from kombu import Queue

celery_app = Celery(
    "worker1",
    broker=settings.REDIS_BROKER_URL,      #store pending tasks
    backend=settings.REDIS_BACKEND_URL      #store results
)

celery_app.conf.update(
    task_serializer="json",     # conver data to json
    accept_content=["json"],    # accept json data
    result_serializer="json",   # return json data
    timezone="Asia/Kolkata",    # for logs
    enable_utc=True
)

celery_app.conf.task_queues = (
    Queue("high", routing_key="high"),          #routing key= high_queue => queue name to use as -Q high_queue
    Queue("default", routing_key="default"),
    Queue("low", routing_key="low"),
)
celery_app.conf.task_default_queue = "default"      #if not mentioned then goes to default

celery_app.autodiscover_tasks(["app.task.audit_task"])              #load tasks from audit_task.py
                                                                    #Cannot import tasks here because of circular dependency




# WorkFlow:
# FastAPI => Redis (Broker) => Celery (Worker) => Redis (Backend)

# Use Different Redis DB for Broker and Backend for storing data (clean)

# API data => Celery converts this to JSON before putting in Redis.
# Also provide security by only allowing JSON data.
# Bcuz JSON data is read only so no code run possible.


#celery -A app.celery_app worker -Q high -n workerA@%h
#✔ Read high queue
#Be named workerA@PC