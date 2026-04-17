# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in YourDay, please **do not open a public GitHub issue**. Instead, report it privately so we can fix it before it becomes public.

**Preferred:** Open a private report via GitHub Security Advisories from the repository's **Security** tab → **Report a vulnerability**.

**Alternative:** Contact the maintainer via [GitHub](https://github.com/kyle-giacchi) (see profile for contact options).

Please include:

- A description of the vulnerability
- Steps to reproduce (or a proof-of-concept)
- The affected version or commit SHA
- Your assessment of impact and severity
- Any suggested mitigation

We will acknowledge receipt within **5 business days** and aim to provide a status update within **14 days**. Critical issues are prioritized.

## Scope

In scope:

- The web application code in this repository (`src/`, `public/`, build configuration)
- Documented features and user flows

Out of scope:

- Vulnerabilities in third-party dependencies that have already been disclosed upstream — please report those to the upstream project. We track dependency CVEs via Dependabot.
- Issues that require physical access to a user's device or browser session.
- Self-XSS that requires the user to paste attacker-supplied JavaScript into devtools.
- Missing security headers on third-party hosted forks (we control the headers in `public/_headers` for our own deployments).

## Disclosure

Once a fix is released, we will credit the reporter in the release notes (if desired). We do not currently offer a bug bounty.

## Data handling

YourDay is a **client-side application**. All user data — guest lists, table layouts, color themes — lives in the user's browser `localStorage`. There is no backend server, no database, and no telemetry. The repository contains no auth, no analytics, and no third-party tracking scripts.

If you find code in this repository that contradicts the above (e.g., an unexpected outbound `fetch`), that itself is a security issue worth reporting.
