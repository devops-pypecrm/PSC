import { NextRequest, NextResponse } from "next/server";
import getClientPromise from "../../../lib/mongodb";
import { isValidSuccessImageDataUrl } from "../../lib/successStoryImageValidation";

export const dynamic = "force-dynamic";

const DB_NAME = "psc";
const COLLECTION = "successVideos";
const SETTINGS_COLLECTION = "admin_settings";
const COVER_SETTINGS_ID = "success-video-cover";
const VALID_TYPES = ["upload", "youtube", "instagram", "drive"];

type SuccessVideoCoverSettings = {
  _id: string;
  coverImage?: string;
  updatedAt?: Date;
};

export async function GET() {
  try {
    const client = await getClientPromise();
    const db = client.db(DB_NAME);
    const [videos, coverSettings] = await Promise.all([
      db.collection(COLLECTION).find({}).sort({ createdAt: -1 }).toArray(),
      db
        .collection<SuccessVideoCoverSettings>(SETTINGS_COLLECTION)
        .findOne({ _id: COVER_SETTINGS_ID }),
    ]);

    return NextResponse.json(
      { videos, coverImage: coverSettings?.coverImage || "" },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (
      typeof body !== "object" ||
      body === null ||
      !("coverImage" in body) ||
      !isValidSuccessImageDataUrl(body.coverImage)
    ) {
      return NextResponse.json(
        { error: "Upload a valid JPEG image under 1MB" },
        { status: 400 }
      );
    }

    const client = await getClientPromise();
    await client
      .db(DB_NAME)
      .collection<SuccessVideoCoverSettings>(SETTINGS_COLLECTION)
      .updateOne(
        { _id: COVER_SETTINGS_ID },
        { $set: { coverImage: body.coverImage, updatedAt: new Date() } },
        { upsert: true }
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const client = await getClientPromise();
    await client
      .db(DB_NAME)
      .collection<SuccessVideoCoverSettings>(SETTINGS_COLLECTION)
      .updateOne(
        { _id: COVER_SETTINGS_ID },
        {
          $unset: { coverImage: "" },
          $set: { updatedAt: new Date() },
        }
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sourceType = String(body.sourceType || "");
    const url = String(body.url || "").trim();

    if (!VALID_TYPES.includes(sourceType)) {
      return NextResponse.json(
        { error: "A valid video source is required" },
        { status: 400 }
      );
    }

    if (!url) {
      return NextResponse.json(
        { error: "A video file or link is required" },
        { status: 400 }
      );
    }

    const client = await getClientPromise();
    await client
      .db(DB_NAME)
      .collection(COLLECTION)
      .insertOne({ sourceType, url, createdAt: new Date() });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
