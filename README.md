# ClaimFlow — Insurance Claims Processing & Fraud Control Platform

## What we are building
ClaimFlow is a secure full-stack cloud-ready application for managing insurance claims from submission to settlement. It flags possible duplicate claims for human review instead of automatically rejecting them.

## Current build
This project is intentionally built from the beginning as a proper full-stack foundation:
- Frontend: HTML, CSS, JavaScript
- Backend: Python FastAPI
- Database: SQLAlchemy + SQLite for local development
- Authentication: JWT
- Password security: bcrypt hashing
- RBAC: Admin, Policyholder, Claims Officer, Surveyor, Finance Officer, Auditor
- Claims, assessments, settlements and audit logs
- Duplicate-claim flagging rule
- Document upload endpoint

## Run locally
1. Open the `backend` folder in a terminal.
2. Create a virtual environment: `python -m venv .venv`
3. Activate it on Windows: `.venv\Scripts\activate`
4. Install: `pip install -r requirements.txt`
5. Start: `uvicorn main:app --reload` from inside backend.
   If relative-import errors occur, run from the project root with `uvicorn backend.main:app --reload`.
6. Open `frontend/index.html` through VS Code Live Server or another local static server.
7. API docs: `http://127.0.0.1:8000/docs`

## Demo accounts
- Admin: admin@claimflow.local / Admin@123
- Claims Officer: naman@claimflow.local / Naman@123
- Policyholder: purvi@claimflow.local / Purvi@123
- Surveyor: surveyor@claimflow.local / Survey@123
- Finance Officer: finance@claimflow.local / Finance@123

## Planned cloud phase
After the local workflow is stable, replace SQLite with Azure SQL Database, use Azure Blob Storage for claim documents, add Azure Cosmos DB for claim-event JSON, connect Power BI analytics, configure HTTPS/secrets/network restrictions, and deploy the frontend/backend to Azure.

## Important
Demo data only. Do not use real customer personal data. AI-assisted development must be declared in the final report according to the project guide.
