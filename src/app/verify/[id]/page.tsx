import { PublicVerify } from "@/components/public-verify";

export const dynamic = "force-dynamic";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PublicVerify credentialId={id} />;
}
