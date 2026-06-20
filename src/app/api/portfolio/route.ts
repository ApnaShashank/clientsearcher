import { NextRequest, NextResponse } from "next/server";
import { serverState } from "@/lib/serverState";
import { PortfolioWebsite } from "@/types/lead";
import { syncState, saveState } from "@/lib/db";

export async function GET() {
  try {
    await syncState();
    if (!serverState.portfolioWebsites) {
      serverState.portfolioWebsites = [];
    }
    return NextResponse.json({ portfolio: serverState.portfolioWebsites });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch portfolio" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await syncState();
    const { action, payload } = await request.json();

    if (!serverState.portfolioWebsites) {
      serverState.portfolioWebsites = [];
    }

    if (action === "add") {
      const { name, url, businessType, address, type } = payload;

      if (!name || !url || !businessType || !address || !type) {
        return NextResponse.json({ error: "Missing required portfolio fields" }, { status: 400 });
      }

      const newWebsite: PortfolioWebsite = {
        id: `port_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name,
        url,
        businessType,
        address,
        type
      };

      serverState.portfolioWebsites.push(newWebsite);
      
      serverState.activities.unshift({
        id: `act_${Date.now()}`,
        leadId: "portfolio",
        leadName: "Portfolio Manager",
        action: `Added new ${type} website: "${name}"`,
        timestamp: new Date().toISOString()
      });

      await saveState("portfolioWebsites");
      await saveState("activities");
      return NextResponse.json({ success: true, website: newWebsite });
    }

    if (action === "delete") {
      const { id } = payload;
      const index = serverState.portfolioWebsites.findIndex(w => w.id === id);
      if (index !== -1) {
        const deleted = serverState.portfolioWebsites[index];
        serverState.portfolioWebsites.splice(index, 1);

        serverState.activities.unshift({
          id: `act_${Date.now()}`,
          leadId: "portfolio",
          leadName: "Portfolio Manager",
          action: `Deleted ${deleted.type} website: "${deleted.name}"`,
          timestamp: new Date().toISOString()
        });
      }
      await saveState("portfolioWebsites");
      await saveState("activities");
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process portfolio request" }, { status: 500 });
  }
}
