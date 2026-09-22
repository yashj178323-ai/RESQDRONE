# ResQDrone

### AI-Assisted Search & Rescue Drone Command Platform

> AI detects. Sensors validate. Humans decide. Rescue teams act.

ResQDrone is a drone-based search-and-rescue platform that combines live telemetry, RGB vision, thermal sensing, LiDAR, GPS, optical sensing, and AI-assisted detection into a unified Ground Command Centre. The platform is designed to support rescue teams in disaster zones and hazardous environments by providing real-time situational awareness, survivor detection, sensor validation, location intelligence, and actionable information for faster and safer rescue operations.

---

## 1. Overview

Search-and-rescue operations depend on fast, reliable situational awareness across large and often hazardous terrain. Manual search is slow, visibility is limited, and coordinating visual, thermal and positional data across teams in real time is difficult — especially when communication or GPS signal is unreliable.

ResQDrone addresses this by deploying a UAV equipped with RGB, thermal, LiDAR and optical-flow sensing, processing that data through AI-assisted detection, and surfacing the result to a rescue team through a Ground Command Centre.

Every detection is treated as a lead for a human operator to verify, not an automatic confirmation.

---

## 2. Operational Flow

The ResQDrone workflow follows a continuous sensing, intelligence and decision-support cycle.

```mermaid
flowchart LR
    A["01<br/>SEARCH<br/><br/>UAV area coverage"]
    B["02<br/>SENSE<br/><br/>RGB • Thermal • LiDAR<br/>GPS • Optical Flow"]
    C["03<br/>DETECT<br/><br/>YOLO • OpenCV<br/>Thermal Analysis"]
    D["04<br/>EVALUATE<br/><br/>Confidence<br/>Context • Risk"]
    E["05<br/>VERIFY<br/><br/>Cross-sensor<br/>validation"]
    F["06<br/>LOCATE<br/><br/>GPS + Optical Flow<br/>Position intelligence"]
    G["07<br/>INFORM<br/><br/>Alerts • Telemetry<br/>Rescue intelligence"]

    A --> B --> C --> D --> E --> F --> G
    G -. "Continuous mission cycle" .-> A

    classDef search fill:#173F5F,stroke:#4EA5D9,color:#FFFFFF,stroke-width:2px;
    classDef sense fill:#145A5A,stroke:#42C7B8,color:#FFFFFF,stroke-width:2px;
    classDef detect fill:#4B3F72,stroke:#9B8AFB,color:#FFFFFF,stroke-width:2px;
    classDef evaluate fill:#704A3A,stroke:#E0A56A,color:#FFFFFF,stroke-width:2px;
    classDef verify fill:#5A3E58,stroke:#D58AC8,color:#FFFFFF,stroke-width:2px;
    classDef locate fill:#384B6B,stroke:#8FB3E8,color:#FFFFFF,stroke-width:2px;
    classDef inform fill:#315C45,stroke:#78C59A,color:#FFFFFF,stroke-width:2px;

    class A search;
    class B sense;
    class C detect;
    class D evaluate;
    class E verify;
    class F locate;
    class G inform;
GPS-Denied Positioning

In GPS-denied or GPS-degraded conditions such as dense structures, indoor environments or signal-shadowed areas, optical flow provides relative motion information to support positional stability and situational continuity.

Optical flow supplements GPS rather than replacing it.

3. Key Capabilities
Real-time drone telemetry monitoring
RGB and thermal visual intelligence
AI-based human and object detection
LiDAR-based environmental sensing
GPS-based location tracking
Optical-flow-assisted positioning in GPS-denied areas
Multi-sensor detection verification
Live video and map-based situational awareness
Ground Command Centre for rescue-team decision support
Real-time alerts and actionable intelligence
4. System Architecture

The platform connects the UAV sensing layer, AI processing, backend services and Ground Command Centre into a unified operational pipeline.

5. Detection & Verification

ResQDrone follows a human-in-the-loop approach. AI identifies potential detections, while additional sensor evidence and the operator provide verification.

This ensures that an AI detection is treated as intelligence for human verification rather than an automatic rescue decision.

6. Technology Stack
Layer	Technologies
Hardware	UAV, Pixhawk 2.4.8, ArduPilot, u-blox NEO GPS, ESP32-CAM, OV2640, AMG8833, TF-Luna LiDAR, Optical Flow Sensor
Embedded & Control	C/C++, ESP32, Flight Control, GPS
AI & Computer Vision	Python, OpenCV, YOLO, Thermal Analysis
Backend	Node.js, Express.js, FastAPI, GPS Data, Telemetry
Web Dashboard	React, TypeScript, Tailwind CSS, Live Video, Maps
Cloud & Data	Cloud Storage, Real-Time Database, Authentication, Logging
7. System Components
UAV / Hardware Layer

The drone carries the sensing payload:

ESP32-CAM + OV2640 RGB camera
AMG8833 thermal sensor
TF-Luna LiDAR
u-blox NEO GPS
Optical Flow Sensor

Flight control is handled by a Pixhawk 2.4.8 running ArduPilot.

AI & Detection Layer

RGB and thermal data are processed using:

Python
OpenCV
YOLO
Thermal Analysis

The AI layer identifies potential people and relevant objects while thermal information supports detection in low-visibility conditions.

Backend

The backend coordinates:

Telemetry ingestion
GPS data
Sensor information
AI detection services
API communication
Ground Command Centre data
Ground Command Centre

The Ground Command Centre provides a unified operational interface for:

Drone telemetry
Live video
Maps
Sensor intelligence
AI detections
Alerts
Rescue-team decision support

The operator can review available evidence and coordinate the appropriate response from a single operational interface.

Cloud & Data Layer

Supports:

Cloud storage
Real-time data synchronization
Authentication
Logging
8. Project Structure
resqdrone/
├── src/
│   ├── app/            # App shell, layout, providers, routing
│   ├── components/     # UI components
│   ├── context/        # Application state and context providers
│   ├── data/           # Mock/reference data
│   ├── hooks/          # Telemetry, sync and mission logic hooks
│   ├── pages/          # Command Centre, missions, detections, fleet, reports
│   ├── services/       # API, auth, telemetry and websocket services
│   ├── types/          # Shared TypeScript types
│   └── utils/          # Shared utilities
├── public/
├── index.html
└── package.json
9. Installation / Setup
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
10. Team / Project Context

ResQDrone is developed as part of Smart India Hackathon 2026, addressing real-time, AI-assisted search-and-rescue operations through an integrated hardware, computer-vision and Ground Command Centre platform.