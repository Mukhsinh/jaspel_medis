# Implementation Plan: Proses Jaspel Rebuild

## Overview

This implementation plan breaks down the Proses Jaspel rebuild into discrete, incremental tasks. Each task builds on previous work and includes testing to validate functionality early. The plan follows a bottom-up approach: database schema → business logic → UI components → integration.

## Tasks

- [x] 1. Database Schema Setup
  - Create all 9 database tables using Supabase MCP tools
  - Set up foreign key relationships and constraints
  - Create indexes for performance optimization
  - Add RLS policies for security
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

- [ ]* 1.1 Write property test for database schema integrity
  - **Property 11: Configuration Hierarchy Integrity**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.8**

- [x] 2. Cleanup Old Proses Jaspel Structure
  - Remove existing proses jaspel submenu pages and components
  - Drop old database tables related to proses jaspel
  - Update navigation/routing to remove old menu items
  - _Requirements: 1.1, 1.2_

- [x] 3. Implement Konfigurasi Remunerasi Backend
  - [x] 3.1 Create server actions for kategori CRUD operations
    - Implement createKategori, updateKategori, deleteKategori
    - Implement getKonfigurasiTree for hierarchical data
    - _Requirements: 4.1_

  - [ ]* 3.2 Write property test for kategori operations
    - **Property 11: Configuration Hierarchy Integrity**
    - **Validates: Requirements 4.1**

  - [x] 3.3 Create server actions for indikator CRUD operations
    - Implement createIndikator, updateIndikator, deleteIndikator
    - Ensure foreign key relationships with kategori
    - _Requirements: 4.2_

  - [ ]* 3.4 Write property test for indikator operations
    - **Property 11: Configuration Hierarchy Integrity**
    - **Validates: Requirements 4.2**

  - [x] 3.5 Create server actions for indeks CRUD operations
    - Implement createIndeks, updateIndeks, deleteIndeks
    - Support both 'indeks' and 'aktivitas' schema types
    - _Requirements: 4.3, 4.4, 4.5_

  - [ ]* 3.6 Write property test for indeks schema storage
    - **Property 12: Schema Type Storage**
    - **Validates: Requirements 4.4, 4.5**

  - [x] 3.7 Create server actions for volume aktivitas operations
    - Implement createVolumeGroup, updateVolumeGroup, deleteVolumeGroup
    - _Requirements: 4.6_

  - [ ]* 3.8 Write property test for volume group persistence
    - **Property 13: Volume Group Persistence**
    - **Validates: Requirements 4.6**

  - [x] 3.9 Implement configuration validation logic
    - Validate required fields before save
    - Return specific error messages for validation failures
    - _Requirements: 4.7_

  - [ ]* 3.10 Write property test for configuration validation
    - **Property 14: Configuration Validation**
    - **Validates: Requirements 4.7**

- [x] 4. Implement Konfigurasi Remunerasi UI
  - [x] 4.1 Create konfigurasi-remunerasi page component
    - Build hierarchical tree view for kategori → indikator → indeks
    - Add create/edit/delete buttons for each level
    - Implement modal forms for data entry
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 4.2 Implement schema type selection UI
    - Add radio buttons for 'indeks' vs 'aktivitas' schema
    - Show/hide fields based on schema type
    - Implement volume group dropdown for aktivitas schema
    - _Requirements: 4.4, 4.5, 4.6_

  - [x] 4.3 Add form validation and error display
    - Show validation errors inline
    - Disable save button until form is valid
    - _Requirements: 4.7_

