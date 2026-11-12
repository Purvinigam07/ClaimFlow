from pydantic import BaseModel, EmailStr


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str


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
