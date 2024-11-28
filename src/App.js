import React, { useState, useRef } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [transcriptionFile, setTranscriptionFile] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showMessage, setShowMessage] = useState(false);

  // Use useRef to persist the last transcribed URL across renders
  const lastTranscribedUrl = useRef('');

  // Handle submission of YouTube URL for transcription
  const handleUrlSubmit = async () => {

    if (url === lastTranscribedUrl.current) {
      setShowMessage(true); // Show the "already transcribed" message
      return;
    } else {
      setResults([])
      setShowMessage(false); // Hide message if it's a new URL
    }

    try {
      const response = await axios({
        url: 'http://127.0.0.1:8000/transcribe',
        method: 'POST',
        data: { url },
        responseType: 'blob',
      });

      const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
      setTranscriptionFile(urlBlob); // Update transcription file for download
      lastTranscribedUrl.current = url; // Update the last processed URL using ref
    } catch (error) {
      console.error('Error generating transcription:', error);
    }
  };

  // Handle submission of query to search the transcription
  const handleQuerySubmit = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/query', { query });
      if (response.data.results) {
        const rsp = [...results, {'query': query}]
        setResults([...rsp, ...response.data.results]);// Update results with the query response
      } else {
        console.error('Results not found in response');
      }
    } catch (error) {
      console.error('Error querying transcription:', error);
    }
  };

  return (
    <div className="chat-app">
      {/* URL Input at the top */}
      <div className="url-input">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter YouTube URL"
          className="input-field"
        />
        <button onClick={handleUrlSubmit} className="submit-button">
          Transcribe
        </button>
      </div>

      {/* Middle Section: Transcription File and Search Results */}
      <div className="chat-window">
        {/* Show if url was already transcribed */}
        {showMessage && (
          <div className="notification">This URL has already been transcribed.</div>
        )}

        {/* Display transcription file if available */}
        {transcriptionFile && (
          <div className="transcription-file">
            <span className="file-icon">📄</span>
            <span className="file-name">transcription.txt</span>
            <a
              href={transcriptionFile}
              download="transcription.txt"
              className="download-button"
            >
              Download
            </a>
          </div>
        )}

        {/* Display search results */}
        <div className="search-results">
          {results.map((result, index) => (
            <div key={index}>
              {result.query && (
                <div className="query-result">
                  <h3>Search for: "{result.query}"</h3>
                </div>
              )}
              {result.sentence && (
                <ul>
                  <li>
                    <strong>Sentence:</strong> {result.sentence}
                  </li>
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Query Input at the bottom */}
      <div className="query-input">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query"
          className="input-field"
        />
        <button onClick={handleQuerySubmit} className="submit-button">
          Search
        </button>
      </div>
    </div>
  );
}

export default App;
