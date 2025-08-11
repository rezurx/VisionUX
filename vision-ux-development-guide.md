# Vision UX Research Suite - Development Guide

## Project Overview

**Vision UX Research Suite** is the "MS Office of UX Research" - an integrated platform that combines video analysis, surveys, card sorting, and AI-powered insights into one seamless workflow. This replaces the fragmented tool landscape where researchers juggle Morae, UserZoom, SurveyMonkey, and dozens of other point solutions.

## Core Value Proposition

- **Integrated Research Workflow**: All UX research methods in one platform
- **AI-Powered Insights**: Automated transcription, sentiment analysis, persona generation
- **Real-time Collaboration**: Multiple researchers working together on analysis
- **Cross-Method Intelligence**: AI finds patterns across video, survey, and card sort data
- **Modern UX**: Fast, responsive, works on any device

## Target Users

- UX Researchers
- Product Managers
- Design Teams
- User Research Agencies
- Enterprise UX teams

## Technical Architecture

### Tech Stack

**Frontend:**
- Next.js 15 with App Router
- TypeScript (strict mode)
- Tailwind CSS for styling
- Shadcn/ui for component library
- Zustand for state management
- React Query/TanStack Query for data fetching

**Backend:**
- Next.js API routes or Express.js
- PostgreSQL with Prisma ORM
- Redis for caching and real-time features
- S3/Cloudflare R2 for video storage
- WebSockets for real-time collaboration

**AI Integration:**
- OpenAI API (GPT-4) for text analysis
- Anthropic API (Claude) for research synthesis
- Whisper API for transcription
- Custom models for UX-specific tasks

**Video Processing:**
- FFmpeg for video manipulation
- WebRTC for recording
- HLS/DASH for streaming
- Video.js or custom player

### Repository Structure

```
vision-ux-suite/
├── apps/
│   ├── web/                 # Next.js frontend
│   ├── api/                 # Backend services
│   └── desktop/             # Electron app (future)
├── packages/
│   ├── ui/                  # Shared components
│   ├── database/            # Prisma schema
│   ├── ai/                  # AI processing modules
│   ├── video/               # Video processing utilities
│   └── auth/                # Authentication utilities
├── docs/
├── scripts/
└── docker/
```

## Core Features

### 1. Video Analysis Engine (Morae Replacement)

**Core Components:**
- **VideoPlayer**: Frame-accurate video player with timeline
- **TaggingSystem**: Real-time collaborative tagging
- **TranscriptionEngine**: AI-powered transcription with speaker identification
- **EmotionAnalysis**: Facial expression and voice sentiment analysis
- **HighlightGenerator**: Automatic creation of insight clips
- **SessionComparison**: Side-by-side analysis of multiple sessions

**Key Requirements:**
- Support for multiple video streams (screen + webcam)
- Frame-accurate seeking and tagging
- Real-time collaboration (multiple researchers tagging simultaneously)
- Export capabilities (video clips, reports, timestamps)

### 2. Survey Builder (SurveyMonkey Alternative)

**Features:**
- Drag-and-drop survey builder
- Logic branching and skip patterns
- Multiple question types (rating scales, matrix, open-ended)
- Real-time response analytics
- Integration with video sessions (pre/post surveys)
- AI-powered response analysis

### 3. Card Sorting Integration

**Integration Points:**
- Existing card sorting tool API integration
- Unified participant management
- Cross-method analysis (card sort results vs. actual navigation behavior)
- Combined reporting

### 4. AI Insight Engine

**Capabilities:**
- **Persona Generation**: Auto-create personas from research data
- **Journey Mapping**: Emotional journey analysis from video + survey data
- **User Story Generation**: AI-generated user stories with acceptance criteria
- **Pattern Recognition**: Cross-study insight detection
- **Sentiment Analysis**: Emotional timeline throughout sessions
- **Quote Mining**: Automatically extract meaningful user quotes

### 5. Research Repository

**Features:**
- AI-powered search across all research data
- Tagging and categorization system
- Version control for research artifacts
- Stakeholder sharing and collaboration
- Trend analysis across multiple studies

## Database Schema (Prisma)

