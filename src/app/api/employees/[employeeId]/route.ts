import { NextRequest, NextResponse } from "next/server";

import { readStaffSession, STAFF_SESSION_COOKIE } from "@/lib/auth/session";
import { serverDb } from "@/lib/firebase/server";

const RELATED_COLLECTIONS = ["timelogs", "leaves", "advances"] as const;

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ employeeId: string }> },
) {
  const session = readStaffSession(
    request.cookies.get(STAFF_SESSION_COOKIE)?.value,
  );
  if (!session) {
    return NextResponse.json({ error: "Your session has expired." }, { status: 401 });
  }
  if (session.role !== "owner") {
    return NextResponse.json(
      { error: "Only the Owner can delete staff records." },
      { status: 403 },
    );
  }
  if (!serverDb) {
    return NextResponse.json(
      { error: "Server Firestore credentials are not configured." },
      { status: 503 },
    );
  }
  const db = serverDb;

  const { employeeId } = await context.params;
  if (!employeeId || employeeId.includes("/")) {
    return NextResponse.json({ error: "Invalid employee ID." }, { status: 400 });
  }

  try {
    const relatedSnapshots = await Promise.all(
      RELATED_COLLECTIONS.map(collectionId =>
        db
          .collection(collectionId)
          .where("employeeId", "==", employeeId)
          .get(),
      ),
    );
    const relatedReferences = relatedSnapshots.flatMap(snapshot =>
      snapshot.docs.map(documentSnapshot => documentSnapshot.ref),
    );

    for (let index = 0; index < relatedReferences.length; index += 500) {
      const batch = db.batch();
      relatedReferences.slice(index, index + 500).forEach(reference => {
        batch.delete(reference);
      });
      await batch.commit();
    }

    await db.collection("employees").doc(employeeId).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Owner employee deletion failed:", error);
    return NextResponse.json(
      { error: "Could not delete the employee and related records." },
      { status: 503 },
    );
  }
}
