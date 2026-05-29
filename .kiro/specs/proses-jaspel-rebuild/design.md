# Design Document: Proses Jaspel Rebuild

## Overview

This design document specifies the architecture and implementation approach for rebuilding the "Proses Jaspel" (Medical Service Incentive Processing) system. The system will manage INA-CBGs claim revenue pooling, cost analysis, remuneration configuration, and doctor performance-based remuneration calculation.

The system follows a modular architecture with clear separation between:
- **Data Layer**: Supabase PostgreSQL database with well-defined schemas
- **Business Logic Layer**: Server actions for calculations and data processing
- **Presentation Layer**: Next.js pages with React components

### Key Design Principles

1. **Database-First Approach**: Use Supabase MCP tools for all database operations
2. **Server Actions**: All data mutations and calculations happen server-side
3. **Type Safety**: Leverage TypeScript for compile-time safety
4. **Incremental Calculation**: Support step-by-step data entry and calculation
5. **Audit Trail**: Track all configuration changes and calculations
6. **Performance**: Optimize queries with proper indexing and pagination

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pooling    │  │   Analisis   │  │ Konfigurasi  │      │
│  │  Pendapatan  │  │    Biaya     │  │ Remunerasi   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pooling    │  │   Analysis   │  │ Remuneration │      │
│  │    Engine    │  │    Engine    │  │    Engine    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                        Data Layer                            │
│                    Supabase PostgreSQL                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  pooling_pendapatan  │  kategori_remunerasi         │   │
│  │  detail_biaya        │  indikator_remunerasi        │   │
│  │  penilaian_dokter    │  indeks_pengukuran           │   │
│  │  hasil_remunerasi    │  volume_aktivitas            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js Server Actions
- **Database**: Supabase PostgreSQL
- **Charts**: ApexCharts (already used in existing codebase)
- **Data Import/Export**: xlsx library for Excel operations

## Components and Interfaces

### 1. Pooling Pendapatan Component

**Purpose**: Manage INA-CBGs claim revenue data with period-based filtering and deficit/surplus tracking.

**Key Features**:
- Period selection (month/year)
- Specialization filtering
- Excel template download/upload
- Expandable detail view per doctor
- Edit/delete actions
- Automatic pooling calculation (17% of total claims)
- Deficit/surplus display

**Data Flow**:
```
User Input → Import Excel → Validate Data → Store in pooling_pendapatan
                                                    ↓
                                          Calculate Grouping
                                                    ↓
                                          Compare with Costs
                                                    ↓
                                          Calculate 17% Pool
```

**Server Actions**:
- `importPoolingData(file, periode, status)`: Import and validate Excel data
- `getPoolingData(periode, spesialisasi?)`: Fetch pooling data with filters
- `updatePoolingRecord(id, data)`: Update a single record
- `deletePoolingRecord(id)`: Delete a record
- `calculatePooling(periode)`: Calculate revenue pooling for period
- `downloadPoolingTemplate()`: Generate Excel template

### 2. Analisis Biaya Component

**Purpose**: Visualize cost analysis with charts and rankings.

**Key Features**:
- Claim vs Cost comparison chart
- Top 10 surplus doctors ranking
- Top 10 deficit doctors ranking
- Highest LOS doctors
- Top 10 surplus diagnoses
- Top 10 deficit diagnoses
- Period filtering

**Data Flow**:
```
pooling_pendapatan data → Aggregate by doctor/diagnosis
                                    ↓
                          Calculate surplus/deficit
                                    ↓
                          Rank and sort
                                    ↓
                          Generate chart data
```

**Server Actions**:
- `getAnalysisData(periode)`: Fetch aggregated analysis data
- `getDoctorRankings(periode, type)`: Get doctor rankings (surplus/deficit/LOS)
- `getDiagnosisRankings(periode, type)`: Get diagnosis rankings

### 3. Konfigurasi Remunerasi Component

**Purpose**: Configure performance categories, indicators, and measurement indices.

**Key Features**:
- Category management (e.g., P1 - Position)
- Indicator management (multiple per category)
- Index measurement configuration (multiple per indicator)
- Two measurement schemas:
  - **Index Schema**: Manual label and scale input
  - **Activity Schema**: Volume-based measurement
