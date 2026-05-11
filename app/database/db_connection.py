import mysql.connector
from mysql.connector import Error
from fastapi import HTTPException
from app.utils.config import settings


def get_connection():
    try:
        connection = mysql.connector.connect(
            host=settings.DB_HOST,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            database=settings.DB_NAME,
            port=settings.DB_PORT,
        )
        return connection
    except Error as e:
        raise HTTPException(
            status_code=503,
            detail=f"Database connection error: {e}",
        ) from e
