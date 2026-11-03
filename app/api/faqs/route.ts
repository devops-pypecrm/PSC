import { NextRequest, NextResponse } from "next/server";
import getClientPromise from "../../../lib/mongodb";

export const dynamic = "force-dynamic";

const DB_NAME = "psc";
const COLLECTION = "faqs";

export async function GET() {
  try {
    const client = await getClientPromise();
    const storedFaqs = await client
      .db(DB_NAME)
      .collection(COLLECTION)
      .find({})
      .toArray();
    const faqs = storedFaqs.sort((a, b) => {
      const aOrder =
        typeof a.homepageOrder === "number" &&
        Number.isInteger(a.homepageOrder)
          ? a.homepageOrder
          : null;
      const bOrder =
        typeof b.homepageOrder === "number" &&
        Number.isInteger(b.homepageOrder)
          ? b.homepageOrder
          : null;

      if (aOrder !== null && bOrder !== null) return aOrder - bOrder;
      if (aOrder !== null) return -1;
      if (bOrder !== null) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ faqs });
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
    const question = String(body.question || "").trim();
    const answer = String(body.answer || "").trim();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    if (!answer) {
      return NextResponse.json(
        { error: "Answer is required" },
        { status: 400 }
      );
    }

    const client = await getClientPromise();
    await client
      .db(DB_NAME)
      .collection(COLLECTION)
      .insertOne({ question, answer, createdAt: new Date() });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
