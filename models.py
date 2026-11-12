from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Role(Base):
    __tablename__ = 'roles'

    id = Column(Integer, primary_key=True)
    name = Column(String(40), unique=True, nullable=False)

    users = relationship('User', back_populates='role')


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(160), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey('roles.id'), nullable=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    role = relationship('Role', back_populates='users')


class Policy(Base):
    __tablename__ = 'policies'

    id = Column(Integer, primary_key=True)
    policy_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_name = Column(String(120), nullable=False)
    coverage_type = Column(String(80), nullable=False)
    status = Column(String(30), default='Active')

    claims = relationship('Claim', back_populates='policy')


class Claim(Base):
    __tablename__ = 'claims'

    # Required because Azure SQL has an AFTER INSERT trigger
    # and SQL Server does not allow OUTPUT without INTO
    # when triggers are enabled.
    __table_args__ = {
        'implicit_returning': False
    }

    id = Column(Integer, primary_key=True)
    claim_number = Column(String(50), unique=True, nullable=False, index=True)
    policy_id = Column(Integer, ForeignKey('policies.id'), nullable=False, index=True)
    claim_type = Column(String(80), nullable=False)
    incident_date = Column(String(20), nullable=False)
    description = Column(Text, nullable=False)
    amount = Column(Float, default=0)
    status = Column(String(40), default='Submitted', index=True)
    risk_flag = Column(String(30), default='Clear')
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    policy = relationship('Policy', back_populates='claims')
    assessment = relationship(
        'DamageAssessment',
        back_populates='claim',
        uselist=False
    )
    settlement = relationship(
        'Settlement',
        back_populates='claim',
        uselist=False
    )


Index(
    'ix_claim_policy_type',
    'claims.policy_id',
    'claims.claim_type'
)


class DamageAssessment(Base):
    __tablename__ = 'damage_assessments'

    id = Column(Integer, primary_key=True)
    claim_id = Column(
        Integer,
        ForeignKey('claims.id'),
        unique=True,
        nullable=False
    )
    surveyor_name = Column(String(120), nullable=False)
    damage_level = Column(String(30), nullable=False)
    assessed_amount = Column(Float, default=0)
    remarks = Column(Text, default='')

    claim = relationship('Claim', back_populates='assessment')


class Settlement(Base):
    __tablename__ = 'settlements'

    id = Column(Integer, primary_key=True)
    claim_id = Column(
        Integer,
        ForeignKey('claims.id'),
        unique=True,
        nullable=False
    )
    approved_amount = Column(Float, default=0)
    payment_status = Column(String(30), default='Pending')
    processed_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    processed_at = Column(DateTime, default=datetime.utcnow)

    claim = relationship('Claim', back_populates='settlement')


class AuditLog(Base):
    __tablename__ = 'audit_logs'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    action = Column(String(120), nullable=False)
    entity = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, default='')
    created_at = Column(DateTime, default=datetime.utcnow, index=True)