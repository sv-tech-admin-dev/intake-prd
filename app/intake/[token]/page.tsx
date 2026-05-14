import { DynamicIntakeForm } from "@/components/intake/dynamic-intake-form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loadIntakeByToken } from "@/lib/intake/service";

export default async function IntakePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await loadIntakeByToken(token);

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Card className="mb-6 gap-0">
          <CardHeader>
            <CardDescription className="text-xs uppercase tracking-[0.24em]">Public intake</CardDescription>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <CardTitle className="font-heading text-3xl">Website intake</CardTitle>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Conditional questions appear as you answer. The review step summarizes what the team needs to produce a
                  PRD instead of a pile of vague responses.
                </p>
              </div>
              <div className="rounded-full border border-border bg-muted px-4 py-2 text-sm text-muted-foreground">
                Schema {data.schema.version}
              </div>
            </div>
          </CardHeader>
        </Card>

        <DynamicIntakeForm token={token} schema={data.schema} submission={data.submission} />
      </div>
    </main>
  );
}
