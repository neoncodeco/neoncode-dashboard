import getDB from "@/lib/mongodb";

export async function POST(req) {
  try {
    const body = await req.json();
    const { uid, email, name, photo } = body;

    if (!uid) {
      return Response.json(
        { error: "UID required" },
        { status: 400 }
      );
    }

    const { db } = await getDB();

    await db.collection("users").updateOne(
      { userId: uid }, // 🔥 IMPORTANT: match ticket system
      {
        // ⬇️ only first time insert
        $setOnInsert: {
          userId: uid,
          role: "user",
          walletBalance: 0,
          topupBalance: 0,
          createdAt: new Date(),
        },

        // ⬇️ update anytime
        $set: {
          email: email || "",
          name: name || "User",
          photo: photo || "https://i.ibb.co/kgp65LMf/profile-avater.png",
          updatedAt: new Date(),
        }
      },
      { upsert: true }
    );

    return Response.json({ ok: true });

  } catch (e) {
    console.error("Error in register:", e);
    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
