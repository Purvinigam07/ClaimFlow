from pydantic import BaseModel, Field


class LoginIn(BaseModel):
    email: str
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
    amount: float = Field(default=0, ge=0)


class StatusIn(BaseModel):
    status: str


class AssessmentIn(BaseModel):
    surveyor_name: str
    damage_level: str
    assessed_amount: float = Field(default=0, ge=0)
    remarks: str = ""


class SettlementIn(BaseModel):
    approved_amount: float = Field(default=0, ge=0)
