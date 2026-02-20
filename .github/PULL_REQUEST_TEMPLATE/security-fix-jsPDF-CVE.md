# Security Fix: Update jsPDF to 4.2.0

## What Changed
- Updated `jspdf` from `^4.0.0` to `^4.2.0`

## Why It Matters
This update addresses **CRITICAL security vulnerabilities** in jsPDF:

- **CVE-2024 (GHSA-p5xg-68wr-hm3m, GHSA-9vjf-qc39-jprp)**: Arbitrary Code Execution vulnerability
- **CVSS Score**: 8.1 (HIGH severity)
- **Affected versions**: jspdf <= 4.1.0
- **Impact**: PDF injection allows arbitrary JavaScript execution when processing untrusted PDF content

This vulnerability could allow attackers to execute malicious code through crafted PDF files, potentially compromising user data and application security.

## Testing Checklist
- [ ] Run `npm install` to verify package installs correctly
- [ ] Run `npm run build` to ensure build succeeds
- [ ] Run `npm run test` to verify no regressions
- [ ] Verify PDF generation functionality works correctly
- [ ] Test PDF export features in the application
- [ ] Run `npm audit` to confirm vulnerability is resolved

## Risk Assessment
| Factor | Assessment |
|--------|------------|
| **Breaking Changes** | LOW - jsPDF 4.2.0 is a patch/minor release with backward compatibility |
| **Test Coverage** | Existing tests cover PDF functionality |
| **Rollback Plan** | Can revert to previous commit if issues arise |
| **Security Impact** | HIGH - Eliminates arbitrary code execution vulnerability |

## References
- [jsPDF 4.2.0 Release Notes](https://github.com/parallax/jsPDF/releases/tag/v4.2.0)
- [GHSA-p5xg-68wr-hm3m Advisory](https://github.com/advisories/GHSA-p5xg-68wr-hm3m)
- [GHSA-9vjf-qc39-jprp Advisory](https://github.com/advisories/GHSA-9vjf-qc39-jprp)
