-- ClaimFlow RDBMS Schema
-- Database: SQLite for local development
-- Azure SQL version can be used during cloud deployment.

PRAGMA foreign_keys = ON;

-- =========================
-- 1. ROLES
-- =========================
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY,
    name VARCHAR(40) NOT NULL UNIQUE
);

-- =========================
-- 2. USERS
-- =========================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- =========================
-- 3. POLICIES
-- =========================
CREATE TABLE IF NOT EXISTS policies (
    id INTEGER PRIMARY KEY,
    policy_number VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(120) NOT NULL,
    coverage_type VARCHAR(80) NOT NULL,
    status VARCHAR(30) DEFAULT 'Active'
);

-- =========================
-- 4. CLAIMS
-- =========================
CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY,
    claim_number VARCHAR(50) NOT NULL UNIQUE,
    policy_id INTEGER NOT NULL,
    claim_type VARCHAR(80) NOT NULL,
    incident_date VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(40) DEFAULT 'Submitted',
    risk_flag VARCHAR(30) DEFAULT 'Clear',
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (policy_id) REFERENCES policies(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- =========================
-- 5. DAMAGE ASSESSMENTS
-- =========================
CREATE TABLE IF NOT EXISTS damage_assessments (
    id INTEGER PRIMARY KEY,
    claim_id INTEGER NOT NULL UNIQUE,
    surveyor_name VARCHAR(120) NOT NULL,
    damage_level VARCHAR(30) NOT NULL,
    assessed_amount DECIMAL(12,2) DEFAULT 0,
    remarks TEXT,

    FOREIGN KEY (claim_id) REFERENCES claims(id)
);

-- =========================
-- 6. SETTLEMENTS
-- =========================
CREATE TABLE IF NOT EXISTS settlements (
    id INTEGER PRIMARY KEY,
    claim_id INTEGER NOT NULL UNIQUE,
    approved_amount DECIMAL(12,2) DEFAULT 0,
    payment_status VARCHAR(30) DEFAULT 'Pending',
    processed_by INTEGER NOT NULL,
    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (claim_id) REFERENCES claims(id),
    FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- =========================
-- 7. AUDIT LOGS
-- =========================
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(120) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =========================
-- 8. CLAIM DOCUMENTS
-- =========================
CREATE TABLE IF NOT EXISTS claim_documents (
    id INTEGER PRIMARY KEY,
    claim_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(80),
    file_url TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (claim_id) REFERENCES claims(id)
);

-- =========================
-- 9. CLAIM FLAGS
-- =========================
CREATE TABLE IF NOT EXISTS claim_flags (
    id INTEGER PRIMARY KEY,
    claim_id INTEGER NOT NULL,
    flag_type VARCHAR(80) NOT NULL,
    severity VARCHAR(30) DEFAULT 'Medium',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (claim_id) REFERENCES claims(id)
);

-- =========================
-- 10. INVESTIGATIONS
-- =========================
CREATE TABLE IF NOT EXISTS investigations (
    id INTEGER PRIMARY KEY,
    claim_id INTEGER NOT NULL,
    investigator_name VARCHAR(120) NOT NULL,
    findings TEXT,
    investigation_status VARCHAR(30) DEFAULT 'Open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (claim_id) REFERENCES claims(id)
);

-- =========================
-- INDEXES
-- =========================

CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

CREATE INDEX IF NOT EXISTS idx_claim_policy
ON claims(policy_id);

CREATE INDEX IF NOT EXISTS idx_claim_status
ON claims(status);

CREATE INDEX IF NOT EXISTS idx_claim_type
ON claims(claim_type);

CREATE INDEX IF NOT EXISTS idx_claim_risk
ON claims(risk_flag);

CREATE INDEX IF NOT EXISTS idx_audit_created
ON audit_logs(created_at);

-- =========================
-- VIEW
-- =========================

CREATE VIEW IF NOT EXISTS claim_summary AS
SELECT
    c.id,
    c.claim_number,
    p.policy_number,
    p.customer_name,
    c.claim_type,
    c.amount,
    c.status,
    c.risk_flag
FROM claims c
JOIN policies p
ON p.id = c.policy_id;

-- =========================
-- FRAUD FLAG TRIGGER
-- =========================

CREATE TRIGGER IF NOT EXISTS trg_duplicate_claim_flag
AFTER INSERT ON claims
WHEN (
    SELECT COUNT(*)
    FROM claims
    WHERE policy_id = NEW.policy_id
      AND claim_type = NEW.claim_type
      AND id != NEW.id
) > 0
BEGIN
    UPDATE claims
    SET risk_flag = 'Duplicate Review'
    WHERE id = NEW.id;
END;

-- =========================
-- JOIN QUERY
-- =========================

SELECT
    c.claim_number,
    p.policy_number,
    p.customer_name,
    c.claim_type,
    c.amount,
    c.status,
    c.risk_flag
FROM claims c
INNER JOIN policies p
ON c.policy_id = p.id;

-- =========================
-- TRANSACTION EXAMPLE
-- =========================

BEGIN TRANSACTION;

UPDATE claims
SET status = 'Under Review'
WHERE id = 1;

INSERT INTO audit_logs
(user_id, action, entity, entity_id, details)
VALUES
(1, 'Claim Review Started', 'Claim', 1, 'Claim moved to Under Review');

COMMIT;