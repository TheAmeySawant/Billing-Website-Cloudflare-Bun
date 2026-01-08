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

    // Instantiate S3 Client
    const s3 = new S3Client({
      region: "eu-central-003",
      endpoint: c.env.B2_ENDPOINT,
      credentials: {
        accessKeyId: c.env.B2_ACCESS_KEY_ID,
        secretAccessKey: c.env.B2_SECRET_ACCESS_KEY,
      },
    });

    const projectsWithImages = await Promise.all(projects.map(async (project: any) => {
      // Get Image Keys from DB
      const imagesResult = await c.env.billingDB
        .prepare("SELECT url FROM images WHERE project_id = ? ORDER BY `order` ASC")
        .bind(project.id)
        .all();

      const imageKeys = imagesResult.results.map((img: any) => img.url);

      // Fetch Image Data from B2
      const imageUrls = await Promise.all(imageKeys.map(async (key: string) => {
        try {
          const command = new GetObjectCommand({
            Bucket: c.env.B2_BUCKET_NAME,
            Key: key,
          });
          const response = await s3.send(command);

          if (!response.Body) return null;

          const byteArray = await response.Body.transformToByteArray();
          const base64 = Buffer.from(byteArray).toString('base64');
          return `data:${response.ContentType || 'image/png'};base64,${base64}`;
        } catch (err) {
          console.error(`Failed to fetch image ${key}:`, err);
          return null; // or placeholder?
        }
      }));

      // Filter out failed fetches
      const validImages = imageUrls.filter(url => url !== null);

      return {
        ...project,
        // Map DB fields to Frontend expected fields if differing
        // Frontend expects: id, name, type, amount, images
        amount: project.price, // DB is price, Frontend is amount
        images: validImages
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

// Update Invoice Status
app.use(accessAuth).post("/api/update/invoice-status", async (c) => {
  try {
    const body = await c.req.json();
    const { clientId, month, year, status } = body;

    if (!clientId || !month || !year || !status) {
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

    // Validate Status
    // CHECK (payment_status IN ('paid', 'pending'))
    if (!['paid', 'pending'].includes(status.toLowerCase())) {
      return c.json({ success: false, error: "Invalid status. Must be 'paid' or 'pending'" }, 400);
    }

    const result = await c.env.billingDB
      .prepare("UPDATE invoices SET payment_status = ?, updated_at = ? WHERE client_id = ? AND invoice_month = ?")
      .bind(status.toLowerCase(), new Date().toISOString().replace('T', ' ').substring(0, 19), clientId, invoiceMonth)
      .run();

    if (result.meta.changes === 0) {
      return c.json({ success: false, error: "Invoice not found or no change" }, 404);
    }

    return c.json({ success: true, message: "Invoice status updated successfully" });

  } catch (error: any) {
    console.error("Error updating invoice status:", error);
    return c.json({ success: false, error: "Failed to update invoice status", details: error.message }, 500);
  }
});

// Create New Project with Images
app.use(accessAuth).post("/api/new/project", async (c) => {
  let uploadedKeys: string[] = [];
  let projectId: number | null = null;
  const s3 = new S3Client({
    region: "eu-central-003",
    endpoint: c.env.B2_ENDPOINT,
    credentials: {
      accessKeyId: c.env.B2_ACCESS_KEY_ID,
      secretAccessKey: c.env.B2_SECRET_ACCESS_KEY,
    },
  });

  try {
    const body = await c.req.json();
    const { clientId, invoiceId, name, type, amount, images } = body;

    // Validate Input
    if (!clientId || !invoiceId || !name || !type || amount === undefined || !images) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    // 1. Insert Project into D1
    // We do this first to get the Project ID for the path
    const projectResult = await c.env.billingDB
      .prepare(
        "INSERT INTO projects (name, client_id, invoice_month, project_type, price) VALUES (?, ?, ?, ?, ?) RETURNING id"
      )
      .bind(name, clientId, invoiceId, type, Number(amount))
      .first();

    if (!projectResult || !projectResult.id) {
      throw new Error("Failed to create project record");
    }

    projectId = projectResult.id as number;

    // 2. Upload Images to Backblaze B2
    // Path: Clients/clientId/invoiceId/projectId/Thumbnail1 (or Type + index)
    // Note: User requested "Thumbnail1", "Thumbnail2", etc. based on Type.
    // We will use "{Type}{Index + 1}" as the filename.

    const uploadPromises = images.map(async (imgStr: string, index: number) => {
      // Parse Base64
      const matches = imgStr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error("Invalid image format");
      }

      const contentType = matches[1];
      const buffer = Buffer.from(matches[2], "base64");

      // Determine file extension
      let ext = "png"; // default
      if (contentType === "image/jpeg") ext = "jpg";
      else if (contentType === "image/webp") ext = "webp";
      else if (contentType === "image/gif") ext = "gif";
      // else keep png

      const filename = `${type}${index + 1}.${ext}`;
      const key = `Clients/${clientId}/${invoiceId}/${projectId}/${filename}`;

      // Upload
      await s3.send(
        new PutObjectCommand({
          Bucket: c.env.B2_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );

      return key; // Return valid key on success
    });

    // Wait for all uploads
    // If one fails, Promise.all throws, going to catch block
    uploadedKeys = await Promise.all(uploadPromises);

    // 3. Insert Images into D1
    const imageStmt = c.env.billingDB.prepare(
      "INSERT INTO images (url, project_id, `order`) VALUES (?, ?, ?)"
    );

    const batch = uploadedKeys.map((key, index) =>
      imageStmt.bind(key, projectId, index)
    );

    await c.env.billingDB.batch(batch);

    return c.json({ success: true, message: "Project created successfully", projectId });

  } catch (error: any) {
    console.error("Error creating project:", error);

    // Rollback Strategy

    // 1. Delete Project from D1 (Cascade delete will remove any images if they were inserted)
    if (projectId) {
      try {
        await c.env.billingDB
          .prepare("DELETE FROM projects WHERE id = ?")
          .bind(projectId)
          .run();
        console.log(`Rolled back project ${projectId}`);
      } catch (dbError) {
        console.error(`Failed to rollback project ${projectId}:`, dbError);
      }
    }

    // 2. Delete Uploaded Objects from B2
    if (uploadedKeys.length > 0) {
      try {
        const objectsToDelete = uploadedKeys.map(key => ({ Key: key }));
        await s3.send(
          new DeleteObjectsCommand({
            Bucket: c.env.B2_BUCKET_NAME,
            Delete: {
              Objects: objectsToDelete,
              Quiet: true
            }
          })
        );
        console.log(`Rolled back ${uploadedKeys.length} images from B2`);
      } catch (s3Error) {
        console.error("Failed to rollback images from B2:", s3Error);
      }
    }

    return c.json(
      {
        success: false,
        error: "Failed to create project",
        details: error.message
      },
      500
    );
  }
});

// Update Project (Atomic)
app.use(accessAuth).post("/api/update/project", async (c) => {
  let uploadedKeys: string[] = []; // Track new uploads for rollback
  const s3 = new S3Client({
    region: "eu-central-003",
    endpoint: c.env.B2_ENDPOINT,
    credentials: {
      accessKeyId: c.env.B2_ACCESS_KEY_ID,
      secretAccessKey: c.env.B2_SECRET_ACCESS_KEY,
    },
  });

  try {
    const body = await c.req.json();
    const { id, clientId, invoiceId, updates } = body;

    if (!id || !clientId || !invoiceId || !updates) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    // 1. Fetch Current Project Images (for Diffing)
    const currentImagesResult = await c.env.billingDB
      .prepare("SELECT * FROM images WHERE project_id = ?")
      .bind(id)
      .all();
    const currentImages = currentImagesResult.results as { id: number, url: string, order: number }[];
    const currentUrlSet = new Set(currentImages.map(img => img.url));

    // 2. Calculate Diff
    // Payload `updates.images` is the FULL desired state (array of strings: URLs or Base64)
    const desiredImages = updates.images as string[];

    const imagesToAdd: { index: number, data: string }[] = [];
    const imagesToKeep: { index: number, url: string }[] = [];
    const urlsInPayload = new Set<string>();

    desiredImages.forEach((imgStr, index) => {
      if (imgStr.startsWith('data:image')) {
        imagesToAdd.push({ index, data: imgStr });
      } else {
        imagesToKeep.push({ index, url: imgStr });
        urlsInPayload.add(imgStr);
      }
    });

    // Images to Remove = Current DB Images NOT in Payload
    const imagesToRemove = currentImages.filter(img => !urlsInPayload.has(img.url));

    // 3. Upload NEW Images to B2
    const uploadPromises = imagesToAdd.map(async (item) => {
      const { index, data } = item;
      const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) throw new Error("Invalid image format");

      const contentType = matches[1];
      const buffer = Buffer.from(matches[2], "base64");

      let ext = "png";
      if (contentType === "image/jpeg") ext = "jpg";
      else if (contentType === "image/webp") ext = "webp";
      else if (contentType === "image/gif") ext = "gif";

      // Unique filename: {Type}{Index + 1}_{Random}.{ext} to avoid collisions/caching
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const filename = `${updates.type || 'Image'}${index + 1}_${randomSuffix}.${ext}`;
      const key = `Clients/${clientId}/${invoiceId}/${id}/${filename}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: c.env.B2_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );
      return { index, key };
    });

    const uploadedResults = await Promise.all(uploadPromises);
    uploadedResults.forEach(r => uploadedKeys.push(r.key));

    // 4. DB Transaction (Manual Batching since D1 doesn't have true interactive transactions yet in all drivers, but batch is atomic-ish)
    // We will construct a batch of statements.

    const statements: any[] = [];

    // 4a. Update Project Details
    if (updates.name || updates.type || updates.amount !== undefined) {
      statements.push(
        c.env.billingDB.prepare("UPDATE projects SET name = ?, project_type = ?, price = ? WHERE id = ?")
          .bind(
            updates.name || (await c.env.billingDB.prepare("SELECT name FROM projects WHERE id = ?").bind(id).first())?.name,
            updates.type || (await c.env.billingDB.prepare("SELECT project_type FROM projects WHERE id = ?").bind(id).first())?.project_type,
            updates.amount !== undefined ? Number(updates.amount) : (await c.env.billingDB.prepare("SELECT price FROM projects WHERE id = ?").bind(id).first())?.price,
            id
          )
      );
    }

    // 4b. Delete Removed Images from DB
    if (imagesToRemove.length > 0) {
      const removeIds = imagesToRemove.map(img => img.id).join(',');
      // D1 Prepare doesn't support IN (?) with array directly well, better to loop or separate
      // Actually, let's just delete by ID.
      imagesToRemove.forEach(img => {
        statements.push(c.env.billingDB.prepare("DELETE FROM images WHERE id = ?").bind(img.id));
      });
    }

    // 4c. Insert New Images
    uploadedResults.forEach(item => {
      statements.push(
        c.env.billingDB.prepare("INSERT INTO images (url, project_id, `order`) VALUES (?, ?, ?)")
          .bind(item.key, id, item.index)
      );
    });

    // 4d. Update Order of Kept Images
    imagesToKeep.forEach(item => {
      statements.push(
        c.env.billingDB.prepare("UPDATE images SET `order` = ? WHERE project_id = ? AND url = ?")
          .bind(item.index, id, item.url)
      );
    });

    // Execute Batch
    if (statements.length > 0) {
      await c.env.billingDB.batch(statements);
    }

    // 5. Cleanup: Delete Removed Images from B2 (Only if DB success)
    if (imagesToRemove.length > 0) {
      // Robust Deletion Logic (List Versions + Delete)
      for (const img of imagesToRemove) {
        const key = img.url;
        try {
          // List versions
          const versions = await s3.send(new ListObjectVersionsCommand({
            Bucket: c.env.B2_BUCKET_NAME,
            Prefix: key
          }));

          if (versions.Versions && versions.Versions.length > 0) {
            const objectsToDelete = versions.Versions.map(v => ({ Key: v.Key!, VersionId: v.VersionId }));
            await s3.send(new DeleteObjectsCommand({
              Bucket: c.env.B2_BUCKET_NAME,
              Delete: { Objects: objectsToDelete, Quiet: true }
            }));
          }
        } catch (cleanupErr) {
          console.error(`Failed to cleanup B2 key ${key}:`, cleanupErr);
          // Don't fail the request, just log.
        }
      }
    }

    return c.json({ success: true, message: "Project updated successfully" });

  } catch (error: any) {
    console.error("Error updating project:", error);

    // Rollback: Delete newly uploaded B2 files
    if (uploadedKeys.length > 0) {
      for (const key of uploadedKeys) {
        try {
          const versions = await s3.send(new ListObjectVersionsCommand({
            Bucket: c.env.B2_BUCKET_NAME,
            Prefix: key
          }));
          if (versions.Versions && versions.Versions.length > 0) {
            const objectsToDelete = versions.Versions.map(v => ({ Key: v.Key!, VersionId: v.VersionId }));
            await s3.send(new DeleteObjectsCommand({
              Bucket: c.env.B2_BUCKET_NAME,
              Delete: { Objects: objectsToDelete, Quiet: true }
            }));
          }
        } catch (rbErr) {
          console.error(`Failed to rollback B2 key ${key}:`, rbErr);
        }
      }
    }

    return c.json({ success: false, error: "Failed to update project", details: error.message }, 500);
  }
});

// Delete Project (Atomic)
app.use(accessAuth).post("/api/delete/project", async (c) => {
  const s3 = new S3Client({
    region: "eu-central-003",
    endpoint: c.env.B2_ENDPOINT,
    credentials: {
      accessKeyId: c.env.B2_ACCESS_KEY_ID,
      secretAccessKey: c.env.B2_SECRET_ACCESS_KEY,
    },
  });

  try {
    const body = await c.req.json();
    const { id } = body;

    if (!id) {
      return c.json({ success: false, error: "Missing project ID" }, 400);
    }

    // 1. Fetch Project Details (Needed for B2 Prefix construction)
    const project = await c.env.billingDB
      .prepare("SELECT client_id, invoice_month FROM projects WHERE id = ?")
      .bind(id)
      .first();

    if (!project) {
      return c.json({ success: false, error: "Project not found" }, 404);
    }

    const { client_id: clientId, invoice_month: invoiceMonth } = project;

    // 2. DB Transaction (Delete)
    const batchResult = await c.env.billingDB.batch([
      // Delete images first (FK cascade might handle this, but explicit is safer/clearer)
      c.env.billingDB.prepare("DELETE FROM images WHERE project_id = ?").bind(id),
      c.env.billingDB.prepare("DELETE FROM projects WHERE id = ?").bind(id)
    ]);

    // Check if delete was successful (at least project delete)
    // batchResult[1] is the project delete
    if (!batchResult[1].success) {
      throw new Error("Failed to delete project from database");
    }

    // 3. B2 Cleanup (Soft Fail)
    let warning = null;
    try {
      const prefix = `Clients/${clientId}/${invoiceMonth}/${id}/`;

      // List all versions
      const versions = await s3.send(new ListObjectVersionsCommand({
        Bucket: c.env.B2_BUCKET_NAME,
        Prefix: prefix
      }));

      if (versions.Versions && versions.Versions.length > 0) {
        const objectsToDelete = versions.Versions.map(v => ({ Key: v.Key!, VersionId: v.VersionId }));
        // Batch Delete
        await s3.send(new DeleteObjectsCommand({
          Bucket: c.env.B2_BUCKET_NAME,
          Delete: { Objects: objectsToDelete, Quiet: true }
        }));
      } else {
        // Try listing standard objects if versions invalid or empty (fallback, though ListObjectVersions usually covers it)
        const objects = await s3.send(new ListObjectsV2Command({
          Bucket: c.env.B2_BUCKET_NAME,
          Prefix: prefix
        }));

        if (objects.Contents && objects.Contents.length > 0) {
          const objectsToDelete = objects.Contents.map(v => ({ Key: v.Key! }));
          await s3.send(new DeleteObjectsCommand({
            Bucket: c.env.B2_BUCKET_NAME,
            Delete: { Objects: objectsToDelete, Quiet: true }
          }));
        }
      }

    } catch (b2Error: any) {
      console.error("B2 Cleanup Failed:", b2Error);
      warning = "Project deleted locally, but failed to cleanup cloud storage files.";
    }

    return c.json({ success: true, message: "Project deleted successfully", warning });

  } catch (error: any) {
    console.error("Error deleting project:", error);
    return c.json({ success: false, error: "Failed to delete project", details: error.message }, 500);
  }
});

export default app;