import { useCallback, useEffect, useRef, useState } from "react";
import type { Body as MatterBody } from "matter-js";

type MatterApi = typeof import("matter-js");

interface UsePhysicsModeOptions {
  active: boolean;
  cardSelector: string;
  onMessage: (message: string) => void;
  onExit: () => void;
}

type PhysicsCard = {
  element: HTMLElement;
  body: MatterBody;
  width: number;
  height: number;
};

type DragState = {
  body: MatterBody;
  pointerId: number;
  lastTime: number;
  lastX: number;
  lastY: number;
  velocityX: number;
  velocityY: number;
};

export function usePhysicsMode({ active, cardSelector, onExit, onMessage }: UsePhysicsModeOptions) {
  const frameRef = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);

  const cleanup = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    setReady(false);
  }, []);

  useEffect(() => {
    if (!active) {
      cleanup();
      return undefined;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onMessage("움직임 줄이기 설정 때문에 physics mode는 실행하지 않았어.");
      onExit();
      return undefined;
    }

    let disposed = false;
    const styledCards: HTMLElement[] = [];

    async function startPhysics() {
      const Matter: MatterApi = await import("matter-js");
      if (disposed) return;

      const visibleCards = Array.from(document.querySelectorAll<HTMLElement>(cardSelector)).filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
      });

      if (!visibleCards.length) {
        onMessage("흔들 카드가 아직 화면에 없어.");
        onExit();
        return;
      }

      const { Body, Bodies, Composite, Engine, Events, Mouse, MouseConstraint, Runner } = Matter;
      const engine = Engine.create();
      engine.gravity.y = 0.72;
      const runner = Runner.create();
      const wallThickness = 120;
      const cards: PhysicsCard[] = visibleCards.map((element) => {
        const rect = element.getBoundingClientRect();
        const body = Bodies.rectangle(rect.left + rect.width / 2, rect.top + rect.height / 2, rect.width, rect.height, {
          restitution: 0.38,
          friction: 0.34,
          frictionAir: 0.035
        });
        styledCards.push(element);
        element.style.position = "fixed";
        element.style.left = `${rect.left}px`;
        element.style.top = `${rect.top}px`;
        element.style.width = `${rect.width}px`;
        element.style.height = `${rect.height}px`;
        element.style.margin = "0";
        element.style.zIndex = "25";
        element.style.pointerEvents = "auto";
        element.style.willChange = "transform";
        element.style.transformOrigin = "center center";
        element.classList.add("song-card--physics");
        return { element, body, width: rect.width, height: rect.height };
      });

      const makeWalls = () => [
        Bodies.rectangle(-wallThickness / 2, window.innerHeight / 2, wallThickness, window.innerHeight * 3, { isStatic: true }),
        Bodies.rectangle(window.innerWidth + wallThickness / 2, window.innerHeight / 2, wallThickness, window.innerHeight * 3, { isStatic: true }),
        Bodies.rectangle(window.innerWidth / 2, window.innerHeight + wallThickness / 2, window.innerWidth + wallThickness * 2, wallThickness, {
          isStatic: true
        })
      ];
      let walls = makeWalls();
      let running = true;
      Composite.add(engine.world, [...cards.map((card) => card.body), ...walls]);

      const mouse = Mouse.create(document.body);
      const mouseConstraint = MouseConstraint.create(engine, {
        mouse,
        constraint: {
          stiffness: 0.18,
          damping: 0.12,
          render: { visible: false }
        }
      });
      Composite.add(engine.world, mouseConstraint);
      let dragState: DragState | null = null;
      const pointerCleanups: Array<() => void> = [];

      const beginDrag = (card: PhysicsCard, pointerId: number, clientX: number, clientY: number) => {
        dragState = {
          body: card.body,
          pointerId,
          lastTime: window.performance.now(),
          lastX: clientX,
          lastY: clientY,
          velocityX: 0,
          velocityY: 0
        };
        Body.setAngularVelocity(card.body, 0);
        Body.setVelocity(card.body, { x: 0, y: 0 });
        Body.setPosition(card.body, { x: clientX, y: clientY });
      };

      const moveDrag = (pointerId: number, clientX: number, clientY: number) => {
        if (!dragState || pointerId !== dragState.pointerId) return;
        const now = window.performance.now();
        const elapsed = Math.max(now - dragState.lastTime, 16);
        dragState.velocityX = ((clientX - dragState.lastX) / elapsed) * 16;
        dragState.velocityY = ((clientY - dragState.lastY) / elapsed) * 16;
        dragState.lastTime = now;
        dragState.lastX = clientX;
        dragState.lastY = clientY;
        Body.setPosition(dragState.body, { x: clientX, y: clientY });
        Body.setVelocity(dragState.body, { x: dragState.velocityX, y: dragState.velocityY });
      };

      const endDrag = (pointerId: number) => {
        if (!dragState || pointerId !== dragState.pointerId) return;
        Body.setVelocity(dragState.body, { x: dragState.velocityX, y: dragState.velocityY });
        dragState = null;
      };

      const onPointerMove = (event: globalThis.PointerEvent) => {
        if (!dragState || event.pointerId !== dragState.pointerId) return;
        event.preventDefault();
        moveDrag(event.pointerId, event.clientX, event.clientY);
      };

      const stopPointerDrag = (event: globalThis.PointerEvent) => {
        endDrag(event.pointerId);
      };

      const onMouseMove = (event: globalThis.MouseEvent) => {
        if (!dragState || dragState.pointerId !== -1) return;
        event.preventDefault();
        moveDrag(-1, event.clientX, event.clientY);
      };

      const stopMouseDrag = () => {
        endDrag(-1);
      };

      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("pointerup", stopPointerDrag);
      window.addEventListener("pointercancel", stopPointerDrag);
      window.addEventListener("mousemove", onMouseMove, { passive: false });
      window.addEventListener("mouseup", stopMouseDrag);
      pointerCleanups.push(() => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", stopPointerDrag);
        window.removeEventListener("pointercancel", stopPointerDrag);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", stopMouseDrag);
      });

      for (const card of cards) {
        const onPointerDown = (event: globalThis.PointerEvent) => {
          event.preventDefault();
          event.stopPropagation();
          card.element.setPointerCapture?.(event.pointerId);
          beginDrag(card, event.pointerId, event.clientX, event.clientY);
        };
        const onMouseDown = (event: globalThis.MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();
          beginDrag(card, -1, event.clientX, event.clientY);
        };
        card.element.addEventListener("pointerdown", onPointerDown);
        card.element.addEventListener("mousedown", onMouseDown);
        pointerCleanups.push(() => card.element.removeEventListener("pointerdown", onPointerDown));
        pointerCleanups.push(() => card.element.removeEventListener("mousedown", onMouseDown));
      }

      const clampBodies = () => {
        for (const card of cards) {
          const halfW = card.width / 2;
          const halfH = card.height / 2;
          const x = Math.min(Math.max(card.body.position.x, halfW), window.innerWidth - halfW);
          const y = Math.min(Math.max(card.body.position.y, halfH), window.innerHeight - halfH);
          if (x !== card.body.position.x || y !== card.body.position.y) {
            Body.setPosition(card.body, { x, y });
            Body.setVelocity(card.body, {
              x: card.body.velocity.x * 0.35,
              y: card.body.velocity.y * 0.35
            });
          }
        }
      };

      const syncDom = () => {
        if (!running) return;
        clampBodies();
        for (const card of cards) {
          const { angle, position } = card.body;
          card.element.style.transform = `translate3d(${position.x - card.width / 2 - Number.parseFloat(card.element.style.left)}px, ${
            position.y - card.height / 2 - Number.parseFloat(card.element.style.top)
          }px, 0) rotate(${angle}rad)`;
        }
        frameRef.current = window.requestAnimationFrame(syncDom);
      };

      const onResize = () => {
        Composite.remove(engine.world, walls);
        walls = makeWalls();
        Composite.add(engine.world, walls);
        clampBodies();
      };

      const onBeforeUpdate = () => {
        for (const card of cards) {
          if (Math.abs(card.body.angularVelocity) > 0.22) {
            Body.setAngularVelocity(card.body, Math.sign(card.body.angularVelocity) * 0.22);
          }
        }
      };

      Events.on(engine, "beforeUpdate", onBeforeUpdate);
      window.addEventListener("resize", onResize);
      Runner.run(runner, engine);
      frameRef.current = window.requestAnimationFrame(syncDom);
      setReady(true);
      window.navigator.vibrate?.(18);
      document.body.classList.add("physics-shake");
      window.setTimeout(() => document.body.classList.remove("physics-shake"), 190);

      cleanupRef.current = () => {
        running = false;
        if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
        window.removeEventListener("resize", onResize);
        Events.off(engine, "beforeUpdate", onBeforeUpdate);
        for (const removePointerListener of pointerCleanups) removePointerListener();
        Runner.stop(runner);
        Composite.clear(engine.world, false);
        Engine.clear(engine);
        for (const element of styledCards) {
          element.classList.remove("song-card--physics");
          element.style.cssText = "";
          element.removeAttribute("style");
          window.requestAnimationFrame(() => element.removeAttribute("style"));
        }
        document.body.classList.remove("physics-shake");
      };
    }

    void startPhysics();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [active, cardSelector, cleanup, onExit, onMessage]);

  return { ready };
}
