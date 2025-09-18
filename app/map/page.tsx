import { MapCanvas } from "@helios/ui/map-canvas";
import { MapToolbar } from "@helios/ui/map-toolbar";
import { getMapState } from "@helios/utils/server";

export default async function MapPlayerPage() {
  const state = await getMapState();

  return (
    <div className="flex h-full flex-col">
      <MapCanvas role="player" state={state} />
      <MapToolbar role="player" />
    </div>
  );
}