### Core Entities

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      UserRole
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  studies     Study[]
}

model Study {
  id          String    @id @default(cuid())
  name        String
  type        StudyType
  status      StudyStatus
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id])
  sessions    Session[]
  surveys     Survey[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Session {
  id            String     @id @default(cuid())
  studyId       String
  study         Study      @relation(fields: [studyId], references: [id])
  participantId String
  videoUrl      String?
  transcriptUrl String?
  duration      Int?
  tags          Tag[]
  highlights    Highlight[]
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

model Tag {
  id        String   @id @default(cuid())
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [id])
  timestamp Float
  content   String
  category  String?
  userId    String
  createdAt DateTime @default(now())
}

model Highlight {
  id        String   @id @default(cuid())
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [id])
  startTime Float
  endTime   Float
  title     String
  description String?
  videoUrl  String?
  createdAt DateTime @default(now())
}

enum StudyType {
  VIDEO_ANALYSIS
  SURVEY
  CARD_SORT
  USABILITY_TEST
}

enum StudyStatus {
  DRAFT
  ACTIVE
  COMPLETED
  ARCHIVED
}

enum UserRole {
  ADMIN
  RESEARCHER
  STAKEHOLDER
}
```

## Development Phases - IMPLEMENTATION STRATEGY

### Phase 1: Foundation Extensions (Weeks 1-2) ✅ CURRENT PRIORITY
**Goal**: Enhance existing card sorting foundation for multi-method research

**Current Foundation Advantages:**
- ✅ React + TypeScript + Vite architecture established
- ✅ Component-based structure with modular components/
- ✅ Study management system fully functional
- ✅ Participant access and flow systems working
- ✅ D3.js analytics infrastructure established
- ✅ Data persistence with localStorage (ready for database upgrade)

**Phase 1 Tasks - Building on Existing Foundation:**
1. **UI/UX Polish** (Immediate)
   - Improve existing button styling and layout consistency
   - Add loading states to current analytics
   - Mobile responsiveness for existing features
   - Accessibility improvements (ARIA labels)

2. **Architecture Extensions** (Week 1)
   - Extend existing `types.ts` Study interface for multi-method support
   - Add new study types to current study management system
   - Enhance existing StudyResult interface for new data types

3. **Survey Builder Integration** (Week 1-2)
   - Add survey creation to existing study configuration flow
   - Extend participant flow to handle survey studies  
   - Add survey analytics to existing AnalyticsDashboard
   - Use existing CSV export system for survey data

4. **Accessibility Scanner** (Week 2)
   - New study type using existing study management
   - axe-core integration for WCAG compliance testing
   - Add accessibility metrics to existing analytics

5. **Design System Analytics** (Week 2)  
   - Extend existing D3.js charts with component usage tracking
   - Figma API integration for design token analysis
   - Design debt visualization using existing chart infrastructure

**Success Criteria:**
- All existing card sorting/tree testing functionality preserved
- Survey creation and deployment working
- Basic accessibility testing functional
- Design system tracking operational
- 80% code reuse from existing foundation

### Phase 2: Advanced Analytics & Multi-Method Intelligence (Weeks 3-4)
**Goal**: AI-powered insights and cross-method analysis using existing analytics foundation

**Building on Phase 1 Foundation:**
- ✅ Extended study management system supports multiple research methods
- ✅ Enhanced analytics dashboard with survey + accessibility + design system data
- ✅ Unified participant flow handles all study types

**Phase 2 Tasks - Advanced Analytics:**
1. **Prototype Testing Integration** (Week 3)
   - Extend existing participant flow for prototype interaction tracking
   - Heatmap visualization using existing D3.js infrastructure
   - Integration with Figma/InVision APIs for prototype embedding
   - A/B test management using existing study configuration

2. **Behavioral Analytics Enhancement** (Week 3-4)  
   - MediaPipe integration for emotion detection (free API)
   - Enhanced sentiment analysis building on existing analytics functions
   - Cognitive load measurement correlating with task completion times
   - Attention mapping using existing interaction tracking

3. **AI-Powered Cross-Method Analysis** (Week 4)
   - OpenAI API integration for pattern recognition across study data
   - Automated insight generation from survey + card sort + accessibility results
   - AI-powered search across all research repository data
   - Basic persona generation from combined research data

4. **Competitive Intelligence** (Week 4)
   - Automated competitor UX monitoring using web scraping
   - Pattern library comparison tools
   - Integration with existing analytics for benchmark comparison

**Success Criteria:**
- Prototype testing with heatmap analysis functional
- AI insights generated from multi-method data
- Cross-study pattern recognition working
- Competitive analysis integrated into existing dashboard

### Phase 3: Video Analysis Engine (Weeks 5-6) 
**Goal**: Professional video research capabilities (Morae replacement)

**Major Infrastructure Addition:**
- Database upgrade from localStorage to PostgreSQL + Prisma
- Real-time collaboration with WebSocket integration  
- Video processing and storage infrastructure

**Phase 3 Tasks - Video Research Platform:**
1. **Database & Infrastructure Upgrade** (Week 5)
   - Migration from localStorage to PostgreSQL with Prisma
   - Redis integration for real-time features and caching
   - Video storage setup (Cloudflare R2 or AWS S3)
   - WebSocket infrastructure for real-time collaboration

2. **Video Player & Analysis** (Week 5-6)
   - Frame-accurate video player component (extending existing participant interface patterns)
   - Real-time collaborative tagging system
   - Video timeline integration with existing analytics visualizations
   - Session comparison tools using existing comparison logic

3. **AI Video Analysis** (Week 6)
   - OpenAI Whisper integration for automatic transcription
   - Emotion analysis using MediaPipe (established in Phase 2)
   - Automatic highlight generation using AI analysis
   - Speaker identification and conversation flow analysis

4. **Video Analytics Integration** (Week 6)
   - Video-specific analytics added to existing AnalyticsDashboard
   - Emotion timeline visualization using existing D3.js infrastructure
   - Cross-video pattern analysis
   - Integration with existing CSV export for video insights

**Success Criteria:**
- Frame-accurate video playback with collaborative tagging
- Automatic transcription and emotion analysis
- Real-time multi-user collaboration functional
- Video analytics integrated with existing dashboard

### Phase 4: Advanced UX Methods & Production Polish (Weeks 7-8)
**Goal**: Emerging technology integration and production readiness

**Phase 4 Tasks - Next-Gen Research:**
1. **Voice & Conversational UX** (Week 7)
   - Voice interface testing capabilities
   - Chatbot conversation analysis
   - Integration with existing video analysis for voice sentiment
   - Conversational flow analytics using existing pattern recognition

2. **AR/VR & Emerging Tech** (Week 7)
   - WebXR API integration for spatial interface testing
   - 3D interaction tracking and visualization
   - Cross-device testing coordination
   - Gesture interaction analysis

3. **Longitudinal & Contextual Research** (Week 8)
   - Extended time-series analysis building on existing analytics
   - Diary study platform integration
   - Context-aware research data collection
   - Habit formation tracking using existing behavioral analytics

4. **Production Polish** (Week 8)
   - Performance optimization for all research methods
   - Advanced mobile responsiveness  
   - User onboarding flow for the complete research suite
   - Enterprise-grade security and compliance features
   - Documentation and help system for all research methods

## Technical Considerations

### Performance Requirements
- Video files up to 2GB
- Real-time collaboration for 10+ concurrent users
- Sub-second search across research repository
- AI processing within 30 seconds for most tasks

### Security & Privacy
- GDPR compliance for user data
- Encrypted video storage
- Role-based access controls
- Audit logging for research data

### Scalability
- Horizontal scaling with load balancers
- CDN for video delivery
- Database sharding for large datasets
- Microservices architecture for independent scaling

## API Design - COMPREHENSIVE RESEARCH SUITE

### Foundation APIs (Building on Existing localStorage System)

```typescript
// Studies (Enhanced from existing system)
GET    /api/studies               # Get all studies (replaces localStorage)
POST   /api/studies               # Create study (any type: card-sort, survey, video, etc.)
PUT    /api/studies/:id           # Update study configuration
DELETE /api/studies/:id           # Delete study

