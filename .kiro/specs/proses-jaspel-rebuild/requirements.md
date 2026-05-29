# Requirements Document

## Introduction

This document specifies the requirements for rebuilding the "Proses Jaspel" (Medical Service Incentive Processing) menu system. The system will manage revenue pooling from INA-CBGs claims, analyze costs versus claims, configure remuneration criteria, and calculate doctor remuneration based on performance indicators.

## Glossary

- **System**: The Proses Jaspel application module
- **INA-CBGs**: Indonesian Case Base Groups - the national health insurance claim system
- **Pooling_Engine**: Component that calculates revenue distribution pools
- **Remuneration_Calculator**: Component that calculates doctor remuneration based on performance indices
- **PIR**: Performance Index Rate - the rate used to calculate remuneration
- **LOS**: Length of Stay - duration of patient hospitalization
- **Deficit**: Negative difference when total costs exceed claim value
- **Surplus**: Positive difference when claim value exceeds total costs
- **Spesialisasi**: Medical specialization category
- **Periode_Layanan**: Service period for claims (month and year)
- **Status_Klaim**: Claim status (regular or pending)
- **Kategori**: Performance category as defined by Ministry of Health
- **Indikator**: Performance indicator within a category
- **Indeks**: Measurement index for an indicator
- **Volume_Aktivitas**: Activity volume used for performance measurement

## Requirements

### Requirement 1: Database Cleanup

**User Story:** As a system administrator, I want to remove all existing proses jaspel submenus and related database tables, so that I can start with a clean foundation for the new system.

#### Acceptance Criteria

1. WHEN the cleanup process is initiated, THE System SHALL remove all existing submenu pages under proses jaspel
2. WHEN database cleanup is executed, THE System SHALL drop all tables related to the old proses jaspel structure
3. WHEN cleanup is complete, THE System SHALL verify no orphaned data remains in the database
4. IF any cleanup operation fails, THEN THE System SHALL rollback all changes and report the error

### Requirement 2: Pooling Pendapatan Submenu

**User Story:** As a finance officer, I want to manage INA-CBGs claim revenue data per doctor, so that I can track revenue pooling and identify deficits or surpluses.

#### Acceptance Criteria

1. WHEN viewing the pooling pendapatan page, THE System SHALL display claim revenue data filterable by specialization
2. WHEN a user clicks download template, THE System SHALL generate an Excel template with required columns
3. WHEN a user imports data, THE System SHALL validate and store the data with periode_layanan and status_klaim
4. WHEN displaying imported data, THE System SHALL show expandable preview with detail per doctor, patient, diagnosis grouper, claim value, and facility service fee
5. WHEN data is expanded, THE System SHALL provide edit and delete actions for each record
6. WHEN calculating pooling, THE System SHALL group INA-CBGs claim revenue per doctor for the period
7. WHEN comparing costs, THE System SHALL calculate total costs and display detailed cost breakdown as an optional view
8. WHEN deficit exists, THE System SHALL display a deficit column showing the negative difference (claim < total cost)
9. WHEN calculating medical pooling, THE System SHALL allocate maximum 17% of total claims per period per doctor
10. WHEN filtering by specialization, THE System SHALL update both detail data and pooling calculations accordingly

### Requirement 3: Analisis Biaya Submenu

**User Story:** As a financial analyst, I want to visualize cost analysis from pooling data, so that I can identify performance patterns and problem areas.

#### Acceptance Criteria

1. WHEN viewing the analisis biaya page, THE System SHALL display a comparison chart of claim value versus total costs
2. WHEN ranking doctors, THE System SHALL display top 10 doctors with highest surplus
3. WHEN ranking doctors, THE System SHALL display top 10 doctors with highest deficit
4. WHEN analyzing LOS, THE System SHALL display doctors with highest Length of Stay
5. WHEN analyzing diagnoses, THE System SHALL display top 10 diagnoses generating highest surplus
6. WHEN analyzing diagnoses, THE System SHALL display top 10 diagnoses with highest deficit
7. WHEN data is filtered by period, THE System SHALL update all charts and rankings accordingly

### Requirement 4: Konfigurasi Remunerasi Submenu

**User Story:** As a remuneration administrator, I want to configure performance categories and measurement criteria, so that I can establish a fair evaluation framework based on Ministry of Health standards.

#### Acceptance Criteria

1. WHEN creating a category, THE System SHALL allow manual input of category name (e.g., P1 for position)
2. WHEN a category exists, THE System SHALL allow adding multiple indicators to that category
3. WHEN an indicator exists, THE System SHALL allow adding multiple measurement indices to that indicator
4. WHEN configuring index measurement, THE System SHALL support index schema with manual label and scale input
5. WHEN configuring activity measurement, THE System SHALL support activity schema using activity volumes
6. WHEN defining activity volumes, THE System SHALL allow manual input of volume groups (e.g., LOS Volume, Action Volume, Consultation Visit Volume, Laboratory Examination Volume)
7. WHEN saving configuration, THE System SHALL validate that all required fields are completed
8. WHEN editing configuration, THE System SHALL preserve relationships between categories, indicators, and indices

