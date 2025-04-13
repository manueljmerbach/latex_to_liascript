import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from 'multer';
import unzipper from 'unzipper';

const app = express();
const port = process.env.PORT || 8080;

// Pfade vorbereiten
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');

// Upload-Verzeichnis anlegen, falls nicht vorhanden
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer Setup für Datei-Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../frontend/dist')));

// Datei entpacken, Haupt-.tex-Datei suchen, pandoc starten
app.post('/convert', upload.single('projectZip'), async (req, res) => {
  const zipPath = req.file.path;
  const extractDir = path.join(uploadsDir, `${Date.now()}_extracted`);

  // Download-Route für die konvertierte Markdown-Datei
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: 'Datei nicht gefunden' });
  }
});

  try {
    // Entpacken
    await fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractDir }))
      .promise();

    // Haupt-TEX-Datei finden (main.tex oder erste .tex-Datei)
    const files = await findTexFiles(extractDir);
    if (files.length === 0) throw new Error('Keine .tex-Datei gefunden.');

    const inputFile = files.find(f => f.endsWith('main.tex')) || files[0];
    const outputFile = inputFile.replace(/\.tex$/, '.md');

    const command = `pandoc -s -f latex -t markdown -o "${outputFile}" "${inputFile}"`;

    const isWindows = process.platform === 'win32';
    exec(command, { cwd: extractDir, shell: isWindows }, (error, stdout, stderr) => {
      if (error || stderr) {
        return res.status(500).json({ error: error?.message || stderr });
      }

      res.json({
        message: 'Konvertierung erfolgreich',
        outputFile: path.basename(outputFile)
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Utility: .tex-Dateien rekursiv finden
async function findTexFiles(dir, result = []) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await findTexFiles(fullPath, result);
    } else if (entry.isFile() && entry.name.endsWith('.tex')) {
      result.push(fullPath);
    }
  }
  return result;
}

// Fallback für SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Server läuft auf Port ${port}`);
});
