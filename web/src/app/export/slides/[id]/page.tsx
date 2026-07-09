import { SlidePrintExport } from "@/components/SlidePrintExport";

type ExportSlidesPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ExportSlidesPage({ params }: ExportSlidesPageProps) {
  const { id } = await params;

  return <SlidePrintExport exportId={id} />;
}
