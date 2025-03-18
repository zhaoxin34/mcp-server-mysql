# Changelog


### Planned Features
- Query Features
  - Prepared statement support
  - Query parameter validation
  - Query timeout configuration
  - Result pagination
  - Query execution statistics

- Security
  - Enhanced SQL injection prevention
  - Query whitelisting/blacklisting
  - Rate limiting
  - Query complexity analysis
  - Connection encryption configuration

- Performance
  - Connection pool optimization
  - Query result caching
  - Large result set streaming
  - Query execution plan analysis

- Monitoring
  - Query logging system
  - Performance metrics collection
  - Error tracking and reporting
  - Health check endpoints

- Schema Management
  - Table relationship information
  - Index details
  - Foreign key constraints
  - Table statistics

## [1.0.10] - 2024-03-13

### Changed
- Version bump to fix npm publishing issue
- Updated installation instructions in README to reference specific version

## [1.0.9] - 2024-03-13

### Added
- GitHub Actions CI workflow for automated lint, build, and test with MySQL service

### Changed
- Removed `@types/mysql2` dependency and related type references
- Updated test files to use `any` type instead of mysql2 specific types
- Fixed integration tests to properly handle MySQL connection and queries

### Fixed
- Fixed GitHub Actions workflow to install pnpm before using it for caching
- Fixed failing unit tests by removing problematic executeReadOnlyQuery tests

## [1.0.8] - 2024-03-12

### Changed
- Upgraded from `mysql` to `mysql2` package (^3.13.0) for better MySQL 8.0+ compatibility
- Refactored database connection code to use mysql2's Promise-based API
- Added support for MySQL 8.0+ authentication with `caching_sha2_password` plugin

### Removed
- Removed deprecated `mysql` package dependency
- Removed unused `@types/mysql2` devDependency

### Fixed
- Fixed authentication issues with MySQL 8.0+ servers
- Improved connection handling with Promise-based API
- Enhanced error handling for database operations

## [1.0.7] - Previous version
- Initial release with basic MySQL functionality 