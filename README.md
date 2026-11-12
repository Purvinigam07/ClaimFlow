# ClaimFlow — Insurance Claims Processing & Fraud Control Platform

## Overview

ClaimFlow is a secure full-stack cloud application for managing insurance claims from submission to settlement. It helps organizations manage claim verification, damage assessment, approval, settlement, and audit activities in one platform.

The system also identifies possible duplicate or inconsistent claims and flags them for human review instead of automatically rejecting them.

> **Important:** ClaimFlow is a decision-support system. The final claim decision is made by an authorized human user.

## Key Features

- Secure user authentication using JWT
- Role-Based Access Control (RBAC)
- Claim submission and claim tracking
- Policy management
- Damage assessment by authorized surveyors
- Duplicate claim detection and risk flagging
- Claim approval and rejection workflow
- Settlement and payment tracking
- Document upload and cloud storage
- Audit logging and activity tracking
- Analytics dashboard
- Secure database access and input validation
- Cloud-based deployment

## User Roles

ClaimFlow supports the following roles:

- **Admin** — manages the system and has administrative access
- **Policyholder** — submits and tracks claims
- **Claims Officer** — reviews and processes claims
- **Surveyor** — performs damage assessment
- **Finance Officer** — processes settlements
- **Auditor** — reviews system activity and audit logs

## Technology Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Python
- FastAPI
- SQLAlchemy
- JWT Authentication
- bcrypt password hashing

### Azure Services
- **Azure SQL Database** — structured relational insurance data
- **Azure Blob Storage** — claim documents and uploaded files
- **Azure Cosmos DB for NoSQL** — claim events and semi-structured JSON data
- **Azure App Service** — backend API deployment

### Analytics
- Microsoft Power BI

### Repository & Deployment
- GitHub
- GitHub Pages for frontend deployment
- Azure App Service for backend deployment

## Database Design

The application uses a relational database design with related tables for users, roles, policies, claims, assessments, settlements, audit logs, and other claim-management data.

The project includes:

- Primary keys and foreign keys
- Constraints
- Indexes
- SQL joins
- Database view
- Database trigger
- Transaction and rollback
- Relational data in 3NF-oriented structure

A database view named `claim_summary` provides a combined claim and policy summary for reporting and analytics.

A database trigger is used to identify possible duplicate claims and mark them for review.

## Cloud Data Storage

### Azure SQL Database

Azure SQL Database stores structured application data including:

- Users and roles
- Policies
- Claims
- Damage assessments
- Settlements
- Audit logs

### Azure Blob Storage

Azure Blob Storage is used to store uploaded claim-related documents and files.

### Azure Cosmos DB

Azure Cosmos DB for NoSQL stores claim-related event information in JSON format, supporting semi-structured cloud data and activity/event tracking.

## Security

ClaimFlow implements multiple security controls:

- JWT-based authentication
- Password hashing using bcrypt
- Role-Based Access Control
- Protected API endpoints
- Input validation
- Parameterized database operations through SQLAlchemy
- Secure secret management using environment variables
- HTTPS for deployed services
- Database firewall/network restrictions
- Audit logging
- Human review for duplicate/fraud risk flags

Sensitive credentials and connection strings are not stored in the source repository.

## Claim Workflow

The main claim workflow is:

**Claim Submission → Under Review → Damage Assessment → Assessment Complete → Approval → Settlement**

Possible duplicate or inconsistent claims can be flagged for additional human review.

Rejected claims are handled by authorized users according to their assigned role.

## Analytics

ClaimFlow includes a Power BI analytics dashboard for monitoring claim-related information such as:

- Total claims
- Claim status distribution
- Settled claims
- Risk/fraud status
- Total claim amount
- Claims by customer
- Claims by claim type
- Claim amount by claim type

## Project Architecture

The high-level architecture follows this flow:

**User → Frontend → FastAPI Backend → Azure SQL / Azure Blob Storage / Azure Cosmos DB → Power BI Analytics**

The backend manages authentication, authorization, claim processing, database operations, document uploads, audit logging, and cloud data services.

## Deployment

The ClaimFlow frontend is deployed using GitHub Pages and the backend API is deployed using Azure App Service.

### Live Project

https://purvinigam07.github.io/ClaimFlow/

### Backend API

https://claimflow-api-2026-cfehbyftescvh3g5.koreacentral-01.azurewebsites.net

### GitHub Repository

https://github.com/Purvinigam07/ClaimFlow

## Local Development

### Backend

1. Open the project folder in a terminal.
2. Create a virtual environment:

```bash
python -m venv .venv
```

3. Activate it on Windows:

```bash
.venv\Scripts\activate
```

4. Install dependencies:

```bash
pip install -r requirements.txt
```

5. Configure the required environment variables in `.env`.

6. Start the FastAPI server:

```bash
uvicorn main:app --reload
```

7. Open the API documentation:

```text
http://127.0.0.1:8000/docs
```

### Frontend

Open the frontend using a local static server such as VS Code Live Server.

## Demo Data

The project uses dummy/demo data for development and demonstration purposes.

Do not use real customer personal information, insurance documents, financial information, or other sensitive data.

## AI-Assisted Development

AI tools were used as development assistance during the project. The use of AI assistance will be disclosed in the final project documentation as required by the project guidelines.

## Project Status

**Completed**

The main ClaimFlow development, cloud integration, deployment, authentication, database implementation, storage integration, analytics, and testing have been completed.