### Requirement 5: Remunerasi Submenu

**User Story:** As a remuneration officer, I want to calculate doctor remuneration based on performance indices, so that I can fairly distribute revenue according to individual contributions.

#### Acceptance Criteria

1. WHEN starting remuneration calculation, THE System SHALL allow selection of a period from pooling pendapatan data
2. WHEN a period is selected, THE System SHALL display a list of doctors to be evaluated
3. WHEN viewing doctor list, THE System SHALL provide "nilai" (evaluate) and "edit" action buttons per doctor
4. WHEN downloading assessment template, THE System SHALL generate a template based on konfigurasi remunerasi settings
5. WHEN importing assessment data, THE System SHALL validate and store performance scores per doctor
6. WHEN clicking calculate, THE System SHALL generate total nominal index value per doctor
7. WHEN calculating PIR, THE System SHALL divide doctor revenue by doctor total index (PIR = Revenue / Total Index)
8. WHEN calculating final remuneration, THE System SHALL multiply PIR by each doctor's total index value
9. WHEN calculation is complete, THE System SHALL display remuneration amount per doctor
10. WHEN saving results, THE System SHALL persist all calculations for audit and reporting purposes

### Requirement 6: Data Import and Export

**User Story:** As a data entry operator, I want to import and export data using Excel templates, so that I can efficiently manage large datasets.

#### Acceptance Criteria

1. WHEN downloading a template, THE System SHALL generate an Excel file with proper column headers and data validation
2. WHEN importing data, THE System SHALL validate file format and required columns
3. WHEN import validation fails, THE System SHALL display specific error messages indicating which rows have issues
4. WHEN import succeeds, THE System SHALL display a success message with count of imported records
5. WHEN exporting data, THE System SHALL generate an Excel file with current filtered data

### Requirement 7: Database Schema

**User Story:** As a system architect, I want a well-structured database schema, so that the system can efficiently store and retrieve proses jaspel data.

#### Acceptance Criteria

1. THE System SHALL create a pooling_pendapatan table with columns for doctor, patient, diagnosis, claim value, costs, period, and status
2. THE System SHALL create a kategori_remunerasi table for performance categories
3. THE System SHALL create an indikator_remunerasi table linked to categories
4. THE System SHALL create an indeks_pengukuran table linked to indicators
5. THE System SHALL create a volume_aktivitas table for activity volume definitions
6. THE System SHALL create a penilaian_dokter table for doctor performance assessments
7. THE System SHALL create a hasil_remunerasi table for calculated remuneration results
8. THE System SHALL establish proper foreign key relationships between all tables
9. THE System SHALL create appropriate indexes for performance optimization
10. THE System SHALL use Supabase MCP tools for all database operations

### Requirement 8: User Interface

**User Story:** As a user, I want an intuitive interface with consistent design, so that I can efficiently navigate and use the system.

#### Acceptance Criteria

1. WHEN navigating menus, THE System SHALL display a clear hierarchical structure under "Proses Jaspel"
2. WHEN viewing data tables, THE System SHALL provide sorting, filtering, and pagination capabilities
3. WHEN performing actions, THE System SHALL display loading indicators during processing
4. WHEN operations complete, THE System SHALL show success or error notifications
5. WHEN forms are displayed, THE System SHALL validate inputs and show clear error messages
6. THE System SHALL use consistent styling with existing application components
7. THE System SHALL be responsive and work on different screen sizes

### Requirement 9: Data Validation and Error Handling

**User Story:** As a system user, I want the system to validate my inputs and handle errors gracefully, so that I can trust the data integrity.

#### Acceptance Criteria

1. WHEN importing data, THE System SHALL validate that periode_layanan is in valid date format
2. WHEN importing data, THE System SHALL validate that status_klaim is either "regular" or "pending"
3. WHEN importing data, THE System SHALL validate that numeric fields contain valid numbers
4. WHEN calculating pooling, THE System SHALL validate that claim values are non-negative
5. WHEN calculating remuneration, THE System SHALL validate that total index is not zero before division
6. IF validation fails, THEN THE System SHALL display specific error messages
7. IF database operations fail, THEN THE System SHALL rollback transactions and report errors
8. WHEN errors occur, THE System SHALL log error details for troubleshooting

### Requirement 10: Performance and Scalability

**User Story:** As a system administrator, I want the system to perform efficiently with large datasets, so that users have a responsive experience.

#### Acceptance Criteria

1. WHEN loading pooling data, THE System SHALL paginate results to display maximum 50 records per page
2. WHEN filtering data, THE System SHALL execute queries within 2 seconds for datasets up to 10,000 records
3. WHEN calculating remuneration, THE System SHALL process up to 500 doctors within 10 seconds
4. WHEN generating reports, THE System SHALL use database aggregation rather than client-side processing
5. THE System SHALL implement proper database indexing on frequently queried columns
