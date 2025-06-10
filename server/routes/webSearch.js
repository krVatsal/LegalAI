import express from "express";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.post("/search-contracts", async (req, res) => {
  try {
    const { contractText } = req.body;

    if (!contractText) {
      return res.status(400).json({ error: "Contract text is required" });
    }

    const pythonScriptPath = path.join(__dirname, "..", "websearch.py");
    
    // More robust Python executable detection
    let pythonExecutable = "python"; // Default fallback
    
    // Try to find Python in virtual environment
    const isWindows = process.platform === "win32";
    
    if (isWindows) {
      // Windows: Check for Scripts/python.exe in virtual environment
      const venvPaths = [
        path.join(process.cwd(), "venv", "Scripts", "python.exe"),
        path.join(process.cwd(), ".venv", "Scripts", "python.exe"),
        path.join(__dirname, "..", "..", "venv", "Scripts", "python.exe"),
        path.join(__dirname, "..", "..", ".venv", "Scripts", "python.exe"),
        "python.exe",
        "python3.exe"
      ];
        // Use the first available Python executable
      for (const pyPath of venvPaths) {
        try {
          if (fs.existsSync(pyPath)) {
            pythonExecutable = pyPath;
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }
    } else {
      // Unix/Linux/Mac: Check for bin/python in virtual environment
      const venvPaths = [
        path.join(process.cwd(), "venv", "bin", "python"),
        path.join(process.cwd(), ".venv", "bin", "python"),
        path.join(__dirname, "..", "..", "venv", "bin", "python"),
        path.join(__dirname, "..", "..", ".venv", "bin", "python"),
        "python3",
        "python"
      ];
      
      for (const pyPath of venvPaths) {
        try {
          if (fs.existsSync(pyPath)) {
            pythonExecutable = pyPath;
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }
    }

    console.log(`Using Python executable: ${pythonExecutable}`);
    console.log(`Python script path: ${pythonScriptPath}`);    const pythonProcess = spawn(pythonExecutable, [pythonScriptPath], {
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONLEGACYWINDOWSSTDIO: '1'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Pass contract text to the script via stdin to avoid argument length limits
    pythonProcess.stdin.setDefaultEncoding('utf8');
    pythonProcess.stdin.write(contractText);
    pythonProcess.stdin.end();    let scriptOutput = "";
    let scriptError = "";

    pythonProcess.stdout.setEncoding('utf8');
    pythonProcess.stderr.setEncoding('utf8');

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
