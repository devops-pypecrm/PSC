import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import getClientPromise from "../../../../lib/mongodb";
import {
  compactSuccessVideoOrder,
  type OrderedSuccessVideoDocument,
} from "../../../lib/successVideoOrder";

export const dynamic = "force-dynamic";

const DB_NAME = "psc";
const COLLECTION = "successVideos";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid video id" },
        { status: 400 }
      );
    }

    const client = await getClientPromise();
    const collection = client
      .db(DB_NAME)
      .collection<OrderedSuccessVideoDocument>(COLLECTION);
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    await compactSuccessVideoOrder(collection);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