// Participants (Enhanced from existing system) 
GET    /api/studies/:id/participants    # Get study participants
POST   /api/studies/:id/participants    # Add participant
GET    /api/participants/:id/results    # Get participant results (all study types)

// Multi-Method Results (Enhanced from existing system)
POST   /api/studies/:id/results         # Submit results (card-sort, survey, video, etc.)
GET    /api/studies/:id/analytics       # Get study analytics (extends existing D3.js data)
GET    /api/studies/:id/export          # Export study data (extends existing CSV)
```

### Phase 1 APIs (Survey + Accessibility + Design System)

```typescript
// Survey Management
GET    /api/studies/:id/survey          # Get survey configuration
PUT    /api/studies/:id/survey          # Update survey questions/logic
POST   /api/surveys/:id/responses       # Submit survey response
GET    /api/surveys/:id/analytics       # Survey response analytics

// Accessibility Testing
POST   /api/accessibility/scan          # Run WCAG compliance scan
GET    /api/accessibility/:id/results   # Get accessibility results
POST   /api/accessibility/batch-scan    # Bulk accessibility scanning

// Design System Analytics
GET    /api/design-systems/:id          # Get design system configuration
POST   /api/design-systems/:id/track    # Track component usage
GET    /api/design-systems/:id/metrics  # Design system adoption metrics
POST   /api/figma/extract-tokens        # Extract design tokens from Figma
```

### Phase 2 APIs (Advanced Analytics + AI)

```typescript
// Prototype Testing
POST   /api/prototypes/embed            # Embed prototype for testing
POST   /api/prototypes/:id/interactions # Track prototype interactions
GET    /api/prototypes/:id/heatmap      # Generate interaction heatmap
POST   /api/prototypes/:id/ab-test      # A/B test prototype variants

