import { Hono } from "hono";
import { accessAuth } from "./middleware/auth";
import { D1Database } from "@cloudflare/workers-types";
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectsCommand, DeleteObjectCommand, ListObjectVersionsCommand } from "@aws-sdk/client-s3";
import { Buffer } from "node:buffer";
import { DOMParser } from "@xmldom/xmldom";


// Polyfill DOMParser and Node for AWS SDK in Cloudflare Workers
(globalThis as any).DOMParser = DOMParser;
(globalThis as any).Node = {
  ELEMENT_NODE: 1,
  ATTRIBUTE_NODE: 2,
  TEXT_NODE: 3,
  CDATA_SECTION_NODE: 4,
  ENTITY_REFERENCE_NODE: 5,
  ENTITY_NODE: 6,
  PROCESSING_INSTRUCTION_NODE: 7,
  COMMENT_NODE: 8,
  DOCUMENT_NODE: 9,
  DOCUMENT_TYPE_NODE: 10,
  DOCUMENT_FRAGMENT_NODE: 11,
  NOTATION_NODE: 12
};


type Bindings = {
  billingDB: D1Database;
  B2_ENDPOINT: string;
  B2_ACCESS_KEY_ID: string;
  B2_SECRET_ACCESS_KEY: string;
  B2_BUCKET_NAME: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(accessAuth).get("/api/health", (c) => c.json("Healthy! 🔥"));

app.use(accessAuth).get("/api/dashboard", (c) => c.json("Soham Dharap's Dashboard"));

// Get all clients
app.use(accessAuth).get("/api/clients", async (c) => {
  try {
    // Query all clients from database
    const result = await c.env.billingDB
      .prepare("SELECT * FROM clients ORDER BY id DESC")
      .all();

    return c.json(
      {
        success: true,
        count: result.results.length,
        data: result.results,
      },
      200
    );
  } catch (error: any) {
    console.error("Error fetching clients:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch clients",
        details: error.message,
      },
      500
    );
  }
});

// Create new client
app.use(accessAuth).post("/api/new/client", async (c) => {
  try {
    // Parse request body
    const body = await c.req.json();

    // Validate required fields
    if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
      return c.json(
        {
          success: false,
          error: "Name is required and must be a non-empty string",
        },
        400
      );
    }

    // Validate optional fields
    if (body.code && typeof body.code !== "string") {
      return c.json(
        {
          success: false,
          error: "Code must be a string",
        },
        400
      );
    }

    if (body.description && typeof body.description !== "string") {
      return c.json(
        {
          success: false,
          error: "Description must be a string",
        },
        400
      );
    }

    // Prepare data
    const name = body.name.trim();
    const code = body.code?.trim() || null;
    const description = body.description?.trim() || null;

    // Insert client with raw SQL
    const result = await c.env.billingDB
      .prepare(
        "INSERT INTO clients (name, code, description) VALUES (?, ?, ?) RETURNING *"
      )
      .bind(name, code, description)
      .first();

    return c.json(
      {
        success: true,
        message: "Client created successfully",
        data: result,
      },
      201
    );
  } catch (error: any) {
    // Handle unique constraint violation (duplicate code)
    if (error.message?.includes("UNIQUE constraint failed")) {
      return c.json(
        {
          success: false,
          error: "Client code already exists",
        },
        409
      );
    }

    // Handle other errors
    console.error("Error creating client:", error);
    return c.json(
      {
        success: false,
        error: "Failed to create client",
        details: error.message,
      },
      500
    );
  }
});

// Update Client
app.use(accessAuth).put("/api/client/:id", async (c) => {
  try {
    const clientId = c.req.param("id");
    const body = await c.req.json();

    // Validate required fields
    if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
      return c.json({ success: false, error: "Name is required" }, 400);
    }

    const name = body.name.trim();
    const description = body.description?.trim() || null;

    // Check if client exists
    const client = await c.env.billingDB
      .prepare("SELECT * FROM clients WHERE id = ?")
      .bind(clientId)
      .first();

    if (!client) {
      return c.json({ success: false, error: "Client not found" }, 404);
    }

    // Update client
    const result = await c.env.billingDB
      .prepare("UPDATE clients SET name = ?, description = ? WHERE id = ?")
      .bind(name, description, clientId)
      .run();

    return c.json({ success: true, message: "Client updated successfully" });

  } catch (error: any) {
    console.error("Error updating client:", error);
    return c.json(
      { success: false, error: "Failed to update client", details: error.message },
      500
    );
  }
});

