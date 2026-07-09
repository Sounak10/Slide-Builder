import { NextResponse, type NextRequest } from "next/server";
import { getSlideExport } from "@/lib/slide-export-store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const slideExport = getSlideExport(id);

  if (!slideExport) {
    return NextResponse.json({ error: "Slide export not found" }, { status: 404 });
  }

  return NextResponse.json({ markdown: slideExport.markdown });
}
