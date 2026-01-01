import { Hono } from "hono";
import { accessAuth } from "./middleware/auth";
import { D1Database } from "@cloudflare/workers-types";
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectsCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Buffer } from "node:buffer";

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

    await s3.send(
      new PutObjectCommand({
        Bucket: c.env.B2_BUCKET_NAME,
        Key: "QRcode/current-qr.img", // Generic extension or fixed
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
    console.error("Error uploading QR code:", error);
    return c.json(
      { success: false, error: "Failed to upload QR code", details: error.message },
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




export default app;