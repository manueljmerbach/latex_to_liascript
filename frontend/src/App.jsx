import React, { useState } from "react";
import axios from "axios";

function App() {
  const [zipFile, setZipFile] = useState(null);
  const [status, setStatus] = useState("");
  const [texFiles, setTexFiles] = useState([]);
  const [selectedTex, setSelectedTex] = useState("");
  const [extractDir, setExtractDir] = useState("");
  const [downloadLink, setDownloadLink] = useState("");

  const handleZipChange = (e) => {
    setZipFile(e.target.files[0]);
    setTexFiles([]);
    setSelectedTex("");
    setDownloadLink("");
    setStatus("");
  };

  const uploadZip = async () => {
    if (!zipFile) {
      setStatus("❗ Bitte eine ZIP-Datei auswählen.");
      return;
    }

    setStatus("📦 Lade ZIP hoch...");

    const formData = new FormData();
    formData.append("projectZip", zipFile);

    try {
      const res = await axios.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTexFiles(res.data.files);
      setExtractDir(res.data.extractDir);
      setStatus("✅ ZIP hochgeladen. Wähle die Hauptdatei.");
    } catch (err) {
      setStatus(`❌ Fehler: ${err.response?.data?.error || err.message}`);
    }
  };

  const convert = async () => {
    if (!selectedTex || !extractDir) {
      setStatus("❗ Bitte eine Datei auswählen.");
      return;
    }

    setStatus("🔄 Konvertiere...");

    try {
      const res = await axios.post("/convert", {
        extractDir,
        relativeTexPath: selectedTex,
      });

      setStatus(`✅ ${res.data.message}`);
      setDownloadLink(res.data.downloadPath);
    } catch (err) {
      setStatus(`❌ Fehler: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "600px", margin: "auto" }}>
      <h1>📝 LaTeX → Markdown Konverter</h1>

      <input type="file" accept=".zip" onChange={handleZipChange} />
      <button style={{ marginLeft: "1rem" }} onClick={uploadZip}>Hochladen</button>

      {texFiles.length > 0 && (
        <>
          <h3>Wähle Haupt-.tex-Datei:</h3>
          <select value={selectedTex} onChange={(e) => setSelectedTex(e.target.value)} style={{ width: "100%", padding: "0.5rem" }}>
            <option value="">-- Datei auswählen --</option>
            {texFiles.map((file, index) => (
              <option key={index} value={file}>{file}</option>
            ))}
          </select>
          <br /><br />
          <button onClick={convert}>Konvertieren</button>
        </>
      )}

      <p>{status}</p>

      {downloadLink && (
        <p>
          📥 <a href={downloadLink} download>Markdown herunterladen</a>
        </p>
      )}
    </div>
  );
}

export default App;
