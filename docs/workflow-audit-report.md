# 1. Workflow Architecture Map

## A) Lead capture workflows

### QuizGeenius (primary geenius funnel)
- **Trigger:** User completes `QuizGeenius` contact step and submits.  
- **Source page/event:** `src/pages/QuizGeenius.jsx` `handleComplete`.  
- **Functions called:** `notifyAdminNewLead` directly from page; geenius welcome and follow-ups are expected from entity automation via `nurture/geeniusWorkflowOrchestrator` (commented in code).  
- **Entity writes:** `Lead.create`/`Lead.update`, `ConversionEvent.create`, `UserBehavior.update`, optional referral attribution fields.  
- **Email sends:** Immediate admin email (`notifyAdminNewLead`) + orchestrator-triggered customer email(s) (`audit_submitted`) and scheduled nudges via `LeadNurture`.  
- **Automations:** Entity automation expected on `Lead create/update` and `Order create` into `geeniusWorkflowOrchestrator`; scheduled `nurture/processScheduledEmails` to execute queued nurtures.  
- **Admin notifications:** `notifyAdminNewLead` sends admin alert via Resend.  
- **Follow-up:** pathway selection in `BridgeGeenius` writes `selected_pathway`, which queues pathway emails + abandoned checkout reminders.

### QuizGeeniusV2 (parallel funnel)
- **Trigger:** User completes `QuizGeeniusV2` and lead is created.  
- **Source page/event:** `src/pages/QuizGeeniusV2.jsx` `handleComplete`.  
- **Functions called:** `nurture/foxyAuditNurture` (background), plus multiple geeniusv2 analysis functions.  
- **Entity writes:** `Lead.create`.  
- **Email sends:** `foxyAuditNurture` sends immediate nurture email + creates `LeadNurture` record.  
- **Automations:** Whatever global lead-create automations exist will also fire unless explicitly scoped (risk: overlap with geenius orchestrator).  
- **Admin notifications:** none in page code.  
- **Follow-up:** scheduled nurture expected via `LeadNurture` processors.

### QuizV3 / QuizV2 / Quiz (legacy parallel funnels)
- **Trigger:** quiz completion.  
- **Source page/event:** `src/pages/QuizV3.jsx`, `src/pages/QuizV2.jsx`, `src/pages/Quiz.jsx`.  
- **Functions called:** mostly no direct email functions on completion in page code; they create/update leads and track events.  
- **Entity writes:** `Lead.create`/`Lead.update`, `ConversionEvent.create`.  
- **Email sends:** indirect only (through automations/scheduled jobs tied to lead events).  
- **Automations:** old nurture stack (`startLeadNurture`, `processLeadNurture`, `abandonedQuiz`) still exists and can run in parallel with geenius stack.  
- **Admin notifications:** not consistently triggered from these pages.

### Programmatic landing -> quiz flow
- **Trigger:** CTA click on city/industry landing pages.  
- **Source page/event:** `CityNicheLanding` and `IndustryLandingTemplate` route to `QuizGeenius`; logs conversion events (`programmatic_landing_view`, `programmatic_cta_clicked`).  
- **Functions called:** none directly for email; event writes only.  
- **Entity writes:** `ConversionEvent.create` with city/industry metadata.  
- **Email sends:** none at landing level.  
- **Follow-up:** inherits quiz flow + whatever lead automations are global.

### Referral lead capture
- **Trigger:** referral link creation and eventual referred checkout conversion.  
- **Source event:** `functions/referrals/createReferral.ts` (create link), `functions/referrals/trackReferralConversion.ts` (admin conversion tracking).  
- **Entity writes:** `Referral.create` and later `Referral.update` + affiliate updates.  
- **Email sends:** conversion-tracking function sends referral credit/commission emails via `Core.SendEmail`.  
- **Automations:** no explicit dedicated referral nurture automation found.

