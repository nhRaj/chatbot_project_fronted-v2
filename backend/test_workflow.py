import io
from fastapi.testclient import TestClient
from .main import app

client = TestClient(app)

def test_full_workflow():
    # 1. new session and new chat
    res = client.post('/new-session')
    sid = res.json()['session_id']
    res = client.post('/start-new-chat', headers={'session-id': sid})
    cid = res.json()['chat_id']

    # 2. cannot ask question before upload
    res = client.post('/ask-question', json={'question': 'hi', 'provider': 'azure'}, headers={'session-id': sid, 'chat-id': cid})
    assert res.status_code == 404

    # upload csv
    file_content = 'col1,col2\n1,2\n3,4\n'
    res = client.post('/upload-statement', headers={'session-id': sid, 'chat-id': cid}, files={'files': ('test.csv', file_content, 'text/csv')})
    assert res.status_code == 200
    file_id = res.json()['files'][0]['file_id']

    # 3. preview data
    res = client.get('/preview-data', params={'file_id': file_id}, headers={'session-id': sid, 'chat-id': cid})
    assert res.status_code == 200
    assert res.json()['rows'][0] == ['1', '2']

    # 4. ask question
    res = client.post('/ask-question', json={'question': 'sum?', 'provider': 'azure'}, headers={'session-id': sid, 'chat-id': cid})
    assert res.status_code == 200
    assert 'You asked' in res.json()['answer']

    # 5. save chat
    msgs = [{'role': 'user', 'content': 'sum?'}, {'role': 'assistant', 'content': 'You asked: sum?'}]
    res = client.post('/save-chat', json={'chat_name': 'test', 'messages': msgs}, headers={'session-id': sid, 'chat-id': cid})
    assert res.status_code == 200

    # saved chats list
    res = client.get('/saved-chats')
    assert any(c['chat_id'] == cid for c in res.json()['chats'])

    # 6. start new chat
    res = client.post('/start-new-chat', headers={'session-id': sid})
    new_cid = res.json()['chat_id']
    assert new_cid != cid

    # 7. load saved chat
    res = client.get(f'/get-chat/{cid}', headers={'session-id': sid})
    assert res.status_code == 200
    assert res.json()['messages'] == msgs

    # 8. common questions endpoint
    res = client.get('/common-questions')
    assert res.status_code == 200
    assert isinstance(res.json()['questions'], list)

    # 9. providers
    res = client.get('/providers')
    assert res.status_code == 200
    assert 'azure' in res.json()['providers']
