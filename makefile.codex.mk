# Codex launcher targets for reusable setup.

.PHONY: codex
codex:
	./scripts/ai/codex-start.sh

.PHONY: codex-clear
codex-clear:
	./scripts/ai/codex-start.sh --clear-cache
