import { LegalPage } from "@/components/legal-page";

export default function RoadmapPage() {
  return (
    <LegalPage title="Roadmap" updated="June 24, 2026">
      <section>
        <h2>Commercial path</h2>
        <p>
          Veritable starts as technical validation for 0G-backed provenance.
          The commercial path is a SaaS and API layer for AI agencies,
          creative studios, brands, and platforms that need public proof pages
          for digital content.
        </p>
      </section>
      <section>
        <h2>Proof issuance API</h2>
        <p>
          Platforms and AI tools could issue Veritable credentials
          programmatically after content is generated or published.
        </p>
      </section>
      <section>
        <h2>Branded verification pages</h2>
        <p>
          Teams could share public proof links with clients, users, and
          audiences without exposing 0G complexity.
        </p>
      </section>
      <section>
        <h2>Team proof dashboard</h2>
        <p>
          Organizations could manage credential history, issuers, artifacts,
          and verification activity from one workspace.
        </p>
      </section>
    </LegalPage>
  );
}