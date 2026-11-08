# Starts GENESIS. Run from the GENESIS_NEW folder:  .\run.ps1
if (-not (Test-Path .venv)) { python -m venv .venv }
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn genesis.api.main:app --host 127.0.0.1 --port 8000
