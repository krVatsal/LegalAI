import express from "express";
const router = express.Router();
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.post("/search-contracts", async (req, res) => {
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
      "..",
      "..",
      "..", //this is not ideal as it exposes somewhat the entire systme
      ".pyenv",
      "versions",
      "cyfutureenv",
      "bin",
      "python"
    );
    const pythonProcess = spawn(pythonExecutable, [pythonScriptPath]);

    // Pass contract text to the script via stdin to avoid argument length limits
    pythonProcess.stdin.write(contractText);
    pythonProcess.stdin.end();

    let scriptOutput = "";
    let scriptError = "";

    pythonProcess.stdout.on("data", (data) => {
      scriptOutput += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      scriptError += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (res.headersSent) return;
      if (code !== 0) {
        console.error(`Python script exited with code ${code}`);
        console.error("stderr:", scriptError);
        return res.status(500).json({
          error: "Failed to execute web search script.",
          details: scriptError || "No stderr output.",
        });
      }

      try {
        if (!scriptOutput) {
          console.error("Python script produced no output.");
          return res.status(500).json({
            error: "Web search script returned no data.",
            details: scriptError,
          });
        }
        const results = JSON.parse(scriptOutput);
        res.json({ success: true, results });
      } catch (parseError) {
        console.error("Error parsing JSON from Python script:", parseError);
        console.error("Python script output:", scriptOutput);
        res.status(500).json({
          error: "Failed to parse results from web search script.",
          details: scriptOutput,
        });
      }
    });

    pythonProcess.on("error", (err) => {
      if (res.headersSent) return;
      console.error("Failed to start Python process:", err);
      res.status(500).json({ error: "Failed to start web search process." });
    });
  } catch (error) {
    console.error("Error in web search:", error);
    res.status(500).json({ error: "Failed to perform web search" });
  }
});

export default router;
