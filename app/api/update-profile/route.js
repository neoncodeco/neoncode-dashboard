
import getDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/verifyToken";
import { NextResponse } from "next/server";



export async function POST(req) {
  try {
    const decoded = await verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, photo, coverPhoto, payoutMethods } = await req.json();
     const { db } = await getDB();
    const result = await db.collection("users").updateOne(
      { userId: decoded.uid }, 
      {
        $set: {
          name: name,
          photo: photo,
          coverPhoto: coverPhoto,
          payoutMethods: payoutMethods,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
        message: "Profile updated successfully",
        success: true 
    }, { status: 200 });

  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
