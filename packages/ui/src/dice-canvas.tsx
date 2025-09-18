"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import {
  Body,
  Box as CannonBox,
  ContactMaterial,
  Material as CannonMaterial,
  NaiveBroadphase,
  Plane as CannonPlane,
  Vec3,
  World,
} from "cannon-es";
import { subscribe, useRealtimeSession } from "@helios/realtime";
import type { RollOutcome } from "@helios/types";

interface DiceCanvasProps {
  role: "player" | "gm";
}

const BACKGROUND = new Color(0x0f172a);
const PLAYER_COLOR = new Color("#7c3aed");
const GM_COLOR = new Color("#f97316");

const DIE_TYPE_BASE_COLORS = {
  attribute: "#38bdf8",
  skill: "#34d399",
  bonus: "#facc15",
  stress: "#f87171",
  special: "#e879f9",
} as const;

type DieKind = RollOutcome["results"][number]["die"]["type"];

type DiceObject = {
  mesh: Mesh;
  body: Body;
  outline: LineSegments;
};

function supportsWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return (
      "WebGLRenderingContext" in window &&
      !!(
        canvas.getContext("webgl2") ??
        canvas.getContext("webgl") ??
        canvas.getContext("experimental-webgl")
      )
    );
  } catch {
    return false;
  }
}

