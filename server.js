// ══════════════════════════════════════════════════════════
// TechAssess Pro — Backend Server
// ══════════════════════════════════════════════════════════

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Ensure directories exist ──────────────────────────────
const RECORDINGS_DIR = path.join(__dirname, "uploads", "recordings");
const DATA_DIR = path.join(__dirname, "uploads", "data");
fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname)));  // Serve HTML/CSS/JS

// ── Multer config for video uploads ───────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, RECORDINGS_DIR),
  filename: (req, file, cb) => {
    const sessionId = req.body.sessionId || `unknown_${Date.now()}`;
    const safeName = sessionId.replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `${safeName}.webm`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
});

// ══════════════════════════════════════════════════════════
// API ENDPOINTS
// ══════════════════════════════════════════════════════════

// ── Upload exam data + recording ──────────────────────────
app.post("/api/submit", upload.single("recording"), (req, res) => {
  try {
    const examData = JSON.parse(req.body.examData);
    const sessionId = examData.id;

    // Save exam data as JSON
    const dataFile = path.join(DATA_DIR, `${sessionId.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`);
    examData.recordingFile = req.file ? req.file.filename : null;
    examData.uploadedAt = new Date().toISOString();

    fs.writeFileSync(dataFile, JSON.stringify(examData, null, 2));

    console.log(`[Server] Exam submitted: ${examData.candidate.name} (${sessionId})`);
    if (req.file) {
      console.log(`[Server] Recording saved: ${req.file.filename} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);
    }

    res.json({ success: true, sessionId });
  } catch (err) {
    console.error("[Server] Submit error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── List all exams ────────────────────────────────────────
app.get("/api/exams", (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
    const exams = files.map((f) => {
      const raw = fs.readFileSync(path.join(DATA_DIR, f), "utf8");
      return JSON.parse(raw);
    });

    // Sort newest first
    exams.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    res.json(exams);
  } catch (err) {
    console.error("[Server] List error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Get single exam ───────────────────────────────────────
app.get("/api/exams/:id", (req, res) => {
  try {
    const safeId = req.params.id.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filePath = path.join(DATA_DIR, `${safeId}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Exam not found" });
    }

    const exam = JSON.parse(fs.readFileSync(filePath, "utf8"));
    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Stream recording ──────────────────────────────────────
app.get("/api/recordings/:filename", (req, res) => {
  const safeName = req.params.filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const filePath = path.join(RECORDINGS_DIR, safeName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Recording not found" });
  }

  const stat = fs.statSync(filePath);
  const range = req.headers.range;

  if (range) {
    // Support range requests for video seeking
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${stat.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/webm",
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": stat.size,
      "Content-Type": "video/webm",
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

// ── Download recording ────────────────────────────────────
app.get("/api/recordings/:filename/download", (req, res) => {
  const safeName = req.params.filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const filePath = path.join(RECORDINGS_DIR, safeName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Recording not found" });
  }

  res.download(filePath);
});

// ── Delete exam + recording ───────────────────────────────
app.delete("/api/exams/:id", (req, res) => {
  try {
    const safeId = req.params.id.replace(/[^a-zA-Z0-9_-]/g, "_");
    const dataFile = path.join(DATA_DIR, `${safeId}.json`);

    if (fs.existsSync(dataFile)) {
      const exam = JSON.parse(fs.readFileSync(dataFile, "utf8"));

      // Delete recording file if it exists
      if (exam.recordingFile) {
        const recPath = path.join(RECORDINGS_DIR, exam.recordingFile);
        if (fs.existsSync(recPath)) fs.unlinkSync(recPath);
      }

      fs.unlinkSync(dataFile);
      console.log(`[Server] Deleted exam: ${safeId}`);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start Server ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log("");
  console.log("  ╔══════════════════════════════════════════════╗");
  console.log("  ║     TechAssess Pro — Server Running          ║");
  console.log("  ╠══════════════════════════════════════════════╣");
  console.log(`  ║  Exam:    http://localhost:${PORT}              ║`);
  console.log(`  ║  Admin:   http://localhost:${PORT}/admin.html   ║`);
  console.log("  ║                                              ║");
  console.log("  ║  Recordings saved to: ./uploads/recordings   ║");
  console.log("  ║  Exam data saved to:  ./uploads/data         ║");
  console.log("  ╚══════════════════════════════════════════════╝");
  console.log("");
});
