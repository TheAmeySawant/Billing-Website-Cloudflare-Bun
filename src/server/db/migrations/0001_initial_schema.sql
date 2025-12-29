-- =====================================
-- Cloudflare D1 / SQLite Schema
-- Monthly Invoices per Client
-- =====================================

PRAGMA foreign_keys = ON;

-- =====================================
-- Clients
-- =====================================
CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  description TEXT
);

-- =====================================
-- Invoices
-- Composite PK: (client_id, invoice_month)
-- =====================================
CREATE TABLE invoices (
  invoice_month TEXT NOT NULL, -- YYYYMM (e.g., 202509)
  client_id INTEGER NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'pending')) DEFAULT 'pending',
  created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', '+5 hours', '+30 minutes')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', '+5 hours', '+30 minutes')),

  PRIMARY KEY (client_id, invoice_month),

  FOREIGN KEY (client_id)
    REFERENCES clients(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_invoices_month ON invoices(invoice_month);

-- =====================================
-- Projects
-- =====================================
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  client_id INTEGER NOT NULL,
  invoice_month TEXT NOT NULL,
  project_type TEXT NOT NULL CHECK (project_type IN ('Banner', 'Thumbnail', 'Poster')),
  price REAL NOT NULL CHECK (price >= 0),
  created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', '+5 hours', '+30 minutes')),

  FOREIGN KEY (client_id, invoice_month)
    REFERENCES invoices(client_id, invoice_month)
    ON DELETE CASCADE
);

CREATE INDEX idx_projects_invoice
  ON projects(client_id, invoice_month);

CREATE INDEX idx_projects_type ON projects(project_type);

-- =====================================
-- Images
-- =====================================
CREATE TABLE images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  project_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', '+5 hours', '+30 minutes')),

  FOREIGN KEY (project_id)
    REFERENCES projects(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_images_project ON images(project_id);