- Volume group definition (LOS, Actions, Consultations, Lab tests, etc.)

**Data Structure**:
```
Kategori (Category)
  ├── Indikator 1 (Indicator)
  │     ├── Indeks 1 (Index with schema)
  │     └── Indeks 2
  └── Indikator 2
        ├── Indeks 1
        └── Indeks 2
```

**Server Actions**:
- `createKategori(name)`: Create performance category
- `createIndikator(kategoriId, name)`: Create indicator
- `createIndeks(indikatorId, data)`: Create measurement index
- `createVolumeGroup(name, description)`: Create activity volume group
- `getKonfigurasiTree()`: Get full configuration hierarchy
- `updateKonfigurasi(id, type, data)`: Update configuration item
- `deleteKonfigurasi(id, type)`: Delete configuration item

### 4. Remunerasi Component

**Purpose**: Calculate doctor remuneration based on performance indices and revenue.

**Key Features**:
- Period selection from pooling data
- Doctor list with evaluation status
- Assessment template download/upload
- PIR (Performance Index Rate) calculation
- Final remuneration calculation
- Results persistence

**Calculation Formula**:
```
1. Total Index per Doctor = Σ(all index values for doctor)
2. PIR = Doctor Revenue / Doctor Total Index
3. Final Remuneration = PIR × Doctor Total Index
```

**Data Flow**:
```
Select Period → Load Doctors → Import Assessments
                                      ↓
                              Calculate Total Index
                                      ↓
                              Get Revenue from Pooling
                                      ↓
                              Calculate PIR
                                      ↓
                              Calculate Final Remuneration
                                      ↓
                              Store Results
```

**Server Actions**:
- `getRemunerasiPeriods()`: Get available periods from pooling
- `getDoctorsForPeriod(periode)`: Get doctors to evaluate
- `downloadAssessmentTemplate(periode)`: Generate assessment Excel
- `importAssessments(file, periode)`: Import performance scores
- `calculateRemuneration(periode)`: Calculate PIR and remuneration
- `getRemunerasiResults(periode)`: Fetch calculation results

## Data Models

### Database Schema

#### 1. pooling_pendapatan
Stores INA-CBGs claim revenue data per doctor.

```sql
CREATE TABLE pooling_pendapatan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periode_layanan DATE NOT NULL,
  status_klaim VARCHAR(20) NOT NULL CHECK (status_klaim IN ('regular', 'pending')),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  doctor_name VARCHAR(255) NOT NULL,
  spesialisasi VARCHAR(100) NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  rm_no VARCHAR(50) NOT NULL,
  diagnosis_grouper VARCHAR(100) NOT NULL,
  nilai_klaim_inacbgs DECIMAL(18,2) NOT NULL,
  jasa_sarana DECIMAL(18,2) NOT NULL,
  total_biaya DECIMAL(18,2) NOT NULL,
  deficit DECIMAL(18,2) DEFAULT 0,
  pooling_medis DECIMAL(18,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pooling_periode ON pooling_pendapatan(periode_layanan);
CREATE INDEX idx_pooling_doctor ON pooling_pendapatan(doctor_id);
CREATE INDEX idx_pooling_spesialisasi ON pooling_pendapatan(spesialisasi);
```

#### 2. detail_biaya
Stores detailed cost breakdown for each claim.

```sql
CREATE TABLE detail_biaya (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pooling_id UUID NOT NULL REFERENCES pooling_pendapatan(id) ON DELETE CASCADE,
  komponen_biaya VARCHAR(100) NOT NULL,
  nilai DECIMAL(18,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_detail_pooling ON detail_biaya(pooling_id);
```

#### 3. kategori_remunerasi
Stores performance categories (e.g., P1 - Position).

```sql
CREATE TABLE kategori_remunerasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(100) NOT NULL UNIQUE,
  deskripsi TEXT,
  urutan INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. indikator_remunerasi
Stores performance indicators within categories.

```sql
CREATE TABLE indikator_remunerasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kategori_id UUID NOT NULL REFERENCES kategori_remunerasi(id) ON DELETE CASCADE,
  nama VARCHAR(100) NOT NULL,
  deskripsi TEXT,
  urutan INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_indikator_kategori ON indikator_remunerasi(kategori_id);
