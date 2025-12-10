# Release v0.0.1

## Features
- feat: log user authentication details including roles and username
- feat: add HEADER_USERNAME constant for consistency
- feat: add token validation via redis-auth and profile routes
- feat: beats upload integration
- feat: beats upload integration
- feat: admin added
- feat: update public authentication paths
- feat: update auth routes, rename from users to auth
- feat: docker volume added to improve developing phase
- feat: headers testing
- feat: use constants in proxy definitions
- feat: new gateway http headers and constants mgmt

## Tests
No test changes.
## Documentation
- docs: update project documentation
- docs: añadido README.md al proyecto

## Fixes
- fix: allowed login on development
- fix: spanish located comments for constants.js

## Continuous integration (CI)
- ci: add create releases workflow

## Other changes
- Merge pull request #8 from SocialBeats/develop
- Merge pull request #3 from SocialBeats/feat/profile-routes
- Merge branch 'feat/profile-routes' of https://github.com/SocialBeats/api-gateway into feat/profile-routes
- Merge pull request #4 from SocialBeats/copilot/sub-pr-3
- Update src/routes/proxy.js
- Initial plan
- Merge pull request #2 from SocialBeats/main
- refactor(gateway): standardize logs to English and comments to Spanish
- feat(gateway): implement aggregation service and routes
- feat(middleware): implement role-based authorization middleware
- feat(core): add response utility and core configurations
- chore(deps): update dependencies for gateway core functionality
- feat(core): create main server entrypoint
- feat(utils): add error handler utility
- feat(routes): add gateway aggregation and proxy routes
- feat(middleware): implement authentication, circuit breaker and rate limiter
- feat(logging): add winston logger and service config
- chore(ci): add Docker configuration and tooling scripts
- chore: initial project setup with tooling

## Full commit history

For full commit history, see [here](https://github.com/SocialBeats/api-gateway/compare/...v0.0.1).

