import s from "./Legal.module.scss";

const updatedAt = "July 13, 2026";

export const Privacy = () => (
  <article className={s.document}>
    <h1>Privacy</h1>
    <p className={s.updated}>Last updated {updatedAt}</p>
    <section>
      <h2>Information processed</h2>
      <p>
        Burrito Finder reads public blockchain data. Addresses, transaction
        hashes, validator addresses, and other identifiers entered into the
        explorer are public network data.
      </p>
    </section>
    <section>
      <h2>Operational data</h2>
      <p>
        Our infrastructure may temporarily process IP addresses, request paths,
        browser details, and technical error reports to secure and operate the
        service. Public health responses contain aggregate and redacted
        information.
      </p>
    </section>
    <section>
      <h2>Third-party services</h2>
      <p>
        Chain data and token metadata may be retrieved from node operators,
        Mintscan, and public asset registries. Their own privacy practices may
        apply when requests are served by those providers.
      </p>
    </section>
    <section>
      <h2>Wallets and custody</h2>
      <p>
        Burrito Finder does not request seed phrases or private keys and does
        not custody assets.
      </p>
    </section>
  </article>
);

export const Terms = () => (
  <article className={s.document}>
    <h1>Terms</h1>
    <p className={s.updated}>Last updated {updatedAt}</p>
    <section>
      <h2>Explorer service</h2>
      <p>
        Burrito Finder is a read-only interface for public blockchain data. Data
        can be delayed, incomplete, or unavailable when networks or upstream
        providers are degraded.
      </p>
    </section>
    <section>
      <h2>No financial advice</h2>
      <p>
        Information displayed by the service is provided for informational
        purposes and is not financial, investment, legal, or tax advice.
      </p>
    </section>
    <section>
      <h2>Verification</h2>
      <p>
        Users should independently verify addresses, denominations,
        transactions, and validator information before making decisions.
      </p>
    </section>
    <section>
      <h2>Availability</h2>
      <p>
        The service is provided as available without a guarantee of continuous
        operation or error-free data.
      </p>
    </section>
  </article>
);