## B) Email workflows
- **Immediate lead emails (multiple systems):**
  - `sendWelcomeEmail` (standalone Resend send).
  - `sendQuizSubmissionEmail` (standalone Resend send).
  - `sendGeeniusEmail` (standalone Resend send).
  - `nurture/geeniusWorkflowOrchestrator` sends immediate `audit_submitted`.
  - `nurture/geeniusNonConvertedFlow` can also send `audit_submitted` depending trigger.
- **Scheduled/queued emails:**
  - `nurture/processScheduledEmails` drains `LeadNurture` active queue for geenius keys.
  - `processLeadNurture` drains a separate legacy 5-step array.
  - `processNurtureSequences` drains active `LeadNurture` and invokes `sendFoxyNurtureEmail` (currently payload mismatch).
- **Abandonment/reminder flows:** `abandonedQuiz`, `abandonedMidQuiz`, `abandonedGeenius`, `sendAbandonedCartReminders`.
- **Post-conversion:** `nurture/postPurchase`, `postConversionNurture`, `closedDealWelcome`, `sendClientNewsletter`.
- **Admin alerts:** `notifyAdminNewLead`, `notifyAdminHotLead`, `sendAdminUpsellNotification`.

## C) Scoring workflows
- `scoring/calculateLeadScore`: computes `lead_score`, `lead_grade`; invokes `notifyAdminHotLead`.
- `calculateEngagementScore`: computes business_health + engagement + priority, writes `LeadEngagementScore` and `Lead.engagement_score`; invokes `notifyAdminHotLead`.
- `updateEngagementScore`: legacy-ish calculator from email logs that also writes lead score-ish outputs (another scoring path).

## D) Referral workflows
- `createReferral`: creates `Referral` with code and pending status.
- quiz pages pass referral code (`campaignData.ref`) into `Lead.referral_code` on create.
- `trackReferralConversion`: marks `Referral` converted and sends emails/commissions.
- Referral dashboard UI exists (`Referrals` page with dashboard/affiliate/leaderboard tabs).

## E) Admin workflows
- Admin auth via magic link (`auth/requestAdminMagicLink`, `auth/verifyAdminMagicLink`).
- Admin automations UI (`AdminAutomations`, `AutomationEditor`) calls CRUD functions, but backend functions are mostly stubs/mock.
- Email analytics/log views exist (`admin/getEmailLogs`, `admin/getEmailAnalytics`, `APILogs`, dashboards).
- No proven production-grade per-funnel template mapping editor in admin.

---

# 2. Email Forensic Audit

## Why new leads can receive 3–8 emails
**Root cause:** multiple independent email systems can trigger on the same lead lifecycle (lead creation + queued nurtures + manual/testing functions), with inconsistent dedup keys.