```

#### 5. indeks_pengukuran
Stores measurement indices for indicators.

```sql
CREATE TABLE indeks_pengukuran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indikator_id UUID NOT NULL REFERENCES indikator_remunerasi(id) ON DELETE CASCADE,
  nama VARCHAR(100) NOT NULL,
  tipe_skema VARCHAR(20) NOT NULL CHECK (tipe_skema IN ('indeks', 'aktivitas')),
  
  -- For indeks schema
  label_pengukuran VARCHAR(100),
  skala_indeks DECIMAL(10,2),
  
  -- For aktivitas schema
  volume_group_id UUID REFERENCES volume_aktivitas(id),
  
  urutan INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_indeks_indikator ON indeks_pengukuran(indikator_id);
```

#### 6. volume_aktivitas
Stores activity volume group definitions.

```sql
CREATE TABLE volume_aktivitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(100) NOT NULL UNIQUE,
  deskripsi TEXT,
  satuan VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 7. penilaian_dokter
Stores performance assessments for doctors.

```sql
CREATE TABLE penilaian_dokter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periode_layanan DATE NOT NULL,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  indeks_id UUID NOT NULL REFERENCES indeks_pengukuran(id),
  nilai DECIMAL(18,2) NOT NULL,
  volume DECIMAL(18,2),
  catatan TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(periode_layanan, doctor_id, indeks_id)
);

CREATE INDEX idx_penilaian_periode ON penilaian_dokter(periode_layanan);
CREATE INDEX idx_penilaian_doctor ON penilaian_dokter(doctor_id);
```

#### 8. hasil_remunerasi
Stores calculated remuneration results.

```sql
CREATE TABLE hasil_remunerasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periode_layanan DATE NOT NULL,
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  doctor_name VARCHAR(255) NOT NULL,
  spesialisasi VARCHAR(100) NOT NULL,
  pendapatan_dokter DECIMAL(18,2) NOT NULL,
  total_indeks DECIMAL(18,2) NOT NULL,
  pir DECIMAL(18,6) NOT NULL,
  remunerasi_final DECIMAL(18,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(periode_layanan, doctor_id)
);

CREATE INDEX idx_hasil_periode ON hasil_remunerasi(periode_layanan);
CREATE INDEX idx_hasil_doctor ON hasil_remunerasi(doctor_id);
```

#### 9. audit_log_proses_jaspel
Stores audit trail for all operations.

```sql
CREATE TABLE audit_log_proses_jaspel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_table ON audit_log_proses_jaspel(table_name);
CREATE INDEX idx_audit_created ON audit_log_proses_jaspel(created_at);
```

### TypeScript Interfaces

