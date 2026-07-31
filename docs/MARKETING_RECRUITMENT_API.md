# ALEF DELTA Marketing Recruitment API

This API lets a separate public marketing website display active ERP vacancies and submit applications directly into **Staff Portal → Job Applications**.

## Connection

- Production API base: `https://erp-api.alefdelta.com/api/public/recruitment`
- Authentication: none for these public endpoints
- Request and response format: JSON (`application/json`)
- Local marketing sites are already allowed from any `http://localhost:<port>` or `http://127.0.0.1:<port>` origin.
- Do not use or expose an ERP JWT token on the marketing website.

## Endpoints

| Method | Endpoint | Purpose | Rate limit |
|---|---|---|---|
| `GET` | `/vacancies` | List active vacancies | 60/minute/IP |
| `GET` | `/vacancies/{id}` | Get one active vacancy | 60/minute/IP |
| `GET` | `/jobs` | List active selectable job types | 60/minute/IP |
| `POST` | `/applications` | Submit a public application | 5/minute/IP |

Inactive vacancies are never returned and cannot receive public applications.

## 1. List vacancies

```http
GET https://erp-api.alefdelta.com/api/public/recruitment/vacancies
Accept: application/json
```

Example response:

```json
{
  "data": [
    {
      "id": 4,
      "title_en": "Security Guard",
      "title_am": "የደህንነት ጠባቂ",
      "description": "Skills and job requirements...",
      "qualification": "Education and certification requirements...",
      "more_info": "Work location, benefits, and application instructions...",
      "number_of_employees": 10,
      "created_at": "2026-08-01T08:30:00.000000Z"
    }
  ]
}
```

All text fields except the titles can be `null`. Render null fields conditionally.

## 2. Vacancy details

```http
GET https://erp-api.alefdelta.com/api/public/recruitment/vacancies/4
Accept: application/json
```

Success uses the same vacancy object inside `data`. An inactive or unknown vacancy returns HTTP `404`.

## 3. List job options

This endpoint is optional. Use it if the public application form lets candidates select one or more general job categories in addition to the vacancy.

```http
GET https://erp-api.alefdelta.com/api/public/recruitment/jobs
```

```json
{
  "data": [
    {
      "id": 2,
      "category_id": 1,
      "job_code": "SEC-001",
      "job_name": "Day Shift Security Guard",
      "description": "Optional description",
      "category": { "id": 1, "name": "Security" }
    }
  ]
}
```

Payroll, salary, tax, and internal configuration are intentionally excluded.

## 4. Submit an application

```http
POST https://erp-api.alefdelta.com/api/public/recruitment/applications
Content-Type: application/json
Accept: application/json
```

```json
{
  "vacancy_id": 4,
  "applicant_id": "Abebe Kebede",
  "age": 27,
  "sex": "MALE",
  "education": "Diploma in Security Management",
  "experience": "Three years of commercial security experience.",
  "job_ids": [2],
  "privacy_consent": true,
  "website": ""
}
```

### Application fields

| Field | Required | Type/rule | UI recommendation |
|---|---|---|---|
| `vacancy_id` | Yes | Active vacancy integer ID | Set from the vacancy detail page; hidden input is fine |
| `applicant_id` | Yes | Full applicant name, 2–255 characters | Text input labelled “Full name” |
| `age` | Yes | Integer, 15–100 | Number input |
| `sex` | Yes | Exact value `MALE` or `FEMALE` | Dropdown: Male/Female |
| `education` | Yes | Maximum 500 characters | Input or textarea |
| `experience` | Yes | Maximum 5,000 characters | Textarea |
| `job_ids` | No | Array of up to 10 unique active job IDs | Multi-select populated from `/jobs`; omit if unused |
| `privacy_consent` | Yes | Must be `true`, `1`, `"yes"`, or `"on"` | Required privacy checkbox |
| `website` | No | Must remain empty | Hidden honeypot input; hide with CSS, not `type="hidden"` |

Success (`201 Created`):

```json
{
  "message": "Your application was submitted successfully.",
  "data": {
    "reference": "APP-000123",
    "vacancy_id": 4,
    "submitted_at": "2026-08-01T10:22:30+00:00"
  }
}
```

Show and retain the returned reference for the candidate. Do not automatically retry after a success response.

## Validation errors

Invalid submissions return HTTP `422` and a field-keyed `errors` object:

```json
{
  "message": "The sex field is required. (and 1 more error)",
  "errors": {
    "sex": ["The sex field is required."],
    "privacy_consent": ["You must accept the privacy notice before applying."]
  }
}
```

Recommended error handling:

- `404`: vacancy was removed or closed; return to the vacancy listing.
- `422`: display each `errors[field][0]` beneath its form control.
- `429`: too many submissions; ask the user to wait at least one minute.
- `500` or network failure: preserve form values and offer a manual retry.

## TypeScript integration example

```ts
const API = 'https://erp-api.alefdelta.com/api/public/recruitment';

export type Vacancy = {
  id: number;
  title_en: string;
  title_am: string;
  description: string | null;
  qualification: string | null;
  more_info: string | null;
  number_of_employees: number;
  created_at: string;
};

export async function getVacancies(): Promise<Vacancy[]> {
  const response = await fetch(`${API}/vacancies`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error('Could not load vacancies');
  return (await response.json()).data;
}

export async function submitApplication(payload: {
  vacancy_id: number;
  applicant_id: string;
  age: number;
  sex: 'MALE' | 'FEMALE';
  education: string;
  experience: string;
  job_ids?: number[];
  privacy_consent: boolean;
  website?: string;
}) {
  const response = await fetch(`${API}/applications`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.message || 'Application failed') as Error & {
      status?: number;
      errors?: Record<string, string[]>;
    };
    error.status = response.status;
    error.errors = body.errors;
    throw error;
  }
  return body;
}
```

## cURL test

```bash
curl -X POST 'https://erp-api.alefdelta.com/api/public/recruitment/applications' \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  --data '{
    "vacancy_id": 4,
    "applicant_id": "Abebe Kebede",
    "age": 27,
    "sex": "MALE",
    "education": "Diploma",
    "experience": "Three years experience",
    "privacy_consent": true,
    "website": ""
  }'
```

Use a real active vacancy ID from `GET /vacancies`.

## CORS when the marketing site is deployed

Localhost is already permitted. Before deploying the marketing site, add its exact HTTPS origin to the backend environment:

```env
MARKETING_ALLOWED_ORIGINS=https://www.example.com,https://example.com
```

Then restart/clear backend configuration:

```bash
docker compose up -d backend
docker compose exec -T backend php artisan optimize:clear
```

Origins must not include paths or a trailing slash.

## Security requirements for the marketing frontend

- Never embed ERP usernames, passwords, or JWT tokens.
- Render vacancy text as text, not raw HTML (`dangerouslySetInnerHTML` must not be used).
- Keep the `website` honeypot visually hidden and empty for real users.
- Disable the submit button while a request is pending.
- Show the server’s validation errors rather than trusting client-side validation alone.
- Include a visible privacy notice and required consent checkbox.
- Do not collect sensitive IDs, documents, or photos through this JSON endpoint.
- Public submissions are rate-limited to five per IP per minute.

## Data flow

```text
Marketing site
   ├── GET active vacancies/jobs ──> Public recruitment API
   └── POST application ───────────> Validation + rate limit
                                          │
                                          ▼
                                  ERP Job Applications
                                          │
                                          ▼
                                  HR review and screening
```

