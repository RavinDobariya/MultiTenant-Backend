USE doc_db;


-- -----------------Documents Table-------------------

CREATE TABLE company (
  id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);


-- -----------------Users Table-------------------

CREATE TABLE user (
  id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','editor','user') NOT NULL,
  company_id CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY index_user_company_id (company_id),                   -- create index on company_id for faster

  CONSTRAINT fk_user_company
    FOREIGN KEY (company_id) REFERENCES company(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

/*
If company has users, you cannot delete company.
company A exists
user belongs to company A
deleting company A = ❌ error
*/


-- -----------------Units Table-------------------

CREATE TABLE unit (
  id CHAR(36) NOT NULL,
  company_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),                           

  -- Unit name must be unique per company
  UNIQUE KEY uq_unit_company_name (company_id, name),

  KEY index_unit_company_id (company_id),                      -- create index on company_id for faster

  CONSTRAINT fk_unit_company
    FOREIGN KEY (company_id) REFERENCES company(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);
 

-- -----------------Documents Table-------------------
CREATE TABLE document (
  id CHAR(36) NOT NULL,
  unit_id CHAR(36) NOT NULL,

  title VARCHAR(255) NOT NULL,
  description TEXT NULL,

  type ENUM('POLICY','MANUAL','REPORT') NOT NULL,
  status ENUM('DRAFT','APPROVED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',

  file_url VARCHAR(1000),

  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  approved_by CHAR(36) NULL,

  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY index_doc_unit_id (unit_id),
  KEY index_doc_created_by (created_by),
  KEY index_doc_approved_by (approved_by),
  KEY index_doc_status (status),

  CONSTRAINT fk_doc_unit
    FOREIGN KEY (unit_id) REFERENCES unit(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_doc_created_by
    FOREIGN KEY (created_by) REFERENCES user(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_doc_approved_by
    FOREIGN KEY (approved_by) REFERENCES user(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);


-- ------------------Audit Logs Table--------------------

CREATE TABLE audit_log (
  id CHAR(36) NOT NULL,
  action VARCHAR(255) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  KEY index_audit_entity_id (entity_id),
  KEY index_audit_user_id (user_id),
  KEY index_audit_action (action),
  
  CONSTRAINT fk_audit_user
    FOREIGN KEY (user_id) REFERENCES user(id)
    ON DELETE RESTRICT            --  “Don’t allow deletion of user(parent) if logs exist”
    ON UPDATE CASCADE             --  “If user id changes, update in audit_log as well”
);

-- -----------------Refresh Tokens Table-------------------
CREATE TABLE refresh_token (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(500) NOT NULL UNIQUE,
  user_id CHAR(36) NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY index_refresh_user_id (user_id),

  CONSTRAINT fk_refresh_user
    FOREIGN KEY (user_id) REFERENCES `user`(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);


SELECT * FROM user;
SELECT * FROM company;
SELECT * FROM unit;
SELECT * FROM document;
SELECT * FROM audit_log;