// AI Analysis (Cross-Method Intelligence)
POST   /api/ai/analyze-patterns         # Find patterns across all study data
POST   /api/ai/generate-personas        # Generate personas from multi-method data  
POST   /api/ai/extract-insights         # Extract insights from research data
GET    /api/search/intelligent          # AI-powered search across all research

// Behavioral Analytics
POST   /api/behavior/emotion-analysis   # Analyze emotions from video/audio
GET    /api/behavior/:id/timeline       # Emotional timeline for session
POST   /api/behavior/cognitive-load     # Measure cognitive load from interactions
```

### Phase 3 APIs (Video Analysis Engine)

```typescript
// Video Sessions
POST   /api/video/upload                # Upload video for analysis
GET    /api/video/:id/stream            # Stream video with HLS/DASH
POST   /api/video/:id/transcribe        # Start AI transcription
GET    /api/video/:id/transcript        # Get transcription results

// Video Collaboration  
POST   /api/video/:id/tags              # Add collaborative tags
PUT    /api/video/tags/:id              # Update tag
DELETE /api/video/tags/:id              # Delete tag
GET    /api/video/:id/highlights        # Get video highlights/clips

// Real-time Collaboration (WebSocket)
WS     /api/ws/video/:id               # Real-time video collaboration
WS     /api/ws/studies/:id             # Real-time study collaboration

// AI Video Processing
POST   /api/ai/emotion-detection        # Detect emotions in video
POST   /api/ai/generate-highlights      # Auto-generate highlight clips
POST   /api/ai/speaker-identification   # Identify speakers in video
GET    /api/ai/video-insights/:id       # Get AI insights from video
```

### Phase 4 APIs (Advanced Methods)

```typescript
// Voice & Conversational UX
POST   /api/voice/analyze-conversation  # Analyze voice interactions
GET    /api/voice/:id/sentiment         # Voice sentiment analysis
POST   /api/chatbot/analyze-flow        # Analyze chatbot conversations

// AR/VR Research
POST   /api/xr/start-session            # Start AR/VR research session
POST   /api/xr/:id/track-interaction    # Track 3D interactions
GET    /api/xr/:id/spatial-analytics    # Spatial interaction analytics

// Longitudinal Research
POST   /api/longitudinal/diary-entry    # Submit diary study entry
GET    /api/longitudinal/:id/timeline   # Get participant journey timeline
POST   /api/longitudinal/context        # Submit contextual research data
```

## Development Environment Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- FFmpeg for video processing

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@localhost:5432/vision_ux
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
S3_BUCKET=your-s3-bucket
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
```

