import { Hono } from "hono";
import { poweredBy } from "hono/powered-by";
import { logger } from "hono/logger";
import dbconnect from "./db/connect";
import VideoModel from "./db/video-schema-model";
import { isValidObjectId } from "mongoose";
import { streamText } from "hono/streaming";

const app = new Hono();

// Middlewares
app.use(poweredBy());
app.use(logger());

// Middleware to ensure DB connection on each request
app.use("*", async (c, next) => {
  console.log("Attempting to connect to MongoDB..."); // Debug log
  try {
    //@ts-ignore
      await dbconnect(c.env.MONGODB_URI); // Use c.env.MONGODB_URI
      console.log("✅ MongoDB connected successfully..."); // Debug log
      return next();
  } catch (error) {
      console.error("❌ MongoDB connection error:", error); // Debug log
      return c.json({ 
          message: "Error connecting to database",
          error: error instanceof Error ? error.message : "Unknown error"
      }, 500);
  }
});

// Get all videos
app.get("/", async (c) => {
    const documents = await VideoModel.find();
    return c.json(documents.map((d) => d.toObject()), 200);
});

// Create a document
app.post("/", async (c) => {
    const formData = await c.req.json();
    if (!formData.thumbnailURL) delete formData.thumbnailURL;
    const videoObject = new VideoModel(formData);
    try {
        const document = await videoObject.save();
        return c.json(document.toObject(), 200);
    } catch (error: any) {
        return c.json({ message: error?.message ?? "Internal server error." }, 500);
    }
});

// View document by ID
app.get("/:documentId", async (c) => {
    const id = c.req.param("documentId");
    if (!isValidObjectId(id)) {
        return c.json({ message: "Invalid document ID" }, 400);
    }

    const document = await VideoModel.findById(id);
    if (!document) {
        return c.json({ message: "Document not found" }, 404);
    }

    return c.json(document.toObject(), 200);
});

// Stream document description
app.get("/d/:documentId", async (c) => {
    const id = c.req.param("documentId");
    if (!isValidObjectId(id)) {
        return c.json({ message: "Invalid document ID" }, 400);
    }

    const document = await VideoModel.findById(id);
    if (!document) {
        return c.json({ message: "Document not found" }, 404);
    }

    if (!document.description) {
        return c.json({ message: "No description available" }, 400);
    }

    return streamText(c, async (stream) => {
        stream.onAbort(() => {
            console.log("Stream aborted");
        });
        for (let i = 0; i < document.description.length; i++) {
            await stream.write(document.description[i]);
            await stream.sleep(1000);
        }
    });
});

// Update document by ID
app.patch("/:documentId", async (c) => {
    const id = c.req.param("documentId");
    if (!isValidObjectId(id)) {
        return c.json({ message: "Invalid document ID" }, 400);
    }

    const document = await VideoModel.findById(id);
    if (!document) {
        return c.json({ message: "Document not found" }, 404);
    }

    const formData = await c.req.json();
    if (!formData.thumbnailURL) delete formData.thumbnailURL;

    try {
        const updatedDocument = await VideoModel.findByIdAndUpdate(id, formData, { new: true });
        return c.json(updatedDocument?.toObject(), 200);
    } catch (error: any) {
        return c.json({ message: error?.message ?? "Update failed" }, 500);
    }
});

// Error handling
app.onError((error: any, c) => {
    return c.json({ message: "Internal server error: " + error.message }, 500);
});

export default app;
