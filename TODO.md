# TODO:

Production readiness (backend):
- [x] Transform data for front end views, redact values that users shouldn't see, and anonymize player ids.
- [x] Persist games and rooms with database.
- [x] Set up logging utility.
- [x] Send instructions in game digest.
- [x] Add slowdown and rate limiting.
- [x] Support moving cards back into the deck.
- [x] Enable linting and address warnings.
- [x] Keep track of when a card arrived at its current location.
- [ ] Add win conditions.
- [ ] Switch from "multi player choices" to "multi player sequences".
- [ ] Write helpers for defining common actions for cards.
- [ ] Write unit tests for game logic.
- [ ] Write end-to-end tests for API.

One day:
- [ ] Set up messaging system that supports different languages.
