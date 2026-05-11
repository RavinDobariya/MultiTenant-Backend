from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Doc Management API"
    ENV: str = "dev"

    JWT_SECRET_KEY: str = "dev-only-change-me"
    JWT_ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 5
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "multitenant_docs"

    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    CLOUDINARY_FOLDER: str = "fastapi_docs"

    DATABASE_URL: str = "mysql+mysqlconnector://root:@127.0.0.1:3306/multitenant_docs"

    REDIS_URL: str = "redis://127.0.0.1:6379/0"
    DEFAULT_TTL: int = 300

    REDIS_BROKER_URL: str = "redis://127.0.0.1:6379/1"
    REDIS_BACKEND_URL: str = "redis://127.0.0.1:6379/2"

    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"


settings = Settings()
