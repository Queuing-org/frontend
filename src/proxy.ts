import { NextResponse, type NextRequest } from "next/server";
import { getMaintenanceConfig } from "@/src/shared/config/maintenance/maintenanceConfig";

const MAINTENANCE_PATH = "/maintenance";

export async function proxy(request: NextRequest) {
  const maintenance = await getMaintenanceConfig();

  if (!maintenance.enabled) {
    return NextResponse.next();
  }

  const maintenanceUrl = request.nextUrl.clone();
  maintenanceUrl.pathname = MAINTENANCE_PATH;
  maintenanceUrl.search = "";

  return NextResponse.redirect(maintenanceUrl);
}

export const config = {
  matcher: ["/((?!api|maintenance|_next/static|_next/image|.*\\..*).*)"],
};
