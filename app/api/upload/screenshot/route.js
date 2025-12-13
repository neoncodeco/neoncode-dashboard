import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");

    if (!file) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    if (!process.env.IMGBB_API_KEY) {
      console.error("IMGBB_API_KEY missing");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Max 2MB allowed" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const res = await fetch(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      {
        method: "POST",
        body: new URLSearchParams({ image: base64 }),
      }
    );

    // 🔥 READ AS TEXT FIRST
    const text = await res.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch (err) {
      console.error("IMGBB returned non-JSON:", text);
      return NextResponse.json(
        { error: "Invalid response from image server" },
        { status: 500 }
      );
    }

    if (!json.success || !json.data) {
      console.error("IMGBB upload failed:", json);
      return NextResponse.json(
        { error: "Image upload failed", details: json },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: json.data.url,
      deleteUrl: json.data.delete_url,
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
