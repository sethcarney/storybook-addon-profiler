# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅        |
| < 1.0   | ❌        |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Use GitHub's private vulnerability reporting instead:
👉 [Report a vulnerability](https://github.com/sethcarney/storybook-addon-profiler/security/advisories/new)

Include as much of the following as possible:

- Type of issue (e.g. XSS, prototype pollution, supply-chain)
- Affected source file paths and version(s)
- Steps to reproduce
- Proof-of-concept or exploit code if available
- Potential impact

You should receive an acknowledgement within **48 hours**. If you have not heard
back within that window please follow up via a new advisory report.

## Disclosure Timeline

We follow a **90-day coordinated disclosure** policy. We will aim to release a
fix within 90 days of the initial report. If a fix is not ready within that
window we will notify you and agree on an extension or a partial mitigation
release.

## Out of Scope

- Issues in Storybook itself — report those at https://github.com/storybookjs/storybook/security
- Issues that only affect development/devDependencies and cannot reach end users
- Denial-of-service via intentionally malformed story files
