import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { LogsSettings } from "@/components/settings/logs-settings";

export default async function LogsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Logs</h1>
        <p className="text-sm text-gray-500">
          Historique des actions et vérifications effectuées par l&apos;outil.
        </p>
      </div>

      <LogsSettings />
    </div>
  );
}
