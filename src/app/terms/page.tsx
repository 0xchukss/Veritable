import { LegalPage } from "@/components/legal-page";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="June 23, 2026">
      <section>
        <h2>Experimental service</h2>
        <p>
          Veritable is early-stage software running against evolving 0G
          infrastructure. Availability, transaction time, and proof retrieval
          are not guaranteed.
        </p>
      </section>
      <section>
        <h2>Your claims</h2>
        <p>
          You are responsible for the files, statements, issuer names, model
          details, and prompts you submit. A credential proves integrity of the
          recorded claim; it does not make a false claim true.
        </p>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <p>
          Do not use Veritable to upload illegal content, impersonate another
          party, misrepresent provenance, or interfere with the service or 0G
          network.
        </p>
      </section>
      <section>
        <h2>No warranty</h2>
        <p>
          The service is provided as-is without warranties. Independently review
          proofs before relying on a credential for legal, financial, safety, or
          other high-stakes decisions.
        </p>
      </section>
    </LegalPage>
  );
}
