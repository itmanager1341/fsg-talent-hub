# FSG Talent Hub - Development Plan V3

**Version:** 3.0
**Created:** 2024-12-23
**Status:** 🟡 Planning
**Focus:** ATS (Applicant Tracking System) Layer

---

## Overview

V3 transforms FSG Talent Hub from a job board into a full Applicant Tracking System (ATS) by adding:
- Real-time messaging between employers and candidates
- Interview scheduling with calendar integration
- Application pipeline with customizable stages
- Enhanced analytics and reporting

---

## Prerequisites (From V2)

Before starting V3, ensure these V2 items are complete:

- [x] AI Resume Builder
- [x] Vector Search (pgvector)
- [x] Resume Database for Employers
- [x] AI Applicant Ranking
- [x] External Job Import System
- [x] Playwright E2E Testing Framework
- [ ] Brand Context Layers (DEFERRED)

---

## V3 Phases

### Phase 1: Messaging System

**Goal:** Enable direct communication between employers and candidates.

#### Database Schema

```sql
-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  employer_user_id UUID NOT NULL REFERENCES auth.users(id),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  subject TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('employer', 'candidate')),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversations_employer ON conversations(employer_user_id);
CREATE INDEX idx_conversations_candidate ON conversations(candidate_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    auth.uid() = employer_user_id OR
    auth.uid() IN (SELECT user_id FROM candidates WHERE id = candidate_id)
  );

CREATE POLICY "Users can insert messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.employer_user_id = auth.uid() OR
           c.candidate_id IN (SELECT id FROM candidates WHERE user_id = auth.uid()))
    )
  );
```

#### Implementation Tasks

- [ ] Create database migrations
- [ ] Build conversation list UI for employers
- [ ] Build conversation list UI for candidates
- [ ] Create message thread component
- [ ] Implement real-time updates with Supabase Realtime
- [ ] Add message notifications
- [ ] Add "Contact Candidate" button on applicant cards
- [ ] Add "Message Employer" button on job applications
- [ ] Create message composer with attachments
- [ ] Add unread message indicators

#### Files to Create

- `src/app/employers/messages/page.tsx` - Employer inbox
- `src/app/employers/messages/[conversationId]/page.tsx` - Conversation view
- `src/app/account/candidate/messages/page.tsx` - Candidate inbox
- `src/components/messaging/ConversationList.tsx`
- `src/components/messaging/MessageThread.tsx`
- `src/components/messaging/MessageComposer.tsx`
- `src/lib/services/messaging.ts`

---

### Phase 2: Interview Scheduling

**Goal:** Enable employers to schedule interviews with candidates.

#### Database Schema

```sql
-- Interviews table
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  scheduled_by UUID NOT NULL REFERENCES auth.users(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  timezone TEXT DEFAULT 'America/New_York',
  type TEXT DEFAULT 'video' CHECK (type IN ('phone', 'video', 'in_person')),
  location TEXT, -- Physical location or notes
  meeting_url TEXT, -- Video call link
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  candidate_notes TEXT,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability slots (for candidate availability)
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_interviews_application ON interviews(application_id);
CREATE INDEX idx_interviews_scheduled ON interviews(scheduled_at);
CREATE INDEX idx_availability_candidate ON availability_slots(candidate_id);
```

#### Implementation Tasks

- [ ] Create database migrations
- [ ] Build interview scheduling UI for employers
- [ ] Create candidate availability settings
- [ ] Implement calendar view component
- [ ] Add Google Calendar integration (optional)
- [ ] Create interview confirmation emails
- [ ] Add reminder system (Edge Function)
- [ ] Build interview details page
- [ ] Add reschedule/cancel functionality
- [ ] Create interview feedback form

#### Files to Create

- `src/app/employers/jobs/[id]/applications/[appId]/schedule/page.tsx`
- `src/app/account/candidate/interviews/page.tsx`
- `src/app/account/candidate/availability/page.tsx`
- `src/components/scheduling/Calendar.tsx`
- `src/components/scheduling/TimeSlotPicker.tsx`
- `src/components/scheduling/InterviewCard.tsx`
- `src/lib/services/scheduling.ts`
- `supabase/functions/send-interview-reminder/index.ts`

---

### Phase 3: Application Pipeline

**Goal:** Customizable hiring stages with kanban-style management.

#### Database Schema

```sql
-- Pipeline stages (per company)
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  position INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  auto_actions JSONB DEFAULT '{}', -- Future: automation rules
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stage history for applications
CREATE TABLE application_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_stage_id UUID REFERENCES pipeline_stages(id),
  to_stage_id UUID NOT NULL REFERENCES pipeline_stages(id),
  moved_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default stages seed
INSERT INTO pipeline_stages (company_id, name, color, position, is_default) VALUES
  (NULL, 'Applied', '#3B82F6', 0, TRUE),
  (NULL, 'Screening', '#F59E0B', 1, TRUE),
  (NULL, 'Interview', '#8B5CF6', 2, TRUE),
  (NULL, 'Offer', '#10B981', 3, TRUE),
  (NULL, 'Hired', '#059669', 4, TRUE),
  (NULL, 'Rejected', '#EF4444', 5, TRUE);

-- Add stage_id to applications
ALTER TABLE applications ADD COLUMN stage_id UUID REFERENCES pipeline_stages(id);

-- Indexes
CREATE INDEX idx_stages_company ON pipeline_stages(company_id);
CREATE INDEX idx_stage_history_application ON application_stage_history(application_id);
```

