# Agent-Ready Swarm Role Deck: Serenity Scrolls SEO/AEO Swarm

This deck outlines the structured roles dynamically compiled by the Swarm Factory for Serenity Scrolls.

## 1. Swarm Roles & Budgets

### SEO/AEO Swarm Coordinator (`coord-seo-aeo-mgr`)
- **Purpose**: Coordinates SEO/AEO audits, schedules page crawl sessions, compiles daily keyword performance metrics, manages git branch staging, and formats summary briefs.
- **Role Archetype**: Swarm Coordinator (Manager Role)
- **Decision Authority**: Pipeline sequencing, priorities, and approval requests
- **Blocked Boundaries**: API key injection, external system mutation, direct execution without human authorization

### SEO Crawler & Analyst Elf (`elf-seo-analyst`)
- **Purpose**: Perform technical SEO crawls on Next.js routes (e.g. `/`, `/shop`, `/learn/courage-covenant`) to isolate indexability flaws, metadata gaps, and speed constraints.
- **Role Archetype**: Specialist Executor (Elf Role)
- **Decision Authority**: Semantic parsing and context-mapping selections
- **Blocked Boundaries**: Credentials handling, production system access

### Leads Prospector & Scraper Elf (`elf-leads-scraper`)
- **Purpose**: Harvest public contact details for Christian bookstores, church gift shops, local religious boutiques, retreat centers, and family ministries from directories.
- **Role Archetype**: Specialist Executor (Elf Role)
- **Decision Authority**: Semantic parsing and lead-scoring selections
- **Blocked Boundaries**: Credentials handling, production system access

### AEO Optimizer & Content Writer Elf (`elf-aeo-writer`)
- **Purpose**: Draft FAQPage schema, Course schema for Courage Covenant, sitemap updates, and write the 5-stage B2B wholesale outreach email funnel.
- **Role Archetype**: Specialist Executor (Elf Role)
- **Decision Authority**: Tone matching and schema selection
- **Blocked Boundaries**: Credentials handling, production system access

### Campaign Dispatcher Elf (`elf-campaign-dispatcher`)
- **Purpose**: Connects to the agentic email system (Resend/Sienvi Sender) to queue and dispatch approved campaigns.
- **Role Archetype**: Specialist Executor (Elf Role)
- **Decision Authority**: Recipient list matching and campaign intervals
- **Blocked Boundaries**: Credentials handling, production system access

### SEO/AEO QA Auditor Elf (`elf-seo-qa`)
- **Purpose**: Audit drafted schema markup, sitemap syntax, check for credentials exposure, and run domain MX records check on leads.
- **Role Archetype**: QA Reviewer / Risk Sentinel
- **Decision Authority**: Boundary compliance checks, validation veto
- **Blocked Boundaries**: Modifying active code registries or sending emails directly

## 2. Quality Control Requirements

1. **Rich Snippets Compliance**: All JSON-LD structured data (FAQPage, Course, Organization) must validate perfectly.
2. **Absolute Path Compliance**: Output builds must map to absolute workspaces (e.g. `c:/Users/Iris/OneDrive/Work/serenityscrollsservant/serenityscrollsservant/seo-swarm/`).
3. **Zero-Credentials Verification**: Verify that no API keys or database connection strings exist in staged files.
4. **Email Verifiability**: All scraped leads must pass domain MX record validation before entering the wholesale dispatch queue.
