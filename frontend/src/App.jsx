import React, { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadAndConvert = async () => {
    if (!file) {
      setStatus("Bitte eine ZIP-Datei mit LaTeX-Projekt auswählen");
      return;
    }

    const formData = new FormData();
    formData.append("projectZip", file);

    try {
      const response = await axios.post("/convert", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setStatus(`✅ Erfolg: ${response.data.message}`);
    } catch (error) {
      setStatus(`❌ Fehler: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>📝 LaTeX → Markdown Konverter</h1>
      <input type="file" accept=".zip" onChange={handleFileChange} />
      <br /><br />
      <button onClick={uploadAndConvert}>Konvertieren</button>
      <p>{status}</p>
    </div>
  );
}

export default App;
