import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getCollection, stripMongoId } from "@/lib/db";
import { Batch, Lead } from "@/types/crm";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const [{ col: batchCol, memory }, { col: leadCol }] = await Promise.all([
    getCollection<Batch>("batches"),
    getCollection<Lead>("leads"),
  ]);

  const batch = batchCol
    ? await batchCol.findOne({ id })
    : memory.batches.find((b) => b.id === id) || null;

  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  const leads = leadCol
    ? (await leadCol.find({ batchId: id }).toArray()).map(
        (d) => stripMongoId(d) as Lead
      )
    : memory.leads.filter((l) => l.batchId === id);

  return NextResponse.json({
    batch: stripMongoId(batch as Batch),
    leads,
  });
}
