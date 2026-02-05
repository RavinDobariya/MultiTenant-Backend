from app.celery_app import celery_app
import time

@celery_app.task( bind=True,
                  autoretry_for=(Exception,),       #auto retry on error
                  retry_backoff=5,                  #Delay between retries(5->10->20->40)
                  retry_kwargs={"max_retries": 3},  #Max retries
                  rate_limit="10/m",                #limit 10 tasks per minute
                  acks_late=True                    #worker send ack after success
                  )                                 #if task fail => no ack => task goes back to queue

def send_email(self):                               # must use self when using bind=True
    print("Before: Sending Email")
    time.sleep(10)                                  #fake delay to simulate heavy task
    print("After: Email Sent")
    return f"Email Sent Successfully"
