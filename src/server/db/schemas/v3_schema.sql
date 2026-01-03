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
  invoice_month TEXT NOT NULL,  -- YYYYMM (e.g., 202509)
  client_id INTEGER NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'pending')) DEFAULT 'pending',
  total_price REAL NOT NULL DEFAULT 0 CHECK (total_price >= 0),
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

CREATE INDEX idx_projects_invoice ON projects(client_id, invoice_month);
CREATE INDEX idx_projects_type ON projects(project_type);

-- =====================================
-- Images
-- =====================================
CREATE TABLE images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  project_id INTEGER NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', '+5 hours', '+30 minutes')),

  FOREIGN KEY (project_id)
    REFERENCES projects(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_images_project ON images(project_id);
CREATE INDEX idx_images_order ON images(project_id, "order");

-- =====================================
-- Triggers for Auto-Calculating Invoice Total
-- =====================================

-- Trigger: Update total_price when project is inserted
CREATE TRIGGER update_invoice_total_on_insert
AFTER INSERT ON projects
BEGIN
  UPDATE invoices
  SET total_price = (
    SELECT COALESCE(SUM(price), 0)
    FROM projects
    WHERE client_id = NEW.client_id AND invoice_month = NEW.invoice_month
  ),
  updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now', '+5 hours', '+30 minutes')
  WHERE client_id = NEW.client_id AND invoice_month = NEW.invoice_month;
END;

-- Trigger: Update total_price when project is updated
CREATE TRIGGER update_invoice_total_on_update
AFTER UPDATE ON projects
BEGIN
  UPDATE invoices
  SET total_price = (
    SELECT COALESCE(SUM(price), 0)
    FROM projects
    WHERE client_id = NEW.client_id AND invoice_month = NEW.invoice_month
  ),
  updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now', '+5 hours', '+30 minutes')
  WHERE client_id = NEW.client_id AND invoice_month = NEW.invoice_month;
END;

-- Trigger: Update total_price when project is deleted
CREATE TRIGGER update_invoice_total_on_delete
AFTER DELETE ON projects
BEGIN
  UPDATE invoices
  SET total_price = (
    SELECT COALESCE(SUM(price), 0)
    FROM projects
    WHERE client_id = OLD.client_id AND invoice_month = OLD.invoice_month
  ),
  updated_at = strftime('%Y-%m-%d %H:%M:%S', 'now', '+5 hours', '+30 minutes')
  WHERE client_id = OLD.client_id AND invoice_month = OLD.invoice_month;
END;