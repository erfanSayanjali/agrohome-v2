import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RevalidateBody = {
  tag?: string;
  tags?: string[];
  path?: string;
  paths?: string[];
};

function asStringList(...groups: Array<string | string[] | undefined>): string[] {
  const out: string[] = [];
  for (const group of groups) {
    if (typeof group === "string" && group) out.push(group);
    else if (Array.isArray(group)) {
      for (const item of group) {
        if (typeof item === "string" && item) out.push(item);
      }
    }
  }
  return [...new Set(out)];
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: RevalidateBody = {};
  try {
    body = (await req.json()) as RevalidateBody;
  } catch {
    body = {};
  }

  const tags = asStringList(body.tag, body.tags);
  const paths = asStringList(body.path, body.paths);

  for (const tag of tags) revalidateTag(tag);
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({ ok: true, tags, paths });
}
