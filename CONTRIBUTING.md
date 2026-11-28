# SearchMind API Platform — Contributing Guidelines and Branch Governance

Welcome to the SearchMind API engineering repository. We maintain strict production-readiness, security, and stability standards across our core search gateway, autonomous agent primitives, and administrative services.

To ensure stability, code quality, and compliance with our security baseline, **all contributors, automated agents, and team members must strictly adhere to the policies defined in this document.**

---

## 1. Absolute Rule: No Direct Pushes to Protected Branches

> **CRITICAL POLICY:**
> **Direct pushes to `main`, `master`, or any production release branches are strictly prohibited for all developers and contributors.**
>
> Any attempt to push directly to `main` will be blocked by our branch protection policies and local git hooks.
>
> **Every single modification must be submitted via a dedicated Pull Request (PR) from an isolated topic branch and must be reviewed, tested, and exclusively approved/merged by the Lead Maintainer (`pritpatel2412`).**

---

## 2. Standard Branching Strategy

All development work must occur within short-lived, isolated feature, fix, or documentation branches branched directly off the latest `main` commit.

### Branch Naming Conventions

Branches must follow the structured namespace convention below:

| Prefix | Usage | Example |
|---|---|---|
| `feat/` | Introducing new features, endpoints, or agent primitives | `feat/multi-tenant-workspaces` |
| `fix/` | Resolving bugs, race conditions, or runtime crashes | `fix/redis-connection-reconnect` |
| `security/` | Addressing OWASP vulnerabilities, SSRF filters, or auth patches | `security/jwt-token-revocation` |
| `docs/` | Documentation, README updates, or API specification edits | `docs/api-reference-update` |
| `perf/` | Performance optimizations, database query tuning, or caching | `perf/vector-embedding-batching` |
| `chore/` | Dependency upgrades, build configuration, or CI workflow updates | `chore/upgrade-playwright-1-45` |
| `test/` | Adding or refactoring test suites and verification harnesses | `test/add-session-e2e-tests` |

---

## 3. Step-by-Step Contribution Workflow

Follow this procedure for every change:

### Step 1: Synchronize Your Local `main`
Always pull the latest upstream commits before starting new work:
```bash
git checkout main
git pull origin main
```

### Step 2: Create a Dedicated Topic Branch
```bash
git checkout -b feat/your-feature-name
```

### Step 3: Implement Changes Following Standards
- **Zero Extraneous Dependencies**: Reach for standard library solutions (`urllib`, `socket`, `ipaddress`, `asyncio`, `hmac`) before introducing third-party packages.
- **Strict Input Validation & Security**: Validate all inputs at trust boundaries. Any endpoint accepting URLs must invoke `validate_safe_url()`.
- **Error Handling**: Mask internal exceptions from user-facing responses. Use structured logging (`logger.exception()`) for debugging.
- **Clean Code**: No dead code, temporary debug print statements, or informal formatting.

### Step 4: Execute Mandatory Pre-Submission Verifications
Before committing, you must verify that all automated test suites pass locally without regressions:

```bash
# 1. Run OWASP Security Test Suite
python backend/tests/test_owasp_security.py

# 2. Run Admin Sessions & Primaries Suite
python backend/tests/test_admin_sessions.py

# 3. Run Core Agent Primitives Suite
python backend/tests/test_dynamic_highlights.py
python backend/tests/test_schema_extraction.py
python backend/tests/test_topological_map.py
python backend/tests/test_browser_sessions.py
python backend/tests/test_instruct_action.py

# 4. Verify Front-End Production Builds
cd frontend/developer-portal && npm run build
cd ../admin && npm run build
```

### Step 5: Format Commits Using Conventional Commits
Write imperative, concise commit messages:
```bash
git add .
git commit -m "feat(module): imperative summary of change"
```

Examples:
- `feat(extract): implement schema-driven JSON entity extraction`
- `fix(security): resolve SSRF vulnerability in webhook validator`
- `docs(readme): clarify persistent session lifecycle documentation`
- `test(security): add test coverage for IP rate limiting thresholds`

### Step 6: Push Topic Branch to Remote
```bash
git push -u origin feat/your-feature-name
```

### Step 7: Open a Pull Request
1. Navigate to GitHub and open a Pull Request targeting `main`.
2. Fill out the **Pull Request Template** completely:
   - Provide a concise summary of the problem and implemented solution.
   - Attach test execution proof.
   - Confirm security impact assessment (does this change touch auth, URLs, database, or client inputs?).
3. Request review from the Lead Maintainer (`pritpatel2412`).

---

## 4. Code Review and Merge Governance

To maintain total system integrity:

1. **Automated CI Validation**: Every Pull Request automatically triggers our GitHub Actions CI pipeline, running lint checks, security tests, and frontend build validations. A PR cannot be merged if any CI step fails.
2. **Review Checklist**:
   - Are trust boundaries secured against SSRF and injection?
   - Are rate limits and quota tracking applied to all new metered endpoints?
   - Are security headers intact?
   - Is performance non-blocking and memory bounded?
3. **Sole Merge Authority**:
   - **Only the repository owner / Lead Maintainer (`pritpatel2412`) has authority to approve and merge Pull Requests into `main`.**
   - Merges must be executed with a clean non-fast-forward merge commit (`git merge --no-ff`) to preserve the isolated commit history and PR reference.

---

## 5. Local Git Pre-Push Hook Protection

To prevent accidental direct pushes from developers' local command lines, activate the repository pre-push hook:

### On Windows (PowerShell):
```powershell
./scripts/setup-git-hooks.ps1
```

### On Linux / macOS:
```bash
chmod +x scripts/setup-git-hooks.sh
./scripts/setup-git-hooks.sh
```

This hook automatically detects any push command targeting `main` or `master` and aborts the command immediately, instructing you to push to a feature branch instead.

---

## 6. Security & Vulnerability Reporting

If you identify a security vulnerability (such as an SSRF bypass, authentication bypass, or denial-of-service vector), **do not open a public GitHub issue**. Instead, report it directly to the Lead Maintainer via email (`pritptl2412@gmail.com`) for private triage and patching.
