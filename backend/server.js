import express from 'express';
import cors from 'cors';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();
const port = process.env.PORT || 8080;

// __dirname-Ersatz für ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(express.json());

// Ersetze hier ggf. die URL mit deiner finalen Render-URL
app.use('/convert', cors({ origin: 'https://dein-frontend.onrender.com' }));

// Endpunkt für Pandoc-Konvertierung
app.post('/convert', (req, res) => {
  const inputFile = req.body.inputFile;
  const outputFile = req.body.outputFile;

  const inputPath = path.resolve(inputFile);
  const outputPath = path.resolve(outputFile);
  const workingDir = path.dirname(inputPath);

  // Direktes Pandoc-Kommando für Linux/Mac (funktioniert auf Render)
  const command = `pandoc -s -f latex -t markdown -o "${outputPath}" "${inputPath}"`;

  exec(command, { cwd: workingDir }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      return res.status(500).json({ error: stderr });
    }
    res.json({ message: 'Conversion successful', output: stdout });
  });
});

// (Optional) Wenn du das React-Frontend mitbaust
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
