# Conventions

## Reducer events

Model every reducer action as an event: a fact about what happened, never a setter.

- `type` is UPPER_SNAKE_CASE and reads as a past-tense fact: `DECISION_FAILED`, `EDIT_SAVED`, `TAB_SELECTED`. Setter names such as `SET_TAB` or `SET_ERROR` become the event that explains why the value changed.
- The payload carries what happened (`requestId`, `code`); the reducer decides which fields change, so one event may update several.
- Components call named functions from the hook (`accept`, `startEdit`) and never build action objects.

Reference: https://redux.js.org/style-guide/#model-actions-as-events-not-setters

## View states

Give every view state a string-literal union named for what it describes, and switch on it exhaustively.

```ts
type AddressState = 'init' | 'selectedAddress' | 'manualEntry';
```

- One union per question the screen answers (`ProfileFormState = 'editing' | 'saving' | 'saved' | 'failed'`); values name the situation, so no two flags can contradict each other.
- A state with data becomes a discriminated union on `kind`, as in `ManageOverlay`.
- Derive the state in a pure function or reducer in the domain layer (`manageViewFor`, `profileViewFor`) and let the component render it.
- `useState<boolean>` stays for a single independent toggle (a focused input, a checkbox).
