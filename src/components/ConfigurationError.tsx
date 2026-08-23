export function ConfigurationError({ variables }: { variables: string[] }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <section className="max-w-xl rounded-lg border bg-card p-8 text-card-foreground shadow-sm">
        <h1 className="text-2xl font-bold">Blueprints is not configured</h1>
        <p className="mt-3 text-muted-foreground">
          This deployment is missing required Supabase configuration. Add the
          following deployment secrets and rebuild the site:
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-6 font-mono text-sm">
          {variables.map((variable) => <li key={variable}>{variable}</li>)}
        </ul>
      </section>
    </main>
  );
}
