from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from os import path, makedirs
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import whisper
import yt_dlp

app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def download_youtube_audio(url, output_path="audio"):
    makedirs(output_path, exist_ok=True)
    audio_path = path.join(output_path, "audio.mp3")

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': audio_path,
        'postprocessors': [
            {
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }
        ],
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    return f"{audio_path}"

def transcribe_audio(audio_path):
    model = whisper.load_model("base")
    result = model.transcribe(audio_path)
    return result['text']

def save_transcription(transcription, output_file="transcription.txt"):
    with open(output_file, "w") as f:
        f.write(transcription)

def create_embeddings(transcription):
    model = SentenceTransformer('all-MiniLM-L6-v2')
    sentences = transcription.split('. ')
    embeddings = model.encode(sentences)
    return embeddings, sentences

def build_search_index(embeddings):
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)
    return index

def query_video_content(query, index, sentences, model):
    query_embedding = model.encode([query])
    distances, indices = index.search(query_embedding, k=3)
    results = []
    for i in range(len(indices[0])):
        results.append({
            "sentence": sentences[indices[0][i]]
        })
    return results


@app.post("/transcribe")
async def transcribe_youtube(request: dict):
    url = request.get('url')
    try:
        transcription = transcribe_audio(download_youtube_audio(url))
        save_transcription(transcription)
        return {"transcription": transcription}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
@app.post("/query")
async def query_transcription(request: dict):
    query = request.get('query')
    try:
        with open("transcription.txt", "r") as file:
            transcription = file.read()
        embeddings, sentences = create_embeddings(transcription)
        embeddings = np.array(embeddings).astype('float32')
        index = build_search_index(embeddings)
        results = query_video_content(query, index, sentences, SentenceTransformer('all-MiniLM-L6-v2'))
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))