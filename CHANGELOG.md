# Changelog

All notable changes to the strapi-mcp project will be documented in this file.

## [0.1.4] - 2025-04-23

### Added
- New custom error handling system with additional error types:
  - `ResourceNotFound` for 404 errors
  - `AccessDenied` for 403/401 errors
- Custom `ExtendedMcpError` class for better error reporting

### Changed
- Improved error messages in `fetchContentTypeSchema`, `fetchEntry`, and `fetchContentTypes` functions
- Enhanced error handling for API responses with specific status codes

### Fixed
- Fixed insufficient error information when API requests fail
- Added more descriptive error messages for common API errors

## [0.1.3] - 2025-03-15

- Initial public release 