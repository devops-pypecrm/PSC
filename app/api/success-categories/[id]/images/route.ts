import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { randomUUID } from "node:crypto";
import getClientPromise from "../../../../../lib/mongodb";
import { isValidSuccessImageDataUrl } from "../../../../lib/successStoryImageValidation";

export const dynamic = "force-dynamic";

const DB_NAME = "psc";
const COLLECTION = "successCategories";

type SuccessCategoryDoc = {
  name: string;
  images: { id: string; src: string }[];
  createdAt: Date;
  updatedAt?: Date;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid category id" },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid image upload request" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || !("images" in body)) {
      return NextResponse.json(
        { error: "Invalid image upload request" },
        { status: 400 }
      );
    }

    const rawImages = body.images;
    if (
      !Array.isArray(rawImages) ||
      rawImages.length === 0 ||
      rawImages.length > 10
    ) {
      return NextResponse.json(
        { error: "Upload between 1 and 10 images at a time" },
        { status: 400 }
      );
    }

    const images: { id: string; src: string }[] = [];
    for (const item of rawImages) {
      const id =
        item && typeof item === "object" && "id" in item
          ? item.id
          : randomUUID();
      const src =
        item && typeof item === "object" && "src" in item
          ? item.src
          : item;

      if (
        typeof id !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ||
        !isValidSuccessImageDataUrl(src)
      ) {
        return NextResponse.json(
          { error: "Each upload must be a valid JPEG under 1MB" },
          { status: 400 }
        );
      }

      images.push({ id, src });
    }

    const client = await getClientPromise();
    const result = await client
      .db(DB_NAME)
      .collection<SuccessCategoryDoc>(COLLECTION)
      .updateOne(
        { _id: new ObjectId(id) },
        { $addToSet: { images: { $each: images } }, $set: { updatedAt: new Date() } }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, images });
  } catch (error) {
    console.error("Failed to add success story images", error);
    return NextResponse.json(
      { error: "Images could not be saved. Please try again." },
      { status: 500 }
    );
  }
}
