import { NextRequest, NextResponse } from "next/server";
import { atlasStore } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const secretParam = req.nextUrl.searchParams.get("secret");
    const expectedSecret = process.env.CRON_SECRET || "atlas_secure_cron_secret_key_32bytes";

    const isAuthorized =
      (authHeader && authHeader === `Bearer ${expectedSecret}`) ||
      (secretParam && secretParam === expectedSecret);

    if (!isAuthorized && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized cron execution." }, { status: 401 });
    }

    // Inspect upcoming pickups and overdue rentals
    const reservations = atlasStore.getReservations();
    const now = new Date().getTime();

    let alertsTriggered = 0;
    const upcomingPickups = reservations.filter((r) => {
      const pTime = new Date(r.pickup_datetime).getTime();
      return r.status === "confirmed" && pTime - now > 0 && pTime - now < 86400000;
    });

    const overdueReturns = reservations.filter((r) => {
      const rTime = new Date(r.return_datetime).getTime();
      return (r.status === "checked_out" || r.status === "active") && now > rTime;
    });

    alertsTriggered = upcomingPickups.length + overdueReturns.length;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processed: {
        upcomingPickups: upcomingPickups.length,
        overdueReturns: overdueReturns.length,
        alertsTriggered,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Cron execution failed" }, { status: 500 });
  }
}