// Upload QR Code
app.use(accessAuth).post("/api/new/qrcode", async (c) => {
  try {
    const { image } = await c.req.json();

    if (!image || !image.startsWith("data:image")) {
      return c.json({ success: false, error: "Invalid image data" }, 400);
    }

    // Parse base64
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return c.json({ success: false, error: "Invalid base64 string" }, 400);
    }

    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], "base64");

    const s3 = new S3Client({
      region: "eu-central-003",
      endpoint: c.env.B2_ENDPOINT,
      credentials: {
        accessKeyId: c.env.B2_ACCESS_KEY_ID,
        secretAccessKey: c.env.B2_SECRET_ACCESS_KEY,
      },
    });

    const key = "QRcode/current-qr.img";

    // 1. List existing versions
    let existingVersions;
    try {
      existingVersions = await s3.send(
        new ListObjectVersionsCommand({
          Bucket: c.env.B2_BUCKET_NAME,
          Prefix: key,
        })
      );
    } catch (listError: any) {
      // Return error but keep it clean
      return c.json({
        success: false,
        error: "Failed to list object versions",
        details: listError.message || String(listError),
      }, 500);
    }

    // 2. Delete existing versions if found
    if (existingVersions.Versions && existingVersions.Versions.length > 0) {
      const objectsToDelete = existingVersions.Versions
        .filter(v => v.Key) // Ensure Key exists
        .map((v) => ({
          Key: v.Key!,
          VersionId: v.VersionId,
        }));

      if (objectsToDelete.length > 0) {
        try {
          await s3.send(
            new DeleteObjectsCommand({
              Bucket: c.env.B2_BUCKET_NAME,
              Delete: {
                Objects: objectsToDelete,
                Quiet: true,
              },
            })
          );
        } catch (deleteError: any) {
          return c.json({
            success: false,
            error: "Failed to delete existing versions",
            details: deleteError.message || String(deleteError),
          }, 500);
        }
      }
    }

    console.log(`Uploading new QR code version to ${key}`);
    await s3.send(
      new PutObjectCommand({
        Bucket: c.env.B2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "no-cache, no-store, must-revalidate",
        Metadata: {
          "uploaded-at": new Date().toISOString() // Track uploads
        }
      })
    );

    return c.json({ success: true, message: "QR Code uploaded successfully" });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: "Failed to upload QR code (General)",
        details: error.message || String(error),
        name: error.name,
        stack: error.stack
      },
      500
    );
  }
});

// Get QR Code
app.use(accessAuth).get("/api/qrcode", async (c) => {
  try {
    const s3 = new S3Client({
      region: "eu-central-003",
      endpoint: c.env.B2_ENDPOINT,
      credentials: {
        accessKeyId: c.env.B2_ACCESS_KEY_ID,
        secretAccessKey: c.env.B2_SECRET_ACCESS_KEY,
      },
    });

    const command = new GetObjectCommand({
      Bucket: c.env.B2_BUCKET_NAME,
      Key: "QRcode/current-qr.img",
    });

    const response = await s3.send(command);

    // Transform stream to byte array
    const bodyByteArray = await response.Body?.transformToByteArray();

    if (!bodyByteArray) {
      return c.json({ success: false, error: "Empty file" }, 404);
    }

    c.header("Content-Type", response.ContentType || "image/png");
    return c.body(bodyByteArray.buffer as ArrayBuffer);

  } catch (error: any) {
    console.error("Error fetching QR code:", error);
    // Return a default or 404
    return c.json({ success: false, error: "QR Code not found", details: error.message, stack: error.stack }, 404);
  }
});