```typescript
// Pooling Pendapatan
interface PoolingPendapatan {
  id: string;
  periode_layanan: Date;
  status_klaim: 'regular' | 'pending';
  doctor_id: string;
  doctor_name: string;
  spesialisasi: string;
  patient_name: string;
  rm_no: string;
  diagnosis_grouper: string;
  nilai_klaim_inacbgs: number;
  jasa_sarana: number;
  total_biaya: number;
  deficit: number;
  pooling_medis: number;
  detail_biaya?: DetailBiaya[];
}

interface DetailBiaya {
  id: string;
  pooling_id: string;
  komponen_biaya: string;
  nilai: number;
}

// Konfigurasi Remunerasi
interface KategoriRemunerasi {
  id: string;
  nama: string;
  deskripsi?: string;
  urutan: number;
  indikator?: IndikatorRemunerasi[];
}

interface IndikatorRemunerasi {
  id: string;
  kategori_id: string;
  nama: string;
  deskripsi?: string;
  urutan: number;
  indeks?: IndeksPengukuran[];
}

interface IndeksPengukuran {
  id: string;
  indikator_id: string;
  nama: string;
  tipe_skema: 'indeks' | 'aktivitas';
  label_pengukuran?: string;
  skala_indeks?: number;
  volume_group_id?: string;
  urutan: number;
}

interface VolumeAktivitas {
  id: string;
  nama: string;
  deskripsi?: string;
  satuan?: string;
}

// Penilaian & Hasil
interface PenilaianDokter {
  id: string;
  periode_layanan: Date;
  doctor_id: string;
  indeks_id: string;
  nilai: number;
  volume?: number;
  catatan?: string;
}

interface HasilRemunerasi {
  id: string;
  periode_layanan: Date;
  doctor_id: string;
  doctor_name: string;
  spesialisasi: string;
  pendapatan_dokter: number;
  total_indeks: number;
  pir: number;
  remunerasi_final: number;
  status: 'draft' | 'approved' | 'paid';
}

// Analysis Data
interface AnalysisData {
  periode: Date;
  totalKlaim: number;
  totalBiaya: number;
  doctorRankings: {
    surplus: DoctorRanking[];
    deficit: DoctorRanking[];
    highestLOS: DoctorRanking[];
  };
  diagnosisRankings: {
    surplus: DiagnosisRanking[];
    deficit: DiagnosisRanking[];
  };
}

interface DoctorRanking {
  doctor_name: string;
  spesialisasi: string;
  nilai_klaim: number;
  total_biaya: number;
  selisih: number;
  los_avg?: number;
}

interface DiagnosisRanking {
  diagnosis_grouper: string;
  jumlah_kasus: number;
  nilai_klaim: number;
  total_biaya: number;
  selisih: number;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Specialization Filtering Consistency
*For any* pooling pendapatan dataset and any specialization filter value, applying the filter should return only records matching that specialization, and the count should match the filtered subset.
**Validates: Requirements 2.1, 2.10**

### Property 2: Template Column Completeness
*For any* configuration state (pooling, assessment, or export), the generated Excel template should contain all required columns as defined by the current configuration.
**Validates: Requirements 2.2, 5.4, 6.1**

### Property 3: Import Data Persistence
*For any* valid import data with periode_layanan and status_klaim, after successful import, querying the database should return the same data with all fields intact.
**Validates: Requirements 2.3**

### Property 4: Display Field Completeness
*For any* pooling record, the display view should include all required fields: doctor, patient, diagnosis grouper, claim value, and facility service fee.
**Validates: Requirements 2.4**

### Property 5: Doctor Revenue Grouping
*For any* set of claims in a period, grouping by doctor should produce totals where each doctor's sum equals the sum of their individual claim values.
**Validates: Requirements 2.6**

### Property 6: Cost Calculation Accuracy
*For any* claim with detail_biaya records, the total_biaya should equal the sum of all cost component values.
**Validates: Requirements 2.7**

### Property 7: Deficit Calculation
*For any* claim record where nilai_klaim_inacbgs < total_biaya, the deficit field should equal (total_biaya - nilai_klaim_inacbgs).
**Validates: Requirements 2.8**

### Property 8: Medical Pooling Limit
*For any* doctor in a period, the pooling_medis value should never exceed 17% of their total claim value for that period.
**Validates: Requirements 2.9**

### Property 9: Ranking Correctness
*For any* dataset and ranking type (surplus, deficit, LOS, diagnosis), the top 10 results should be correctly sorted in descending order by the ranking criterion, and limited to 10 items.
**Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6**

### Property 10: Period Filter Consistency
*For any* period filter applied to analysis data, all charts and rankings should reflect only data from that period, with no data from other periods included.
**Validates: Requirements 3.7**

### Property 11: Configuration Hierarchy Integrity
*For any* category with indicators, and indicators with indices, creating or updating should preserve the foreign key relationships (kategori → indikator → indeks).
**Validates: Requirements 4.1, 4.2, 4.3, 4.8**

### Property 12: Schema Type Storage
*For any* indeks_pengukuran record, if tipe_skema is 'indeks', then label_pengukuran and skala_indeks should be non-null; if tipe_skema is 'aktivitas', then volume_group_id should be non-null.
**Validates: Requirements 4.4, 4.5**

### Property 13: Volume Group Persistence
*For any* volume group created with a unique name, querying by that name should return the same volume group with all fields intact.
**Validates: Requirements 4.6**

### Property 14: Configuration Validation
*For any* configuration save attempt with missing required fields, the validation should reject the save and return specific error messages.
**Validates: Requirements 4.7**

### Property 15: Doctor List Completeness
*For any* selected period, the doctor list should include all doctors who have pooling_pendapatan records for that period, with no duplicates.
**Validates: Requirements 5.2**

### Property 16: Assessment Template Completeness
*For any* konfigurasi remunerasi state, the assessment template should include columns for all configured indeks_pengukuran items.
**Validates: Requirements 5.4**

### Property 17: Assessment Data Persistence
*For any* valid assessment import, all performance scores should be stored in penilaian_dokter with correct doctor_id, indeks_id, and nilai mappings.
**Validates: Requirements 5.5**

### Property 18: Index Total Calculation
*For any* doctor in a period, the total_indeks should equal the sum of all nilai values from penilaian_dokter for that doctor and period.
**Validates: Requirements 5.6**

### Property 19: PIR Calculation Formula
*For any* doctor with non-zero total_indeks, PIR should equal pendapatan_dokter / total_indeks.
**Validates: Requirements 5.7**

### Property 20: Remuneration Calculation Formula
*For any* doctor with calculated PIR, remunerasi_final should equal PIR × total_indeks.
**Validates: Requirements 5.8**

### Property 21: Calculation Persistence
*For any* completed remuneration calculation, the saved hasil_remunerasi record should match the calculated values for pendapatan_dokter, total_indeks, pir, and remunerasi_final.
**Validates: Requirements 5.10**

### Property 22: Import Validation Rejection
*For any* import file with invalid periode_layanan format, invalid status_klaim value, or non-numeric values in numeric fields, the validation should reject the import and return specific error messages.
**Validates: Requirements 6.2, 9.1, 9.2, 9.3**

### Property 23: Import Success Count
*For any* successful import, the success message count should equal the number of records actually inserted into the database.
**Validates: Requirements 6.4**

### Property 24: Export Data Accuracy
*For any* filtered dataset, the exported Excel file should contain exactly the same records as the filtered view, with all field values matching.
**Validates: Requirements 6.5**

### Property 25: Table Sorting
*For any* data table with sorting applied, the results should be ordered according to the sort column and direction (ascending/descending).
**Validates: Requirements 8.2**

### Property 26: Form Validation
*For any* form submission with invalid inputs, the validation should reject the submission and display error messages indicating which fields are invalid.
**Validates: Requirements 8.5**

### Property 27: Non-Negative Claim Validation
*For any* pooling calculation, if any claim value is negative, the validation should reject the calculation and return an error.
**Validates: Requirements 9.4**

### Property 28: Error Logging
*For any* error that occurs during operations, an entry should be created in audit_log_proses_jaspel with error details.
**Validates: Requirements 9.8**

### Property 29: Pagination Limit
*For any* pooling data query with pagination, each page should contain at most 50 records.
**Validates: Requirements 10.1**

## Error Handling

### Validation Errors

**Import Validation**:
- Invalid date format → "Invalid date format in row {row}: {value}"
- Invalid status_klaim → "Invalid status in row {row}: must be 'regular' or 'pending'"
- Non-numeric value → "Invalid number in row {row}, column {column}: {value}"
- Missing required field → "Missing required field in row {row}: {field}"

**Calculation Validation**:
- Negative claim value → "Claim value cannot be negative: {value}"
- Zero total index → "Cannot calculate PIR: total index is zero for doctor {name}"
- Missing pooling data → "No pooling data found for period {period}"

**Configuration Validation**:
- Missing required field → "Required field missing: {field}"
- Duplicate name → "{entity} with name '{name}' already exists"
- Invalid foreign key → "Referenced {entity} not found: {id}"

### Database Errors

**Transaction Handling**:
- All multi-step operations (import, calculation) use database transactions
- On error, rollback all changes and return error message
- Log all database errors to audit_log_proses_jaspel

**Connection Errors**:
- Retry failed queries up to 3 times with exponential backoff
- If all retries fail, return user-friendly error message
- Log connection errors for monitoring

### User-Facing Error Messages

All error messages should:
- Be clear and actionable
- Include specific details (row numbers, field names, values)
- Suggest corrective actions when possible
- Avoid exposing internal system details

## Testing Strategy

### Dual Testing Approach

This system requires both **unit tests** and **property-based tests** for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples demonstrating correct behavior
- Edge cases (empty datasets, single records, boundary values)
- Error conditions (invalid inputs, missing data, constraint violations)
- Integration points between components

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Invariants that must be maintained
- Mathematical relationships between inputs and outputs

### Property-Based Testing Configuration

**Framework**: Use `fast-check` for TypeScript property-based testing

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: proses-jaspel-rebuild, Property {number}: {property_text}`
- Use custom generators for domain-specific data (dates, claim amounts, doctor records)

