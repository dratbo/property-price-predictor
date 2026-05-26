FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY parser.py scheduler.py regions.py ./

CMD ["python", "scheduler.py"]
