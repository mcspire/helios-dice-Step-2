import { redirect } from "next/navigation";
import { MapCanvas } from "@helios/ui/map-canvas";
import { MapToolbar } from "@helios/ui/map-toolbar";
import { getMapState, UnauthorizedError } from "@helios/utils/server";

export default async function MapGmPage() {
  try {
    const state = await getMapState();

    return (
      <div className="flex h-full flex-col">
        <MapToolbar role="gm" />
        <MapCanvas role="gm" state={state} />
      </div>
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/login");
    }
    throw error;
  }
}
