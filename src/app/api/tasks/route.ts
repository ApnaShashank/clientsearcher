import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  deleteTask,
  getAllTasks,
  insertTask,
  makeId,
  updateTask,
} from "@/lib/repo";
import { logActivity } from "@/lib/activity";
import { AdminTask } from "@/types/crm";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const tasks = await getAllTasks();
  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Task title is required." }, { status: 400 });
    }

    const task: AdminTask = {
      id: makeId("task"),
      title,
      description: String(body.description || "").trim(),
      dueDate: body.dueDate ? String(body.dueDate) : null,
      status: "To Do",
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    await insertTask(task);
    await logActivity({
      actorId: auth.user.id,
      actorName: auth.user.name,
      actorRole: "admin",
      action: `Created admin task "${task.title}"`,
      entityType: "task",
      entityId: task.id,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error("Create task error:", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const id = String(body.id || "");
    if (!id) {
      return NextResponse.json({ error: "Task id is required" }, { status: 400 });
    }

    const patch: Partial<AdminTask> = {};
    if (body.status === "Done" || body.status === "To Do") {
      patch.status = body.status;
      patch.completedAt = body.status === "Done" ? new Date().toISOString() : null;
    }
    if (typeof body.title === "string" && body.title.trim()) {
      patch.title = body.title.trim();
    }
    if (body.dueDate !== undefined) {
      patch.dueDate = body.dueDate ? String(body.dueDate) : null;
    }

    const updated = await updateTask(id, patch);
    if (!updated) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task: updated });
  } catch (err) {
    console.error("Update task error:", err);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || "";
  if (!id) {
    return NextResponse.json({ error: "Task id is required" }, { status: 400 });
  }

  const deleted = await deleteTask(id);
  if (!deleted) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
