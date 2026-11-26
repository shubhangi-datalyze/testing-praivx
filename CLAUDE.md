<!-- datalyze:start (written by the Datalyze Tracking Agent) -->
## Analytics tracking (Datalyze)

This repo's analytics tracking plan is in `analytics/registry/`. The Datalyze plugin for Claude Code (`datalyze`, offered by `.claude/settings.json`) knows how it works.

- What a branch or pull request needs includes its tracking: run `/datalyze:review` for that part. It writes the proposal to `.datalyze/proposals/`.
- To audit the tracking (the whole repo, an area, some events, or since a date), run `/datalyze:audit`.
- To build an approved proposal, run `/datalyze:implement`.
- Never edit `analytics/registry/_conventions.yaml`, `analytics/registry/_baseline.json` or `.datalyze/config.yaml` to make a check pass.

The plugin needs `DATALYZE_KEY` in your environment: your workspace key, from the Datalyze dashboard.
<!-- datalyze:end -->
