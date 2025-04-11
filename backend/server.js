import express from 'express';
import cors from 'cors';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}`);
});

// __dirname-Ersatz für ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isWindows = process.platform === 'win32';

// Middleware
app.use(express.json());

// Ersetze hier ggf. die URL mit deiner finalen Render-URL
//app.use('/convert', cors({ origin: 'https://dein-frontend.onrender.com' }));

// Endpunkt für Pandoc-Konvertierung
app.post('/convert', (req, res) => {
  const inputFile = req.body.inputFile;
  const outputFile = req.body.outputFile;

  const inputPath = path.resolve(inputFile);
  const outputPath = path.resolve(outputFile);
  const workingDir = path.dirname(inputPath);

  // Direktes Pandoc-Kommando für Linux/Mac (funktioniert auf Render)
  const command = `pandoc -s -f latex -t markdown -o "${outputPath}" "${inputPath}"`;

  exec(command, { cwd: workingDir, shell: isWindows }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      return res.status(500).json({ error: stderr });
    }
    res.json({ message: 'Conversion successful', output: stdout });
  });
});

const buildPath = path.resolve(__dirname, '../frontend/dist');

// statische Dateien ausliefern
app.use(express.static(buildPath));

// alle anderen Routen auf index.html umleiten
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});