#### Implementation Tasks

- [ ] Create database migrations
- [ ] Seed default pipeline stages
- [ ] Build kanban board component
- [ ] Implement drag-and-drop stage changes
- [ ] Add stage change notifications
- [ ] Create stage management UI for employers
- [ ] Add stage history timeline
- [ ] Implement bulk stage changes
- [ ] Add stage-based filtering
- [ ] Create stage analytics

#### Files to Create

- `src/app/employers/jobs/[id]/pipeline/page.tsx` - Kanban view
- `src/app/employers/settings/pipeline/page.tsx` - Stage configuration
- `src/components/pipeline/KanbanBoard.tsx`
- `src/components/pipeline/StageColumn.tsx`
- `src/components/pipeline/ApplicationCard.tsx`
- `src/components/pipeline/StageHistory.tsx`
- `src/lib/services/pipeline.ts`

---

### Phase 4: Enhanced Analytics

**Goal:** Comprehensive hiring metrics and insights.

#### Database Schema

```sql
-- Analytics events (for detailed tracking)
CREATE TABLE hiring_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  job_id UUID REFERENCES jobs(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggregated metrics (materialized for performance)
CREATE TABLE hiring_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  job_id UUID REFERENCES jobs(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, job_id, period_start)
);
```

#### Metrics to Track

- **Time-to-Hire:** Days from job posted to candidate hired
- **Source Performance:** Which job sources produce best candidates
- **Stage Conversion:** % of candidates moving through each stage
- **Interview-to-Offer Ratio:** Success rate of interviews
- **Offer Acceptance Rate:** % of offers accepted
- **Cost-per-Hire:** If tracking ad spend
- **Quality of Hire:** Based on AI match scores

#### Implementation Tasks

- [ ] Create database migrations
- [ ] Build analytics dashboard for employers
- [ ] Implement funnel visualization
- [ ] Add time-based charts
- [ ] Create source attribution reports
- [ ] Add export to CSV functionality
- [ ] Build comparison views (period over period)
- [ ] Create job-specific analytics
- [ ] Add team performance metrics

#### Files to Create

- `src/app/employers/analytics/page.tsx` - Main analytics dashboard
- `src/app/employers/analytics/[jobId]/page.tsx` - Per-job analytics
- `src/components/analytics/HiringFunnel.tsx`
- `src/components/analytics/TimeToHireChart.tsx`
- `src/components/analytics/SourcePerformance.tsx`
- `src/components/analytics/MetricCard.tsx`
- `src/lib/services/analytics.ts`

---

## Technical Considerations

### Real-time Updates

Use Supabase Realtime for:
- New message notifications
- Stage change notifications
- Interview reminders

```typescript
// Example: Subscribe to new messages
const channel = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload) => {
      // Handle new message
    }
  )
  .subscribe();
```

### Email Notifications

Create Edge Functions for:
- New message notifications
- Interview scheduled/reminder
- Stage change alerts
- Application status updates

### Mobile Responsiveness

All new components should be mobile-first:
- Kanban board collapses to list on mobile
- Message thread optimized for mobile
- Calendar picker touch-friendly

---

## Testing Strategy

### E2E Tests to Add

- `tests/employer/messaging.spec.ts`
- `tests/employer/scheduling.spec.ts`
- `tests/employer/pipeline.spec.ts`
- `tests/employer/analytics.spec.ts`
- `tests/candidate/messaging.spec.ts`
- `tests/candidate/interviews.spec.ts`

### Integration Tests

- Message delivery and real-time updates
- Interview scheduling with timezone handling
- Pipeline stage transitions
- Analytics aggregation accuracy

---

## Timeline Estimate

| Phase | Estimated Effort |
|-------|-----------------|
| Phase 1: Messaging | 2-3 weeks |
| Phase 2: Scheduling | 2-3 weeks |
| Phase 3: Pipeline | 2 weeks |
| Phase 4: Analytics | 1-2 weeks |

**Total:** 7-10 weeks

---

## Success Criteria

### Phase 1 Complete When:
- [x] Employers can message candidates
- [x] Candidates can reply to messages
- [x] Unread indicators work
- [x] Real-time updates function

### Phase 2 Complete When:
- [x] Employers can schedule interviews
- [x] Candidates see upcoming interviews
- [x] Reminders are sent
- [x] Reschedule/cancel works

### Phase 3 Complete When:
- [x] Kanban board displays applications by stage
- [x] Drag-and-drop changes stage
- [x] Stage history is tracked
- [x] Employers can customize stages

### Phase 4 Complete When:
- [x] Analytics dashboard shows key metrics
- [x] Time-to-hire is calculated
- [x] Source attribution works
- [x] Data can be exported

---

## Related Documents

- [PRD](./01_PRD_Job_Board_Platform.md) - Full requirements
- [DEV_PLAN_v2](./DEV_PLAN_v2.md) - V2 implementation details
- [Technical Review](./03_TECHNICAL_REVIEW_Job_Board.md) - Architecture decisions
