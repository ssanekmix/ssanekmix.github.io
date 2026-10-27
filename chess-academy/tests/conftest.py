import pytest
from fastapi.testclient import TestClient
from academy import db,main,engine

@pytest.fixture
def client(tmp_path,monkeypatch):
    monkeypatch.setattr(db,'DB',tmp_path/'test.sqlite3')
    monkeypatch.setattr(db,'DATA',tmp_path)
    main.queue=engine.Queue()
    with TestClient(main.app) as c: yield c
