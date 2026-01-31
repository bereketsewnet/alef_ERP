FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
# .env is loaded at runtime (bind-mounted or baked in)

CMD ["python", "-u", "bot.py"]
