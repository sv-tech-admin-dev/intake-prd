-- Seed data for local Supabase resets.
-- This recreates the demo record used by the app during local development.

insert into public.intake_submissions (
  id,
  token,
  schema_version,
  client_name,
  project_name,
  contact_email,
  website_type,
  status,
  readiness_score,
  owner,
  notes,
  submitted_at,
  created_at,
  updated_at
) values (
  '11111111-1111-1111-1111-111111111111',
  'demo-token',
  '1.0.0',
  'Northstar Studio',
  'Client intake blueprint',
  'owner@northstar.studio',
  'redesign',
  'draft',
  74,
  'Avery Chen',
  array['Demo record preloaded for local development.'],
  null,
  now(),
  now()
);

insert into public.intake_answers (
  id,
  submission_id,
  question_id,
  answer_value,
  is_visible_at_submission,
  hidden_answer_policy,
  created_at,
  updated_at
) values
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'clientName', to_jsonb('Northstar Studio'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'projectName', to_jsonb('Client intake blueprint'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'contactEmail', to_jsonb('owner@northstar.studio'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'websiteType', to_jsonb('redesign'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'businessGoal', to_jsonb('Increase qualified website leads and cut briefing time.'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'successMetric', to_jsonb('Qualified leads, conversion rate and shorter intake cycles.'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'currentUrl', to_jsonb('https://northstar.studio'::text), true, 'retain_for_audit', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'currentPainPoints', to_jsonb('The current site is slow to update and lacks a clear conversion path.'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'targetAudience', to_jsonb('Founders and operators who need a quick project intake process.'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'keyDifferentiator', to_jsonb('A guided intake that reduces back-and-forth.'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'pagesNeeded', to_jsonb('Home, services, about, intake, contact and FAQ.'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'contentReady', to_jsonb('partial'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'formsRequired', to_jsonb('yes'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'bookingRequired', to_jsonb('yes'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'paymentsRequired', to_jsonb('no'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'portalRequired', to_jsonb('no'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'bookingType', to_jsonb('Discovery call booking for qualified leads.'::text), true, 'clear_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'calendarTool', to_jsonb('Calendly'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'integrationsNeeded', to_jsonb('HubSpot, GA4, Slack notifications'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'seoImportant', to_jsonb('yes'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'redirectsNeeded', to_jsonb('Map old service URLs to new content structure.'::text), true, 'retain_for_audit', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'accessibilityLevel', to_jsonb('wcag_aa'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'complianceNotes', to_jsonb('No special regulatory concerns.'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'launchDate', to_jsonb('2026-07-15'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'budgetRange', to_jsonb('25k_50k'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'owner', to_jsonb('Avery Chen'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'supportNeed', to_jsonb('Monthly support and content updates.'::text), true, 'retain_when_hidden', now(), now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'notes', to_jsonb('Needs a faster intake experience than the current questionnaire.'::text), true, 'retain_when_hidden', now(), now());

insert into public.generated_documents (
  id,
  submission_id,
  document_type,
  status,
  markdown_content,
  model_name,
  estimated_cost_usd,
  created_at
) values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'prd_with_assumptions',
  'ready',
  E'# Website Blueprint PRD\n\n## Summary\nThis is a deterministic preview document generated from the intake blueprint.\n\n## Scope\n- Redesign with guided intake flow\n- Booking flow\n- SEO migration\n\n## Notes\n- Human review required before client handoff',
  'mock-openai-responses',
  0.21,
  now()
);

insert into public.notification_logs (
  id,
  submission_id,
  generated_document_id,
  channel,
  event_type,
  status,
  message,
  created_at
) values (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'email',
  'prd_generated',
  'sent',
  'Review notification sent to internal team.',
  now()
);

insert into public.audit_logs (
  id,
  actor_id,
  action,
  entity_type,
  entity_id,
  metadata,
  created_at
) values (
  '44444444-4444-4444-4444-444444444444',
  null,
  'seed.created',
  'submission',
  '11111111-1111-1111-1111-111111111111',
  '{"token":"demo-token"}'::jsonb,
  now()
);
