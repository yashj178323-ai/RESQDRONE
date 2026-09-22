import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppState } from '@/context/AppStore';
import { useAuth } from '@/context/AuthContext';
import type { AppAction } from '@/context/store/actions';
import {
  derivePriority,
  logEvent,
  makeAlert,
  makeEvent,
  makeQueued,
  subsystem,
} from '@/context/store/actions';
import type {
  AlertLevel,
  Detection,
  LatLng,
  Mission,
  MissionEvent,
  QueuedEventKind,
  RescueTeam,
  SearchArea,
} from '@/types';
import { BASE_STATION, PUNE_CENTER, ZONE_A_POLYGON } from '@/data/mockData';
import { distanceKm } from '@/utils/geo';
import { uid } from '@/utils/format';
import {
  MAP_DEFAULT_ZOOM,
  MAP_DETAIL_ZOOM,
  MAP_FOCUS_ZOOM,
  TEAM_SPEED_KMPH,
} from '@/config/constants';

/** Straight-line approach route with one bend, adequate for a ground view. */
function buildRoute(from: LatLng, to: LatLng): LatLng[] {
  const mid = { lat: (from.lat + to.lat) / 2 + 0.0011, lng: (from.lng + to.lng) / 2 - 0.0009 };
  return [from, mid, to];
}

export function estimateEtaSec(from: LatLng, to: LatLng): number {
  return Math.round((distanceKm(from, to) / TEAM_SPEED_KMPH) * 3600);
}

function nearestAvailableTeam(teams: RescueTeam[], target: LatLng): RescueTeam | undefined {
  return teams
    .filter((t) => t.state === 'AVAILABLE' || t.state === 'STANDBY')
    .map((t) => ({ team: t, d: distanceKm({ lat: t.latitude, lng: t.longitude }, target) }))
    .sort((a, b) => a.d - b.d)[0]?.team;
}

interface OperatorCommit {
  /** Domain state changes. Applied immediately, online or not. */
  actions: AppAction[];
  alert?: { level: AlertLevel; title: string; detail?: string };
  timeline?: { kind: MissionEvent['kind']; label: string; detail?: string };
  /** Cloud-dependent record. Queued locally whenever the uplink is down. */
  queue?: { kind: QueuedEventKind; payload: string };
}

/**
 * Every operator action funnels through one commit path, so local-first
 * behaviour is uniform: the UI updates now, a durable event is queued when the
 * cloud is unreachable, and the alert says so rather than implying an
 * acknowledgement that never happened.
 */
