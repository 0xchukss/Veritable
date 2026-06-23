import { VeritableApp } from "@/components/veritable-app";

export default async function AppPage({
  searchParams,
}: {
  searchParams?: Promise<{ demo?: string; example?: string }>;
}) {
  const params = searchParams ? await searchParams : {};

  return (
    <VeritableApp
      startWithDemo={params.demo === "1" || params.example === "1"}
    />
  );
}
