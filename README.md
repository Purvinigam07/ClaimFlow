CLAIMFLOW - BASIC INSURANCE CLAIMS PROTOTYPE
============================================

PROJECT OVERVIEW
----------------
ClaimFlow is a beginner-friendly prototype for an Insurance Claims
Processing and Fraud Control Platform.

The system is designed to help manage insurance claims from submission
to review and status update. It also includes a basic duplicate claim
detection feature to identify possible duplicate claims.

This version is an initial working frontend prototype created for the
college project.

TECHNOLOGY USED
---------------
- HTML
- CSS
- JavaScript
- Browser Local Storage

HOW TO RUN
----------
1. Extract the ZIP file.
2. Open the ClaimFlow_Basic_Prototype folder.
3. Double-click index.html.
4. The project should open in your default browser.
5. No installation or server is required for this prototype.

FEATURES
--------
- Dashboard with total, pending, approved and flagged claim counts
- Sample claim records
- Claim submission form
- Search claims by ID, policy number, claimant or claim type
- Update claim status
- Basic duplicate claim detection
- Duplicate check based on policy number and claim type
- Stores demo changes using browser local storage
- Simple and responsive user interface

HOW DUPLICATE CHECKING WORKS
----------------------------
When a new claim is submitted, the system checks whether another claim
already exists with the same policy number and claim type.

If a possible duplicate is found, the claim is marked as flagged for
review.

This is only a basic demonstration rule. In a real insurance system,
duplicate and fraud detection would require more validation, historical
data analysis and backend processing.

CURRENT PROJECT STATUS
----------------------
The current version is the initial working prototype.

The following frontend functionality has been completed:
- Claim submission
- Claims dashboard
- Claim search
- Claim status update
- Basic duplicate claim detection
- Local browser data storage

This prototype demonstrates the basic workflow and user interface of
ClaimFlow.

IMPORTANT NOTES
---------------
- This is a prototype, not a production insurance system.
- It uses sample/demo data only.
- It does not use a real insurance database.
- Data is currently stored in browser local storage.
- Authentication and role-based access control are not implemented yet.
- The duplicate check is a simple demonstration rule.
- Do not enter real personal, medical or financial information.
- To reset the demo, clear this site's local storage in your browser.

PLANNED NEXT DEVELOPMENT
-------------------------
The next phase of ClaimFlow will focus on converting this prototype into
a complete full-stack cloud application.

Planned features include:

1. BACKEND INTEGRATION
   - Python FastAPI backend
   - REST APIs for claims and users
   - Frontend-backend integration

2. RELATIONAL DATABASE
   - SQL database integration
   - Proper tables and relationships
   - Primary keys and foreign keys
   - Normalization
   - Indexes
   - Views
   - Transactions
   - Stored procedure or trigger
   - Audit logging

3. SECURITY
   - Secure login
   - Password hashing
   - Role-Based Access Control (RBAC)
   - Input validation
   - SQL injection protection
   - XSS protection
   - Secure storage of secrets

4. CLAIM MANAGEMENT
   - Claim document upload
   - Surveyor assignment
   - Damage assessment
   - Claim review
   - Claim approval/rejection
   - Settlement and payment management

5. CLOUD INTEGRATION
   - Azure SQL Database for structured data
   - Azure Blob Storage for claim documents and images
   - Azure Cosmos DB for semi-structured claim event data
   - Cloud deployment

6. ANALYTICS
   - Claim statistics
   - Fraud/duplicate claim monitoring
   - Approval and rejection analysis
   - Dashboard and analytics using Power BI

7. AUDIT AND MONITORING
   - Activity logs
   - Claim history
   - User actions tracking
   - Security monitoring

FUTURE ARCHITECTURE
-------------------
The planned application will follow this basic flow:

User
  |
  v
Frontend
  |
  v
FastAPI Backend
  |
  +---- Authentication & RBAC
  |
  +---- Claim Management
  |
  +---- Assessment & Review
  |
  +---- Settlement
  |
  v
Azure SQL Database
  |
  +---- Azure Blob Storage
  |
  +---- Azure Cosmos DB
  |
  v
Analytics / Power BI

PROJECT GOAL
------------
The final goal of ClaimFlow is to provide a secure cloud-based platform
that can help manage insurance claims efficiently, reduce duplicate
claims, maintain proper records and provide better visibility into the
claim processing workflow.

The current prototype is the first step toward the complete system.