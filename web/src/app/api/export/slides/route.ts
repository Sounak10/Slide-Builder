import { NextResponse, type NextRequest } from "next/server";
import { createSlideExport } from "@/lib/slide-export-store";

export const dynamic = "force-dynamic";

type SlideExportRequest = {
  markdown?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as SlideExportRequest;
  const markdown = body.markdown?.trim();

  if (!markdown) {
    return NextResponse.json({ error: "No slide markdown provided" }, { status: 400 });
  }

  const id = createSlideExport(markdown);

  return NextResponse.json({ id }, { status: 201 });
}