| Function / Automation | Trigger | Recipient | Template / Message | Immediate / Delayed | Duplicate Risk | Active? |
|---|---|---|---|---|---|---|
| `notifyAdminNewLead` | called directly from `QuizGeenius` submit | Admin email (`AppSettings.admin_email`) | New Lead alert | Immediate | Medium (no lead-level “already notified” flag) | Yes (page call) |
| `nurture/geeniusWorkflowOrchestrator` (`Lead create`) | entity automation on new `Lead` | Lead | `audit_submitted` confirmation | Immediate | **High** (same intent exists in other functions) | Likely active by design comment |
| `nurture/geeniusWorkflowOrchestrator` schedule | after lead create | Lead | `pathway_selection_nudge_2h`, `pathway_selection_urgent_12h` queued in `LeadNurture` | Delayed | Medium (queue-level dedup by `sequence_name`) | Likely active |
| `nurture/processScheduledEmails` | scheduled job over active `LeadNurture` | Lead | geenius sequence templates | Delayed | Medium (depends on queue records only) | Likely active |
| `nurture/foxyAuditNurture` | called by `QuizGeeniusV2` | Lead | immediate Foxy step + creates `LeadNurture` | Immediate + delayed | **High** (parallel to geenius flow) | Active from page |
| `sendFoxyNurtureEmail` | called by foxy processors | Lead | Foxy WOMP templates | Immediate/step-based | Medium (no pre-send EmailLog existence check per step) | Active |
| `sendWelcomeEmail` | manual/invoked function | Lead | generic “Quiz Complete” welcome | Immediate | **High** if callable alongside orchestrator | Exists/used in checklists/tests |
| `sendQuizSubmissionEmail` | manual/invoked function | Lead | audit results email | Immediate | **High** if also sending welcome/orchestrator | Exists/used in testing path |
| `sendGeeniusEmail` | direct invoke | Lead | GeeNiusPath “exclusive pathways” | Immediate | **High** if combined with orchestrator `audit_submitted` | Exists |
| `nurture/geeniusNonConvertedFlow` (`audit_submitted`) | manual/automation trigger | Lead | another `audit_submitted` template | Immediate | **High** (same message purpose as orchestrator) | Exists |
| `nurture/abandonedGeenius` | scheduled candidate scan | Lead | pathway reminders | Delayed | Medium (metadata sequence dedup used) | Exists |
| `sendAbandonedCartReminders` | scheduled daily style | Lead | abandoned cart email via `sendAbandonedCartEmail` | Delayed | Medium (per-day check only) | Exists |
| `nurture/abandonedQuiz` | scheduled on v3 starts w/o completion | Lead | complete your quiz | Delayed | Low-Med (session-based dedup) | Exists |
| `nurture/abandonedMidQuiz` | scheduled partial lead scan | Lead | mid-quiz recovery | Delayed | Low-Med (sequence key dedup) | Exists |
| `notifyAdminHotLead` | scoring functions invoke | Admin(s) | hot lead alert | Event-based immediate | Low (lead flag `hot_lead_notified`) | Active |

### Code-path proof highlights
- Initial `QuizGeenius` submit explicitly calls admin notify and states lead welcome is via orchestrator automation.  
- Orchestrator sends immediate `audit_submitted` on `Lead create`, then schedules 2h/12h nudges.  
- `QuizGeeniusV2` independently invokes `foxyAuditNurture`, which sends immediate email and creates a separate nurture stream.  
- `sendWelcomeEmail`, `sendQuizSubmissionEmail`, and `sendGeeniusEmail` are separate immediate email senders with no cross-system lock.
- Dead/orphaned behavior: `processNurtureSequences` invokes `sendFoxyNurtureEmail` with `{ leadId, step }`, but `sendFoxyNurtureEmail` requires `nurtureId`; this path will skip/fail.

---

# 3. Quiz / Funnel Workflow Matrix

| Quiz / Funnel | Lead Created | Welcome Email | Nurture Sequence | Admin Alert | Tags / Labels | Copy matched to intent? | User in one workflow only? |
|---|---|---|---|---|---|---|---|
| QuizGeenius | Yes (`Lead.create/update`) | Orchestrator `audit_submitted` (entity automation) | `LeadNurture` geenius scheduled emails | Yes (`notifyAdminNewLead` from page) | Funnel tags in email metadata (`funnel: geenius`) | Mostly yes | **No** (other email funcs can still run) |
| QuizGeeniusV2 | Yes | Foxy immediate email from `foxyAuditNurture` | Foxy follow-up via `LeadNurture` + processors | Not explicit in page | sequence_name `Foxy Audit Follow-up` | Mixed (Foxy copy) | **No** (can overlap with global lead automations) |
| QuizV3 | Yes | Not direct from page; automation-dependent | legacy nurture/abandon flows may apply | Not direct | `funnel_version: v3` events | Mixed | **No** |
| QuizV2 / Quiz (legacy) | Yes | Not direct from page | legacy nurture flows | Not direct | older event names | Mixed/legacy | **No** |
| Programmatic city landing -> QuizGeenius | Indirect (at quiz submit) | Same as QuizGeenius | Same as QuizGeenius | Same as QuizGeenius | ConversionEvent has city/industry/source | partially (landing-specific pre-quiz only) | **No** |
| Referral lead (ref code path) | Lead may include `referral_code` | No unique referral welcome mapped at lead-create | No clean dedicated referral nurture map | No dedicated referral admin alert path found | referral code on lead + Referral entity | Not cleanly mapped | **No** |

