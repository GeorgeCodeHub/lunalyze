---
version: 1
slug: "frontend-components-compare-tsx"
primary_target: "frontend/components/Compare.tsx"
related_targets: []
---

# Compare screen, comparison state

Mode: Operate. Readers: mission planners, teachers and the public. A non-expert must be able to name the best place within seconds.
Task: see the tool's best place for the chosen date and stay, compare it line by line with one alternative, and watch both over time.
Constraints: every number comes from backend/lib through useScenario; plain words; AGENTS.md conventions. The setup step's world is inherited (frontend/styles/tokens.css).
Reference from the user: a dark traffic-management dashboard. It sets the craft level (calm cards, large readable figures, small status marks, a live map in the middle), not the look.

## Direction contract

THESIS: The page answers "which place?" before anything else: the tool's best option on the left, one alternative on the right, compared line by line. It refuses the equal-columns dashboard where the reader has to work out the winner.

OWN-WORLD: Inherited: near-black ground, light Geist Mono text, Geist Pixel only for place names and the title, 1px light rules, 8px panels. The Sun is a yellow circle and Earth a blue diamond everywhere; hidden is dashed. Added for this screen: a green tick and a warm warning mark on the verdict, each with its word.

STORY: The reader sees the winner and why, sees line by line where the other place falls short, then presses play and watches the Sun and Earth move for both.

FIRST VIEWPORT: A slim scenario toolbar on top. Below it three columns: the best-option card (name, verdict, why it won, three comparison rows, what happens next), the live view (map or sky switch, play button and scrubber, both timelines), the alternative card (the same rows, with a dropdown to swap the place). On narrow screens the two cards come first, the live view after.

FORM: Three-column comparison, pinned by the user. seed: none (pinned) "compare between the best option that the tool gies the user and another one as an alternative and in the middle we can see the live vieww"

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
