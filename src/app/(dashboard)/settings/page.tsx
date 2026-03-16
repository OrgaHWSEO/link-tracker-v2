import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Parametres</h1>

      <Card>
        <CardHeader>
          <CardTitle>Mon profil</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Nom</dt>
              <dd className="mt-1">{session.user.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1">{session.user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1">
                <Badge
                  variant={
                    session.user.role === "ADMIN" ? "default" : "secondary"
                  }
                >
                  {session.user.role === "ADMIN" ? "Administrateur" : "Membre"}
                </Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
