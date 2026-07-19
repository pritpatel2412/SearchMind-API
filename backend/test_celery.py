from celery import Celery
app = Celery('test')
@app.task
def my_task(url, max_depth, max_pages):
    pass

if __name__ == '__main__':
    try:
        print("Testing delay with kwargs...")
        # Mock connection to avoid actual redis
        my_task.apply_async = lambda args, kwargs: print("apply_async called with", args, kwargs)
        my_task.delay(url="http", max_depth=1, max_pages=2)
    except Exception as e:
        print("EXCEPTION:", e)
