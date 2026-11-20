import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import getClientPromise from "../../../lib/mongodb";
import { isValidSuccessImageDataUrl } from "../../lib/successStoryImageValidation";
import {
  getOrderedSuccessVideos,
  type OrderedSuccessVideoDocument,
} from "../../lib/successVideoOrder";

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
    const videoCollection =
      db.collection<OrderedSuccessVideoDocument>(COLLECTION);
    const [videos, coverSettings] = await Promise.all([
      getOrderedSuccessVideos(videoCollection),
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
      typeof body === "object" &&
      body !== null &&
      "videoIds" in body
    ) {
      const { videoIds } = body;
      if (
        !Array.isArray(videoIds) ||
        !videoIds.every(
          (id): id is string => typeof id === "string" && ObjectId.isValid(id)
        ) ||
        new Set(videoIds).size !== videoIds.length
      ) {
        return NextResponse.json(
          { error: "Provide each video ID exactly once" },
          { status: 400 }
        );
      }

      const collection =
        (await getClientPromise())
          .db(DB_NAME)
          .collection<OrderedSuccessVideoDocument>(COLLECTION);
      const currentVideos = await getOrderedSuccessVideos(collection);
      const currentIds = new Set(
        currentVideos.map((video) => video._id.toHexString())
      );

      if (
        videoIds.length !== currentVideos.length ||
        videoIds.some((id) => !currentIds.has(id.toLowerCase()))
      ) {
        return NextResponse.json(
          { error: "The video list changed. Reload and try again." },
          { status: 409 }
        );
      }

      const result =
        videoIds.length > 0
          ? await collection.bulkWrite(
              videoIds.map((id, order) => ({
                updateOne: {
                  filter: { _id: new ObjectId(id) },
                  update: { $set: { order } },
                },
              }))
            )
          : null;

      if (result && result.matchedCount !== videoIds.length) {
        return NextResponse.json(
          { error: "The video list changed. Reload and try again." },
          { status: 409 }
        );
      }

      return NextResponse.json({ success: true });
    }

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
    const collection = client
      .db(DB_NAME)
      .collection<OrderedSuccessVideoDocument>(COLLECTION);
    const videos = await getOrderedSuccessVideos(collection);
    const order =
      videos.length > 0
        ? Math.max(...videos.map((video) => video.order ?? -1)) + 1
        : 0;
    await collection.insertOne({
      _id: new ObjectId(),
      sourceType,
      url,
      createdAt: new Date(),
      order,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
