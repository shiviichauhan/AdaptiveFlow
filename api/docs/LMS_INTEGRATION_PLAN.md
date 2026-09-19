# LMS Integration Plan

## Executive Summary

This document outlines the integration strategy for embedding the AdaptiveFlow personalized learning recommendation engine into existing Learning Management Systems (LMS). The integration follows a microservices architecture with RESTful APIs, webhooks, and LTI (Learning Tools Interoperability) compliance.

---

## 1. Integration Architecture

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      LMS Platform                           │
│  (Canvas, Moodle, Blackboard, Custom)                       │
└─────────────────────────────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │   LTI 1.3   │
                    │   Gateway   │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐
   │ Recommendation│  │   Learner   │  │ Evaluation │
   │    Engine     │  │   State     │  │   System   │
   └──────┬──────┘  │   Service   │  └──────┬──────┘
          │         └──────┬──────┘         │
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────┴──────┐
                    │  Knowledge  │
                    │    Graph    │
                    │   Database  │
                    └─────────────┘
```

### 1.2 Deployment Options

| Option | Description | Best For |
|--------|-------------|----------|
| **SaaS API** | Cloud-hosted endpoints | Quick integration, minimal ops |
| **On-Premise** | Self-hosted containers | Data sovereignty requirements |
| **Embedded** | Library bundled with LMS | Full control, custom LMS |
| **Hybrid** | Edge + cloud combination | Performance + scalability |

---

## 2. API Specification

### 2.1 Authentication

```http
POST /api/v1/auth/token
Content-Type: application/json

