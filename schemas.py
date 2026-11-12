from pydantic import BaseModel, field_validator
import re


class LoginIn(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value):
        value = value.strip().lower()

        pattern = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"

        if not re.match(pattern, value):
            raise ValueError("Please enter a valid email address.")

        return value


class RegisterIn(BaseModel):
    name: str
    email: str
    password: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        value = value.strip()

        if len(value) < 2:
            raise ValueError("Name must contain at least 2 characters.")

        return value


    @field_validator("email")
    @classmethod
    def validate_email(cls, value):
        value = value.strip().lower()

        pattern = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"

        if not re.match(pattern, value):
            raise ValueError("Please enter a valid email address.")

        return value


    @field_validator("password")
    @classmethod
    def validate_password(cls, value):
        if len(value) < 6:
            raise ValueError("Password must be at least 6 characters.")

        return value


class ClaimCreate(BaseModel):
    policy_id: int
    claim_type: str
    incident_date: str
    description: str
    amount: float


class StatusIn(BaseModel):
    status: str


class AssessmentIn(BaseModel):
    surveyor_name: str
    damage_level: str
    assessed_amount: float
    remarks: str


class SettlementIn(BaseModel):
    approved_amount: float
