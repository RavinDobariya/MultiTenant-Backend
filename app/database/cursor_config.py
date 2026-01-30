from app.database.db_connection import get_connection
from app.utils.logger import logger

def get_db():
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)         #return rows as dict => otherwise as tuple
    logger.info(f"Database connection established")
    try:
        yield cursor, connection   # <-- route uses it here
        
    finally:
        cursor.close()
        connection.close()
        logger.info(f"Database connection closed")
        
        
#In API call use like this:
       
# def some_route(data: = Depends(get_db)):  => cursor, connection = data
#Before yield → configurates DB connection + cursor
#At yield → give (cursor, conn) to your route
#After request finishes → FastAPI resumes function and runs finally block → closes cursor + connection