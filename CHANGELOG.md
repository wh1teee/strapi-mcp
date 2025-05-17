# Changelog

All notable changes to the strapi-mcp project will be documented in this file.

## [0.1.7] - 2025-05-17

### Added
- New content lifecycle management tools:
  - `publish_entry`: Publish any content entry
  - `unpublish_entry`: Unpublish any content entry
- Complete component management system:
  - `list_components`: List all available components
  - `get_component_schema`: Get schema for a specific component
  - `create_component`: Create new components
  - `update_component`: Update existing components
- Improved admin authentication for all API operations
- New content type management functionality:
  - `delete_content_type`: Delete existing content types via the Content-Type Builder API

### Changed
- Prioritized admin credentials for all content operations
- Added better error handling and fallbacks for component operations
- Enhanced debugging with better console output
- Enhanced the `loginToStrapiAdmin` and `makeAdminApiRequest` functions with better error logging and token handling
- Improved payload structure for the Strapi v4 API in content type creation
- Updated documentation to clarify server management via Cursor configuration

### Fixed
- Fixed authentication issues in the `createContentType` function 
- Improved error handling in content type management
- Resolved server process management issues with multiple instances

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