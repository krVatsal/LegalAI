import express from "express";
const router = express.Router();
import { spawn } from "child_process";
import path from "path";
import { verifyToken } from "../middleware/auth.middleware.js";

router.post("/search-contracts", verifyToken, async (req, res) => {
  try {
    const { contractText } = req.body;

    if (!contractText) {
      return res.status(400).json({ error: "Contract text is required" });
    }

    const pythonScriptPath = path.join(__dirname, "..", "..", "websearch.py");
    const pythonExecutable = path.join(
      __dirname,
      "..",
      "..",
      ".venv",
      "bin",
      "python"
    );
    const pythonProcess = spawn(pythonExecutable, [
      pythonScriptPath,
      contractText,
    ]);

    let scriptOutput = "";
    let scriptError = "";

    pythonProcess.stdout.on("data", (data) => {
      scriptOutput += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      scriptError += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`Python script exited with code ${code}`);
        console.error("stderr:", scriptError);
        return res
          .status(500)
          .json({
            error: "Failed to execute web search script.",
            details: scriptError,
          });
      }
      try {
        const results = JSON.parse(scriptOutput);
        res.json({ success: true, results });
      } catch (parseError) {
        console.error("Error parsing JSON from Python script:", parseError);
        console.error("Python script output:", scriptOutput);
        res
          .status(500)
          .json({
            error: "Failed to parse results from web search script.",
            details: scriptOutput,
          });
      }
    });

    pythonProcess.on("error", (err) => {
      console.error("Failed to start Python process:", err);
      res.status(500).json({ error: "Failed to start web search process." });
    });
  } catch (error) {
    console.error("Error in web search:", error);
    res.status(500).json({ error: "Failed to perform web search" });
  }
});

export default router;
