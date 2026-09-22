# ResQDrone

### AI-Assisted Search & Rescue Drone Command Platform

> AI detects. Sensors validate. Humans decide. Rescue teams act.

ResQDrone is a drone-based search-and-rescue platform that combines live telemetry, RGB vision, thermal sensing, LiDAR, GPS, optical sensing, and AI-assisted detection into a unified Ground Command Centre. The platform is designed to support rescue teams in disaster zones and hazardous environments by providing real-time situational awareness, survivor detection, sensor validation, location intelligence, and actionable information for faster and safer rescue operations.

---

## 1. Overview

Search-and-rescue operations depend on fast, reliable situational awareness across large and often hazardous terrain. Manual search is slow, visibility is limited, and coordinating visual, thermal and positional data across teams in real time is difficult — especially when communication or GPS signal is unreliable.

ResQDrone addresses this by deploying a UAV equipped with RGB, thermal, LiDAR and optical-flow sensing, processing that data through AI-assisted detection, and surfacing the result to a rescue team through a Ground Command Centre. Every detection is treated as a lead for a human operator to verify, not an automatic confirmation — the system supports the decision, the operator makes it.

---

## 2. Technical Approach

The platform follows a defined operational pipeline:

1. **SEARCH** — Systematic area coverage using UAV.
2. **SENSE** — Collect RGB, thermal, LiDAR, GPS, optical-flow and other sensor data.
3. **DETECT** — AI/computer-vision models identify people, hazards and relevant objects.
4. **EVALUATE** — Assess detection confidence, context and risk.
5. **VERIFY** — Use additional sensor evidence to validate uncertain detections.
6. **LOCATE** — Use GPS and optical-flow-based positioning to support accurate localization, including GPS-denied environments.
7. **INFORM** — Send real-time alerts, telemetry and actionable information to the rescue team through the Ground Command Centre.

In GPS-denied or GPS-degraded conditions (e.g. dense structures, indoor spaces, signal shadowing), the optical flow sensor provides relative motion and position information to help maintain positional stability and situational continuity. This supplements GPS rather than replacing it.

---

## 3. Key Capabilities

- Real-time drone telemetry monitoring
- RGB and thermal visual intelligence
- AI-based human/object detection
- LiDAR-based environmental sensing
- GPS-based location tracking
- Optical-flow-assisted positioning in GPS-denied areas
- Multi-sensor detection verification
- Live video and map-based situational awareness
- Ground Command Centre for rescue-team decision support
- Real-time alerts and actionable intelligence

---

## 4. Technology Stack

| Layer | Technologies |
|---|---|
| Hardware | UAV, Pixhawk 2.4.8, ArduPilot, u-blox NEO GPS, ESP32-CAM, OV2640, AMG8833, TF-Luna LiDAR, Optical Flow Sensor |
| Embedded & Control | C/C++, ESP32, Flight Control, GPS |
| AI & Computer Vision | Python, OpenCV, YOLO, Thermal Analysis |
| Backend | Node.js, Express.js, FastAPI, GPS Data, Telemetry |
| Web Dashboard | React, TypeScript, Tailwind CSS, Live Video, Maps |
| Cloud & Data | Cloud Storage, Real-Time Database, Authentication, Logging |

---

## 5. System Components

### UAV / Hardware Layer
The drone carries the sensing payload: RGB camera (ESP32-CAM + OV2640), AMG8833 thermal sensor, TF-Luna LiDAR, u-blox NEO GPS, and an optical flow sensor. Flight is managed by a Pixhawk 2.4.8 running ArduPilot.

### AI & Detection Layer
RGB and thermal frames are processed through Python-based computer-vision models (OpenCV, YOLO) to identify people and relevant objects, with thermal analysis used to support detection in low-visibility conditions.

### Backend
Handles telemetry ingestion, GPS data, and API/service coordination between the drone, detection layer and the Ground Command Centre.

### Ground Command Centre
The Ground Command Centre is the central operational interface for the rescue team. It provides a unified operational view of drone telemetry, live video, maps, sensor intelligence, detections and alerts — giving the operator everything needed to verify a detection and coordinate a response from a single screen.

### Cloud & Data Layer
Supports storage, real-time data synchronization, authentication and logging across the platform.

---

## 6. Project Structure

```
resqdrone/
├── src/
│   ├── app/            # App shell, layout, providers, routing
│   ├── components/     # UI components (map, hud, payload, incidents, mission, telemetry, ui)
│   ├── context/        # Application state and context providers
│   ├── data/           # Mock/reference data
│   ├── hooks/          # Telemetry, sync and mission logic hooks
│   ├── pages/          # Command Centre, Live Mission, Detections, Fleet, Rescue Teams, Reports, etc.
│   ├── services/       # API, auth, telemetry and websocket services
│   ├── types/          # Shared TypeScript types
│   └── utils/          # Shared utilities
├── public/
├── index.html
└── package.json
```

---

## 7. Installation / Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

---

## 8. Team / Project Context

ResQDrone is developed as part of Smart India Hackathon 2026, addressing real-time, AI-assisted search-and-rescue operations through a combined hardware, computer-vision and command-centre platform.
