# Ligneous Frontend Documentation

Welcome to the Ligneous Frontend documentation. This directory contains all project documentation organized by category.

## 📚 Documentation Index

### Architecture
- [Architecture Overview](../docs/architecture/ARCHITECTURE.md) - Overall system architecture
- [Architecture Decision: Auth](../docs/architecture/ARCHITECTURE_DECISION_AUTH.md) - Authentication architecture decisions
- [Proxy API Architecture](../docs/architecture/PROXY_API_ARCHITECTURE_ANALYSIS.md) - API proxy pattern analysis
- [Access Control Model](../docs/architecture/ACCESS_CONTROL_MODEL.md) - Permission and access control system

### Implementation
- [Implementation Plan](../docs/implementation/IMPLEMENTATION_PLAN.md) - Overall implementation roadmap
- [Implementation Status](../docs/implementation/IMPLEMENTATION_STATUS.md) - Current implementation status
- [Next Steps](../docs/implementation/NEXT_STEPS.md) - Planned next steps
- [Project Status](../docs/implementation/PROJECT_STATUS.md) - Current project status

#### Database
- [Database Plan Summary](../docs/implementation/DATABASE_PLAN_SUMMARY.md) - Database planning overview
- [Database Schema Plan](../docs/implementation/DATABASE_SCHEMA_PLAN.md) - Schema design
- [Database Setup Complete](../docs/implementation/DATABASE_SETUP_COMPLETE.md) - Setup documentation
- [Schema Update Summary](../docs/implementation/SCHEMA_UPDATE_SUMMARY.md) - Schema changes
- [Schema Gap Analysis](../docs/implementation/SCHEMA_GAP_ANALYSIS.md) - Schema gaps and improvements

#### Mycelia Facets
- [All Facets Complete](../docs/implementation/ALL_FACETS_COMPLETE.md) - Facet implementation status
- [Facets Update Summary](../docs/implementation/FACETS_UPDATE_SUMMARY.md) - Facet updates
- [Go API Facet Implementation](../docs/implementation/GO_API_FACET_IMPLEMENTATION.md) - Go API facet details
- [Individuals Facet Fixes](../docs/implementation/INDIVIDUALS_FACET_FIXES.md) - Individuals facet fixes
- [Mycelia Facets Usage](../docs/implementation/MYCELIA_FACETS_USAGE.md) - How to use facets
- [Mycelia Usage Corrected](../docs/implementation/MYCELIA_USAGE_CORRECTED.md) - Corrected usage patterns

#### Features
- [Dashboard Implementation](../docs/implementation/DASHBOARD_IMPLEMENTATION.md) - Dashboard feature
- [Frontend Fix Complete](../docs/implementation/FRONTEND_FIX_COMPLETE.md) - Frontend fixes
- [Gateway Migration](../docs/implementation/GATEWAY_MIGRATION.md) - API gateway migration
- [Go API Individual Storage](../docs/implementation/GO_API_INDIVIDUAL_STORAGE.md) - Individual data storage
- [New Features Summary](../docs/implementation/NEW_FEATURES_SUMMARY.md) - New features overview
- [Permission Logic](../docs/implementation/PERMISSION_LOGIC.md) - Permission system logic
- [Permission Rule](../docs/implementation/PERMISSION_RULE.md) - Permission rules
- [Owner vs Maintainer](../docs/implementation/OWNER_VS_MAINTAINER.md) - Ownership model
- [Superuser Analysis](../docs/implementation/SUPERUSER_AND_MULTIPLE_OWNERS_ANALYSIS.md) - Superuser system
- [Superuser Implementation](../docs/implementation/SUPERUSER_IMPLEMENTATION_SUMMARY.md) - Superuser implementation
- [Prisma 7 Fix](../docs/implementation/PRISMA_7_FIX_SUMMARY.md) - Prisma 7 migration

### Features

#### Search
- [Search and Statistics Analysis](../docs/features/search/SEARCH_AND_STATISTICS_ANALYSIS.md) - Search functionality analysis
- [Endpoint Implementation Locations](../docs/features/search/ENDPOINT_IMPLEMENTATION_LOCATIONS.md) - Search endpoint locations

#### Family Tree
- [Pedigree Layout Analysis](../docs/features/family-tree/PEDIGREE_LAYOUT_ANALYSIS.md) - Pedigree chart layout algorithm

#### Upload
- [Upload Dashboard Implementation](../docs/features/upload/UPLOAD_DASHBOARD_IMPLEMENTATION.md) - Upload feature implementation

### Testing
- [Testing Guide](../docs/testing/TESTING.md) - Testing documentation
- [All Integration Tests Complete](../docs/testing/ALL_INTEGRATION_TESTS_COMPLETE.md) - Integration test status
- [Graph Testing Complete](../docs/testing/GRAPH_TESTING_COMPLETE.md) - Graph tests
- [Duplicates Testing Complete](../docs/testing/DUPLICATES_TESTING_COMPLETE.md) - Duplicate detection tests
- [Families Testing Complete](../docs/testing/FAMILIES_TESTING_COMPLETE.md) - Family tests

### API
- [API Response Structures](../docs/api/API_RESPONSE_STRUCTURES.md) - API response format documentation
- [API Endpoint Analysis](../docs/api/API_ENDPOINT_ANALYSIS.md) - Endpoint analysis
- [TNG Feature Requirements](../docs/api/TNG_FEATURE_REQUIREMENTS.md) - TNG feature mapping

## 🚀 Quick Links

- [Setup Guide](../SETUP.md) - Getting started
- [Main README](../README.md) - Project overview
- [Refactoring Analysis](../REFACTORING_ANALYSIS.md) - Codebase refactoring suggestions

## 📝 Documentation Guidelines

When adding new documentation:

1. **Architecture decisions** → `docs/architecture/`
2. **Implementation status/plans** → `docs/implementation/`
3. **Feature-specific docs** → `docs/features/{feature-name}/`
4. **Testing docs** → `docs/testing/`
5. **API documentation** → `docs/api/`

Keep the root directory clean - only essential files like `README.md` and `SETUP.md` should remain in the root.

