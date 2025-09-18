import { MapCanvas } from "@helios/ui/map-canvas";
import { MapToolbar } from "@helios/ui/map-toolbar";
import { getMapState } from "@helios/utils/server";

export default async function MapGmPage() {
  const state = await getMapState();

  return (
    <div className="flex h-full flex-col">
      <MapToolbar role="gm" />
      <MapCanvas role="gm" state={state} />
    </div>
  );
}