// Get Client Invoice List (Separate Route)
app.use(accessAuth).get("/api/client-invoices/:client_id/list", async (c) => {
  try {
    const clientId = c.req.param("client_id");

    const invoicesResult = await c.env.billingDB
      .prepare(`
        SELECT 
          invoice_month as month,
          payment_status as status,
          total_price as totalAmount
        FROM invoices
        WHERE client_id = ?
        ORDER BY invoice_month DESC
      `)
      .bind(clientId)
      .all();

    return c.json({
      success: true,
      count: invoicesResult.results.length,
      data: invoicesResult.results
    });

  } catch (error: any) {
    console.error("Error fetching client invoice list:", error);
    return c.json(
      { success: false, error: "Failed to fetch client invoice list", details: error.message },
      500
    );
  }
});

// Delete Invoice
app.use(accessAuth).delete("/api/invoice", async (c) => {
  try {
    const clientId = c.req.query("clientId");
    const invoiceMonth = c.req.query("invoiceMonth");

    if (!clientId || !invoiceMonth) {
      return c.json({ success: false, error: "Missing clientId or invoiceMonth" }, 400);
    }

    // Delete invoice (Cascade will delete projects and images if set up)
    const result = await c.env.billingDB
      .prepare("DELETE FROM invoices WHERE client_id = ? AND invoice_month = ?")
      .bind(clientId, invoiceMonth)
      .run();

    if (result.meta.changes === 0) {
      // Optional: treat as success or 404. Idempotent delete is often 200.
      // But if we want to confirm it verified logic: 
      // return c.json({ success: false, error: "Invoice not found or already deleted" }, 404);
    }

    return c.json({ success: true, message: "Invoice deleted successfully" });

  } catch (error: any) {
    console.error("Error deleting invoice:", error);
    return c.json(
      { success: false, error: "Failed to delete invoice", details: error.message },
      500
    );
  }
});

// Get Client Invoices and Stats
app.use(accessAuth).get("/api/client-invoices/:client_id", async (c) => {
  try {
    const clientId = c.req.param("client_id");

    // 1. Get Client Details
    const client = await c.env.billingDB
      .prepare("SELECT * FROM clients WHERE id = ?")
      .bind(clientId)
      .first();

    if (!client) {
      return c.json({ success: false, error: "Client not found" }, 404);
    }

    // 2. Get Invoices with Total Amounts
    // D1 might not support complex joins with aggregates nicely in one go depending on version, 
    // but standard SQL should work.
    // We sum project prices for each invoice.

    /* 
      Schema reminders:
      invoices: (client_id, invoice_month) -> PK
      projects: (client_id, invoice_month) -> FK
    */

    const invoicesResult = await c.env.billingDB
      .prepare(`
        SELECT 
          invoice_month as month,
          payment_status as status,
          total_price as totalAmount
        FROM invoices
        WHERE client_id = ?
        ORDER BY invoice_month DESC
      `)
      .bind(clientId)
      .all();

    // 3. Calculate Aggregates
    const invoices = invoicesResult.results;
    const totalInvoices = invoices.length;
    // Cast totalAmount to number as it might be returned as value depending on driver
    const totalEarnings = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);

    return c.json({
      success: true,
      data: {
        client,
        invoices,
        stats: {
          totalInvoices,
          totalEarnings
        }
      }
    });

  } catch (error: any) {
    console.error("Error fetching client invoices:", error);
    return c.json(
      { success: false, error: "Failed to fetch client invoices", details: error.message },
      500
    );
  }
});

// Create New Invoice
app.use(accessAuth).post("/api/new/invoice", async (c) => {
  try {
    const body = await c.req.json();
    const { clientId, month, year, status } = body;

    if (!clientId || !month || !year) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    // Convert Month Name to Number
    const monthMap: { [key: string]: string } = {
      "January": "01", "February": "02", "March": "03", "April": "04", "May": "05", "June": "06",
      "July": "07", "August": "08", "September": "09", "October": "10", "November": "11", "December": "12"
    };

    const monthNum = monthMap[month];
    if (!monthNum) {
      return c.json({ success: false, error: "Invalid month" }, 400);
    }

    const invoiceMonth = `${year}${monthNum}`; // YYYYMM

    // Check for duplicate
    const existing = await c.env.billingDB
      .prepare("SELECT 1 FROM invoices WHERE client_id = ? AND invoice_month = ?")
      .bind(clientId, invoiceMonth)
      .first();

    if (existing) {
      return c.json({ success: false, error: "Invoice already exists" }, 409);
    }

    // Insert Invoice
    await c.env.billingDB
      .prepare("INSERT INTO invoices (client_id, invoice_month, payment_status) VALUES (?, ?, ?)")
      .bind(clientId, invoiceMonth, (status || 'Pending').toLowerCase())
      .run();

    return c.json({ success: true, message: "Invoice created successfully" }, 201);

  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed")) {
      return c.json({ success: false, error: "Invoice already exists" }, 409);
    }
    console.error("Error creating invoice:", error);
    return c.json({ success: false, error: "Failed to create invoice", details: error.message }, 500);
  }
});

