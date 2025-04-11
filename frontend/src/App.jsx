import React, { useState } from "react";
import axios from "axios";

function App() {
  const [status, setStatus] = useState("");

  const convertFile = async () => {
    try {
      const response = await axios.post("/convert", {
        inputFile: "/files/Kurs_1793.tex", // Beispielpfad auf dem Server
        outputFile: "/files/dokument.md", // Ausgabe auf dem Server
      });

      setStatus(`Erfolg: ${response.data.message}`);
    } catch (error) {
      setStatus(`Fehler: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>📝 Latex zu Markdown Konverter</h1>
      <button onClick={convertFile}>Konvertieren</button>
      <p>{status}</p>
    </div>
  );
}

export default App;
