import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    SURVEYOR = "SURVEYOR"
    VERIFIER_MOES = "VERIFIER_MOES"
    VERIFIER_NCCR = "VERIFIER_NCCR"
    DEVELOPER = "DEVELOPER"
    BUYER = "BUYER"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.SURVEYOR)
    wallet_address = Column(String(42), nullable=True, index=True)
    organization = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