---

# 4. Admin Email Control Audit

| Admin Capability | Exists? | Works? | Missing? | Recommended Fix |
|---|---|---|---|---|
| Email template editor | Partial (`AIEmailComposer` can save `EmailTemplate`) | Partial (ad-hoc, not wired to core automations) | No centralized template registry used by geenius/foxy/orchestrator | Introduce canonical Template entity and force all nurture sends to resolve template IDs |
| Subject editing | Partial (in composer UI) | Partial/manual only | No per-workflow subject governance | Add workflow-template mapping UI with versioning |
| Body editing | Partial (composer editable body) | Partial | Hardcoded HTML remains primary in many backend functions | Migrate hardcoded HTML to DB templates |
| Preview support | Partial (`AIEmailComposer` preview toggle) | Limited | No broad preview for production automation templates; audit plan itself flags missing preview | Add preview endpoint rendering template + sample lead data |
| Workflow assignment | Weak | Mostly no | No admin mapping of template->funnel->trigger | Add WorkflowMap table and admin matrix editor |
| Tag-based recipient logic | Minimal | Limited | Tags used inconsistently (metadata tags in Resend, lead tags separate) | Normalize tag schema and use one audience resolver service |
| Per-quiz template mapping | No proven centralized mapping | No | hardcoded in function files | Add per-funnel template mapping in admin settings |
| Send log visibility | Yes (`getEmailLogs`, `getEmailAnalytics`, APILogs) | Yes | lacks conflict/dedup diagnostics | Add dedup decision logs + automation source column |
| Suppress/pause workflow controls | Partial UI only | Weak (automation CRUD backend stubs) | Pause/resume not truly controlling actual infra | Implement real automation registry backend and runtime enforcement |

---

# 5. Duplicate Send Protection Audit

| Workflow | Dedup Exists? | Method | Risk of Duplicate Send |
|---|---|---|---|
| `startLeadNurture` | Yes (basic) | checks active `LeadNurture` by `lead_id` | Medium (only one sequence check, not cross-system) |
| `geeniusWorkflowOrchestrator` scheduling | Yes (queue-level) | checks existing `LeadNurture` with same `sequence_name` | Medium (doesn’t stop other direct send functions) |
| `processScheduledEmails` | Partial | relies on one active nurture record then marks completed/paused | Medium |
| `foxyAuditNurture` | No strong dedup | creates sequence + sends immediately without explicit EmailLog dedup | **High** |
| `sendFoxyNurtureEmail` | No pre-send dedup | logs after send; no “already sent step X” check | **High** |
| `sendWelcomeEmail` | No | none | **High** |
| `sendQuizSubmissionEmail` | No | none | **High** |
| `sendGeeniusEmail` | No | none | **High** |
| `geeniusNonConvertedFlow` | No pre-send dedup | logs only after send | **High** |
| `abandonedGeenius` | Yes | checks `EmailLog.metadata.sequence` | Low-Med |
| `abandonedQuiz` | Yes | checks EmailLog by `{session_id, sequence}` | Low-Med |
| `abandonedMidQuiz` | Yes | checks EmailLog `metadata.sequence` per lead | Low-Med |
| `sendAbandonedCartReminders` | Partial | only “sent today” check for type | Medium |
| `notifyAdminHotLead` | Yes | `Lead.hot_lead_notified` flag + timestamp | Low |
| `notifyAdminNewLead` | No strong dedup | none beyond missing-config skip | Medium-High |

Direct answers:
- Same welcome twice? **Yes, currently possible** across `sendWelcomeEmail`, orchestrator `audit_submitted`, and other immediate welcome-like functions.
- Overlapping welcomes from multiple systems? **Yes.**
- Scheduled duplicates? **Possible** if multiple schedulers target same lead with different sequence names.
- Admin alerts more than once? `notifyAdminHotLead` mostly protected; `notifyAdminNewLead` not strongly protected.