{
  "client_id": "your_lms_client_id",
  "client_secret": "your_client_secret",
  "grant_type": "client_credentials"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### 2.2 Learner State Endpoints

```http
# Get learner state
GET /api/v1/learners/{learner_id}/state
Authorization: Bearer {token}

Response:
{
  "learner_id": "learner_001",
  "topic_mastery": {
    "python_basics": 0.95,
    "variables": 0.88,
    "control_flow": 0.72
  },
  "engagement_score": 0.82,
  "current_streak": 7,
  "weak_areas": ["data_structures", "oop"],
  "strong_areas": ["python_basics", "variables"],
  "last_activity": "2026-09-18T10:30:00Z"
}

# Update learner state
POST /api/v1/learners/{learner_id}/events
Authorization: Bearer {token}

{
  "interaction_type": "quiz_attempt",
  "item_id": "quiz_001",
  "value": 0.85,
  "metadata": {
    "topic_id": "control_flow",
    "time_spent_seconds": 120
  },
  "timestamp": "2026-09-18T10:30:00Z"
}
```

### 2.3 Recommendation Endpoints

```http
# Get personalized recommendations
GET /api/v1/learners/{learner_id}/recommendations?count=5
Authorization: Bearer {token}

Response:
{
  "recommendations": [
    {
      "item_id": "item_001",
      "topic_id": "data_structures",
      "title": "Lists & Arrays Deep Dive",
      "content_type": "video",
      "score": 0.92,
      "reason": "needs improvement (45% mastery)",
      "difficulty_adjustment": 0.0,
      "estimated_duration_minutes": 25
    }
  ],
  "generated_at": "2026-09-18T10:30:00Z"
}

# Get personalized learning path
GET /api/v1/learners/{learner_id}/path/{target_topic_id}
Authorization: Bearer {token}

Response:
{
  "target_topic": "oop",
  "path": [
    {"item_id": "item_010", "title": "Data Structures Review", "order": 1},
    {"item_id": "item_011", "title": "Introduction to OOP", "order": 2}
  ],
  "estimated_total_minutes": 90
}
```

### 2.4 Knowledge Graph Endpoints

```http
# Get topic prerequisites
GET /api/v1/topics/{topic_id}/prerequisites

# Get learning path between topics
GET /api/v1/topics/path?from=python_basics&to=decorators

# Get all topics
GET /api/v1/topics
```

### 2.5 Evaluation Endpoints

```http
# Get learner metrics
GET /api/v1/learners/{learner_id}/metrics

# Get aggregate system metrics
GET /api/v1/metrics/aggregate

# Log recommendation outcome
POST /api/v1/learners/{learner_id}/outcomes
{
  "item_id": "item_001",
  "completed": true,
  "score": 0.85,
  "time_spent_seconds": 300
}
```

---

## 3. LTI Integration

### 3.1 LTI 1.3 Configuration

```json
{
  "issuer": "https://your-lms-domain.com",
  "authorization_endpoint": "https://your-lms-domain.com/lti/authorize",
  "token_endpoint": "https://your-lms-domain.com/lti/token",
  "jwks_uri": "https://your-lms-domain.com/lti/jwks",
  "client_id": "adaptiveflow_client",
  "deployment_id": "deployment_001",
  "target_link_uri": "https://adaptiveflow.com/lti/launch",
  "redirect_uris": ["https://adaptiveflow.com/lti/callback"],
  "scopes": [
    "https://purl.imsglobal.org/spec/lti-ags/scope/score",
    "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem",
    "https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly"
  ]
}
```

### 3.2 LTI Launch Flow

```
┌─────────┐     ┌─────────┐     ┌─────────────┐
│   LMS   │────▶│  LTI    │────▶│ AdaptiveFlow│
│         │     │ Launch  │     │  Dashboard  │
└─────────┘     └─────────┘     └─────────────┘
     │              │                  │
     │    1. Deep Linking Request      │
     │◀─────────────┤                  │
     │              │                  │
     │    2. JWT with user context     │
     │─────────────▶│                  │
     │              │                  │
     │    3. Redirect to dashboard     │
     │─────────────┼─────────────────▶│
     │              │                  │
     │    4. Session established       │
     │              │◀─────────────────│
```

### 3.3 Grade Passback

```http
POST /api/v1/lti/scores
Authorization: Bearer {lti_token}

{
  "userId": "student_123",
  "activityItemId": "assessment_001",
  "scoreGiven": 85,
  "scoreMaximum": 100,
  "timestamp": "2026-09-18T10:30:00Z",
  "comment": "Great improvement in control flow!"
}
```

---

## 4. Webhook Integration

### 4.1 Event Subscriptions

```http
POST /api/v1/webhooks
Authorization: Bearer {token}

{
  "url": "https://your-lms.com/webhooks/adaptiveflow",
  "events": [
    "learner.mastery_updated",
    "learner.milestone_reached",
    "recommendation.generated",
    "assessment.completed"
  ],
  "secret": "your_webhook_secret"
}
```

### 4.2 Webhook Payloads

```json
{
  "event": "learner.mastery_updated",
  "timestamp": "2026-09-18T10:30:00Z",
  "data": {
    "learner_id": "learner_001",
    "topic_id": "control_flow",
    "previous_mastery": 0.65,
    "new_mastery": 0.72,
    "trigger": "quiz_attempt"
  },
  "signature": "sha256=..."
}
```

### 4.3 Webhook Verification

```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

---

## 5. Data Synchronization

### 5.1 Initial Sync

```http
POST /api/v1/sync/initial
Authorization: Bearer {token}

{
  "learners": [
    {
      "external_id": "lms_student_123",
      "email": "student@university.edu",
      "name": "Jordan Smith",
      "enrolled_courses": ["CS101", "CS102"]
    }
  ],
  "courses": [
    {
      "external_id": "CS101",
      "name": "Introduction to Programming",
      "topics": ["python_basics", "variables", "control_flow"]
    }
  ]
}
```

### 5.2 Incremental Sync

```http
POST /api/v1/sync/incremental
Authorization: Bearer {token}

{
  "since": "2026-09-17T00:00:00Z",
  "changes": [
    {
      "type": "enrollment",
      "learner_id": "lms_student_456",
      "course_id": "CS101"
    },
    {
      "type": "completion",
      "learner_id": "lms_student_123",
      "item_id": "quiz_001",
      "score": 0.85
    }
  ]
}
```

### 5.3 Real-time Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `learner.activity` | LMS → AF | User interaction in LMS |
| `recommendation.ready` | AF → LMS | New recommendations available |
| `mastery.achieved` | AF → LMS | Topic mastery threshold met |
| `path.completed` | AF → LMS | Learning path finished |

---

## 6. Embedding Options

### 6.1 iframe Embedding

```html
<iframe 
  src="https://adaptiveflow.com/embed/dashboard?learner_id=123&token=abc"
  width="100%" 
  height="800"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
></iframe>
```

### 6.2 React Component

```jsx
import { AdaptiveFlowDashboard } from '@adaptiveflow/react';

function CoursePage({ learnerId, courseId }) {
  return (
    <AdaptiveFlowDashboard
      learnerId={learnerId}
      courseId={courseId}
      theme="dark"
      onRecommendationClick={(item) => {
        // Navigate to learning item
        window.location.href = item.url;
      }}
      onMasteryAchieved={(topic) => {
        // Update LMS gradebook
        updateGradebook(learnerId, topic);
      }}
    />
  );
}
```

### 6.3 Widget Configuration

```json
{
  "position": "sidebar",
  "width": "350px",
  "height": "600px",
  "theme": "dark",
  "features": {
    "recommendations": true,
    "knowledge_graph": true,
    "progress_tracker": true,
    "streak_counter": true
  },
  "branding": {
    "logo_url": "https://your-lms.com/logo.png",
    "primary_color": "#00d4ff"
  }
}
```

---

## 7. Security Considerations

### 7.1 Authentication

- OAuth 2.0 with JWT tokens
- API key rotation every 90 days
- Rate limiting: 1000 requests/minute per client

### 7.2 Data Privacy

```yaml
Data Handling:
  - All PII encrypted at rest (AES-256)
  - TLS 1.3 for all transmissions
  - GDPR compliant data retention
  - Right to deletion API endpoint
  - Data residency options: US, EU, APAC

Access Control:
  - RBAC: Admin, Instructor, Student roles
  - Course-level data isolation
  - Audit logging for all data access
```

### 7.3 Compliance

| Standard | Status | Notes |
|----------|--------|-------|
| GDPR | Compliant | Data processing agreement available |
| FERPA | Compliant | Student records protection |
| SOC 2 Type II | Certified | Annual audit |
| ISO 27001 | Certified | Information security management |

---

## 8. Implementation Phases

### Phase 1: Foundation (Weeks 1-4)

- [ ] Set up API gateway and authentication
- [ ] Deploy recommendation engine microservice
- [ ] Implement learner state service
- [ ] Create basic REST endpoints
- [ ] Set up monitoring and logging

### Phase 2: LMS Integration (Weeks 5-8)

- [ ] Implement LTI 1.3 provider
- [ ] Build grade passback functionality
- [ ] Create webhook system
- [ ] Develop data sync mechanisms
- [ ] Test with pilot LMS (Canvas/Moodle)

### Phase 3: Dashboard & UI (Weeks 9-12)

- [ ] Build embeddable React components
- [ ] Create iframe embedding options
- [ ] Implement real-time updates (WebSocket)
- [ ] Design responsive dashboard
- [ ] Add accessibility features (WCAG 2.1)

### Phase 4: Evaluation & Optimization (Weeks 13-16)

- [ ] Deploy evaluation metrics system
- [ ] Implement A/B testing framework
- [ ] Create analytics dashboard for admins
- [ ] Optimize recommendation algorithms
- [ ] Document API and create SDKs

---

## 9. SDK Availability

### JavaScript/TypeScript

```bash
npm install @adaptiveflow/sdk
```

```javascript
import { AdaptiveFlow } from '@adaptiveflow/sdk';

const af = new AdaptiveFlow({
  apiKey: 'your_api_key',
  environment: 'production'
});

const recommendations = await af.recommendations.get('learner_001', { count: 5 });
```

### Python

```bash
pip install adaptiveflow
```

```python
from adaptiveflow import AdaptiveFlowClient

client = AdaptiveFlowClient(api_key="your_api_key")
recommendations = client.recommendations.get("learner_001", count=5)
```

### REST API

```bash
curl -X GET "https://api.adaptiveflow.com/v1/learners/learner_001/recommendations" \
  -H "Authorization: Bearer your_token"
```

---

## 10. Support & Resources

| Resource | URL |
|----------|-----|
| API Documentation | https://docs.adaptiveflow.com |
| Developer Portal | https://developers.adaptiveflow.com |
| Status Page | https://status.adaptiveflow.com |
| Support Email | integration@adaptiveflow.com |
| Slack Community | https://adaptiveflow.slack.com |

---

## Appendix A: Sample Integration Code

### Canvas LMS Integration

```python
from flask import Flask, request, redirect
from pylti1p3.tool_config import ToolConfDict
from pylti1p3.launch_data_storage import LaunchDataDB

app = Flask(__name__)

tool_conf = ToolConfDict({
    "client_id": "adaptiveflow_client",
    "auth_login_url": "https://canvas.edu/lti/authorize",
    "auth_token_url": "https://canvas.edu/lti/token",
    "key_set_url": "https://canvas.edu/lti/jwks",
    "deployment_id": "1",
    "issuer": "https://canvas.edu",
    "launch_wizard_enabled": False,
    "target_link_uri": "https://adaptiveflow.com/lti/launch",
    "redirect_uris": ["https://adaptiveflow.com/lti/callback"]
})

@app.route("/lti/launch", methods=["POST"])
def lti_launch():
    launch_data = request.form
    
    learner_id = launch_data.get("sub")
    course_id = launch_data.get("context_id")
    
    return redirect(
        f"https://adaptiveflow.com/dashboard"
        f"?learner_id={learner_id}"
        f"&course_id={course_id}"
        f"&token={generate_session_token(learner_id)}"
    )
```

### Moodle Plugin Configuration

```php
<?php
// mod/adaptiveflow/settings.php

$settings->add('adaptiveflow_api_key', new admin_setting_configtext(
    'adaptiveflow/api_key',
    'API Key',
    'Enter your AdaptiveFlow API key',
    '',
    PARAM_ALPHANUMERIC
));

$settings->add('adaptiveflow_api_url', new admin_setting_configurl(
    'adaptiveflow/api_url',
    'API URL',
    'Enter the AdaptiveFlow API endpoint',
    'https://api.adaptiveflow.com/v1'
));
```

---

*Document Version: 1.0*  
*Last Updated: September 2026*  
*Contact: integration@adaptiveflow.com*