from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    UploadFile,
    File
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import (
    OAuth2PasswordBearer,
    OAuth2PasswordRequestForm
)

from sqlalchemy.orm import Session
from sqlalchemy import func

from passlib.context import CryptContext
from jose import jwt

from datetime import datetime, timedelta
from pathlib import Path

import os
import shutil
import uuid

from azure.storage.blob import BlobServiceClient
from azure.cosmos import CosmosClient

from database import Base, engine, get_db

from models import (
    Role,
    User,
    Policy,
    Claim,
    DamageAssessment,
    Settlement,
    AuditLog
)

from schemas import (
    LoginIn,
    ClaimCreate,
    StatusIn,
    AssessmentIn,
    SettlementIn
)


# =========================================================
# APP CONFIGURATION
# =========================================================

app = FastAPI(
    title="ClaimFlow API",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# =========================================================
# FILE UPLOADS
# =========================================================

BASE = Path(__file__).resolve().parent.parent

UPLOADS = BASE / "uploads"

UPLOADS.mkdir(
    exist_ok=True
)

app.mount(
    "/uploads",
    StaticFiles(directory=UPLOADS),
    name="uploads"
)


# =========================================================
# DATABASE
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# AZURE BLOB STORAGE
# =========================================================

blob_service_client = BlobServiceClient.from_connection_string(
    os.getenv("AZURE_STORAGE_CONNECTION_STRING")
)

blob_container_client = blob_service_client.get_container_client(
    os.getenv("AZURE_STORAGE_CONTAINER")
)


# =========================================================
# AZURE COSMOS DB
# =========================================================

cosmos_client = CosmosClient.from_connection_string(
    os.getenv("AZURE_COSMOS_CONNECTION_STRING")
)

cosmos_database = cosmos_client.get_database_client(
    os.getenv("AZURE_COSMOS_DATABASE")
)

cosmos_container = cosmos_database.get_container_client(
    os.getenv("AZURE_COSMOS_CONTAINER")
)


# =========================================================
# SECURITY
# =========================================================

pwd = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# JWT secret is now loaded from .env
SECRET = os.getenv("JWT_SECRET")

if not SECRET:
    raise RuntimeError(
        "JWT_SECRET is not configured in .env"
    )

ALGO = "HS256"

oauth = OAuth2PasswordBearer(
    tokenUrl="/api/auth/token"
)


# =========================================================
# ROLES
# =========================================================

ROLES = [
    "Admin",
    "Policyholder",
    "Claims Officer",
    "Surveyor",
    "Finance Officer",
    "Auditor"
]


# =========================================================
# DATABASE SEED
# =========================================================

def seed(db: Session):

    # -----------------------------------------------------
    # CREATE ROLES
    # -----------------------------------------------------

    if db.query(Role).count() == 0:

        for role_name in ROLES:

            db.add(
                Role(
                    name=role_name
                )
            )

        db.commit()


    # -----------------------------------------------------
    # CREATE DEMO USERS
    # -----------------------------------------------------

    if db.query(User).count() == 0:

        roles = {
            role.name: role
            for role in db.query(Role).all()
        }

        users = [
            (
                "Admin",
                "admin@claimflow.local",
                "Admin@123",
                "Admin"
            ),

            (
                "Naman",
                "naman@claimflow.local",
                "Naman@123",
                "Claims Officer"
            ),

            (
                "Purvi",
                "purvi@claimflow.local",
                "Purvi@123",
                "Policyholder"
            ),

            (
                "Surveyor",
                "surveyor@claimflow.local",
                "Survey@123",
                "Surveyor"
            ),

            (
                "Finance",
                "finance@claimflow.local",
                "Finance@123",
                "Finance Officer"
            )
        ]

        for name, email, password, role_name in users:

            db.add(
                User(
                    name=name,
                    email=email,
                    password_hash=pwd.hash(password),
                    role_id=roles[role_name].id,
                    active=True
                )
            )

        db.commit()


    # -----------------------------------------------------
    # CREATE DEMO POLICIES
    # -----------------------------------------------------

    if db.query(Policy).count() == 0:

        db.add_all(
            [
                Policy(
                    policy_number="POL-1001",
                    customer_name="Demo Customer",
                    coverage_type="Motor",
                    status="Active"
                ),

                Policy(
                    policy_number="POL-1002",
                    customer_name="Demo Customer 2",
                    coverage_type="Health",
                    status="Active"
                )
            ]
        )

        db.commit()


# =========================================================
# STARTUP
# =========================================================

@app.on_event("startup")
def startup():

    db = next(get_db())

    try:

        seed(db)

    finally:

        db.close()


# =========================================================
# JWT TOKEN
# =========================================================

def token_for(user):

    payload = {
        "sub": str(user.id),
        "role": user.role.name,
        "exp": datetime.utcnow() + timedelta(hours=8)
    }

    return jwt.encode(
        payload,
        SECRET,
        algorithm=ALGO
    )


# =========================================================
# CURRENT USER
# =========================================================

def current_user(
    token: str,
    db: Session
):

    try:

        payload = jwt.decode(
            token,
            SECRET,
            algorithms=[ALGO]
        )

        user_id = int(
            payload["sub"]
        )

        user = db.get(
            User,
            user_id
        )

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    if not user.active:

        raise HTTPException(
            status_code=401,
            detail="Inactive user"
        )

    return user


# =========================================================
# AUTH DEPENDENCY
# =========================================================

def me(
    token=Depends(oauth),
    db: Session = Depends(get_db)
):

    return current_user(
        token,
        db
    )


# =========================================================
# ROLE CHECK
# =========================================================

def require(*roles):

    def dependency(
        user=Depends(me)
    ):

        if user.role.name not in roles:

            raise HTTPException(
                status_code=403,
                detail="Access denied for this role"
            )

        return user

    return dependency


# =========================================================
# AUDIT LOG + COSMOS EVENT
# =========================================================

def audit(
    db: Session,
    user,
    action,
    entity,
    entity_id=None,
    details=""
):

    # -----------------------------------------------------
    # SAVE AUDIT LOG IN AZURE SQL
    # -----------------------------------------------------

    db.add(
        AuditLog(
            user_id=user.id if user else None,
            action=action,
            entity=entity,
            entity_id=entity_id,
            details=details
        )
    )

    db.commit()


    # -----------------------------------------------------
    # SAVE EVENT IN AZURE COSMOS DB
    # -----------------------------------------------------

    try:

        cosmos_container.upsert_item(
            {
                "id": str(uuid.uuid4()),

                "claimId": (
                    str(entity_id)
                    if entity_id is not None
                    else "N/A"
                ),

                "event": action,

                "entity": entity,

                "entityId": entity_id,

                "details": details,

                "userId": (
                    str(user.id)
                    if user
                    else None
                ),

                "timestamp": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:

        # Cosmos failure should not stop the
        # main ClaimFlow operation.
        print(
            f"Cosmos DB event logging failed: {e}"
        )


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/api/health")
def health():

    return {
        "status": "ok",
        "service": "ClaimFlow API"
    }


# =========================================================
# LOGIN - FRONTEND JSON
# =========================================================

@app.post("/api/auth/login")
def login(
    data: LoginIn,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not pwd.verify(
        data.password,
        user.password_hash
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = token_for(user)

    return {
        "access_token": token,

        "token_type": "bearer",

        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.name
        }
    }


# =========================================================
# SWAGGER TOKEN LOGIN
# =========================================================

@app.post("/api/auth/token")
def token_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(User.email == form_data.username)
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not pwd.verify(
        form_data.password,
        user.password_hash
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = token_for(user)

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# =========================================================
# CURRENT USER PROFILE
# =========================================================

@app.get("/api/me")
def profile(
    user=Depends(me)
):

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role.name
    }


# =========================================================
# POLICIES
# =========================================================

@app.get("/api/policies")
def policies(
    db: Session = Depends(get_db),
    user=Depends(me)
):

    return db.query(
        Policy
    ).all()


# =========================================================
# GET CLAIMS
# =========================================================

@app.get("/api/claims")
def claims(
    db: Session = Depends(get_db),
    user=Depends(me)
):

    rows = (
        db.query(Claim)
        .order_by(Claim.id.desc())
        .all()
    )

    result = []

    for claim in rows:

        result.append(
            {
                "id": claim.id,

                "claim_number":
                    claim.claim_number,

                "policy_id":
                    claim.policy_id,

                "policy_number":
                    claim.policy.policy_number,

                "customer_name":
                    claim.policy.customer_name,

                "claim_type":
                    claim.claim_type,

                "incident_date":
                    claim.incident_date,

                "description":
                    claim.description,

                "amount":
                    claim.amount,

                "status":
                    claim.status,

                "risk_flag":
                    claim.risk_flag,

                "created_at":
                    claim.created_at.isoformat()
            }
        )

    return result


# =========================================================
# CREATE CLAIM
# =========================================================

@app.post("/api/claims")
def create_claim(
    data: ClaimCreate,
    db: Session = Depends(get_db),
    user=Depends(me)
):

    policy = db.get(
        Policy,
        data.policy_id
    )

    if not policy:

        raise HTTPException(
            status_code=400,
            detail="Policy not found"
        )

    if policy.status != "Active":

        raise HTTPException(
            status_code=400,
            detail="Policy is inactive"
        )


    # -----------------------------------------------------
    # DUPLICATE CHECK
    # -----------------------------------------------------

    duplicate = (
        db.query(Claim)
        .filter(
            Claim.policy_id == data.policy_id,
            Claim.claim_type == data.claim_type
        )
        .first()
    )

    if duplicate:

        risk_flag = "Duplicate Review"

    else:

        risk_flag = "Clear"


    # -----------------------------------------------------
    # CREATE CLAIM
    # -----------------------------------------------------

    claim = Claim(

        claim_number=
            "CLM-"
            + uuid.uuid4().hex[:8].upper(),

        policy_id=data.policy_id,

        claim_type=data.claim_type,

        incident_date=data.incident_date,

        description=data.description,

        amount=data.amount,

        created_by=user.id,

        status="Submitted",

        risk_flag=risk_flag
    )


    db.add(claim)

    db.commit()

    db.refresh(claim)


    audit(
        db,
        user,
        "CREATE",
        "Claim",
        claim.id,
        "Claim submitted"
    )


    return {

        "message":
            "Claim submitted",

        "claim_id":
            claim.id,

        "risk_flag":
            claim.risk_flag
    }


# =========================================================
# CHANGE CLAIM STATUS
# =========================================================

@app.patch("/api/claims/{claim_id}/status")
def status(
    claim_id: int,
    data: StatusIn,
    db: Session = Depends(get_db),
    user=Depends(
        require(
            "Admin",
            "Claims Officer"
        )
    )
):

    claim = db.get(
        Claim,
        claim_id
    )

    if not claim:

        raise HTTPException(
            status_code=404,
            detail="Claim not found"
        )


    new_status = data.status


    allowed_statuses = {
        "Submitted",
        "Under Review",
        "Assessment Complete",
        "Approved",
        "Rejected"
    }


    if new_status not in allowed_statuses:

        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )


    # =====================================================
    # WORKFLOW VALIDATION
    # =====================================================

    # Submitted -> Under Review

    if (
        claim.status == "Submitted"
        and new_status == "Under Review"
    ):

        claim.status = "Under Review"


    # -----------------------------------------------------
    # Assessment must be completed before approval
    # -----------------------------------------------------

    elif new_status == "Approved":

        assessment = (
            db.query(DamageAssessment)
            .filter(
                DamageAssessment.claim_id
                == claim_id
            )
            .first()
        )

        if not assessment:

            raise HTTPException(
                status_code=400,
                detail=
                "Claim must be assessed before approval"
            )

        if claim.status != "Assessment Complete":

            raise HTTPException(
                status_code=400,
                detail=
                "Claim must be in Assessment Complete status before approval"
            )

        claim.status = "Approved"


    # -----------------------------------------------------
    # Rejection
    # -----------------------------------------------------

    elif new_status == "Rejected":

        if claim.status not in [
            "Submitted",
            "Under Review",
            "Assessment Complete"
        ]:

            raise HTTPException(
                status_code=400,
                detail=
                "Claim cannot be rejected at this stage"
            )

        claim.status = "Rejected"


    # -----------------------------------------------------
    # Assessment Complete is automatic
    # -----------------------------------------------------

    elif new_status == "Assessment Complete":

        raise HTTPException(
            status_code=400,
            detail=
            "Assessment Complete is automatically set after surveyor assessment"
        )


    # -----------------------------------------------------
    # Submitted cannot be restored
    # -----------------------------------------------------

    elif new_status == "Submitted":

        raise HTTPException(
            status_code=400,
            detail=
            "Submitted status cannot be manually restored"
        )


    else:

        raise HTTPException(
            status_code=400,
            detail=
            f"Invalid workflow transition from {claim.status} to {new_status}"
        )


    db.commit()


    audit(
        db,
        user,
        "UPDATE_STATUS",
        "Claim",
        claim.id,
        claim.status
    )


    return {
        "message":
            "Claim status updated",

        "status":
            claim.status
    }


# =========================================================
# SURVEYOR ASSESSMENT
# =========================================================

@app.post("/api/claims/{claim_id}/assessment")
def assessment(
    claim_id: int,
    data: AssessmentIn,
    db: Session = Depends(get_db),
    user=Depends(
        require(
            "Admin",
            "Surveyor"
        )
    )
):

    claim = db.get(
        Claim,
        claim_id
    )

    if not claim:

        raise HTTPException(
            status_code=404,
            detail="Claim not found"
        )


    # -----------------------------------------------------
    # VALID STATUS
    # -----------------------------------------------------

    if claim.status not in [
        "Under Review",
        "Submitted"
    ]:

        raise HTTPException(
            status_code=400,
            detail=
            "Claim must be under review before assessment"
        )


    # -----------------------------------------------------
    # CREATE / UPDATE ASSESSMENT
    # -----------------------------------------------------

    assessment = (
        db.query(DamageAssessment)
        .filter(
            DamageAssessment.claim_id
            == claim_id
        )
        .first()
    )


    if not assessment:

        assessment = DamageAssessment(
            claim_id=claim_id
        )

        db.add(assessment)


    assessment.surveyor_name = \
        data.surveyor_name

    assessment.damage_level = \
        data.damage_level

    assessment.assessed_amount = \
        data.assessed_amount

    assessment.remarks = \
        data.remarks


    # -----------------------------------------------------
    # COMPLETE ASSESSMENT
    # -----------------------------------------------------

    claim.status = "Assessment Complete"

    db.commit()


    audit(
        db,
        user,
        "ASSESS",
        "Claim",
        claim_id,
        f"Damage level: {data.damage_level}"
    )


    return {
        "message":
            "Assessment completed successfully",

        "status":
            "Assessment Complete"
    }


# =========================================================
# SETTLEMENT
# =========================================================

@app.post("/api/claims/{claim_id}/settlement")
def settlement(
    claim_id: int,
    data: SettlementIn,
    db: Session = Depends(get_db),
    user=Depends(
        require(
            "Admin",
            "Finance Officer"
        )
    )
):

    claim = db.get(
        Claim,
        claim_id
    )

    if not claim:

        raise HTTPException(
            status_code=404,
            detail="Claim not found"
        )


    # =====================================================
    # ASSESSMENT REQUIRED
    # =====================================================

    assessment = (
        db.query(DamageAssessment)
        .filter(
            DamageAssessment.claim_id
            == claim_id
        )
        .first()
    )


    if not assessment:

        raise HTTPException(
            status_code=400,
            detail=
            "Claim must be assessed before settlement"
        )


    # =====================================================
    # APPROVAL REQUIRED
    # =====================================================

    if claim.status != "Approved":

        raise HTTPException(
            status_code=400,
            detail=
            "Claim must be approved before settlement"
        )


    # =====================================================
    # CREATE / UPDATE SETTLEMENT
    # =====================================================

    settlement_record = (
        db.query(Settlement)
        .filter(
            Settlement.claim_id
            == claim_id
        )
        .first()
    )


    if not settlement_record:

        settlement_record = Settlement(
            claim_id=claim_id,
            processed_by=user.id
        )

        db.add(
            settlement_record
        )


    settlement_record.approved_amount = \
        data.approved_amount

    settlement_record.payment_status = \
        "Processed"

    settlement_record.processed_by = \
        user.id

    settlement_record.processed_at = \
        datetime.utcnow()


    # =====================================================
    # FINAL STATUS
    # =====================================================

    claim.status = "Settled"

    db.commit()


    audit(
        db,
        user,
        "SETTLEMENT",
        "Claim",
        claim_id,
        f"Settlement amount: {data.approved_amount}"
    )


    return {
        "message":
            "Settlement processed successfully",

        "status":
            "Settled",

        "approved_amount":
            data.approved_amount
    }


# =========================================================
# DOCUMENT UPLOAD
# =========================================================

@app.post("/api/claims/{claim_id}/documents")
def upload(
    claim_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(me)
):

    claim = db.get(
        Claim,
        claim_id
    )

    if not claim:

        raise HTTPException(
            status_code=404,
            detail="Claim not found"
        )


    original_name = (
        file.filename
        or "file"
    )


    safe_name = (
        f"{claim_id}_"
        f"{uuid.uuid4().hex}_"
        f"{Path(original_name).name}"
    )


    file_path = (
        UPLOADS
        / safe_name
    )


    # -----------------------------------------------------
    # SAVE LOCAL COPY
    # -----------------------------------------------------

    with open(
        file_path,
        "wb"
    ) as output:

        shutil.copyfileobj(
            file.file,
            output
        )


    # -----------------------------------------------------
    # UPLOAD TO AZURE BLOB STORAGE
    # -----------------------------------------------------

    try:

        with file_path.open("rb") as blob_file:

            blob_container_client.upload_blob(
                name=safe_name,
                data=blob_file,
                overwrite=True
            )

    except Exception as e:

        print(
            f"Azure Blob upload failed: {e}"
        )


    # -----------------------------------------------------
    # AUDIT
    # -----------------------------------------------------

    audit(
        db,
        user,
        "UPLOAD_DOCUMENT",
        "Claim",
        claim_id,
        safe_name
    )


    return {
        "message":
            "Document uploaded successfully",

        "file":
            f"/uploads/{safe_name}"
    }


# =========================================================
# DASHBOARD
# =========================================================

@app.get("/api/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    user=Depends(me)
):

    total = (
        db.query(
            func.count(Claim.id)
        )
        .scalar()
    )


    pending = (
        db.query(
            func.count(Claim.id)
        )
        .filter(
            Claim.status.in_(
                [
                    "Submitted",
                    "Under Review",
                    "Assessment Complete"
                ]
            )
        )
        .scalar()
    )


    flagged = (
        db.query(
            func.count(Claim.id)
        )
        .filter(
            Claim.risk_flag != "Clear"
        )
        .scalar()
    )


    settled = (
        db.query(
            func.count(Claim.id)
        )
        .filter(
            Claim.status == "Settled"
        )
        .scalar()
    )


    approved = (
        db.query(
            func.count(Claim.id)
        )
        .filter(
            Claim.status == "Approved"
        )
        .scalar()
    )


    return {
        "total": total,
        "pending": pending,
        "flagged": flagged,
        "approved": approved,
        "settled": settled
    }


# =========================================================
# AUDIT LOGS
# =========================================================

@app.get("/api/audit-logs")
def logs(
    db: Session = Depends(get_db),
    user=Depends(
        require(
            "Admin",
            "Auditor"
        )
    )
):

    return (
        db.query(AuditLog)
        .order_by(
            AuditLog.id.desc()
        )
        .limit(100)
        .all()
    )