---

# 6. Automation Conflict Audit

| Automation Name | Trigger | Function | Workflow Area | Status | Conflict Risk | Failure Risk |
|---|---|---|---|---|---|---|
| Lead create orchestrator | Lead create entity event | `nurture/geeniusWorkflowOrchestrator` | Geenius email orchestration | Intended active | **High** overlap with direct welcome senders | Medium |
| Lead update orchestrator | Lead update (pathway select) | `nurture/geeniusWorkflowOrchestrator` | Pathway/abandon emails | Intended active | Medium (plus `triggerGeeniusAutomations`) | Medium |
| Order create orchestrator | Order create | `nurture/geeniusWorkflowOrchestrator` | Post-purchase day1 queue | Active if wired | Medium (with postPurchase/postConversionNurture) | Medium |
| Scheduled queue processor | schedule | `nurture/processScheduledEmails` | Geenius queued sends | Intended active | Medium | Medium |
| Foxy start | page call | `nurture/foxyAuditNurture` | Foxy funnel | Active from QuizGeeniusV2 | **High** with geenius lead automations | Medium |
| Legacy nurture processor | schedule | `processLeadNurture` | Legacy nurture | Unknown but present | **High** with scheduled geenius/foxy | Medium |
| Legacy processor #2 | schedule | `processNurtureSequences` | Legacy/Foxy | Present | **High** duplicate processing path | **High** (payload mismatch to sender) |
| Abandoned cart reminders | schedule | `sendAbandonedCartReminders` | cart recovery | Present | Medium | Low-Med |
| Abandoned quiz v3 | schedule | `nurture/abandonedQuiz` | v3 recovery | Present | Medium | Low |
| Abandoned mid-quiz | schedule | `nurture/abandonedMidQuiz` | mid-quiz recovery | Present | Medium | Low |
| Abandoned geenius | schedule | `nurture/abandonedGeenius` | geenius no-selection | Present | Medium (with geeniusNonConvertedFlow) | Low-Med |
| Manual geenius trigger | admin/manual/scheduled | `nurture/triggerGeeniusAutomations` | geenius reminders | Present | **High** can replay same intent as orchestrator | Low-Med |
| Hot lead notifier | scoring invoke | `notifyAdminHotLead` | admin ops | Active | Low | Low |
| Admin automation CRUD | UI/API | `admin/*Automation` | admin ops | **Stub/mock** | N/A | **High operational failure (false control)** |

Classification:
- **Valid:** orchestrator + processScheduledEmails pattern, hot lead notifier dedup logic.
- **Broken:** `processNurtureSequences` -> `sendFoxyNurtureEmail` contract mismatch.
- **Redundant:** multiple welcome/immediate-send paths (`sendWelcomeEmail`, `sendQuizSubmissionEmail`, `sendGeeniusEmail`, geeniusNonConvertedFlow audit_submitted).
- **Dangerous:** parallel old/new schedulers and fake automation management UI/backend mismatch.

---

# 7. Half-Assed Feature Audit

