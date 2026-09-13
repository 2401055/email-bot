import os
import sys
import time
import json
import shlex
import subprocess
from pathlib import Path

import requests

BASE_URL = os.environ.get("VODER_BRIDGE_BASE_URL", "").rstrip("/")
TOKEN = os.environ.get("VODER_BRIDGE_TOKEN", "")
POLL_SECONDS = int(os.environ.get("VODER_POLL_SECONDS", "5"))
WORK_DIR = Path(os.environ.get("VODER_WORK_DIR", "/kaggle/working/voder_runtime"))
INPUT_DIR = WORK_DIR / "inputs"
OUTPUT_DIR = WORK_DIR / "outputs"


def required_config():
    missing = [name for name, value in {
        "VODER_BRIDGE_BASE_URL": BASE_URL,
        "VODER_BRIDGE_TOKEN": TOKEN,
    }.items() if not value]
    if missing:
        raise RuntimeError("Missing environment variables: " + ", ".join(missing))


def headers():
    return {"x-voder-token": TOKEN}


def download_item(item):
    file_id = item["file_id"]
    name = Path(item.get("file_name") or "input.bin").name
    target = INPUT_DIR / f"{int(time.time())}_{name}"
    with requests.get(
        f"{BASE_URL}/voder/file",
        params={"file_id": file_id},
        headers=headers(),
        stream=True,
        timeout=120,
    ) as response:
        response.raise_for_status()
        with target.open("wb") as handle:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    handle.write(chunk)
    return target


def run_voder(input_path):
    output_dir = OUTPUT_DIR / input_path.stem
    output_dir.mkdir(parents=True, exist_ok=True)
    template = os.environ.get(
        "VODER_COMMAND_TEMPLATE",
        "python /kaggle/working/VODER/src/voder.py stt {input} timestamp",
    )
    command = template.format(input=shlex.quote(str(input_path)), output_dir=shlex.quote(str(output_dir)))
    completed = subprocess.run(command, shell=True, text=True, capture_output=True, timeout=3600)
    log = (completed.stdout or "") + "\n" + (completed.stderr or "")
    (output_dir / "voder.log").write_text(log, encoding="utf-8")
    if completed.returncode != 0:
        raise RuntimeError(f"VODER failed with exit code {completed.returncode}. See {output_dir / 'voder.log'}")
    candidates = [p for p in output_dir.rglob("*") if p.is_file() and p.name != "voder.log"]
    if candidates:
        result = max(candidates, key=lambda p: p.stat().st_mtime)
        if result.suffix.lower() in {".txt", ".srt", ".vtt", ".json", ".md"}:
            return result.read_text(encoding="utf-8", errors="replace")[-3800:]
        return f"تمت معالجة الملف بنجاح. الناتج محفوظ في Kaggle: {result}"
    return "اكتملت المعالجة، لكن لم يتم العثور على ملف ناتج. راجع voder.log في مجلد النتائج."


def send_result(chat_id, text):
    response = requests.post(
        f"{BASE_URL}/voder/result",
        headers={**headers(), "content-type": "application/json"},
        json={"chat_id": chat_id, "text": text},
        timeout=120,
    )
    response.raise_for_status()


def main():
    required_config()
    INPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"VODER bridge started: {BASE_URL}", flush=True)
    while True:
        try:
            response = requests.get(f"{BASE_URL}/voder/next", headers=headers(), timeout=60)
            response.raise_for_status()
            payload = response.json()
            item = payload.get("item")
            if not item:
                time.sleep(POLL_SECONDS)
                continue
            print(f"Received item: {json.dumps(item, ensure_ascii=False)}", flush=True)
            try:
                input_path = download_item(item)
                result = run_voder(input_path)
                send_result(item["chat_id"], "تمت معالجة الملف بواسطة VODER:\n\n" + result)
                print(f"Processed item: {input_path.name}", flush=True)
            except Exception as exc:
                send_result(item["chat_id"], "تعذر إكمال معالجة VODER: " + str(exc))
                print(f"Item failed: {exc}", file=sys.stderr, flush=True)
        except KeyboardInterrupt:
            print("Bridge stopped", flush=True)
            return
        except Exception as exc:
            print(f"Polling error: {exc}", file=sys.stderr, flush=True)
            time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
