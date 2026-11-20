import getClientPromise from "../../lib/mongodb";
import {
  DEFAULT_HERO_CHILDREN,
  DEFAULT_HERO_HEADING,
  DEFAULT_HERO_TAG,
  type HeroChild,
  type HeroContent,
} from "./heroUtils";

const DB_NAME = "psc";
const COLLECTION = "herocontent";

export function normalizeHeroChildren(raw: unknown): HeroChild[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_HERO_CHILDREN;

  return raw.map((item, index) => {
    const child = item as Partial<HeroChild> | undefined;
    return {
      heading:
        String(child?.heading ?? "") ||
        DEFAULT_HERO_CHILDREN[index]?.heading ||
        "",
      paragraph:
        String(child?.paragraph ?? "") ||
        DEFAULT_HERO_CHILDREN[index]?.paragraph ||
        "",
      visible: typeof child?.visible === "boolean" ? child.visible : true,
    };
  });
}

export async function getHeroContent(): Promise<HeroContent> {
  try {
    const client = await getClientPromise();
    const doc = await client.db(DB_NAME).collection(COLLECTION).findOne({});

    return {
      tag: doc?.tag || DEFAULT_HERO_TAG,
      heading: doc?.heading || DEFAULT_HERO_HEADING,
      children: normalizeHeroChildren(doc?.children),
    };
  } catch {
    return {
      tag: DEFAULT_HERO_TAG,
      heading: DEFAULT_HERO_HEADING,
      children: DEFAULT_HERO_CHILDREN,
    };
  }
}
