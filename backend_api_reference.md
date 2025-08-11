# API Reference

## POST `/new-session`
Creates a new chat session.

### Response
```
{ "session_id": "<uuid>" }
```

## POST `/upload-statement`
Upload one or more PDF or CSV files and process them.

### Headers
- `session-id` – ID returned from `/new-session`
- `chat-id` – ID returned from `/start-new-chat`

### Form Data
- `files` – one or more statement files

### Response
```
{
  "session_id": "<sid>",
  "chat_id": "<cid>",
  "files": [
    { "file_id": "<uuid>", "filename": "statement1.pdf" },
    { "file_id": "<uuid>", "filename": "statement2.csv" }
  ]
}
```

## POST `/ask-question`
Ask a question about an uploaded statement.

### Headers
- `session-id` – Session identifier
- `chat-id` – Chat identifier

### JSON Body
```
{
  "question": "What is the total deposit?",
  "provider": "azure"
}
```

### Response
```
{ "answer": "Your total deposit is 1000" }
```

## GET `/preview-data`
Return the first few rows of the cleaned CSV file.

### Headers
- `session-id` – Session identifier
- `chat-id` – Chat identifier

### Query Parameters
- `file_id` – File identifier
- `rows` – Number of rows to return (default `5`)

### Response
```
{
  "columns": ["Date", "Description", "Debit", "Credit"],
  "rows": [["2024-01-01", "SALARY", "", "1000"], ...]
}
```

## GET `/common-questions`
List of predefined helpful questions.

### Response
```
{
  "questions": ["What is the total amount credited to the account across all transactions?", ...]
}
```

## POST `/save-chat`
Persist chat history for a session.

### Headers
- `session-id` – Session identifier
- `chat-id` – Chat identifier

### JSON Body
```
{
  "chat_name": "July summary",  // optional
  "messages": [
    {"role": "user", "content": "Hi"},
    {"role": "assistant", "content": "Hello"}
  ]
}
```

### Response
```
{ "status": "saved" }
```

## POST `/start-new-chat`
Start a new chat history.

### Headers
- `session-id` – Session identifier

### Response
```
{ "chat_id": "<uuid>" }
```


## GET `/providers`
List available LLM providers.

### Response
```
{ "providers": ["azure"] }
```

## GET `/saved-chats`
List all saved chat sessions.

### Headers
- `session-id` – Session identifier

### Response
```
{
  "chats": [
    { "chat_id": "<id>", "chat_name": "July summary", "timestamp": "2024-07-17T14:55:32Z" }
  ]
}
```
## GET `/get-chat/{chat_id}`
Retrieve a previously saved chat.

### Headers
- `session-id` – Session identifier

### Response
```
{
  "chat_id": "abc123",
  "chat_name": "July summary",
  "files": [
    { "file_id": "a1", "filename": "statement1.pdf" }
  ],
  "messages": [ ... ],
  "timestamp": "2024-07-17T14:55:32Z"
}
```

All endpoints may return:

- **404** – when the provided identifiers do not exist. `/ask-question` also returns this status if no files have been uploaded for the session.
- **400** – when the uploaded file is invalid or an internal processing error occurs.
