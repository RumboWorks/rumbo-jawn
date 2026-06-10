# Adjusting the UI and experience of "runs" in Eval

> IMPLEMENTED 2026-06-10 in phase 24 (`docs/development-phases/phase-24-eval-run-adjustments.md`),
> together with the folded-in run trash can. Archived; not source of truth.

A great majority of Evals will probably be only one run.  I'd like, tool-wide, to collapse mention of runs, until someone makes a second run on an eval.

starting a new eval already short-cuts creating a run.
Viewing a completed eval with only 1 run already hides the "overview" and "trend" tabs which is perfect.

- clicking on an eval title, if there's only one run, should take you to that run's overview page, not a page showing 1 run. and the main title on that page should be the eval title, not "Run 1" in huge letters.

- under reports, it should list evals as primary with runs beneath.

- when an eval has no more runs in it, it should be removed.