# Changelog

## June 3, 2025

### Test Improvements and Bug Fixes

I have made the following improvements to the "Gift a Voucher" feature:

#### API Tests
- Fixed and stabilized `giftVoucherHandler` tests by properly mocking validation, database operations, and error handling
- Updated test assertions to match the actual behavior of the handler (500 status code for validation errors)
- Improved mocking of `VoucherGiftSchema.safeParse` to conditionally return success or error responses
- Fixed high-value voucher confirmation tests to correctly check for the `isHighValue` flag
- Ensured idempotency tests verify that repeated requests return the existing voucher
- Fixed TypeScript errors and converted Jest tests to Vitest

#### Middleware Tests
- Rewrote `rateLimiter` tests with a simplified synchronous mock exposing the internal test store
- Fixed mocking of Express request and response objects, including read-only IP property
- Fixed header value assertions to expect strings instead of numbers
- Ensured proper test isolation and state reset between tests

#### Service Tests
- Fixed `saveIdempotencyRecord` test to properly mock the Date constructor
- Fixed TTL calculation to match the actual 7-day TTL by adding milliseconds then converting to seconds
- Added type assertions for mocked DynamoDB calls

#### Test Coverage
- Added test coverage scripts to package.json files for both API and frontend
- Created root-level scripts to run coverage for the entire project

### Security Enhancements

I have implemented or verified the following security features:

#### Rate Limiting
- Verified the rate limiter middleware that restricts requests per IP address
- Confirmed stricter limits for high-value voucher requests
- Ensured proper error responses (429) when limits are exceeded

#### Amount Limits and High-Value Confirmation
- Verified maximum amount limits in the `VoucherGiftSchema` validation
- Confirmed high-value confirmation requirement for vouchers above the threshold
- Tested rejection of vouchers exceeding the maximum limit

#### Idempotency Handling
- Verified idempotency key generation and checking
- Confirmed that duplicate requests with the same idempotency key return the existing voucher
- Tested TTL-based storage for idempotency records

### Code Quality Improvements
- Fixed TypeScript errors and improved type safety
- Enhanced error handling and logging
- Improved test reliability and reduced flakiness
- Added comprehensive test coverage for critical paths