- [x] 5. Checkpoint - Konfigurasi Remunerasi Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Pooling Pendapatan Backend
  - [x] 6.1 Create Excel template generation function
    - Generate template with required columns, dapat menggunakan template pooling pendapatan pada folder public
    - Add data validation rules to Excel cells
    - _Requirements: 2.2, 6.1_

  - [ ]* 6.2 Write property test for template completeness
    - **Property 2: Template Column Completeness**
    - **Validates: Requirements 2.2, 6.1**

  - [x] 6.3 Create Excel import validation function
    - Validate file format and required columns
    - Validate periode_layanan date format
    - Validate status_klaim values ('regular' or 'pending')
    - Validate numeric fields
    - Return specific error messages with row numbers
    - _Requirements: 6.2, 9.1, 9.2, 9.3_

  - [ ]* 6.4 Write property test for import validation
    - **Property 22: Import Validation Rejection**
    - **Validates: Requirements 6.2, 9.1, 9.2, 9.3**

  - [x] 6.5 Create server action for importing pooling data
    - Parse Excel file
    - Validate data using validation function
    - Insert records into pooling_pendapatan table
    - Insert detail_biaya records if provided
    - Return success count or error messages
    - _Requirements: 2.3, 6.3, 6.4_

  - [ ]* 6.6 Write property test for import persistence
    - **Property 3: Import Data Persistence**
    - **Validates: Requirements 2.3**

  - [ ]* 6.7 Write property test for import success count
    - **Property 23: Import Success Count**
    - **Validates: Requirements 6.4**

  - [x] 6.8 Create server action for pooling calculation
    - Group claims by doctor and period
    - Calculate total claims per doctor
    - Calculate 17% medical pooling
    - Calculate deficit where claim < cost
    - Update pooling_medis and deficit fields
    - _Requirements: 2.6, 2.8, 2.9, 9.4_

  - [ ]* 6.9 Write property test for doctor grouping
    - **Property 5: Doctor Revenue Grouping**
    - **Validates: Requirements 2.6**

  - [ ]* 6.10 Write property test for deficit calculation
    - **Property 7: Deficit Calculation**
    - **Validates: Requirements 2.8**

  - [ ]* 6.11 Write property test for medical pooling limit
    - **Property 8: Medical Pooling Limit**
    - **Validates: Requirements 2.9**

  - [ ]* 6.12 Write property test for non-negative validation
    - **Property 27: Non-Negative Claim Validation**
    - **Validates: Requirements 9.4**

  - [x] 6.13 Create server action for cost calculation
    - Sum all detail_biaya records for each pooling record
    - Update total_biaya field
    - _Requirements: 2.7_

  - [ ]* 6.14 Write property test for cost calculation
    - **Property 6: Cost Calculation Accuracy**
    - **Validates: Requirements 2.7**

  - [x] 6.15 Create server actions for data retrieval
    - getPoolingData(periode, spesialisasi?) with filtering
    - getPoolingRecord(id) for detail view
    - Implement pagination (50 records per page)
    - _Requirements: 2.1, 2.10, 10.1_

  - [ ]* 6.16 Write property test for specialization filtering
    - **Property 1: Specialization Filtering Consistency**
    - **Validates: Requirements 2.1, 2.10**

  - [ ]* 6.17 Write property test for pagination
    - **Property 29: Pagination Limit**
    - **Validates: Requirements 10.1**

  - [x] 6.18 Create server actions for CRUD operations
    - updatePoolingRecord(id, data)
    - deletePoolingRecord(id)
    - _Requirements: 2.5_

  - [x] 6.19 Create Excel export function
    - Export filtered pooling data to Excel
    - Include all fields and detail_biaya
    - _Requirements: 6.5_

  - [ ]* 6.20 Write property test for export accuracy
    - **Property 24: Export Data Accuracy**
    - **Validates: Requirements 6.5**

- [x] 7. Implement Pooling Pendapatan UI
  - [x] 7.1 Create pooling-pendapatan page component
    - Add period selector (month/year)
    - Add specialization filter dropdown
    - Display data table with pagination
    - _Requirements: 2.1, 2.10_

  - [x] 7.2 Implement template download button
    - Trigger downloadPoolingTemplate action
    - Download Excel file to user's computer
    - _Requirements: 2.2_

  - [x] 7.3 Implement import functionality
    - Add file upload button
    - Show upload progress
    - Display success message with count or error messages
    - _Requirements: 2.3, 6.3, 6.4_

  - [x] 7.4 Implement expandable detail view
    - Add expand/collapse button per row
    - Show all required fields when expanded
    - Display detail_biaya breakdown if available
    - _Requirements: 2.4, 2.7_

  - [ ]* 7.5 Write property test for display completeness
    - **Property 4: Display Field Completeness**
    - **Validates: Requirements 2.4**

  - [x] 7.6 Implement edit and delete actions
    - Add action buttons in each row
    - Show edit modal with form
    - Confirm before delete
    - _Requirements: 2.5_

  - [x] 7.7 Display deficit column
    - Show deficit value when claim < cost
    - Highlight deficit rows in red
    - _Requirements: 2.8_

  - [x] 7.8 Display pooling calculation results
    - Show 17% medical pooling per doctor
    - Display summary statistics
    - _Requirements: 2.9_

