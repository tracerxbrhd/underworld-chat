# Architecture Notes

## Core Product Shape

The system is modeled as a messaging backend with a public landing page for guests and a single-page dialog workspace for authenticated users.

## Identity and Sessions

- Anonymous account as the primary identity
- Immutable `public_id` as the account login
- Device sessions as the main access unit
- Recovery key and pairing flow for additional devices
- Public registration with user-controlled communication choices

## Domain Additions

- Editable profile data: avatar, display name, bio, birth date
- Personal notes channel scaffold for self-messaging
- Chat model prepared for direct chats and self-owned channels
- Search flow that looks through existing chats first and then matching users without an open dialog

## Internationalization

- Repository docs ship in English and Russian
- Frontend uses a translation dictionary with a language switcher
- Django settings enable `en` and `ru` with locale middleware
