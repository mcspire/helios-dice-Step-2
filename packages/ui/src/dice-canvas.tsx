"use client";

import { useEffect, useRef, useState } from "react";
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vector3,
  WebGLRenderer,
  LineSegments,
  LineBasicMaterial,
  EdgesGeometry,
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

interface DiceCanvasProps {
  role: "player" | "gm";
}

const BACKGROUND = new Color(0x0f172a);
const PLAYER_COLOR = new Color("#7c3aed");
const GM_COLOR = new Color("#f97316");

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!supportsWebGL()) {
      setFallbackMessage(
        "WebGL wird von diesem Gerät nicht unterstützt – die Würfelsimulation wird in einer zukünftigen textbasierten Ansicht nachgebildet."
      );
      return;
    }

    setFallbackMessage(null);

    const scene = new Scene();
    scene.background = BACKGROUND.clone();

    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    const camera = new PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(6, 5, 6);
    camera.lookAt(new Vector3(0, 0, 0));

    const ambientLight = new AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new DirectionalLight(0xffffff, 0.75);
    keyLight.position.set(5, 10, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new DirectionalLight(0xffffff, 0.25);
    fillLight.position.set(-6, 6, -4);
    scene.add(fillLight);

    const floorGeometry = new PlaneGeometry(30, 30);
    const floorMaterial = new MeshStandardMaterial({
      color: new Color(0x111827),
      roughness: 0.9,
      metalness: 0.1,
    });
    const floorMesh = new Mesh(floorGeometry, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const diceGeometry = new BoxGeometry(1, 1, 1);
    const diceMaterial = new MeshStandardMaterial({
      color: role === "gm" ? GM_COLOR.clone() : PLAYER_COLOR.clone(),
      roughness: 0.45,
      metalness: 0.35,
      emissive: new Color(0x111111),
      emissiveIntensity: 0.15,
    });
    const diceMesh = new Mesh(diceGeometry, diceMaterial);
    diceMesh.castShadow = true;
    diceMesh.position.set(0, 3, 0);

    const edgeLines = new LineSegments(
      new EdgesGeometry(diceGeometry),
      new LineBasicMaterial({ color: 0xffffff, linewidth: 1 })
    );
    diceMesh.add(edgeLines);

    scene.add(diceMesh);

    const world = new World({ gravity: new Vec3(0, -9.82, 0) });
    world.broadphase = new NaiveBroadphase();
    world.allowSleep = true;

    const groundMaterial = new CannonMaterial("ground");
    const dicePhysicsMaterial = new CannonMaterial("dice");
    world.addContactMaterial(
      new ContactMaterial(groundMaterial, dicePhysicsMaterial, {
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

    const diceBody = new Body({
      mass: 1,
      material: dicePhysicsMaterial,
      shape: new CannonBox(new Vec3(0.5, 0.5, 0.5)),
      position: new Vec3(
        (Math.random() - 0.5) * 1.5,
        3 + Math.random(),
        (Math.random() - 0.5) * 1.5
      ),
      angularDamping: 0.18,
      linearDamping: 0.21,
    });
    diceBody.quaternion.setFromEuler(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    diceBody.angularVelocity.set(
      Math.random() * 6 - 3,
      Math.random() * 6 - 3,
      Math.random() * 6 - 3
    );
    diceBody.velocity.set(
      Math.random() * 2 - 1,
      Math.random() * 4 + 2,
      Math.random() * 2 - 1
    );

    world.addBody(diceBody);

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

    let frameId = 0;
    let lastTime: number | undefined;

    const animate = (time: number) => {
      frameId = window.requestAnimationFrame(animate);
      const delta = lastTime ? (time - lastTime) / 1000 : 0;
      lastTime = time;
      world.step(1 / 60, delta, 3);
      diceMesh.position.set(
        diceBody.position.x,
        diceBody.position.y,
        diceBody.position.z
      );
      diceMesh.quaternion.set(
        diceBody.quaternion.x,
        diceBody.quaternion.y,
        diceBody.quaternion.z,
        diceBody.quaternion.w
      );
      renderer.render(scene, camera);
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      scene.remove(diceMesh);
      scene.remove(floorMesh);
      diceGeometry.dispose();
      diceMaterial.dispose();
      if (Array.isArray(edgeLines.material)) {
        edgeLines.material.forEach((material) => material.dispose());
      } else {
        edgeLines.material.dispose();
      }
      edgeLines.geometry.dispose();
      floorGeometry.dispose();
      floorMaterial.dispose();
      renderer.dispose();
      world.removeBody(diceBody);
      world.removeBody(groundBody);
    };
  }, [role]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-4 text-xs uppercase tracking-wide text-slate-400">
        <span>Realtime Dice Table</span>
        <span>{role === "gm" ? "GM" : "Player"} View</span>
      </div>
      {fallbackMessage ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 px-6 text-center text-sm text-slate-200">
          {fallbackMessage}
        </div>
      ) : null}
    </div>
  );
}