- [x] 8. Checkpoint - Pooling Pendapatan Complete
  - Ensure all tests pass, ask the user if questions arise.

- [-] 9. Implement Analisis Biaya Backend
  - [x] 9.1 Create server action for analysis data aggregation
    - Aggregate claims vs costs by period
    - Calculate surplus/deficit per doctor
    - Calculate surplus/deficit per diagnosis
    - Calculate average LOS per doctor
    - _Requirements: 3.1_

  - [x] 9.2 Create server action for doctor rankings
    - Rank doctors by surplus (top 10)
    - Rank doctors by deficit (top 10)
    - Rank doctors by LOS (highest)
    - _Requirements: 3.2, 3.3, 3.4_

  - [ ]* 9.3 Write property test for ranking correctness
    - **Property 9: Ranking Correctness**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6**

  - [x] 9.4 Create server action for diagnosis rankings
    - Rank diagnoses by surplus (top 10)
    - Rank diagnoses by deficit (top 10)
    - _Requirements: 3.5, 3.6_

  - [x] 9.5 Implement period filtering for analysis
    - Filter all analysis data by selected period
    - _Requirements: 3.7_

  - [ ]* 9.6 Write property test for period filter consistency
    - **Property 10: Period Filter Consistency**
    - **Validates: Requirements 3.7**

- [x] 10. Implement Analisis Biaya UI
  - [x] 10.1 Create analisis-biaya page component
    - Add period selector
    - Create layout for charts and rankings
    - _Requirements: 3.1, 3.7_

  - [x] 10.2 Implement claim vs cost comparison chart
    - Use ApexCharts for visualization
    - Show claim value vs total costs
    - _Requirements: 3.1_

  - [x] 10.3 Implement doctor ranking displays
    - Create cards for top 10 surplus doctors
    - Create cards for top 10 deficit doctors
    - Create cards for highest LOS doctors
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 10.4 Implement diagnosis ranking displays
    - Create cards for top 10 surplus diagnoses
    - Create cards for top 10 deficit diagnoses
    - _Requirements: 3.5, 3.6_

- [x] 11. Checkpoint - Analisis Biaya Complete

- [x] 12. Implement Remunerasi Backend
  - [x] 12.1 Create server action to get available periods
    - Query distinct periods from pooling_pendapatan
    - Return list of periods with doctor counts
    - _Requirements: 5.1_

  - [x] 12.2 Create server action to get doctors for period
    - Query doctors from pooling_pendapatan for selected period
    - Include doctor name, specialization, and revenue
    - _Requirements: 5.2_

  - [ ]* 12.3 Write property test for doctor list completeness
    - **Property 15: Doctor List Completeness**
    - **Validates: Requirements 5.2**

  - [x] 12.4 Create assessment template generation function
    - Generate Excel template based on konfigurasi_remunerasi
    - Include columns for all indeks_pengukuran items
    - Add doctor list and period info
    - _Requirements: 5.4_

  - [ ]* 12.5 Write property test for assessment template
    - **Property 16: Assessment Template Completeness**
    - **Validates: Requirements 5.4**

  - [x] 12.6 Create server action for importing assessments
    - Parse Excel file with performance scores
    - Validate data (doctor_id, indeks_id, nilai)
    - Insert into penilaian_dokter table
    - _Requirements: 5.5_

  - [ ]* 12.7 Write property test for assessment persistence
    - **Property 17: Assessment Data Persistence**
    - **Validates: Requirements 5.5**

  - [x] 12.8 Create server action for remuneration calculation
    - Calculate total_indeks per doctor (sum of all nilai)
    - Get pendapatan_dokter from pooling data
    - Calculate PIR = pendapatan_dokter / total_indeks
    - Calculate remunerasi_final = PIR × total_indeks
    - Insert results into hasil_remunerasi table
    - _Requirements: 5.6, 5.7, 5.8, 5.10_

  - [ ]* 12.9 Write property test for index total calculation
    - **Property 18: Index Total Calculation**
    - **Validates: Requirements 5.6**

  - [ ]* 12.10 Write property test for PIR calculation
    - **Property 19: PIR Calculation Formula**
    - **Validates: Requirements 5.7**

  - [ ]* 12.11 Write property test for remuneration calculation
    - **Property 20: Remuneration Calculation Formula**
    - **Validates: Requirements 5.8**

  - [ ]* 12.12 Write property test for calculation persistence
    - **Property 21: Calculation Persistence**
    - **Validates: Requirements 5.10**

  - [x] 12.13 Create server action to get remuneration results
    - Query hasil_remunerasi for period
    - Include all calculation details
    - _Requirements: 5.9_