// Get Invoice Details (Client & Invoice Info)
app.use(accessAuth).get("/api/invoice-details", async (c) => {
  try {
    const clientId = c.req.query("clientId");
    const invoiceMonth = c.req.query("month");

    if (!clientId || !invoiceMonth) {
      return c.json({ success: false, error: "Missing clientId or month" }, 400);
    }

    // Get Client Details
    const client = await c.env.billingDB
      .prepare("SELECT * FROM clients WHERE id = ?")
      .bind(clientId)
      .first();

    if (!client) {
      return c.json({ success: false, error: "Client not found" }, 404);
    }

    // Get Invoice Details
    const invoice = await c.env.billingDB
      .prepare("SELECT * FROM invoices WHERE client_id = ? AND invoice_month = ?")
      .bind(clientId, invoiceMonth)
      .first();

    if (!invoice) {
      // Technically it might not exist if accessed directly, or could return null
      return c.json({ success: false, error: "Invoice not found" }, 404);
    }

    return c.json({
      success: true,
      data: {
        client,
        invoice
      }
    });

  } catch (error: any) {
    console.error("Error fetching invoice details:", error);
    return c.json({ success: false, error: "Failed to fetch invoice details", details: error.message }, 500);
  }
});

// Get Invoice Projects (Projects & Images)
app.use(accessAuth).get("/api/invoice-projects", async (c) => {
  try {
    const clientId = c.req.query("clientId");
    const invoiceMonth = c.req.query("month");

    if (!clientId || !invoiceMonth) {
      return c.json({ success: false, error: "Missing clientId or month" }, 400);
    }

    // Get Projects
    const projectsResult = await c.env.billingDB
      .prepare(`
        SELECT * FROM projects 
        WHERE client_id = ? AND invoice_month = ?
        ORDER BY created_at DESC
      `)
      .bind(clientId, invoiceMonth)
      .all();

    const projects = projectsResult.results;

    // Get Images for these projects
    // We can do this efficiently by fetching all images for these projects OR one by one.
    // Given the scale, fetching all images for this invoice's projects is better.
    // D1 doesn't support array parameters in WHERE IN easily without dynamic SQL construction or multiple queries.
    // We will iterate for now or do a join if possible.

    // Let's try a JOIN query to get everything in one go, then restructure in code.
    // Actually, separating might be cleaner for debugging, but let's try to be efficient.

    // Alternative: Get all images linked to projects of this invoice.
    // We need project IDs.

    const projectsWithImages = await Promise.all(projects.map(async (project: any) => {
      const imagesResult = await c.env.billingDB
        .prepare("SELECT url FROM images WHERE project_id = ? ORDER BY `order` ASC")
        .bind(project.id)
        .all();

      // Map to just strings as per frontend expectation (Project interface has images: string[])
      const imageUrls = imagesResult.results.map((img: any) => img.url);

      return {
        ...project,
        // Map DB fields to Frontend expected fields if differing
        // Frontend expects: id, name, type, amount, images
        amount: project.price, // DB is price, Frontend is amount
        images: imageUrls
      };
    }));

    return c.json({
      success: true,
      data: projectsWithImages
    });

  } catch (error: any) {
    console.error("Error fetching invoice projects:", error);
    return c.json({ success: false, error: "Failed to fetch invoice projects", details: error.message }, 500);
  }
});

export default app;