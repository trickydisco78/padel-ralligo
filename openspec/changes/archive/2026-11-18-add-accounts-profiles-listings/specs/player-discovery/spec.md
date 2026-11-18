# Spec Delta

## REMOVED Requirements

### Requirement: Player list
**Reason**: Discovery is by match listing, not by player. Listings replace the mock player list.
**Migration**: Use the `match-listings` capability (Discover shows open listings with the poster's name and skill tier).

### Requirement: Skill level filter
**Reason**: Filtering is now by level wanted on a listing, together with destination and dates.
**Migration**: Use the filter requirement in the `match-listings` capability.

### Requirement: Local mock data source
**Reason**: Data now comes from the backend, and the `Player` mock data is deleted.
**Migration**: Listings, profiles and destinations are read from the database; tests use fixtures local to each test.
