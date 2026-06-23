import { LegalPage } from "@/components/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="June 23, 2026">
      <section>
        <h2>What Veritable processes</h2>
        <p>
          Veritable hashes uploaded artifacts to create credentials. Credential
          data is encrypted before it is committed to 0G Storage. Public
          verification pages expose the claim, artifact hash, provenance fields,
          and network proof needed to verify a credential.
        </p>
      </section>
      <section>
        <h2>Artifacts and sensitive information</h2>
        <p>
          Do not upload confidential or unlawful material. Network transactions
          and public credential metadata cannot be treated as private or
          erasable, even when credential bytes are encrypted.
        </p>
      </section>
      <section>
        <h2>Third-party infrastructure</h2>
        <p>
          The service uses 0G network infrastructure and Vercel hosting. Their
          respective policies apply to data handled by those services.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          Report privacy or security concerns through the public Veritable
          GitHub repository.
        </p>
      </section>
    </LegalPage>
  );
}