**Example Property Test Structure**:
```typescript
// Feature: proses-jaspel-rebuild, Property 8: Medical Pooling Limit
test('medical pooling never exceeds 17% of total claims', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(claimGenerator(), { minLength: 1, maxLength: 100 }),
      async (claims) => {
        const grouped = await groupClaimsByDoctor(claims);
        for (const doctor of grouped) {
          const totalClaims = doctor.claims.reduce((sum, c) => sum + c.nilai_klaim, 0);
          const maxPooling = totalClaims * 0.17;
          expect(doctor.pooling_medis).toBeLessThanOrEqual(maxPooling);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Examples

**Deficit Calculation**:
```typescript
test('calculates deficit when claim < cost', () => {
  const record = {
    nilai_klaim_inacbgs: 1000000,
    total_biaya: 1500000
  };
  const deficit = calculateDeficit(record);
  expect(deficit).toBe(500000);
});

test('deficit is zero when claim >= cost', () => {
  const record = {
    nilai_klaim_inacbgs: 2000000,
    total_biaya: 1500000
  };
  const deficit = calculateDeficit(record);
  expect(deficit).toBe(0);
});
```

**PIR Calculation**:
```typescript
test('calculates PIR correctly', () => {
  const pir = calculatePIR(1000000, 50);
  expect(pir).toBe(20000);
});

