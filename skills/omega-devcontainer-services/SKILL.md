---
name: omega-devcontainer-services
description: Use when a program must keep running and answer on a web address of its own (a remote desktop in the browser, a media server, a small web app), not run once and finish. Covers marking a Devcontainer always-on with `executionType`, declaring a service on it with `qo service up`, reading its address with `qo service status`, removing it with `qo service stop`, the limit of three always-on Devcontainers per account, and that a service is public and must handle its own sign-in.
---

**Parent skill: `omega-navigation`.** If you have not invoked `omega-navigation` yet, invoke it
first — it establishes how to find your bearings in a workspace — then come back here.

# Devcontainer Services

## When to use

A job that must stay up and be reached over the web: a desktop you open in a browser, a media server, a small web app. A job that runs once and ends is a Run (`omega-pod-runs`), and an agent session is a session (`omega-devcontainers`, "Using the image").

## The model

- A Devcontainer is **serverless** by default: it starts when a session or Run needs it and stops when it is idle. Putting `"executionType": "always-on"` at the top level of its `devcontainer-json` makes it **always-on**: one pod runs for it all the time, is restarted when it crashes, and is moved to another machine when its machine is lost.
- A **service** is a program you declare on an always-on Devcontainer: a name, a port, a command, and optional environment variables. It runs in the Devcontainer's pod, and gets an address of its own: for a service named `web` on a Devcontainer whose id begins `7f3c91aa-`, it is `https://web-7f3c91aa.svc.cloud.queryomega.com` (the service name, a dash, the part of the Devcontainer's id before its first dash). The address has a certificate.
- A service is **public**. Anyone who has the address can open it. The service has to ask for its own password; OmegaAI does not.
- A service is stored at the path `system:#service:$DC:web` for a service named `web` on the Devcontainer whose id is in the shell variable `DC` (set below). Writing it starts it, deleting it stops it.

## The three commands

```bash
dcid() { qo block devcontainer get "$1" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const f=o=>o&&typeof o==="object"?(o["devcontainer-id"]||Object.values(o).map(f).find(Boolean)):undefined;console.log(f(JSON.parse(s)))})'; }
DC=$(dcid "Resources/Containers@web-env")
qo service up web --devcontainer "$DC" --port 8000 --command '["node","/home/agent/server.js"]' --var MODE=production
qo service status web --devcontainer "$DC"
qo service stop web --devcontainer "$DC"
```

- `--command` is a JSON array: the program and its arguments, run as the `agent` user with no shell. To use a shell, make it the program: `["sh","-c","cd /home/agent && exec node server.js"]`.
- `--var` may be given many times (`--var MODE=production --var PORT_BASE=8000`). A service name is 1 to 20 characters: lower-case letters, digits and dashes, starting with a letter and not ending with a dash.
- `up` answers `host`, `url` and `state`. `status` answers `state`: `starting`, `running`, `stopped` or `gone` (the always-on pod does not exist).
- Run `up` again with the same name to change a service. Adding, changing or removing a service restarts the pod, so every service on that Devcontainer is down for a moment.
- Start a program in the foreground. A program that ends, or that forks into the background and returns, is restarted.

## Limits

- At most **three** always-on Devcontainers per account. The fourth is refused with HTTP status 429 and an error that starts `always-on-cap`.
- Deleting an always-on Devcontainer that still has services is refused: stop its services first.
- Files the program writes outside a mounted Volume are lost when the pod restarts. Mount a Volume (`omega-devcontainers`, "Volumes") for anything that must last, and write there.
- An always-on Devcontainer with no service runs nothing.

## Recipe: a remote desktop in the browser (VNC)

The Devcontainer, written with `omega-devcontainers` (create the block, write this as its `devcontainer-json`, wait for `ready`). Make the Volume once with `qo block volume create "Resources/Volumes" vnc-config`, create the block with `qo block devcontainer create "Resources/Containers" desktop`, and write this as its `devcontainer-json`:

```json
{
  "executionType": "always-on",
  "features": {
    "apt": ["tigervnc-standalone-server", "tigervnc-tools", "novnc", "websockify", "openbox", "xterm"],
    "runAfterFetch": ["mkdir -p /home/agent/.vnc && printf 'exec openbox\\n' > /home/agent/.vnc/xstartup && chmod +x /home/agent/.vnc/xstartup"]
  },
  "mounts": [{"source": "Resources/Volumes@vnc-config", "target": "/home/agent/vnc-config"}]
}
```

The program is a short script, saved as `vnc-start.sh`. It keeps the VNC password in the Volume, as a file only the `agent` user can read, so the password is given once:

```sh
set -e; umask 077; D=/home/agent/vnc-config; mkdir -p "$D"
if [ -n "$VNC_PASSWORD" ]; then printf '%s\n%s\n' "$VNC_PASSWORD" "$VNC_PASSWORD" | tigervncpasswd "$D/rfbauth" >/dev/null; fi
[ -s "$D/rfbauth" ] || { echo "no VNC password: start the service once with --var VNC_PASSWORD=..." >&2; exit 1; }
vncserver :1 -geometry 1280x800 -localhost yes -rfbauth "$D/rfbauth" -SecurityTypes VncAuth
exec websockify --web /usr/share/novnc 6080 localhost:5901
```

Start it the first time with the password, and later times without it:

```bash
DC=$(dcid "Resources/Containers@desktop")
qo service up desktop --devcontainer "$DC" --port 6080 --var VNC_PASSWORD=choose-a-password \
  --command "$(node -e 'console.log(JSON.stringify(["sh","-c",require("fs").readFileSync(0,"utf8")]))' < vnc-start.sh)"
```

Open the `url` that `up` printed with `/vnc.html` added, press Connect, and type the password. Only the first 8 characters of a VNC password count. The password is kept in the service's record until you run `up` again without `--var VNC_PASSWORD`; the file in the Volume is what later starts use.

## Recipe: a Plex Media Server

The Devcontainer:

```json
{
  "executionType": "always-on",
  "features": {
    "fetch": [{"download": "https://downloads.plex.tv/plex-media-server-new/1.43.5.11079-b3b13e506/debian/plexmediaserver_1.43.5.11079-b3b13e506_amd64.deb", "sha256": "74e9a71c97e06d6e925cc4398279141fd838ee9df446f90e769614fa2c87a206", "dest": "/opt/src/plexmediaserver.deb"}],
    "runAfterFetch": ["dpkg-deb -x /opt/src/plexmediaserver.deb /home/agent/plex-root"]
  },
  "mounts": [{"source": "Resources/Volumes@plex-config", "target": "/home/agent/plex-config"}]
}
```

The service:

```bash
DC=$(dcid "Resources/Containers@plex")
qo service up plex --devcontainer "$DC" --port 32400 \
  --command '["/home/agent/plex-root/usr/lib/plexmediaserver/Plex Media Server"]' \
  --var PLEX_MEDIA_SERVER_HOME=/home/agent/plex-root/usr/lib/plexmediaserver \
  --var LD_LIBRARY_PATH=/home/agent/plex-root/usr/lib/plexmediaserver/lib \
  --var PLEX_MEDIA_SERVER_APPLICATION_SUPPORT_DIR=/home/agent/plex-config \
  --var TMPDIR=/tmp --var TZ=UTC
```

`$(qo service status plex --devcontainer "$DC" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).url))")/identity` answers when it is up. Make the Volume once with `qo block volume create "Resources/Volumes" plex-config`; put media on a second Volume the same way and add it to the same `mounts` list.

## See also

`omega-devcontainers` (the spec and the build), `omega-pod-runs` (a program that runs once), `omega-long-running-work` (waiting on a job).
