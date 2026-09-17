# ResQDrone — Ground Command Centre

Frontend for an AI-assisted search-and-rescue drone command platform. Built for SIH 2026.

React 18 · TypeScript · Vite · Tailwind · React Router · React-Leaflet · Recharts · Axios · Socket.IO client · Lucide.

---

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # type-check + production build
npm run preview  # serve the build
```

No backend is required. With no environment variables set, the app runs entirely on a local
telemetry simulator and clearly labels its data as simulated.

Optional `.env` (copy from `.env.example`):

```
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=http://localhost:8000
VITE_MAP_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

When `VITE_API_URL` or `VITE_WS_URL` are set the app switches its reported telemetry source to
`BACKEND`. When they are unset, no socket is opened and no request is fired — nothing retry-loops
against a server that does not exist.

Map tiles are fetched from OpenStreetMap, so the map needs internet even though the rest of the
command centre does not.

---

## Operator access

The station opens with a boot sequence (click or press Enter to skip), then an operator login.

```
Operator ID   DEMO-OP-01
Password      ResQDrone@2026
```

This is a **frontend demonstration session** held in browser storage. There is no server, no token
verification and no secret — `src/services/auth/localAuth.ts` exists so a real provider can be
dropped in behind the same interface.

## Demo walkthrough

Open **Demo controls** (bottom right). Each button changes real application state.

0. **Force thermal alarm** — the AMG8833 matrix warms at cell (4, 2), the reticle locks, the event
   log records the signature, and a detection opens for review.
1. **Trigger AI detection** — a detection appears at the drone's current position with RGB, thermal
   and fused confidence, a derived priority, a map pin and a timeline entry.
2. **Confirm survivor** — the detection becomes a survivor, mission counters increment, an incident
   opens, and a team recommendation appears with its reasoning.
3. **Dispatch team** — the team's route is drawn on the map and its ETA counts down live until it
   arrives.
4. **Network loss** — cloud goes offline while drone, GPS, AI and telemetry stay up. Subsequent
   events queue locally.
5. **Restore network** — the queue drains with visible progress, then reports completion.
6. **GPS loss / low battery / drone link loss** — each produces its own degraded UI state.
7. **Replay mission** — resets to the start of Mission Alpha.

Reports → **Export JSON / CSV** downloads the current mission state from the browser.

---

## Layout contract

The shell never scrolls. `AppLayout`'s `<main>` is `overflow-hidden`, and each page declares its
own behaviour:

- **Live Mission** is `h-full flex flex-col overflow-hidden`. It fits the viewport at 1440×900 with
  no page scroll. Three regions scroll internally: the mission panel, the event log, and nothing
  else. Every grid child carries `min-h-0` so a tall panel cannot push its neighbours or escape its
  cell.
- **Every other page** is `h-full overflow-y-auto` and owns its own scrollbar.

Absolute positioning is now confined to genuine overlays: map markers and controls, camera HUD
text, targeting reticles and the splash. No content panel is removed from flow.

## Information ownership

| Region | Owns |
| --- | --- |
| Global header (64px) | Identity, mission name, drone state, link honesty, battery, clock, operator |
| Mission status strip (44px) | Mission status, zone coverage, pending targets, GPS, link quality |
| Workspace | Map, payload, thermal, target decision |
| Bottom instrument bar (48px) | Flight, power, nav, sensor-bus counts, event count |
| Drawers | Diagnostics, sensor settings, simulation controls |

Nothing appears in two places. Battery lives in the header; zone coverage lives in the strip.

## Architecture

```
src/
├── app/          layout (header, sidebar, shell), router, providers
├── components/   map/ (composition root + memoised layers/), telemetry, incidents, drone,
│                 mission, rescue, video, timeline, demo, ui
├── components/   ... plus hud/ (attitude, tapes, cluster, LiDAR graph, hardware bar, event log),
│                 payload/ (RGB + thermal viewports), splash/, auth/, system/
├── config/       domain constants (tick rates, ETA assumptions, storage schema, map defaults)
├── context/      AppStore + store/ (state, actions, one reducer per slice, root reducer), ThemeContext
├── data/         mock mission data for the Pune scenario
├── hooks/        telemetry simulator, dispatch tracker, sync engine, operator actions, clock
├── pages/        CommandCenter, LiveMission, Detections, RescueTeams, Missions,
│                 Analytics, Reports, Settings, NotFound
├── services/     api (Axios), websocket (Socket.IO), telemetry source resolution
├── types/        the whole domain model
└── utils/        geo maths, formatting and semantic colour maps
```

