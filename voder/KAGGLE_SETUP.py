import os
import subprocess
import sys
from pathlib import Path


def run(command, check=True):
    print(f"$ {command}", flush=True)
    return subprocess.run(command, shell=True, check=check)


def secret(name):
    try:
        from kaggle_secrets import UserSecretsClient
        value = UserSecretsClient().get_secret(name)
        return value.strip() if value else ""
    except Exception as exc:
        print(f"Could not read Kaggle Secret {name}: {exc}", file=sys.stderr)
        return ""

# Change this only if the Worker is exposed at a different public hostname.
bridge_url = os.environ.get("VODER_BRIDGE_BASE_URL", "https://email-bot.2401055.workers.dev")
bridge_token = os.environ.get("VODER_BRIDGE_TOKEN") or secret("VODER_BRIDGE_TOKEN")

if not bridge_token:
    raise RuntimeError("Add VODER_BRIDGE_TOKEN in Kaggle Add-ons -> Secrets before running this file.")

os.environ["VODER_BRIDGE_BASE_URL"] = bridge_url.rstrip("/")
os.environ["VODER_BRIDGE_TOKEN"] = bridge_token

run("apt-get update -qq && apt-get install -y -qq ffmpeg git")

repo = Path("/kaggle/working/VODER")
if not repo.exists():
    run("git clone --depth 1 https://github.com/HAKORADev/VODER.git /kaggle/working/VODER")
else:
    print("VODER repository already exists; keeping the current checkout.", flush=True)

run("python -m pip install --upgrade pip")
run("python -m pip install requests")
run("cd /kaggle/working/VODER && python setup.py", check=False)

# Verify the Cloudflare bridge before starting the long-running process.
run(
    "python -c \"import os,requests; u=os.environ['VODER_BRIDGE_BASE_URL']+'/voder/next'; "
    "r=requests.get(u,headers={'x-voder-token':os.environ['VODER_BRIDGE_TOKEN']},timeout=30); "
    "print(r.status_code, r.text[:500]); r.raise_for_status()\""
)

bridge = Path("/kaggle/working/voder_colab_bridge.py")
if not bridge.exists():
    raise FileNotFoundError("Upload voder_colab_bridge.py to /kaggle/working before running KAGGLE_SETUP.py")

print("Setup complete. Starting the VODER bridge. Leave this cell running.", flush=True)
os.execv(sys.executable, [sys.executable, str(bridge)])