export function DiceCanvas({ role }: DiceCanvasProps) {
  const { sessionId, userId } = useRealtimeSession();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [lastOutcome, setLastOutcome] = useState<RollOutcome | null>(null);
  const [rollingStatus, setRollingStatus] = useState<string | null>(null);

  const sceneRef = useRef<Scene | null>(null);
  const worldRef = useRef<World | null>(null);
  const diceObjectsRef = useRef<DiceObject[]>([]);
  const removalTimersRef = useRef<ReturnType<typeof window.setTimeout>[]>([]);
  const diceGeometryRef = useRef<BoxGeometry | null>(null);
  const edgesGeometryRef = useRef<EdgesGeometry | null>(null);
  const outlineMaterialRef = useRef<LineBasicMaterial | null>(null);
  const materialCacheRef = useRef<Record<string, MeshStandardMaterial>>({});
  const diceMaterialRef = useRef<CannonMaterial | null>(null);
  const groundBodyRef = useRef<Body | null>(null);
  const pendingOutcomeRef = useRef<RollOutcome | null>(null);

  const clearDice = useCallback(() => {
    removalTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    removalTimersRef.current = [];

    const world = worldRef.current;
    const scene = sceneRef.current;
    if (!world || !scene) {
      diceObjectsRef.current = [];
      return;
    }

    diceObjectsRef.current.forEach(({ mesh, body, outline }) => {
      mesh.remove(outline);
      scene.remove(mesh);
      world.removeBody(body);
    });
    diceObjectsRef.current = [];
  }, []);

  const getMaterial = useCallback(
    (type: DieKind) => {
      const cacheKey = `${type}:${role}`;
      const cached = materialCacheRef.current[cacheKey];
      if (cached) {
        return cached;
      }

      const base = new Color(DIE_TYPE_BASE_COLORS[type]);
      const accent = (role === "gm" ? GM_COLOR : PLAYER_COLOR).clone();
      base.lerp(accent, 0.2);

      const material = new MeshStandardMaterial({
        color: base,
        roughness: 0.42,
        metalness: 0.3,
        emissive: type === "stress" ? new Color("#7f1d1d") : new Color(0x111111),
        emissiveIntensity: type === "stress" ? 0.35 : 0.15,
      });

      materialCacheRef.current[cacheKey] = material;
      return material;
    },
    [role]
  );

  const spawnRoll = useCallback(
    (outcome: RollOutcome) => {
      const world = worldRef.current;
      const scene = sceneRef.current;
      const diceGeometry = diceGeometryRef.current;
      const edgesGeometry = edgesGeometryRef.current;
      const outlineMaterial = outlineMaterialRef.current;
      const diceMaterial = diceMaterialRef.current;

      if (!world || !scene || !diceGeometry || !edgesGeometry || !outlineMaterial || !diceMaterial) {
        pendingOutcomeRef.current = outcome;
        return;
      }

      pendingOutcomeRef.current = null;
      clearDice();

      const total = outcome.results.length || 1;
      const gridSize = Math.ceil(Math.sqrt(total));
      const spacing = 1.35;

      outcome.results.forEach((result, index) => {
        const mesh = new Mesh(diceGeometry, getMaterial(result.die.type));
        mesh.castShadow = true;
        const outline = new LineSegments(edgesGeometry, outlineMaterial);
        mesh.add(outline);

        const col = index % gridSize;
        const row = Math.floor(index / gridSize);
        const offset = (gridSize - 1) / 2;

        const body = new Body({
          mass: 1,
          material: diceMaterial,
          shape: new CannonBox(new Vec3(0.5, 0.5, 0.5)),
          position: new Vec3(
            (col - offset) * spacing + (Math.random() - 0.5) * 0.6,
            4.5 + Math.random() * 1.5,
            (row - offset) * spacing + (Math.random() - 0.5) * 0.6
          ),
          angularDamping: 0.18,
          linearDamping: 0.21,
        });
        body.quaternion.setFromEuler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        body.angularVelocity.set(
          Math.random() * 6 - 3,
          Math.random() * 6 - 3,
          Math.random() * 6 - 3
        );
        body.velocity.set(Math.random() * 2 - 1, Math.random() * 3 + 2, Math.random() * 2 - 1);

        world.addBody(body);
        scene.add(mesh);
        diceObjectsRef.current.push({ mesh, body, outline });
      });

      const timer = window.setTimeout(() => {
        clearDice();
      }, 12_000);
      removalTimersRef.current.push(timer);
    },
    [clearDice, getMaterial]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!supportsWebGL()) {
      setFallbackMessage(
        "WebGL wird von diesem Gerät nicht unterstützt – die Würfelsimulation wird in einer textbasierten Ansicht dargestellt."
      );
      return;
    }

    setFallbackMessage(null);

    const scene = new Scene();
    scene.background = BACKGROUND.clone();
    sceneRef.current = scene;

    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    const camera = new PerspectiveCamera(45, 1, 0.1, 120);
    camera.position.set(6, 6, 10);
    camera.lookAt(new Vector3(0, 0, 0));

    const ambientLight = new AmbientLight(0xffffff, 0.7);
    const keyLight = new DirectionalLight(0xffffff, 0.75);
    keyLight.position.set(6, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    const fillLight = new DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-6, 8, -6);
    scene.add(ambientLight, keyLight, fillLight);

    const accent = (role === "gm" ? GM_COLOR : PLAYER_COLOR).clone();
    const floorGeometry = new PlaneGeometry(36, 36);
    const floorMaterial = new MeshStandardMaterial({
      color: accent.multiplyScalar(0.35),
      roughness: 0.9,
      metalness: 0.08,
    });
    const floorMesh = new Mesh(floorGeometry, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);
    const world = new World({ gravity: new Vec3(0, -9.82, 0) });
    world.broadphase = new NaiveBroadphase();
    world.allowSleep = true;
    worldRef.current = world;

    const groundMaterial = new CannonMaterial("ground");
    const diceMaterial = new CannonMaterial("dice");
    diceMaterialRef.current = diceMaterial;

    world.addContactMaterial(
      new ContactMaterial(groundMaterial, diceMaterial, {
        restitution: 0.35,
        friction: 0.4,
      })
    );

    const groundBody = new Body({
      mass: 0,
      material: groundMaterial,
      shape: new CannonPlane(),
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);
    groundBodyRef.current = groundBody;

    const diceGeometry = new BoxGeometry(1, 1, 1);
    const edgesGeometry = new EdgesGeometry(diceGeometry);
    const outlineMaterial = new LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
    diceGeometryRef.current = diceGeometry;
    edgesGeometryRef.current = edgesGeometry;
    outlineMaterialRef.current = outlineMaterial;

    const resize = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth ?? canvas.clientWidth ?? 1;
      const height = parent?.clientHeight ?? canvas.clientHeight ?? 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };

    resize();
    window.addEventListener("resize", resize);

    let lastTime: number | undefined;
    let frameId = 0;

    const animate = (time: number) => {
      frameId = window.requestAnimationFrame(animate);
      const delta = lastTime ? (time - lastTime) / 1000 : 1 / 60;
      lastTime = time;
      world.step(1 / 60, delta, 3);

      diceObjectsRef.current.forEach(({ mesh, body }) => {
        mesh.position.set(body.position.x, body.position.y, body.position.z);
        mesh.quaternion.set(
          body.quaternion.x,
          body.quaternion.y,
          body.quaternion.z,
          body.quaternion.w
        );
      });

      renderer.render(scene, camera);
    };

    frameId = window.requestAnimationFrame(animate);

    if (pendingOutcomeRef.current) {
      spawnRoll(pendingOutcomeRef.current);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);

      clearDice();

      if (groundBodyRef.current) {
        world.removeBody(groundBodyRef.current);
        groundBodyRef.current = null;
      }

      renderer.dispose();

      floorGeometry.dispose();
      floorMaterial.dispose();
      diceGeometry.dispose();
      edgesGeometry.dispose();
      outlineMaterial.dispose();

      scene.remove(floorMesh);
      scene.remove(ambientLight, keyLight, fillLight);

      Object.values(materialCacheRef.current).forEach((material) => material.dispose());
      materialCacheRef.current = {};

      worldRef.current = null;
      sceneRef.current = null;
      diceGeometryRef.current = null;
      edgesGeometryRef.current = null;
      outlineMaterialRef.current = null;
      diceMaterialRef.current = null;
      pendingOutcomeRef.current = null;
    };
  }, [role, clearDice, spawnRoll]);

  useEffect(() => {
    if (!supportsWebGL()) {
      return;
    }

    const unsubscribe = subscribe((event) => {
      if (event.type === "rollResult" && event.payload.sessionId === sessionId) {
        setRollingStatus(null);
        setLastOutcome(event.payload);
        spawnRoll(event.payload);
      }

      if (event.type === "rollInitiate" && event.payload.sessionId === sessionId) {
        const actor =
          event.payload.userId === userId
            ? "Du"
            : `Spieler ${event.payload.userId.slice(0, 8)}`;
        setRollingStatus(`${actor} würfelt…`);
      }

      if (event.type === "rollClear" && event.payload.sessionId === sessionId) {
        clearDice();
        setLastOutcome(null);
        setRollingStatus("Würfel wurden zurückgesetzt.");
      }
    });

    return () => {
      unsubscribe();
    };
  }, [sessionId, userId, spawnRoll, clearDice]);

  const lastOutcomeSummary = lastOutcome
    ? `Letzter Wurf ${
        lastOutcome.userId === userId ? "(du)" : `(${lastOutcome.userId.slice(0, 8)})`
      }: ${lastOutcome.successes} Erfolg${lastOutcome.successes === 1 ? "" : "e"}${
        lastOutcome.crit ? " • Kritisch" : ""
      }${lastOutcome.panic ? " • Panik!" : ""}`
    : "Noch kein Wurf empfangen.";

  const statusLine = rollingStatus ?? "Warte auf neue Ereignisse…";

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 text-xs text-slate-400">
        <div className="flex justify-between uppercase tracking-wide">
          <span>Realtime Dice Table</span>
          <span>{role === "gm" ? "GM" : "Player"} View</span>
        </div>
        {!fallbackMessage && (
          <div className="flex flex-col gap-1 text-[11px] font-medium normal-case">
            <span className="text-slate-200">{lastOutcomeSummary}</span>
            <span className="text-slate-500">{statusLine}</span>
          </div>
        )}
      </div>
      {fallbackMessage ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 px-6 text-center text-sm text-slate-200">
          {fallbackMessage}
        </div>
      ) : null}
    </div>
  );
}