### State

Six independent slices — `drone`, `mission`, `incidents`, `rescue`, `system`, `map` — each with its
own reducer. A single dispatch fans one action out to every slice, so a cross-cutting event such as
confirming a survivor updates the incident, the mission counters, the timeline and the alert feed in
one commit, without any slice reading another's state.

Only operator preferences (map layers, base layer) and the unsent offline queue are persisted to
`localStorage`, under a schema version. Persisted data is validated field by field on hydration and
discarded if it is malformed or from an older schema.

Queued events carry a deterministic idempotency key, so repeating an operator action cannot enqueue
it twice, and the queue drains in order with each event marked as it is acknowledged.

### Simulation

`useTelemetrySimulator` advances the drone along a generated boustrophedon sweep at 1 Hz — one state
commit per second, so the map is not thrashed. `CommandMap` derives geometry and passes it to
memoised layer components, so a telemetry tick re-renders the drone marker rather than every
polygon; flight-path polylines are rebuilt only when progress moves past a threshold. Coverage, flight time, distance, battery and heading
all derive from that motion; the coverage polygon on the map is sized by the same progress value the
mission-area card reports.

---

## Design decisions worth knowing

**Two themes, one class set.** Light is the default — white surfaces, charcoal type (#161616), a
single accent blue (#2F35E8), hairline #E5E5E5 borders and almost no shadow, with colour reserved
for operational meaning. Dark is a toggle in the header and in Settings. Every colour resolves through a CSS variable declared in
`src/index.css`, so no component names a theme and switching is a variable swap rather than a second
stylesheet. The choice persists per device. Leaflet markers and Recharts axes read the same palette
through `useThemeColors`, so the map and charts follow the theme too.

**Configuration is not connection.** `telemetryLink` moves `LOCAL_SIMULATOR → CONNECTING →
CONNECTED`, and only a received telemetry frame produces `CONNECTED`. A URL in `.env` that never
delivers gives `DEGRADED` or `OFFLINE`, and the simulator keeps running underneath.

**One commit path for operator actions.** Every cloud-dependent action goes through `commit()` in
`useMissionActions`: local state updates immediately, a durable event is queued when the uplink is
down, and the alert says "queued locally, not yet sent" instead of implying an acknowledgement.

**Colour always carries meaning.** Green operational, blue drone and navigation, yellow warning,
orange action required, red critical, purple AI. No decorative gradients or glows.

**Colour is never the only signal.** Every status is a dot or icon plus a word.

**The camera feeds are drawn, not photographed.** Both feeds are procedurally rendered to a canvas
and labelled `LIVE · SIMULATED`. No still image is passed off as a downlink.

**The AI proposes, a person decides.** Detections read *AI detected* until an operator confirms
them. Nothing in the interface calls a model output a survivor.

**Internet loss is not drone loss.** Drone link, telemetry, GPS, internet and cloud are five
separate indicators, and the offline banner spells out what still works.

**Commands are reported as submitted, not guaranteed.** The UI states what was sent to the
flight-control system; it never claims physical outcomes.

---

## Wiring a backend later

Replace the simulator, not the UI:

1. Set `VITE_API_URL` / `VITE_WS_URL`.
2. In `services/websocket/socket.ts`, subscribe to `CHANNELS.telemetry` and dispatch `drone/tick`
   with the received frame.
3. `useTelemetrySimulator` already stands down when `telemetrySource === 'BACKEND'`.

The action shapes in `context/store/actions.ts` are the contract the backend should satisfy.


## Professional operations upgrade

The frontend now includes an explicit operational status strip, multi-drone Fleet view, structured Incidents register, runtime operator audit log, and clearer simulation/data-source labelling. These are frontend prototype capabilities. Authentication, immutable audit persistence, live fleet telemetry, server-side authorization, and production data retention controls still require backend infrastructure.
