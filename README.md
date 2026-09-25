# 🚁 ResQDrone

### AI-Assisted Search & Rescue Drone Command Platform

> **AI detects. Operators verify. Rescue teams act.**

ResQDrone turns a UAV's sensor feed into rescue-ready intelligence. It combines drone telemetry,
thermal and visual sensing, and AI-assisted detection with a Ground Command Centre built for one
rule: **a human always makes the final call.**

![SIH 2026](https://img.shields.io/badge/SIH-2026-orange?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![AI/CV](https://img.shields.io/badge/AI%2FCV-prototype-9B8AFB?style=flat-square)

---

## The Problem

Search-and-rescue teams operate under conditions that work against them:

- Search zones are large and often hazardous to cover on foot
- Visibility is poor — smoke, debris, dense terrain, night operations
- Survivors can be hidden from plain sight but still detectable by heat
- Visual, thermal and position data arrive from different sources, not one view
- Manual coordination between spotting and dispatch costs critical time

## Our Solution

ResQDrone pairs a sensor-equipped UAV with computer vision and a unified Ground Command Centre.
Drone telemetry, RGB vision, thermal imaging, LiDAR and GPS are fused into a single candidate
detection, prioritized by confidence, and presented to a rescue operator alongside a live map and
sensor evidence. The operator reviews that evidence and decides — the system never dispatches on
its own.

> **AI proposes a detection; the human operator makes the final decision.**

---

## System in Action

<p align="center">
  <img src="docs/images/ground-command-centre.png" alt="ResQDrone Ground Command Centre" width="100%">
</p>

<p align="center"><em>Ground Command Centre — live mission monitoring, mapping and rescue operations.</em></p>

---

## Main Workflow

```mermaid
flowchart LR
    A[DRONE SEARCH] --> B[SENSOR CAPTURE]
    B --> C[AI DETECTION]
    C --> D[SENSOR FUSION]
    D --> E[OPERATOR VERIFICATION]
    E --> F[INCIDENT]
    F --> G[RESCUE DISPATCH]

    classDef drone fill:#1B3A5C,stroke:#4EA5D9,color:#fff
    classDef ai fill:#4B3F72,stroke:#9B8AFB,color:#fff
    classDef human fill:#7A4A1F,stroke:#E0A56A,color:#fff
    classDef rescue fill:#245C40,stroke:#78C59A,color:#fff

    class A,B drone
    class C,D ai
    class E human
    class F,G rescue
```

## Sensor → AI → Command Centre

```mermaid
flowchart TB
    D[RESQDRONE DRONE]
    D --> R[RGB Camera]
    D --> T[Thermal · AMG8833]
    D --> L[LiDAR · TF-Luna]
    R --> F[SENSOR FUSION]
    T --> F
    L --> F
    F --> Y[YOLOv8 + Telemetry]
    Y --> C[COMMAND CENTRE]

    classDef drone fill:#1B3A5C,stroke:#4EA5D9,color:#fff
    classDef ai fill:#4B3F72,stroke:#9B8AFB,color:#fff
    classDef human fill:#7A4A1F,stroke:#E0A56A,color:#fff

    class D,R,T,L drone
    class F,Y ai
    class C human
```

---

## AI / Computer Vision

**YOLOv8** — person detection from RGB frames
**OpenCV** — image and video preprocessing
**PyTorch** — deep-learning framework
**AMG8833** — 8×8 thermal-grid sensing for heat signatures
**Sensor Fusion** — combines RGB, thermal, LiDAR, GPS and telemetry into one candidate detection
and priority signal

The detection pipeline above is designed and prototyped in software; live YOLOv8 inference and
sensor hardware are integration targets, listed honestly in the status table below.

---

## Human-in-the-Loop Workflow

```mermaid
flowchart TB
    A[AI DETECTION] --> B[EVIDENCE REVIEW]
    B --> C{OPERATOR DECISION}
    C -->|Dismiss| X[DISMISSED]
    C -->|Confirm| D[INCIDENT]
    D --> E[RESCUE TEAM]
    E --> F[DISPATCH]

    classDef ai fill:#4B3F72,stroke:#9B8AFB,color:#fff
    classDef human fill:#7A4A1F,stroke:#E0A56A,color:#fff
    classDef rescue fill:#245C40,stroke:#78C59A,color:#fff

    class A ai
    class B,C human
    class D,E,F rescue
    class X human
```

> **AI assists the operator; it does not replace the operator.**

---

## Hardware

| Component | Purpose |
|---|---|
| Pixhawk 2.4.8 | Flight control |
| ArduPilot | Flight firmware |
| u-blox NEO GPS | Position |
| ESP32-CAM + OV2640 | RGB vision |
| AMG8833 | Thermal sensing |
| TF-Luna LiDAR | Distance |
| ESP32 | Sensor communication |

<p align="center">
  <img src="docs/images/hardware-drone.png" alt="ResQDrone assembled UAV hardware" width="90%">
</p>

<p align="center"><strong>ResQDrone hardware — assembled UAV platform</strong></p>

---

## Ground Command Centre

- Live map with drone position and coverage
- Drone telemetry
- RGB and thermal views
- Detection intelligence
- Incident management
- Rescue coordination
- Mission analytics
- System health

---

## System Architecture

```mermaid
flowchart TB
    DR[DRONE<br/>Pixhawk + Sensors]
    CM[COMMUNICATION<br/>MAVLink / Wi-Fi]
    BE[BACKEND<br/>FastAPI + WebSocket]
    AI[AI / CV<br/>YOLOv8 + OpenCV + PyTorch]
    DA[DATA<br/>PostgreSQL]
    CC[COMMAND CENTRE<br/>React + GIS]
    OP[OPERATOR<br/>Verification + Rescue Coordination]

    DR --> CM --> BE
    BE --> AI
    BE --> DA
    AI --> CC
    DA --> CC
    CC --> OP

    classDef drone fill:#1B3A5C,stroke:#4EA5D9,color:#fff
    classDef backend fill:#2B4A5E,stroke:#5FB0C9,color:#fff
    classDef ai fill:#4B3F72,stroke:#9B8AFB,color:#fff
    classDef human fill:#7A4A1F,stroke:#E0A56A,color:#fff

    class DR,CM drone
    class BE,DA backend
    class AI ai
    class CC,OP human
```

---

## Technology Stack

| Category | Technologies |
|---|---|
| Hardware | UAV, GPS, RGB, Thermal, LiDAR |
| Embedded & Control | C/C++, ESP32, Flight Control, GPS |
| AI & Computer Vision | Python, OpenCV, YOLO, Thermal Analysis |
| Backend | Node.js, Express.js, FastAPI, GPS Data, Telemetry |
| Web Dashboard | React, TypeScript, Tailwind CSS, Live Video, Maps |
| Cloud & Data | Cloud Storage, Real-Time Database, Authentication, Logging |

---

## Implementation Status

| Component | Status |
|---|---|
| Ground Command Centre | Prototype |
| Telemetry Simulation | Prototype |
| GIS Interface | Prototype |
| Detection Workflow | Prototype |
| Rescue Workflow | Prototype |
| Backend | Integration |
| Pixhawk / MAVLink | Integration |
| Hardware Sensors | Integration |
| YOLOv8 | Integration Target |
| Sensor Fusion | Integration Target |
