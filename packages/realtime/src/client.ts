import mitt from "mitt";
import type { RealtimeEvent } from "@helios/types";

const emitter = mitt<{ event: RealtimeEvent }>();

export function publish(event: RealtimeEvent) {
  emitter.emit("event", event);
}

export function subscribe(handler: (event: RealtimeEvent) => void) {
  emitter.on("event", handler);
  return () => emitter.off("event", handler);
}
