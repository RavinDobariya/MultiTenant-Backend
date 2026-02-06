from app.celery_app import celery_app
from app.services.audit_service import create_audit_log
from app.utils.logger import logger
from celery.result import AsyncResult

import time

@celery_app.task( bind=True,
                  autoretry_for=(Exception,),       #auto retry on error
                  retry_backoff=5,                  #Delay between retries(5->10->20->40)
                  retry_kwargs={"max_retries": 3},  #Max retries
                  rate_limit="3/m",                #limit 10 tasks per minute
                  acks_late=True,                   #worker send ack after success
                  queue="high"                      #if task fail => no ack => task goes back to queue
                  )

def create_audit_log_task(self,action,entity_id,user_id):
    logger.info("audit task called || working in background")
    #time.sleep(30)  #=> simulate heavy task

    """
    To ensure excute once || idempotent task
    generate unique redis key and cache set in redis memory (exp:10 mins)
    logic: if key exist in redis => task already executed
    """

    return create_audit_log(action,entity_id,user_id)

"""
This Logic will not work as expected
=> At server crash again task is send to background to run with NEW TASK ID
task_id = self.request.id
    result = AsyncResult(task_id)

    if result.status == "SUCCESS":
        return { "status": "task already completed"}
"""