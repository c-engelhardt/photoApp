# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows semantic versioning where practical.

## [Unreleased]

### Added

- Root `README.md` with full prerequisites, setup, run, and troubleshooting steps.
- `CHANGELOG.md` to track project changes over time.

## [0.1.0] - 2026-02-21

### Added

- Initial PhotoApp scaffold with Fastify backend, React frontend, and Prisma schema.
- Invite-only authentication flow with admin seeding and viewer onboarding.
- Photo upload pipeline with image resizing, tag support, and album support.
- Expiring share links for photos and albums, plus protected media delivery.
- Project documentation in `docs/` for setup, API, deployment, security, backup, and Nginx.
- Readable inline comments across `client/src` and `server/src`.
