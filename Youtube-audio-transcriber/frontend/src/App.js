import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [url, setUrl] = useState('');
  const [transcription, setTranscription] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // Handle submission of YouTube URL for transcription
  const handleUrlSubmit = async () => {
    const response = await axios.post('http://127.0.0.1:8000/transcribe', { url });
    if (response.data.transcription) {
      setTranscription(response.data.transcription);
    } else {
      console.error('Transcription not found in response');
    }
  };

  // Handle submission of query to search in the transcription
  const handleQuerySubmit = async () => {
    const response = await axios.post('http://127.0.0.1:8000/query', { query });
    if (response.data.results) {
      setResults(response.data.results); // Update results with the query response
    } else {
      console.error('Results not found in response');
    }
  };

  return (
    <div>
      <h1>YouTube Transcription and Search</h1>

      {/* Section to input YouTube URL and trigger transcription */}
      <div>
        <h2>Enter YouTube URL for Transcription</h2>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter YouTube URL"
        />
        <button onClick={handleUrlSubmit}>Transcribe</button>
      </div>

      <div>
        <h2>Transcription Result</h2>
        <p>{transcription}</p>
      </div>

      <div>
        <h2>Enter Query to Search in Transcription</h2>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query"
        />
        <button onClick={handleQuerySubmit}>Search</button>
      </div>

      {/* Display search results */}
      <div>
        <h2>Search Results</h2>
        {results.length > 0 ? (
          <ul>
            {results.map((result, index) => (
              <li key={index}>
                <strong>Sentence:</strong> {result.sentence}
              </li>
            ))}
          </ul>
        ) : (
          <p>No results found.</p>
        )}
      </div>
    </div>
  );
}

export default App;
