from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Request
from fastapi.responses import JSONResponse
from uuid import uuid4
from typing import List, Optional
from datetime import datetime
import csv
from io import StringIO, TextIOWrapper

app = FastAPI()

# In-memory stores
sessions = {}
saved_chats = []

COMMON_QUESTIONS = [
    "What is the total amount credited to the account across all transactions?",
    "What is the total amount debited from the account?",
    "What is the average balance?",
]

@app.post("/new-session")
def new_session():
    sid = str(uuid4())
    sessions[sid] = {"chats": {}}
    return {"session_id": sid}

@app.post("/start-new-chat")
def start_new_chat(session_id: str = Header(..., alias="session-id")):
    if session_id not in sessions:
        raise HTTPException(404, "Session not found")
    cid = str(uuid4())
    sessions[session_id]["chats"][cid] = {"files": [], "messages": [], "chat_name": None, "timestamp": datetime.utcnow()}
    return {"chat_id": cid}

@app.post("/upload-statement")
async def upload_statement(
    request: Request,
    files: List[UploadFile] = File(...),
    session_id: str = Header(..., alias="session-id"),
    chat_id: str = Header(..., alias="chat-id"),
):
    session = sessions.get(session_id)
    if not session or chat_id not in session["chats"]:
        raise HTTPException(404, "Session or chat not found")
    chat = session["chats"][chat_id]
    for f in files:
        fid = str(uuid4())
        content = await f.read()
        columns = []
        rows = []
        try:
            if f.filename.lower().endswith(".csv"):
                text = content.decode("utf-8")
                reader = csv.reader(StringIO(text))
                columns = next(reader, [])
                for i, row in enumerate(reader):
                    if i >= 5:
                        break
                    rows.append(row)
            # For PDFs or other files we don't parse but still store metadata
        except Exception:
            pass
        chat["files"].append({
            "file_id": fid,
            "filename": f.filename,
            "columns": columns,
            "rows": rows,
        })
    return {
        "session_id": session_id,
        "chat_id": chat_id,
        "files": [{"file_id": f["file_id"], "filename": f["filename"]} for f in chat["files"]],
    }

@app.get("/preview-data")
def preview_data(
    file_id: str,
    rows: int = 5,
    session_id: str = Header(..., alias="session-id"),
    chat_id: str = Header(..., alias="chat-id"),
):
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    chat = session["chats"].get(chat_id)
    if not chat:
        raise HTTPException(404, "Chat not found")
    for f in chat["files"]:
        if f["file_id"] == file_id:
            return {"columns": f["columns"], "rows": f["rows"][:rows]}
    raise HTTPException(404, "File not found")

@app.post("/ask-question")
def ask_question(
    body: dict,
    session_id: str = Header(..., alias="session-id"),
    chat_id: str = Header(..., alias="chat-id"),
):
    session = sessions.get(session_id)
    if not session or chat_id not in session["chats"]:
        raise HTTPException(404, "Session or chat not found")
    chat = session["chats"][chat_id]
    if not chat["files"]:
        raise HTTPException(404, "No files uploaded")
    question = body.get("question", "")
    answer = f"You asked: {question}"
    return {"answer": answer}

@app.get("/common-questions")
def common_questions():
    return {"questions": COMMON_QUESTIONS}

@app.post("/save-chat")
def save_chat(
    body: dict,
    session_id: str = Header(..., alias="session-id"),
    chat_id: str = Header(..., alias="chat-id"),
):
    session = sessions.get(session_id)
    if not session or chat_id not in session["chats"]:
        raise HTTPException(404, "Session or chat not found")
    chat = session["chats"][chat_id]
    chat_name = body.get("chat_name")
    messages = body.get("messages", [])
    chat["chat_name"] = chat_name
    chat["messages"] = messages
    chat["timestamp"] = datetime.utcnow()
    # update global saved_chats list
    found = False
    for c in saved_chats:
        if c["chat_id"] == chat_id:
            c.update({"chat_name": chat_name, "session_id": session_id, "timestamp": chat["timestamp"]})
            found = True
            break
    if not found:
        saved_chats.append({
            "chat_id": chat_id,
            "session_id": session_id,
            "chat_name": chat_name,
            "timestamp": chat["timestamp"],
        })
    return {"status": "saved"}

@app.get("/saved-chats")
def list_saved_chats():
    return {"chats": saved_chats}

@app.get("/get-chat/{chat_id}")
def get_chat(chat_id: str, session_id: str = Header(..., alias="session-id")):
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    chat = session["chats"].get(chat_id)
    if not chat:
        raise HTTPException(404, "Chat not found")
    return {
        "chat_id": chat_id,
        "chat_name": chat.get("chat_name"),
        "files": [{"file_id": f["file_id"], "filename": f["filename"]} for f in chat["files"]],
        "messages": chat.get("messages", []),
        "timestamp": chat.get("timestamp"),
    }

@app.get("/providers")
def providers():
    return {"providers": ["azure"]}
