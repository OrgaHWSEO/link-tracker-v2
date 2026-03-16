import { CsvImportForm } from "@/components/articles/csv-import-form";

export default function ImportArticlesPage({
  params,
}: {
  params: { campaignId: string };
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <CsvImportForm campaignId={params.campaignId} />
    </div>
  );
}
