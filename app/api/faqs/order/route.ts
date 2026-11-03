import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import getClientPromise from "../../../../lib/mongodb";

export const dynamic = "force-dynamic";

const DB_NAME = "psc";
const COLLECTION = "faqs";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const faqIds: unknown = body?.faqIds;

    if (
      !Array.isArray(faqIds) ||
      !faqIds.every(
        (id): id is string => typeof id === "string" && /^[a-f\d]{24}$/i.test(id)
      ) ||
      new Set(faqIds).size !== faqIds.length
    ) {
      return NextResponse.json(
        { error: "FAQ ids must be a unique list of valid ids" },
        { status: 400 }
      );
    }

    const client = await getClientPromise();
    const collection = client.db(DB_NAME).collection(COLLECTION);
    const existingFaqs = await collection
      .find({}, { projection: { _id: 1 } })
      .toArray();
    const existingIds = new Set(existingFaqs.map((faq) => faq._id.toString()));

    if (
      faqIds.length !== existingIds.size ||
      faqIds.some((id) => !existingIds.has(id))
    ) {
      return NextResponse.json(
        { error: "The FAQ list changed. Refresh it before saving the order." },
        { status: 409 }
      );
    }

    if (faqIds.length > 0) {
      const result = await collection.bulkWrite(
        faqIds.map((id, homepageOrder) => ({
          updateOne: {
            filter: { _id: new ObjectId(id) },
            update: { $set: { homepageOrder } },
          },
        }))
      );

      if (result.matchedCount !== faqIds.length) {
        return NextResponse.json(
          { error: "The FAQ list changed while saving. Refresh and try again." },
          { status: 409 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
