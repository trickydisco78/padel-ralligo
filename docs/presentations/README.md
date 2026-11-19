# Presentations and references

Shareable material about the business case, infrastructure and design. The Claude artifacts are the live versions; the files here are snapshots so the content lives with the code.

The artifact links are private and need access to open.

## Artifacts

| What | Link | Snapshot here |
| --- | --- | --- |
| Padel App business case (slide deck, 19 slides) | https://claude.ai/artifact/6qVRdScvdtC3LsqwAZJ6VR | [padel-app-business-case.md](padel-app-business-case.md) |
| Padel App design story (slide deck, 19 slides): from four light directions to hot pink, and why it works | https://claude.ai/artifact/EtFckw6x59nD6U9oEHTTDG | [padel-app-design-story.md](padel-app-design-story.md) |
| Padel infra map: today, production target, UK costs, plan limits | https://claude.ai/artifact/5zt6RMFsfz37j3pmHfFUFE | See [../database-delivery.md](../database-delivery.md) for the delivery part |
| Padel Pink design system (components, tokens, guidance) | https://claude.ai/artifact/WD22rDN9bJZfQvDqs1Eh14 | [padel-pink-design-system.md](padel-pink-design-system.md) |
| Why pink: pink within sport, four pink directions and the 70/20/10 rule (research and opinion, not an artifact) | None | [pink-reference.md](pink-reference.md) |
| Design canvas: four light directions, pink screens and the match request flow | https://claude.ai/artifact/SfUSwPjN1KHwUYk7c7RUgp | Renders of 12 screens in [images/design/](images/design/) |

## Related files in the repo

- [../design-reference.md](../design-reference.md): how the design system is applied in the app.
- [../architecture.md](../architecture.md): package structure and the join requests flow.
- [../database-delivery.md](../database-delivery.md): migrations, CI and seeds.
- [../product-vision.md](../product-vision.md): product vision.
- `packages/ui/design/tokens.json`: design tokens, the source for generated app tokens.
- `openspec/`: the specs and changes for each feature.

## Keeping snapshots current

- The deck, infra map and design system are edited in Claude. Re-copy the text here after larger changes, and update the date in each file.
- The images in `images/design/` are renders of the design canvas at 390 x 844 (2x). Re-render them after canvas changes: open each artboard file in headless Chrome with `--window-size=390,844 --force-device-scale-factor=2 --screenshot`.
- Prices and limits in the infra map and deck are estimates from vendor pages and third-party summaries. Confirm them before relying on them.
