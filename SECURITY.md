# Security

Do not open public issues for suspected credential leaks or security-sensitive
behavior. Please contact the maintainers privately through the repository owner
or the security advisory channel configured for the public repository.

This repository is prepared so `.env`, raw capture output, logs, local caches,
and generated training JSONL are ignored by default. Before publishing release
artifacts, run a local secret scan and verify that no provider credentials,
cookies, raw payloads, or host-specific absolute paths are present.
