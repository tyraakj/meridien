# 🌊 Meridien

### _Blockchain-Based Blue Carbon Registry & Plot-Verified MRV System_

[![CI & Quality Checks](https://github.com/tyraakj/meridien/actions/workflows/ci.yml/badge.svg?branch=dev)](https://github.com/tyraakj/meridien/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Theme: Clean & Green Tech](https://img.shields.io/badge/SIH%202026-Clean%20%26%20Green%20Technology-10B981)](https://www.sih.gov.in/)
[![Author: tyraakj](https://img.shields.io/badge/Author-tyraakj-008DDA)](https://github.com/tyraakj)

---

## 📌 Hackathon Metadata

- **Hackathon:** Smart India Hackathon 2026
- **Problem Statement ID:** SIH26038 — _Blockchain-Based Blue Carbon Registry and MRV System_
- **Team Name:** Git Push Pray
- **Team ID:** SIH2601
- **Primary Stakeholders:** Ministry of Earth Sciences (MoES), National Centre for Coastal Research (NCCR), Coastal Panchayats, Restoration NGOs, Carbon Project Developers, and Institutional Credit Buyers.

---

## 📖 Table of Contents

1. [Executive Summary](#-executive-summary)
2. [The Core Problem](#-the-core-problem)
3. [The Meridien Solution](#-the-meridien-solution)
4. [5-Stage Architecture Pipeline](#-5-stage-architecture-pipeline)
5. [Tech Stack Breakdown](#-tech-stack-breakdown)
6. [Repository Structure](#-repository-structure)
7. [Smart Contract & Tokenomics Model](#-smart-contract--tokenomics-model)
8. [Local Development Setup](#-local-development-setup)
9. [Running Test Suites](#-running-test-suites)
10. [API Reference Surface](#-api-reference-surface)
11. [Governance & Code Ownership](#-governance--code-ownership)

---

## 🌊 Executive Summary

India has over **7,500 km of coastline** with vast mangrove habitats (_Sundarbans, Pichavaram, Bhitarkanika, Gulf of Khambhat_) that sequester up to **10× more carbon per hectare** than terrestrial forests.

**Meridien** is an offline-first Progressive Web Application (PWA) and decentralized registry that turns coastal field restoration data into tamper-proof, plot-verified blue carbon credits. By combining **IndexedDB offline boundary capture**, **PostGIS spatial integrity validation**, **IPFS cryptographic audit bundles**, and **Solidity multi-sig settlement smart contracts**, Meridien provides end-to-end transparency for regulators (MoES/NCCR) and carbon buyers.

---

## 🛑 The Core Problem

1. **Zero-Connectivity Ground Truth Deficit:** Field teams operate in remote coastal mudflats with zero cellular coverage. Data is either recorded on paper or lost, creating large baseline gaps.
2. **Double Counting & Boundary Disputes:** Lack of centralized spatial validation allows overlapping boundary claims across NGOs and forest departments.
3. **Greenwashing & Low-Credibility Credits:** Traditional carbon registries lack transparent, plot-level provenance linking minted credits to cryptographic, immutable field audits.
4. **Regulator Blind Spots:** MoES and NCCR lack real-time visibility into project boundaries, biometric canopy data, and multi-agency verification pipelines.

---

## 💡 The Meridien Solution

- 📱 **Offline-First PWA:** Native-feeling Web App with Service Worker, IndexedDB caching, GPS boundary walking, EXIF geo-tagged photo capture, and automated sync queue with background reconciliation.
- 🗺️ **GIS & PostGIS Engine:** FastAPI async server with PostGIS for spatial validation (`ST_IsValid`, `ST_Intersects`, `ST_Area`), IPCC Tier 2 Mangrove allometric biomass modeling, and automated MRV bundle assembly.
- 📦 **Hybrid Storage Tier:** Relational/Spatial metadata in Cloud PostgreSQL (**Neon.tech**) + PostGIS; immutable image artifacts and signed audit bundles pinned to **IPFS**.
- ⛓️ **Blockchain Settlement Layer:** Hardhat + Solidity smart contracts (`ProjectRegistry.sol`, `MRVRecord.sol`, `BlueCarbonToken.sol` ERC-20) with a **2-of-3 verifier multi-sig threshold** (MoES + NCCR sign-off).
- 🏛️ **Stakeholder Portals:**
  - _Field Interface:_ Offline survey creation, GPS coordinate walking, photo upload, sync status indicator.
  - _Verifier/MoES Dashboard:_ Spatial map view, IPFS audit bundle inspector, and one-click Web3 signature approval.
  - _Public Registry & Explorer:_ Interactive map of verified restoration plots, credit retirement interface, and public verifiable certificate generation.

---

## 🏗️ 5-Stage Architecture Pipeline

```mermaid
flowchart TD
    subgraph Stage 1: Field Capture (Offline PWA)
        A[Field Surveyor / NGO] -->|Walk Boundary + Geotagged Photos| B[PWA UI: Next.js + Leaflet]
        B -->|Persist Locally| C[(IndexedDB / Dexie.js Cache)]
        C -->|Detect Online Reconnection| D[Sync Engine / Batch Queue]
    end

    subgraph Stage 2: Unified Backend & GIS (FastAPI)
        D -->|Batch Ingestion Payload| E[FastAPI Sync Ingestion]
        E -->|Spatial Topological Check| F[PostGIS Geometry Validation]
        F -->|IPCC Tier 2 Allometrics| G[Biomass & tCO2e Engine]
        G -->|Assemble Cryptographic Package| H[Canonical MRV Bundle Generator]
    end

    subgraph Stage 3: Hybrid Storage Tier
        H -->|Plot Polygons, User Accounts, Status| I[(Neon.tech Cloud PostGIS)]
        H -->|Field Photos, Exif, Signed JSON Bundle| J[(IPFS Storage / Pinata)]
    end

    subgraph Stage 4: Blockchain & Settlement Layer
        H -->|Generate SHA-256 Bundle Hash| K[Viem / Web3 Client]
        K -->|Record Anchor CID & Hash| L[MRVRecord.sol]
        L -->|Link to Registered Plot| M[ProjectRegistry.sol]
        N[MoES / NCCR Multi-Sig Verifiers] -->|Submit Cryptographic Approvals| L
        L -->|On Threshold Reached >= 2| O[BlueCarbonToken.sol - Mint BCT]
    end

    subgraph Stage 5: Stakeholders & Consumption
        O -->|Credits Available| P[Public Registry Portal]
        P -->|Retire / Burn Credits| Q[On-Chain Retirement & Certificate]
        I & J -->|Audit & Map Layer| R[Verifier Portal & Public Explorer]
```

---

## 🛠️ Tech Stack Breakdown

| Layer                     | Technologies                                                              | Purpose                                                 |
| ------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Frontend & PWA**        | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons | Responsive Surveyor & Verifier Interfaces               |
| **Offline Storage**       | Dexie.js (IndexedDB wrapper), Service Worker (`sw.js`)                    | Zero-connectivity field data persistence & auto-sync    |
| **GIS & Mapping**         | Leaflet, React-Leaflet, GeoJSON, Shapely, PyProj                          | Boundary tracing, geodesic area math, interactive maps  |
| **Backend API**           | FastAPI (Python 3.12), Pydantic v2, Uvicorn                               | Async REST API, GIS validation & ingestion engine       |
| **Database**              | PostgreSQL 16 + PostGIS 3.4 (**Neon.tech Cloud / Docker**)                | Spatial geometries, topological queries, plot metadata  |
| **Decentralized Storage** | IPFS, Pinata Gateway, SHA-256 Hashing                                     | Immutable photo evidence & canonical MRV audit packages |
| **Smart Contracts**       | Solidity 0.8.24, OpenZeppelin v5, Hardhat, Ethers v6                      | Project registry, multi-sig approvals, BCT ERC-20 token |
| **Web3 Client**           | Viem v2, TypeScript                                                       | High-performance, type-safe browser wallet interactions |
| **DevOps & Tooling**      | pnpm, uv, Prettier, Husky, GitHub Actions CI                              | Automated linting, contract tests, and pytest suites    |

---

## 📁 Repository Structure

```
meridien/
├── .github/
│   ├── workflows/
│   │   └── ci.yml                  # GitHub Actions CI (Node 22 LTS, Hardhat, Pytest)
│   └── CODEOWNERS                  # Repository codeowners configuration
├── backend/                        # FastAPI GIS & Ingestion Server
│   ├── app/
│   │   ├── api/v1/                 # API Routes (auth, plots, mrv, registry)
│   │   ├── core/                   # Config & SQLAlchemy Async Database (Neon.tech)
│   │   ├── models/                 # SQLAlchemy & GeoAlchemy2 Models
│   │   ├── schemas/                # Pydantic v2 validation schemas
│   │   ├── services/               # GIS validation, IPCC biomass model, IPFS service
│   │   └── main.py                 # FastAPI application entrypoint & CORS
│   ├── tests/                      # Pytest test suite (biomass math, GIS validation)
│   └── pyproject.toml              # Python project & dependencies (uv managed)
├── frontend/                       # Next.js 14 PWA + Smart Contracts
│   ├── contracts/                  # Solidity Smart Contracts
│   │   ├── ProjectRegistry.sol     # Plot boundary hash & project lifecycle registry
│   │   ├── BlueCarbonToken.sol     # BCT ERC-20 token with mint & retirement mechanics
│   │   └── MRVRecord.sol           # IPFS audit anchoring & 2-of-3 verifier multi-sig
│   ├── scripts/
│   │   └── deploy.ts               # Hardhat deployment script
│   ├── test/
│   │   └── MeridienContracts.test.ts # Hardhat smart contract test suite (9 tests)
│   ├── src/
│   │   ├── app/                    # Next.js App Router pages
│   │   ├── components/             # UI, maps, and boundary drawer components
│   │   └── lib/                    # Viem client, Dexie.js offline DB, sync worker
│   ├── hardhat.config.ts           # Hardhat configuration (Solidity 0.8.24)
│   └── package.json                # Frontend & Hardhat dependencies (pnpm)
├── docker-compose.yml              # Local PostGIS 16 fallback container
├── .env.example                    # Environment configuration template
└── package.json                    # Root workspace & tooling scripts
```

---

## 🪙 Smart Contract & Tokenomics Model

### 1. `ProjectRegistry.sol`

- Manages blue carbon restoration projects and stores canonical SHA-256 boundary hashes.
- Enforces strict **anti-double-counting** by rejecting overlapping or duplicate coordinate hashes.

### 2. `MRVRecord.sol`

- Anchors canonical IPFS bundle CIDs and cryptographic hashes submitted by field surveyors.
- Enforces a **2-of-3 Verifier Multi-Sig Gate** (e.g. MoES Lead + NCCR Regional Verifier).
- Automatically dispatches token minting once the verification threshold is reached.

### 3. `BlueCarbonToken.sol` (`BCT`)

- Standard ERC-20 token representing verified blue carbon sequestration.
- **Token Equivalence:** $1.0\text{ BCT} \equiv 1.0\text{ metric ton of sequestered } CO_2e$ ($1\text{ tCO}_2\text{e}$).
- Contains a public `retire(amount, beneficiary, reason)` function that permanently burns tokens and emits on-chain verifiable retirement certificates.

---

## 🚀 Local Development Setup

### Prerequisites

- **Node.js**: v22 LTS or higher
- **pnpm**: v11+ (`npm install -g pnpm`)
- **Python**: v3.11+ with **uv** (`pip install uv` or standalone installer)
- **Cloud Database**: Managed PostGIS database on [Neon.tech](https://neon.tech) (or local Docker)

### 1. Clone & Configure Environment

```bash
git clone https://github.com/tyraakj/meridien.git
cd meridien

# Copy environment template
cp .env.example .env
```

### 2. Setup & Test Smart Contracts (`frontend/`)

```bash
cd frontend
pnpm install
pnpm approve-builds keccak secp256k1

# Run contract tests
pnpm run test:contracts

# Compile Solidity contracts
pnpm run compile:contracts
```

### 3. Setup & Run Backend (`backend/`)

```bash
cd ../backend
uv sync

# Run backend test suite
uv run pytest tests/ -v

# Start FastAPI dev server
uv run uvicorn app.main:app --reload --port 8000
```

### 4. Run Frontend PWA (`frontend/`)

```bash
cd ../frontend
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Running Test Suites

### Hardhat Smart Contract Tests (9/9 Passing)

```bash
cd frontend
pnpm run test:contracts
```

```text
  Meridien Core Smart Contract Suite
    1. Deployment & Permissions
      ✔ should initialize contracts with correct owner and controllers
      ✔ should reject direct unauthorized token minting
    2. Project Registration (ProjectRegistry)
      ✔ should allow a project developer to register a plot
      ✔ should reject duplicate boundary hash registrations (Anti-Double-Counting)
    3. MRV Report Submission & Multi-Sig Verification (MRVRecord)
      ✔ should allow surveyor to submit an MRV audit report
      ✔ should require 2 verifier approvals before minting Blue Carbon Tokens (BCT)
      ✔ should reject approvals from non-verifiers
    4. Credit Settlement & Voluntary Retirement (BlueCarbonToken)
      ✔ should allow buyer to permanently retire (burn) verified carbon credits
      ✔ should reject retirement if balance is insufficient

  9 passing (1s)
```

### FastAPI GIS & Biomass Tests (6/6 Passing)

```bash
cd backend
uv run pytest tests/ -v
```

```text
tests/test_biomass.py::test_single_tree_biomass_calculation PASSED       [ 16%]
tests/test_biomass.py::test_mangrove_total_tco2e PASSED                  [ 33%]
tests/test_biomass.py::test_zero_tree_edge_case PASSED                   [ 50%]
tests/test_gis_service.py::test_valid_geojson_polygon PASSED             [ 66%]
tests/test_gis_service.py::test_invalid_polygon_self_intersecting PASSED [ 83%]
tests/test_gis_service.py::test_deterministic_boundary_hash PASSED       [100%]

============================== 6 passed in 8.44s ==============================
```

---

## 🔌 API Reference Surface

| Method | Endpoint                            | Description                                               | Auth / Role          |
| ------ | ----------------------------------- | --------------------------------------------------------- | -------------------- |
| `POST` | `/api/v1/auth/register`             | Register new surveyor, verifier, or developer             | Public               |
| `POST` | `/api/v1/auth/login`                | JWT Login & access token generation                       | Public               |
| `POST` | `/api/v1/plots/register`            | Register new restoration plot with GeoJSON boundary       | Developer / Surveyor |
| `GET`  | `/api/v1/plots`                     | List & filter plots (with bounding box / spatial query)   | Public               |
| `GET`  | `/api/v1/plots/{id}`                | Get plot details, historical MRV & geometry               | Public               |
| `POST` | `/api/v1/mrv/sync-batch`            | Offline sync endpoint for field survey batches            | Surveyor             |
| `GET`  | `/api/v1/mrv/reports`               | List submitted MRV reports for verification               | Verifier / MoES      |
| `POST` | `/api/v1/mrv/reports/{id}/approve`  | Verifier submits multi-sig approval                       | Verifier (MoES/NCCR) |
| `GET`  | `/api/v1/registry/stats`            | National aggregate metrics (area, credits minted/retired) | Public               |
| `GET`  | `/api/v1/registry/certificate/{id}` | Generate verifiable retirement certificate                | Public               |

---

## 🛡️ Governance & Code Ownership

This repository is maintained under strict governance guidelines defined in [`.github/CODEOWNERS`](.github/CODEOWNERS).

- **Lead Developer & Maintainer:** [@tyraakj](https://github.com/tyraakj) (`tyra191712@gmail.com`)
- **License:** MIT License — see [LICENSE](LICENSE) for details.
- **Hackathon Submission:** Smart India Hackathon 2026 (SIH2601 / SIH26038)