- [x] 13. Implement Remunerasi UI
  - [x] 13.1 Create remunerasi page component
    - Add period selector dropdown
    - Display doctor list for selected period
    - _Requirements: 5.1, 5.2_

  - [x] 13.2 Implement action buttons per doctor
    - Add "nilai" (evaluate) button
    - Add "edit" button
    - _Requirements: 5.3_

  - [x] 13.3 Implement assessment template download
    - Trigger downloadAssessmentTemplate action
    - Download Excel file
    - _Requirements: 5.4_

  - [x] 13.4 Implement assessment import
    - Add file upload button
    - Show upload progress
    - Display success or error messages
    - _Requirements: 5.5_

  - [x] 13.5 Implement calculate button
    - Trigger calculateRemuneration action
    - Show calculation progress
    - Display results after completion
    - _Requirements: 5.6, 5.7, 5.8_

  - [x] 13.6 Display remuneration results
    - Show table with all doctors
    - Display pendapatan, total_indeks, PIR, remunerasi_final
    - Add status indicator (draft/approved/paid)
    - _Requirements: 5.9_

- [x] 14. Checkpoint - Remunerasi Complete

- [-] 15. Implement Navigation and Menu Structure
  - [x] 15.1 Update sidebar navigation
    - Add "Proses Jaspel" menu item
    - Add 4 submenu items (Pooling, Analisis, Konfigurasi, Remunerasi)
    - _Requirements: 8.1_

  - [x] 15.2 Implement breadcrumb navigation
    - Show current location in hierarchy
    - Enable navigation via breadcrumbs
    - _Requirements: 8.1_

- [-] 16. Implement Common UI Features
  - [x] 16.1 Add table sorting functionality
    - Implement sort by column
    - Support ascending/descending order
    - _Requirements: 8.2_

  - [ ]* 16.2 Write property test for table sorting
    - **Property 25: Table Sorting**
    - **Validates: Requirements 8.2**

  - [x] 16.3 Add loading indicators
    - Show spinner during data fetch
    - Show progress bar during imports
    - _Requirements: 8.3_

  - [x] 16.4 Add success/error notifications
    - Use toast notifications for feedback
    - Show success messages after operations
    - Show error messages with details
    - _Requirements: 8.4, 9.6_

  - [ ]* 16.5 Write property test for error messages
    - **Property 26: Form Validation**
    - **Validates: Requirements 8.5**

- [x] 17. Implement Error Logging and Audit Trail
  - [x] 17.1 Create audit logging function
    - Log all CRUD operations
    - Log all calculations
    - Log all imports/exports
    - Store in audit_log_proses_jaspel table
    - _Requirements: 9.8_

  - [ ]* 17.2 Write property test for error logging
    - **Property 28: Error Logging**
    - **Validates: Requirements 9.8**

  - [x] 17.3 Implement error logging middleware
    - Catch all errors in server actions
    - Log error details
    - Return user-friendly error messages
    - _Requirements: 9.6, 9.7_

- [ ] 18. Final Integration and Testing
  - [ ] 18.1 Test complete workflow end-to-end
    - Create konfigurasi remunerasi
    - Import pooling data
    - View analisis biaya
    - Calculate remunerasi
    - Verify all data flows correctly

  - [ ] 18.2 Test error scenarios
    - Test invalid imports
    - Test missing data
    - Test constraint violations
    - Verify error messages are clear

  - [ ] 18.3 Test performance with large datasets
    - Import 1000+ pooling records
    - Test pagination performance
    - Test calculation performance with 500 doctors
    - Verify queries complete within acceptable time

  - [ ] 18.4 Verify all property tests pass
    - Run full test suite
    - Ensure 100 iterations per property test
    - Fix any failing tests

- [ ] 19. Final Checkpoint - Complete System
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All database operations use Supabase MCP tools
- Excel operations use xlsx library
- Charts use ApexCharts (already in codebase)

