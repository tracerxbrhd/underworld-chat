# Underworld Chat

`EN` | [Русская версия](./README.ru.md)

Privacy-first messenger scaffold with user-chosen logins, device-centric sessions, and an interface split between a public landing page and an authenticated dialog workspace.

## License

This repository uses `Apache-2.0` with a project `NOTICE` file.

Why this choice:

- the license is open-source and broadly compatible;
- it allows commercial and private use;
- it requires preserving copyright and attribution notices;
- the `NOTICE` file gives a clean, standard place to keep visible credit to the original author.

## Current Direction

- Public landing page for guests
- Dialog workspace for authenticated users
- Anonymous accounts + device sessions with open registration
- Editable user profile with immutable account login
- Personal notes channel scaffold
- Chat and user search with quick direct-dialog creation
- RU/EN localization groundwork in docs, frontend, and backend settings

## Repository Map

```text
apps/
  backend/
  frontend/
docs/
infra/
  nginx/
scripts/
docker-compose.yml
LICENSE
NOTICE
README.en.md
README.ru.md
```

## Local Start

1. Copy `.env.example` to `.env`.
2. Review secrets, ports, and language defaults.
3. Start the stack with `docker compose up --build`.
4. Open `http://localhost`.

## Documentation

- [English README](./README.en.md)
- [Русский README](./README.ru.md)
- [Architecture Index](./docs/architecture.md)
- [Deployment Index](./docs/deployment.md)
- Fresh Ubuntu 24 deployment is now the default production path
