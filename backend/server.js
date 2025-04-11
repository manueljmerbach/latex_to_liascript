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
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

// ZIP Upload + Liste aller .tex-Dateien
app.post('/upload', upload.single('projectZip'), async (req, res) => {
  const zipPath = req.file.path;
  const extractDir = zipPath.replace(/\.zip$/, '');

  try {
    await fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractDir }))
      .promise();

    const texFiles = await findTexFiles(extractDir);

    if (texFiles.length === 0) throw new Error('Keine .tex-Dateien gefunden.');

    // Speicher für spätere Konvertierung
    res.json({
      message: 'Projekt entpackt',
      files: texFiles.map(p => path.relative(extractDir, p)),
      extractDir
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Konvertieren
app.post('/convert', async (req, res) => {
  const { extractDir, relativeTexPath } = req.body;

  const inputPath = path.join(extractDir, relativeTexPath);
  const outputPath = inputPath.replace(/\.tex$/, '.md');

  const command = `pandoc -s -f latex -t markdown -o "${outputPath}" "${inputPath}"`;
  const isWindows = process.platform === 'win32';

  exec(command, { cwd: extractDir, shell: isWindows }, (error, stdout, stderr) => {
    if (error || stderr) {
      return res.status(500).json({ error: error?.message || stderr });
    }

    res.json({
      message: 'Konvertierung erfolgreich',
      outputFile: path.basename(outputPath),
      downloadPath: `/download/${path.basename(outputPath)}`
    });
  });
});

// Datei-Download
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: 'Datei nicht gefunden' });
  }
});

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

app.listen(port, () => {
  console.log(`🚀 Server läuft auf Port ${port}`);
});
