from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Meridien Blue Carbon Registry"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgrespassword@localhost:5432/meridien_db"
    
    # Blockchain / Web3
    RPC_URL: str = "http://127.0.0.1:8545"
    CHAIN_ID: int = 31337
    PROJECT_REGISTRY_ADDRESS: Optional[str] = None
    MRV_RECORD_ADDRESS: Optional[str] = None
    BLUE_CARBON_TOKEN_ADDRESS: Optional[str] = None
    DEPLOYER_PRIVATE_KEY: Optional[str] = None

    # IPFS
    IPFS_GATEWAY: str = "https://ipfs.io/ipfs/"
    IPFS_API_URL: str = "http://127.0.0.1:5001/api/v0"
    PINATA_JWT: Optional[str] = None

    # Auth & Security
    JWT_SECRET: str = "supersecret_meridien_jwt_token_2026_sih"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