| Feature | Current State | Why It’s Weak | Severity | Fix Needed |
|---|---|---|---|---|
| Automation management (admin) | UI exists with create/edit/delete/toggle | Backend endpoints return mock/stub behavior; no real automation persistence/control | **Critical** | Build real automation registry + execution control |
| Template management | Scattered hardcoded templates + AI composer saves template records | Core workflows do not consume a central template system | **Critical** | Central template engine + mandatory template IDs per workflow |
| Workflow clarity | Multiple parallel funnel stacks (geenius/foxy/legacy) | No single workflow ownership per lead; overlap and drift | **Critical** | Primary workflow assignment and routing lock |
| Dedup governance | Inconsistent per-function checks | Some flows robust, many none | **Critical** | Unified dedup service keyed by lead+workflow+step |
| Admin preview/mapping | Partial preview only in composer | No per-funnel mapping, no robust preview across live templates | High | Workflow-template matrix UI |
| Send diagnostics | Email logs/analytics exist | No source-of-truth conflict tracing, no dedup decision trail | High | Add `workflow_source`, `dedup_key`, `suppressed_reason` fields |
| Referral workflow integration | Referral entities and conversion exist | No clean referral-specific nurture/admin alert mapping | High | Define referral funnel workflow explicitly |
| Testing docs vs reality | Testing page claims “all automations active” | Contradicted by mocked automation backend and mixed legacy stacks | High | Replace marketing copy with live status from runtime registry |
| APILogs operational utility | Logs visible/exportable | Not workflow-first; hard to trace one lead across automations | Medium | Add lead timeline view (event->email->automation chain) |
| Dashboard widgets/analytics consistency | Many dashboards exist | Several are synthetic/mock or loosely coupled | Medium | Mark mock data, remove or wire to real sources |

---

# 8. Workflow Cleanup & Rebuild Plan

## 1) Immediate fixes
1. Freeze all non-essential email senders for lead submission (`sendWelcomeEmail`, `sendQuizSubmissionEmail`, `sendGeeniusEmail`, geeniusNonConvertedFlow `audit_submitted`) behind feature flags.
2. Keep exactly one lead-create path active: `geeniusWorkflowOrchestrator` for geenius funnel.
3. Fix broken contract: `processNurtureSequences` must pass `nurtureId` or be retired.
4. Add guardrail in every sender: reject if dedup key already exists.

## 2) Workflow consolidation
1. Introduce `Lead.primary_workflow` assigned at lead creation (`geenius`, `foxy_v2`, `referral`, `programmatic_geenius`, etc.).
2. Only workflow router can enqueue/schedule emails.
3. Retire duplicate schedulers; keep one scheduler service for all queued workflow steps.

## 3) Template system improvements
1. Move all hardcoded HTML/subjects to `EmailTemplate` records with versioning.
2. Add `WorkflowStepTemplateMap` table: `(workflow, step, template_id, delay, channel)`.
3. Enforce template rendering + preview via one renderer service.

## 4) Admin controls needed
1. Workflow matrix editor: map funnel -> welcome/nurture/abandon/admin-alert templates.
2. Pause/resume by workflow and by step (real runtime effect).
3. Per-lead timeline page with dedup and suppression decisions.
4. Audience/tag logic editor with validation.

## 5) Automation cleanup
1. Replace mock `admin/*Automation` with real CRUD against automation registry.
2. Remove or archive legacy processors (`processLeadNurture`, old reengagement/welcome stacks) once migrated.
3. Keep one execution engine for scheduled sends (`processScheduledEmails` successor).

## 6) Risk reduction steps
1. Idempotency keys on every send: `lead_id + workflow + step + version`.
2. Transactional send log write before send attempt (`pending` -> `sent`/`failed`).
3. Add anomaly alert: >2 customer emails within 10 minutes after lead creation.
4. Add workflow unit tests for “new lead gets exactly one welcome”.

---

# 9. Top 10 Fixes

## CRITICAL
1. Enforce one primary workflow per lead (`Lead.primary_workflow`) and block cross-workflow sends.
2. Kill overlapping immediate welcome paths; keep one canonical lead-create welcome.
3. Replace mock automation admin backend with real persistence/control.
4. Implement global idempotency/dedup keys for all email sends.

## HIGH
5. Fix `processNurtureSequences` / `sendFoxyNurtureEmail` parameter mismatch or remove one path.
6. Build template mapping system (funnel -> step -> template) and migrate hardcoded copy.
7. Add admin timeline trace for each lead (event->automation->email chain).

## MEDIUM
8. Rationalize abandoned flows (quiz/geenius/cart) to avoid redundant reminders.
9. Create explicit referral workflow (welcome/nurture/admin alert) rather than ad-hoc conversion emails.

## LOW
10. Clean up testing/dashboard copy that claims full automation readiness when backend is partially mocked.
