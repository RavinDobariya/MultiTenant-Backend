from logging.config import fileConfig

from alembic import context
import mysql.connector
from sqlalchemy import create_engine, pool
from sqlalchemy.engine import URL, make_url

from app.utils.config import settings

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = None


def get_database_url() -> str:
    raw_url = settings.DATABASE_URL.strip()

    if raw_url:
        url = make_url(raw_url)
        if url.get_backend_name() == "mysql":
            return str(url.set(drivername="mysql+mysqlconnector"))

    return str(
        URL.create(
            drivername="mysql+mysqlconnector",
            username=settings.DB_USER,
            password=settings.DB_PASSWORD,
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            database=settings.DB_NAME,
        )
    )


def run_migrations_offline() -> None:
    context.configure(
        url=get_database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(
        "mysql+mysqlconnector://",
        creator=lambda: mysql.connector.connect(
            host=settings.DB_HOST,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            database=settings.DB_NAME,
            port=settings.DB_PORT,
        ),
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
