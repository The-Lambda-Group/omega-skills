---
name: omega-devcontainer-services
description: Use when a Devcontainer's pod must run all the time instead of only when a session needs it (set `executionType` to `"always-on"`), or when a port of a Devcontainer's pod must answer on a web address of its own (a Devcontainer Service, made with `qo service up`, read with `qo service status`, removed with `qo service stop`). These are two separate things: an always-on Devcontainer needs no service, and a service starts nothing. Covers both, who may manage a service, that visiting one is public, and a VNC and a Plex recipe.
---

**Parent skill: `omega-navigation`.** If you have not invoked `omega-navigation` yet, invoke it
first — it establishes how to find your bearings in a workspace — then come back here.

# Always-On Devcontainers and Devcontainer Services

## When to use

- The pod of a Devcontainer must keep running, not start only when a session needs it: set its `executionType` (below, "The ASP Execution Model").
- A port in a Devcontainer's pod must be reached over the web at an address of its own: declare a Devcontainer Service (below, "Devcontainer Services").

These are two separate things. Use either one without the other. A job that runs once and ends is a Run (`omega-pod-runs`); an agent session is a session (`omega-devcontainers`, "Using the image").

## The ASP Execution Model: `executionType`

A Devcontainer's sessions run in its **Agent Service Pod (ASP)**: the pod that runs the agent server on the Devcontainer's image. How that pod runs is its **ASP Execution Model**, chosen by the top-level `executionType` key of the Devcontainer's `devcontainer-json`:

- `"serverless"`, the default when the key is absent: the **Serverless ASP Execution Model**. The ASP starts when a session needs it; it does not run all the time.
- `"always-on"`: the **Always-On ASP Execution Model**. The ASP runs as soon as the Devcontainer is always-on and its build is `ready`, whether or not it has any service. It is a Kubernetes Deployment of one pod: Kubernetes keeps it running, starts it again when it crashes, and starts it on another machine when its machine is lost. OmegaAI adds no start or restart of its own.
- Any other value is refused with `omega/query-omega/devcontainer/UnsupportedExecutionType`.

Set it by writing the spec, as `omega-devcontainers` describes:

```bash
qo block devcontainer create "Resources/Containers" web-env
qo write "Resources/Containers@web-env" --data '{"devcontainer-json": "{\"executionType\": \"always-on\", \"features\": {\"apt\": [\"python3\"]}}"}'
qo block devcontainer get "Resources/Containers@web-env"
```

- Every write of `devcontainer-json` builds. When the build is `ready`, the always-on ASP is started, or started again on the new image. `executionType` is not part of the image: changing only it builds the same image again.
- Writing `"serverless"` (or leaving the key out), or deleting the Devcontainer, removes the always-on ASP.
- The always-on ASP runs the same agent server a serverless one runs, and nothing else.
- There is no limit on the number of always-on Devcontainers per account.
- Files written outside a mounted Volume are lost when the pod starts again. Mount a Volume (`omega-devcontainers`, "Volumes") for anything that must last. A Volume is mounted by one container at a time, and an always-on ASP mounts its Devcontainer's Volumes all the time.

## Devcontainer Services