export function useMissionActions() {
  const dispatch = useAppDispatch();
  const state = useAppState();
  const { session } = useAuth();
  const missionId = state.mission.activeMissionId;
  const offline = state.system.connection.cloud !== 'ONLINE';

  const commit = useCallback(
    ({ actions, alert, timeline, queue }: OperatorCommit) => {
      actions.forEach(dispatch);
      if (timeline) dispatch(makeEvent(missionId, timeline.kind, timeline.label, timeline.detail));
      if (queue && offline) dispatch(makeQueued(queue.kind, queue.payload));
      if (timeline || alert) {
        dispatch({
          type: 'system/audit',
          event: {
            id: uid('AUD'),
            at: Date.now(),
            operatorId: session?.operatorId ?? 'UNKNOWN',
            role: session?.role ?? 'Unknown',
            action: timeline?.kind ?? alert?.level ?? 'OPERATOR_ACTION',
            detail: timeline?.detail ? `${timeline.label} · ${timeline.detail}` : (timeline?.label ?? alert?.title ?? 'Operational action'),
          },
        });
      }
      if (alert) {
        const detail =
          queue && offline
            ? `${alert.detail ? `${alert.detail} · ` : ''}Queued locally, not yet sent`
            : alert.detail;
        dispatch(makeAlert(alert.level, alert.title, detail));
      }
    },
    [dispatch, missionId, offline, session?.operatorId, session?.role],
  );

  const focusOn = useCallback(
    (lat: number, lng: number, zoom = MAP_FOCUS_ZOOM) =>
      dispatch({ type: 'map/focus', lat, lng, zoom }),
    [dispatch],
  );

  const homeView = useCallback(
    () => focusOn(PUNE_CENTER.lat, PUNE_CENTER.lng, MAP_DEFAULT_ZOOM),
    [focusOn],
  );

  const selectDetection = useCallback(
    (detectionId: string | null) => dispatch({ type: 'incident/select', detectionId }),
    [dispatch],
  );

  /* ------------------------------ verification ------------------------------ */

  const isResolved = useCallback(
    (id: string) => {
      const d = state.incidents.detections.find((x) => x.id === id);
      return !d || d.verification === 'CONFIRMED' || d.verification === 'FALSE_DETECTION';
    },
    [state.incidents.detections],
  );

  const reviewDetection = useCallback(
    (detectionId: string) => {
      if (isResolved(detectionId)) return;
      commit({
        actions: [{ type: 'incident/setVerification', detectionId, verification: 'UNDER_REVIEW' }],
        timeline: { kind: 'AWAITING_VERIFICATION', label: `${detectionId} under review` },
        queue: { kind: 'DETECTION_REVIEWED', payload: detectionId },
      });
    },
    [commit, isResolved],
  );

  const confirmDetection = useCallback(
    (detectionId: string) => {
      if (isResolved(detectionId)) return;
      const detection = state.incidents.detections.find((d) => d.id === detectionId);
      if (!detection) return;

      const target = { lat: detection.latitude, lng: detection.longitude };
      const team = nearestAvailableTeam(state.rescue.teams, target);
      const alreadyDispatched = state.rescue.dispatches.some((d) => d.detectionId === detectionId);

      const actions: AppAction[] = [
        { type: 'incident/confirm', detectionId, survivorId: uid('SUR'), at: Date.now() },
      ];
      if (team && !alreadyDispatched) {
        actions.push({
          type: 'rescue/recommend',
          recommendation: {
            detectionId,
            teamId: team.id,
            etaSec: estimateEtaSec({ lat: team.latitude, lng: team.longitude }, target),
            reasons: [
              'Nearest available team',
              team.capability.length > 0
                ? `Capability match: ${team.capability[0].toLowerCase()}`
                : 'Team available for tasking',
              `${detection.priority} incident`,
              `Fused confidence ${(detection.fusedConfidence * 100).toFixed(1)}%`,
              'Approach route available',
            ],
          },
        });
      }

      commit({
        actions,
        timeline: {
          kind: 'VERIFIED',
          label: `Survivor confirmed (${detectionId})`,
          detail: `${detection.priority} · operator verified`,
        },
        alert: {
          level: 'CRITICAL',
          title: `Survivor confirmed (${detectionId})`,
          detail: `${detection.priority} · ${detection.latitude.toFixed(4)}, ${detection.longitude.toFixed(4)}`,
        },
        queue: { kind: 'SURVIVOR_CONFIRMED', payload: detectionId },
      });
    },
    [commit, isResolved, state.incidents.detections, state.rescue.dispatches, state.rescue.teams],
  );

  const rejectDetection = useCallback(
    (detectionId: string, note = 'Operator review: no person present.') => {
      if (isResolved(detectionId)) return;
      commit({
        actions: [
          { type: 'incident/setVerification', detectionId, verification: 'FALSE_DETECTION', note },
        ],
        timeline: { kind: 'REJECTED', label: `${detectionId} marked false detection` },
        alert: { level: 'INFO', title: `${detectionId} marked false detection`, detail: note },
        queue: { kind: 'DETECTION_REJECTED', payload: detectionId },
      });
    },
    [commit, isResolved],
  );

  const markUncertain = useCallback(
    (detectionId: string) => {
      if (isResolved(detectionId)) return;
      commit({
        actions: [{ type: 'incident/setVerification', detectionId, verification: 'UNCERTAIN' }],
        alert: {
          level: 'WARNING',
          title: `${detectionId} marked uncertain`,
          detail: 'Re-fly requested over this point',
        },
        queue: { kind: 'DETECTION_UNCERTAIN', payload: detectionId },
      });
    },
    [commit, isResolved],
  );

  /* ------------------------------ dispatch ------------------------------ */

  const dismissRecommendation = useCallback(
    () => dispatch({ type: 'rescue/dismissRecommendation' }),
    [dispatch],
  );

  const sendTeam = useCallback(
    (teamId: string, detectionId: string, reasons: string[], etaSec?: number) => {
      const team = state.rescue.teams.find((t) => t.id === teamId);
      const detection = state.incidents.detections.find((d) => d.id === detectionId);
      if (!team || !detection) return;
      if (team.state === 'UNAVAILABLE' || team.state === 'DISPATCHED' || team.state === 'ON_WAY') {
        return;
      }
      if (state.rescue.dispatches.some((d) => d.detectionId === detectionId && !d.arrivedAt)) return;

      const from = { lat: team.latitude, lng: team.longitude };
      const to = { lat: detection.latitude, lng: detection.longitude };

      commit({
        actions: [
          {
            type: 'rescue/dispatch',
            route: buildRoute(from, to),
            dispatch: {
              id: uid('DSP'),
              teamId,
              detectionId,
              dispatchedAt: Date.now(),
              etaSec: etaSec ?? estimateEtaSec(from, to),
              reasons,
            },
          },
        ],
        timeline: {
          kind: 'TEAM_DISPATCHED',
          label: `${team.name} dispatched`,
          detail: `Target ${detectionId}`,
        },
        alert: {
          level: 'WARNING',
          title: `${team.name} dispatched`,
          detail: `${detectionId} · ETA updating live`,
        },
        queue: { kind: 'TEAM_DISPATCHED', payload: `${teamId}:${detectionId}` },
      });
    },
    [commit, state.incidents.detections, state.rescue.dispatches, state.rescue.teams],
  );

  const acceptRecommendation = useCallback(() => {
    const rec = state.rescue.recommendation;
    if (!rec) return;
    sendTeam(rec.teamId, rec.detectionId, rec.reasons, rec.etaSec);
  }, [sendTeam, state.rescue.recommendation]);

  const dispatchTeam = useCallback(
    (teamId: string, detectionId: string) =>
      sendTeam(teamId, detectionId, ['Manual dispatch by operator']),
    [sendTeam],
  );

  /* ------------------------------ mission ------------------------------ */

  const triggerDetection = useCallback(() => {
    const rgb = 0.72 + Math.random() * 0.26;
    const thermal = 0.7 + Math.random() * 0.29;
    const fused = Number(((rgb + thermal * 1.15) / 2.15).toFixed(3));
    const index = state.incidents.detections.length + 1;
    const detection: Detection = {
      id: `DET-${String(index).padStart(3, '0')}`,
      missionId,
      droneId: state.drone.activeDroneId,
      areaId: state.mission.selectedAreaId,
      timestamp: Date.now(),
      rgbConfidence: Number(rgb.toFixed(2)),
      thermalConfidence: Number(thermal.toFixed(2)),
      fusedConfidence: fused,
      latitude: Number(state.drone.telemetry.latitude.toFixed(5)),
      longitude: Number(state.drone.telemetry.longitude.toFixed(5)),
      altitude: state.drone.telemetry.altitude,
      priority: derivePriority(fused, thermal > 0.85),
      verification: 'PENDING',
      reasons: [
        thermal > 0.85 ? 'RGB and thermal agree' : 'RGB lead, thermal partial',
        `Fused confidence ${(fused * 100).toFixed(1)}%`,
        'Flooded surroundings',
        'No safe structure within 120 m',
      ],
    };

    commit({
      actions: [{ type: 'incident/add', detection, incidentId: `INC-${detection.id}` }],
      timeline: {
        kind: 'DETECTION',
        label: `Detection ${detection.id}`,
        detail: `Fused ${(fused * 100).toFixed(1)}%`,
      },
      alert: {
        level: detection.priority === 'P1' ? 'CRITICAL' : 'WARNING',
        title: `AI detection ${detection.id}`,
        detail: `${detection.priority} · awaiting operator verification`,
      },
      queue: { kind: 'DETECTION', payload: detection.id },
    });
    dispatch(logEvent('AI', `Detection ${detection.id} · fused ${(fused * 100).toFixed(1)}%`, 'CRITICAL'));
    dispatch(logEvent('SYSTEM', 'Operator verification required', 'WARN'));
    focusOn(detection.latitude, detection.longitude, MAP_FOCUS_ZOOM);
  }, [
    commit,
    focusOn,
    missionId,
    state.drone.activeDroneId,
    state.drone.telemetry,
    state.incidents.detections.length,
    state.mission.selectedAreaId,
  ]);

  /**
   * Demonstration control: forces the thermal matrix into a target state, which
   * raises the reticle, writes the sensor log and opens a detection for review.
   * It is a scripted scenario, never presented as an autonomous trigger.
   */
  const triggerThermalAlarm = useCallback(() => {
    dispatch({ type: 'sensors/setTargetLock', locked: true });
    dispatch(logEvent('AMG8833', 'Thermal matrix peak rising above threshold', 'WARN'));
    dispatch(logEvent('AMG8833', 'Thermal signature detected · target locked', 'CRITICAL'));
    triggerDetection();
  }, [dispatch, triggerDetection]);

  const clearThermalAlarm = useCallback(() => {
    dispatch({ type: 'sensors/setTargetLock', locked: false });
    dispatch(logEvent('AMG8833', 'Thermal field returned to ambient', 'OK'));
  }, [dispatch]);

  const startMission = useCallback(() => {
    commit({
      actions: [
        { type: 'mission/setStatus', missionId, status: 'ACTIVE' },
        { type: 'drone/setSimulating', value: true },
      ],
      timeline: { kind: 'SEARCH_STARTED', label: 'Search resumed' },
      alert: { level: 'INFO', title: 'Search resumed', detail: 'RQ-01 sweeping Search Zone A' },
      queue: { kind: 'MISSION_STATUS', payload: `${missionId}:ACTIVE` },
    });
  }, [commit, missionId]);

  const completeMission = useCallback(() => {
    commit({
      actions: [{ type: 'mission/setStatus', missionId, status: 'COMPLETED' }],
      alert: {
        level: 'SUCCESS',
        title: 'Mission complete',
        detail: 'Return-to-home command submitted to the flight-control system',
      },
      queue: { kind: 'MISSION_STATUS', payload: `${missionId}:COMPLETED` },
    });
  }, [commit, missionId]);

  const createMission = useCallback(
    (mission: Mission, area: SearchArea) => {
      commit({
        actions: [{ type: 'mission/create', mission, area }],
        alert: {
          level: 'SUCCESS',
          title: `Mission ${mission.id} created`,
          detail: mission.location,
        },
        queue: { kind: 'MISSION_CREATED', payload: mission.id },
      });
    },
    [commit],
  );

  const replayMission = useCallback(() => {
    dispatch({ type: 'app/reset' });
    dispatch(makeAlert('INFO', 'Mission replay loaded', 'State reset to the start of Mission Alpha'));
  }, [dispatch]);

  /* ------------------------------ fault injection ------------------------------ */

  const triggerGpsLoss = useCallback(() => {
    commit({
      actions: [
        { type: 'system/setConnection', patch: { gps: 'DEGRADED' } },
        subsystem('gps', 'DEGRADED'),
        { type: 'drone/patch', telemetry: { gpsStatus: 'DEGRADED', satellites: 5 } },
      ],
      timeline: { kind: 'FAULT', label: 'GPS accuracy degraded' },
      alert: {
        level: 'WARNING',
        title: 'GPS accuracy degraded',
        detail: 'Position held from the last good fix · 5 satellites',
      },
    });
  }, [commit]);

  const restoreGps = useCallback(() => {
    commit({
      actions: [
        { type: 'system/setConnection', patch: { gps: 'LOCKED' } },
        subsystem('gps', 'ONLINE'),
        { type: 'drone/patch', telemetry: { gpsStatus: 'LOCKED', satellites: 14 } },
      ],
      alert: { level: 'SUCCESS', title: 'GPS lock restored', detail: '14 satellites' },
    });
  }, [commit]);

  const triggerNetworkLoss = useCallback(() => {
    commit({
      actions: [{ type: 'system/setConnection', patch: { internet: 'OFFLINE', cloud: 'OFFLINE' } }],
      timeline: { kind: 'FAULT', label: 'Cloud connection lost' },
      alert: {
        level: 'WARNING',
        title: 'Cloud connection lost',
        detail: 'Local operations active — drone, GPS, AI and telemetry unaffected',
      },
    });
  }, [commit]);

  const restoreNetwork = useCallback(() => {
    const pending = state.system.queue.filter((q) => q.status === 'QUEUED');
    dispatch({ type: 'system/setConnection', patch: { internet: 'ONLINE', cloud: 'SYNCING' } });
    dispatch({ type: 'system/startSync', total: Math.max(1, pending.length) });
    dispatch(
      makeAlert(
        'INFO',
        'Uplink restored',
        `Synchronising ${pending.length} queued event${pending.length === 1 ? '' : 's'}`,
      ),
    );
  }, [dispatch, state.system.queue]);

  const triggerLowBattery = useCallback(() => {
    commit({
      actions: [
        { type: 'drone/patch', telemetry: { battery: 18 } },
        subsystem('battery', 'DEGRADED'),
      ],
      alert: {
        level: 'CRITICAL',
        title: 'Low battery',
        detail: 'Return-to-home recommended for RQ-01',
      },
    });
  }, [commit]);

  const triggerDroneLinkLoss = useCallback(() => {
    commit({
      actions: [
        { type: 'system/setConnection', patch: { droneLink: 'LOST', telemetry: 'LOST' } },
        subsystem('communication', 'OFFLINE'),
      ],
      timeline: { kind: 'FAULT', label: 'Drone link lost' },
      alert: {
        level: 'CRITICAL',
        title: 'Drone link lost',
        detail: 'Showing the last known telemetry — no live position',
      },
    });
  }, [commit]);

  const restoreDroneLink = useCallback(() => {
    commit({
      actions: [
        { type: 'system/setConnection', patch: { droneLink: 'CONNECTED', telemetry: 'CONNECTED' } },
        subsystem('communication', 'ONLINE'),
      ],
      alert: { level: 'SUCCESS', title: 'Drone link restored', detail: 'Live telemetry resumed' },
    });
  }, [commit]);

  const toggleThermal = useCallback(
    (online: boolean) => {
      commit({
        actions: [subsystem('thermalCamera', online ? 'ONLINE' : 'OFFLINE')],
        alert: online
          ? {
              level: 'SUCCESS',
              title: 'Thermal sensor online',
              detail: 'Sensor fusion available again',
            }
          : {
              level: 'WARNING',
              title: 'Thermal sensor offline',
              detail: 'RGB detection remains available',
            },
      });
    },
    [commit],
  );

  const toggleAiEngine = useCallback(
    (online: boolean) => {
      commit({
        actions: [subsystem('aiEngine', online ? 'ACTIVE' : 'OFFLINE')],
        alert: online
          ? { level: 'SUCCESS', title: 'AI engine online', detail: 'Automatic detection resumed' }
          : { level: 'WARNING', title: 'AI engine offline', detail: 'Manual monitoring available' },
      });
    },
    [commit],
  );

  return useMemo(
    () => ({
      focusOn,
      homeView,
      selectDetection,
      reviewDetection,
      confirmDetection,
      rejectDetection,
      markUncertain,
      acceptRecommendation,
      dismissRecommendation,
      dispatchTeam,
      triggerDetection,
      triggerThermalAlarm,
      clearThermalAlarm,
      startMission,
      completeMission,
      replayMission,
      createMission,
      triggerGpsLoss,
      restoreGps,
      triggerNetworkLoss,
      restoreNetwork,
      triggerLowBattery,
      triggerDroneLinkLoss,
      restoreDroneLink,
      toggleThermal,
      toggleAiEngine,
      basePosition: BASE_STATION,
      zonePolygon: ZONE_A_POLYGON,
      detailZoom: MAP_DETAIL_ZOOM,
    }),
    [
      acceptRecommendation,
      completeMission,
      confirmDetection,
      createMission,
      dismissRecommendation,
      dispatchTeam,
      focusOn,
      homeView,
      markUncertain,
      rejectDetection,
      replayMission,
      restoreDroneLink,
      restoreGps,
      restoreNetwork,
      reviewDetection,
      selectDetection,
      startMission,
      toggleAiEngine,
      toggleThermal,
      clearThermalAlarm,
      triggerDetection,
      triggerThermalAlarm,
      triggerDroneLinkLoss,
      triggerGpsLoss,
      triggerLowBattery,
      triggerNetworkLoss,
    ],
  );
}

export type MissionActions = ReturnType<typeof useMissionActions>;
