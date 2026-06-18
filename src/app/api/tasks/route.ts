import { NextRequest, NextResponse } from "next/server";
import { serverState } from "@/lib/serverState";
import { AdminTask } from "@/types/lead";

export async function GET() {
  return NextResponse.json({
    tasks: serverState.adminTasks || []
  });
}

export async function POST(request: NextRequest) {
  try {
    const { action, payload } = await request.json();

    if (!serverState.adminTasks) {
      serverState.adminTasks = [];
    }

    if (action === "create") {
      const { businessName, phoneNumber, googleMapsUrl, address, pdfUrl } = payload;

      if (!businessName || !address) {
        return NextResponse.json({ error: "Name and Address are required" }, { status: 400 });
      }

      const newTask: AdminTask = {
        id: `task_${Date.now()}`,
        businessName,
        phoneNumber: phoneNumber || "",
        googleMapsUrl: googleMapsUrl || "",
        address,
        dispatchedAt: new Date().toISOString(),
        pdfUrl: pdfUrl || "",
        acceptedBy: null,
        acceptedByName: null,
        status: "Pending"
      };

      serverState.adminTasks.unshift(newTask);

      // Add to system activities audit logs
      serverState.activities.unshift({
        id: `act_${Date.now()}`,
        leadId: newTask.id,
        leadName: newTask.businessName,
        action: `Administrator dispatched new task: "${newTask.businessName}" to all operators`,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({ success: true, task: newTask });
    }

    if (action === "accept") {
      const { taskId, userId, userName } = payload;

      if (!taskId || !userId || !userName) {
        return NextResponse.json({ error: "Missing acceptance credentials" }, { status: 400 });
      }

      const task = serverState.adminTasks.find(t => t.id === taskId);
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      // Check if another operator accepted first (race conditions block)
      if (task.acceptedBy !== null) {
        if (task.acceptedBy === userId) {
          return NextResponse.json({ success: true, task, message: "You already accepted this task" });
        }
        return NextResponse.json({ 
          error: `Another user accepted`, 
          acceptedByName: task.acceptedByName 
        }, { status: 409 });
      }

      task.acceptedBy = userId;
      task.acceptedByName = userName;

      // Add audit activities
      serverState.activities.unshift({
        id: `act_${Date.now()}`,
        leadId: task.id,
        leadName: task.businessName,
        action: `Task accepted by operator "${userName}" (${userId})`,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({ success: true, task });
    }

    if (action === "updateStatus") {
      const { taskId, userId, status } = payload;

      if (!taskId || !status || !userId) {
        return NextResponse.json({ error: "Missing update details" }, { status: 400 });
      }

      const task = serverState.adminTasks.find(t => t.id === taskId);
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      if (task.acceptedBy !== userId) {
        return NextResponse.json({ error: "Unauthorized: You are not the assignee for this task" }, { status: 403 });
      }

      const oldStatus = task.status;
      task.status = status;

      // Trigger admin system notification
      if (!serverState.systemNotifications) {
        serverState.systemNotifications = [];
      }
      serverState.systemNotifications.unshift({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        recipientId: "admin",
        title: "Task Status Updated",
        message: `Task "${task.businessName}" status changed from "${oldStatus}" to "${status}" by ${task.acceptedByName || "operator"}.`,
        timestamp: new Date().toISOString(),
        read: false,
        senderName: task.acceptedByName || "Operator"
      });

      // Add audit activities
      serverState.activities.unshift({
        id: `act_${Date.now()}`,
        leadId: task.id,
        leadName: task.businessName,
        action: `Operator updated task outreach progress to "${status}"`,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({ success: true, task });
    }

    if (action === "updateNotes") {
      const { taskId, userId, notes } = payload;

      if (!taskId || !userId) {
        return NextResponse.json({ error: "Missing update details" }, { status: 400 });
      }

      const task = serverState.adminTasks.find(t => t.id === taskId);
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      if (task.acceptedBy !== userId) {
        return NextResponse.json({ error: "Unauthorized: You are not the assignee for this task" }, { status: 403 });
      }

      task.notes = notes;

      // Trigger admin system notification
      if (!serverState.systemNotifications) {
        serverState.systemNotifications = [];
      }
      serverState.systemNotifications.unshift({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        recipientId: "admin",
        title: "Task Notes Updated",
        message: `Notes for task "${task.businessName}" were updated by ${task.acceptedByName || "operator"}.`,
        timestamp: new Date().toISOString(),
        read: false,
        senderName: task.acceptedByName || "Operator"
      });

      // Add audit activities
      serverState.activities.unshift({
        id: `act_${Date.now()}`,
        leadId: task.id,
        leadName: task.businessName,
        action: `Operator updated task notes`,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({ success: true, task });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Tasks API error:", err);
    return NextResponse.json({ error: err.message || "Failed to handle task action" }, { status: 500 });
  }
}