### Getting Started

```bash
# Clone and setup
git clone https://github.com/username/vision-ux-suite
cd vision-ux-suite
npm install

# Setup database
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev
```

## Testing Strategy

### Unit Tests
- Component testing with React Testing Library
- API endpoint testing with Jest
- Database model testing

### Integration Tests
- End-to-end user workflows with Playwright
- AI pipeline testing
- Video processing pipeline testing

### Performance Tests
- Load testing for concurrent users
- Video upload/processing performance
- Database query optimization

## Deployment

### Production Stack
- **Frontend**: Vercel or Netlify
- **Backend**: Railway, Render, or AWS
- **Database**: PlanetScale or Supabase
- **Video Storage**: Cloudflare R2 or AWS S3
- **CDN**: Cloudflare

### CI/CD Pipeline
- Automated testing on PR
- Staging deployments for review
- Production deployments on merge to main
- Database migration automation

## Success Metrics

### Technical Metrics
- Page load time < 2 seconds
- Video upload success rate > 99%
- AI processing accuracy > 90%
- System uptime > 99.9%

### Business Metrics
- User session duration
- Feature adoption rates
- Customer retention
- Time-to-insight reduction vs. existing tools

## Future Roadmap

### Version 2.0
- Mobile app for field research
- Advanced biometric integration
- Custom AI model training
- Enterprise SSO and compliance features

### Version 3.0
- AR/VR research capabilities
- Advanced predictive analytics
- Industry-specific templates
- API marketplace for integrations

---

## Getting Started with Claude Code

This document provides the complete technical specification for building Vision UX Research Suite. Use this as your reference for:

1. **Architecture decisions** - Tech stack and system design
2. **Feature requirements** - What to build and why
3. **Development phases** - Step-by-step implementation plan
4. **Technical specifications** - Database schema, API design, performance requirements

Start with Phase 1 and build iteratively. Each phase should result in a working, demonstrable feature set that provides value to users.

## Implementation Strategy - Building on Existing Foundation

### Current Card Sorting Foundation = Perfect Starting Point
Your existing card sorting application provides the ideal foundation for Vision UX Research Suite:

**✅ Established Architecture (80% Reusable):**
- React + TypeScript + Vite + Tailwind CSS
- Component-based structure (`components/participant/`, `components/analytics/`)
- D3.js analytics infrastructure with advanced visualizations
- Study management system with participant flow
- Data persistence and CSV export capabilities

**✅ Proven Systems (Ready for Extension):**
- Study creation, configuration, and lifecycle management
- Participant access via codes/links with session tracking
- Real-time data collection and storage
- Professional analytics dashboard with dendrogram, similarity matrix, rainbow charts
- CSV import/export system for research data

### Phase-by-Phase Evolution Strategy

**Phase 1 (Immediate)**: Extend existing systems
- Survey builder uses existing study configuration patterns
- Accessibility testing becomes new study type in current management system
- Design system analytics extends existing D3.js visualizations
- **Result**: Multi-method research platform with 80% code reuse

**Phase 2**: Add AI intelligence to existing data
- Cross-method analysis uses existing analytics infrastructure  
- AI insights layer over existing study results
- Enhanced behavioral analytics builds on existing participant tracking
- **Result**: AI-powered research insights across all methods

**Phase 3**: Major video infrastructure addition
- Video analysis engine as major new capability
- Real-time collaboration extends existing participant systems
- Database upgrade from localStorage to PostgreSQL
- **Result**: Complete Morae replacement integrated with existing platform

**Phase 4**: Advanced methods and production polish
- Emerging tech integration (AR/VR, voice, longitudinal)
- Enterprise features and scalability
- **Result**: Industry-leading comprehensive UX research suite

### Key Success Factor: Progressive Enhancement
Each phase builds on previous work without breaking existing functionality. Your card sorting users continue working while you add survey, video, and AI capabilities around them.

**Start with Phase 1 foundation extensions - that's where the most immediate value and market differentiation lies.**