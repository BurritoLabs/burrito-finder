# Security Policy

## Dependency Audit

Run `npm run audit:prod` before release. The check fails on every production
advisory except the explicitly reviewed exception below. It also prevents the
Finder from importing Terra wallet, private-key, or signing APIs.

## Reviewed Upstream Exception

- Advisory: `GHSA-848j-6mx2-7j84`
- Reviewed: 2026-07-13
- Scope: the latest `@terra-money/terra.js` read-only LCD dependency and its
  `elliptic` dependency chain
- Exposure: Finder reads public chain data and does not hold keys or sign
  transactions
- Upstream status: no fixed `elliptic` release is available
- Enforcement: `scripts/audit-production.mjs` permits only this advisory and
  its exact known package set; any new advisory or signing API import fails CI
- Removal trigger: replace or upgrade the Terra SDK when an upstream fixed
  release becomes available