test('throws error when total index is zero', () => {
  expect(() => calculatePIR(1000000, 0)).toThrow('total index is zero');
});
```

### Test Data Generators

**Custom Generators for Property Tests**:
```typescript
// Generate valid pooling records
const poolingRecordGenerator = () => fc.record({
  periode_layanan: fc.date({ min: new Date('2024-01-01'), max: new Date('2026-12-31') }),
  status_klaim: fc.constantFrom('regular', 'pending'),
  doctor_name: fc.string({ minLength: 3, maxLength: 50 }),
  spesialisasi: fc.constantFrom('Bedah', 'Penyakit Dalam', 'Anak', 'Kandungan'),
  nilai_klaim_inacbgs: fc.float({ min: 100000, max: 50000000 }),
  total_biaya: fc.float({ min: 100000, max: 50000000 }),
});

// Generate configuration hierarchy
const konfigurasiGenerator = () => fc.record({
  kategori: fc.array(fc.record({
    nama: fc.string({ minLength: 2, maxLength: 20 }),
    indikator: fc.array(fc.record({
      nama: fc.string({ minLength: 3, maxLength: 50 }),
      indeks: fc.array(fc.record({
        nama: fc.string({ minLength: 3, maxLength: 50 }),
        tipe_skema: fc.constantFrom('indeks', 'aktivitas'),
        skala_indeks: fc.option(fc.float({ min: 0, max: 100 })),
      }), { minLength: 1, maxLength: 5 })
    }), { minLength: 1, maxLength: 5 })
  }), { minLength: 1, maxLength: 5 })
});
```

### Integration Testing

**Database Integration**:
- Test actual Supabase operations with test database
- Verify foreign key constraints
- Test transaction rollback on errors
- Verify indexes improve query performance

**Excel Import/Export**:
- Test with real Excel files
- Verify template generation
- Test various file formats (.xlsx, .xls)
- Test large file handling (1000+ rows)

### Test Coverage Goals

- **Unit Test Coverage**: Minimum 80% code coverage
- **Property Test Coverage**: All 29 correctness properties implemented
- **Integration Test Coverage**: All server actions tested with real database
- **Edge Case Coverage**: All validation rules tested with invalid inputs