A **Devcontainer Service** is a name and a port on a Devcontainer, and nothing else: it has no command and no environment variables. It gives that port an address of its own, its **Service Host**: for a service named `web` on a Devcontainer whose id begins `7f3c91aa-`, it is `https://web-7f3c91aa.svc.cloud.queryomega.com` (the service name, a dash, the part of the Devcontainer's id before its first dash). The address has a certificate.

- A service does two things: it makes that address, and it forwards the address to its port in the Devcontainer's always-on ASP. That is all.
- A service starts nothing and stops nothing. Adding, changing or removing a service never starts, stops or restarts the pod, so the other services of that Devcontainer stay up.
- Something in the pod must listen on the port, on all addresses (`0.0.0.0`), not only on `localhost`. A service does not start that program.
- When the Devcontainer's ASP is not running (it is still starting, or the Devcontainer is serverless), the address answers HTTP status `503`.

```bash
dcid() { qo block devcontainer get "$1" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const f=o=>o&&typeof o==="object"?(o["devcontainer-id"]||Object.values(o).map(f).find(Boolean)):undefined;console.log(f(JSON.parse(s)))})'; }
DC=$(dcid "Resources/Containers@web-env")
qo service up web --devcontainer "$DC" --port 8000
qo service status web --devcontainer "$DC"
qo service stop web --devcontainer "$DC"
```

- A service name is 1 to 20 characters: lower-case letters, digits and dashes, starting with a letter and not ending with a dash. The port is 1 to 65535, except 4096 to 4099, which the ASP uses. Two services of one Devcontainer cannot share a port (`PortInUseException`).
- Run `up` again with the same name to change its port.
- `up` and `status` print the service as JSON, with its `service-id`, `host`, `url`, `port` and `state`. `state` is one of four, each meaning one thing:
  - `gone`: there is no address.
  - `off`: the address exists and the Devcontainer has no always-on ASP, so nothing will boot (it is serverless, or its always-on ASP has not been applied yet).
  - `starting`: the address exists and the always-on ASP's pod is booting.
  - `running`: the address exists and the always-on ASP has a running pod. This does not check that your program answers.
- `stop` removes the address and its forwarding. It does not stop the pod or any program in it.
- A service is stored at the path `system:#service:$DC:web`. `qo service up` is a `qo write` of that path, `status` is a `qo get` and `stop` is a `qo delete`. A write that carries any field but the port (for example `command` or `env`) is refused with `UnsupportedServiceKeyException`.

## Who may do what

- **Visiting a service is public.** Anyone who has its address can open it. The program behind it must ask for its own password; OmegaAI adds no sign-in.
- **Managing a service is not.** Reading, changing or removing a service (`qo service up`, `status`, `stop`) takes the Devcontainer's own permission (a Resource-Level Access Policy): you may read a service only if you may read its Devcontainer, and change or remove it only if you may write its Devcontainer. Anyone else is refused with `PERMISSION_DENIED_EXCEPTION`. The agent service checks the write permission again itself when a service is changed or removed through it, so calling it directly with a credential that may only read the Devcontainer is refused too. Being able to visit an address does not let you manage it.

## Limits

- Deleting a Devcontainer that still has a service is refused with `DevcontainerHasServicesException`: stop its services first. Writing it `"serverless"` is not refused; its services then read `off` and answer `503` until it is always-on again.
- A Devcontainer has no list of its services: `qo service status` reads one service by its name.

## Recipe: a remote desktop in the browser (VNC)

1. The Volume, made once: `qo block volume create "Resources/Volumes" vnc-config`.
2. The Devcontainer: `qo block devcontainer create "Resources/Containers" desktop`, with this as its `devcontainer-json` (write it as `omega-devcontainers` describes and wait for `ready`):

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

3. The password. The desktop must have a VNC password, because the address is public. The password is kept in the Volume as the file `/home/agent/vnc-config/rfbauth`, readable only by the `agent` user, in the format `vncpasswd -f` (from `tigervnc-tools`) writes. It is never put in the spec, the image, a service or any stored record, and never passed through a service. Only the first 8 characters of a VNC password count. How that file is written into the Volume is not decided yet: it needs a shell, as the `agent` user, in a container that mounts the Volume, and a Run Pod mounts no Volume (`omega-pod-runs`).
4. The service:

```bash
DC=$(dcid "Resources/Containers@desktop")
qo service up desktop --devcontainer "$DC" --port 6080
```

The programs that serve the desktop, as checked in the base image as the `agent` user, are `vncserver :1 -geometry 1280x800 -localhost yes -SecurityTypes VncAuth -rfbauth /home/agent/vnc-config/rfbauth` and then `websockify --web /usr/share/novnc 6080 localhost:5901`. Once they run, open the service's `url` with `/vnc.html` added, press Connect, and type the password.

## Recipe: a Plex Media Server

1. The Volume, made once: `qo block volume create "Resources/Volumes" plex-config`. Put media on a second Volume made the same way and add it to the same `mounts` list.
2. The Devcontainer: `qo block devcontainer create "Resources/Containers" plex`, with this as its `devcontainer-json`:

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

3. The service:

```bash
DC=$(dcid "Resources/Containers@plex")
qo service up plex --devcontainer "$DC" --port 32400
```

The server, as checked in the base image as the `agent` user, is `/home/agent/plex-root/usr/lib/plexmediaserver/Plex Media Server`, run with `PLEX_MEDIA_SERVER_HOME=/home/agent/plex-root/usr/lib/plexmediaserver`, `LD_LIBRARY_PATH=/home/agent/plex-root/usr/lib/plexmediaserver/lib`, `PLEX_MEDIA_SERVER_APPLICATION_SUPPORT_DIR=/home/agent/plex-config`, `TMPDIR=/tmp` and `TZ=UTC`. Once it runs, the service's `url` with `/identity` added answers. Plex asks for its own sign-in.

## See also

`omega-devcontainers` (the spec, the build and Volumes), `omega-pod-runs` (a program that runs once), `omega-long-running-work` (waiting on a job).
