import { NextRequest, NextResponse } from "next/server";
import getClientPromise from "../../../lib/mongodb";
import {
  HERO_TAG_MAX_CHARS,
  HERO_HEADING_MAX_CHARS,
  HERO_CHILD_HEADING_MAX_CHARS,
  HERO_CHILD_PARAGRAPH_MAX_CHARS,
  countChars,
} from "../../lib/heroUtils";
import { getHeroContent, normalizeHeroChildren } from "../../lib/heroContent";

export const dynamic = "force-dynamic";

const DB_NAME = "psc";
const COLLECTION = "herocontent";

export async function GET() {
  return NextResponse.json(await getHeroContent());
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const tag = String(body.tag ?? "");
    const heading = String(body.heading ?? "");
    const children = normalizeHeroChildren(body.children);

    if (countChars(tag) > HERO_TAG_MAX_CHARS) {
      return NextResponse.json(
        { error: `Tag must be ${HERO_TAG_MAX_CHARS} characters or fewer` },
        { status: 400 }
      );
    }

    if (countChars(heading) > HERO_HEADING_MAX_CHARS) {
      return NextResponse.json(
        {
          error: `Heading must be ${HERO_HEADING_MAX_CHARS} characters or fewer`,
        },
        { status: 400 }
      );
    }

    for (const [i, child] of children.entries()) {
      if (countChars(child.heading) > HERO_CHILD_HEADING_MAX_CHARS) {
        return NextResponse.json(
          {
            error: `Child ${i + 1} heading must be ${HERO_CHILD_HEADING_MAX_CHARS} characters or fewer`,
          },
          { status: 400 }
        );
      }
      if (countChars(child.paragraph) > HERO_CHILD_PARAGRAPH_MAX_CHARS) {
        return NextResponse.json(
          {
            error: `Child ${i + 1} paragraph must be ${HERO_CHILD_PARAGRAPH_MAX_CHARS} characters or fewer`,
          },
          { status: 400 }
        );
      }
    }

    const client = await getClientPromise();
    await client
      .db(DB_NAME)
      .collection(COLLECTION)
      .updateOne(
        {},
        { $set: { tag, heading, children, updatedAt: new Date() } },
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
