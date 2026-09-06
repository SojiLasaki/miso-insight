# MISO Insight

Build a polished, production-quality web application called MISO AI based on the concept:

“Ask for the information. We’ll find the right MISO data.”

The application is an AI-powered natural-language interface for navigating MISO's public information, APIs, market reports, and datasets.

The primary goal is to make MISO data accessible to both technical and nontechnical users. Users should not need to understand MISO terminology, API endpoints, parameters, authentication, or documentation unless they specifically want that information.

The application should feel extremely simple on the surface while having a powerful data/API orchestration system underneath.

1. DESIGN PHILOSOPHY

Use an Apple-inspired design language.

The interface should feel:

Minimal

Premium

Calm

Spacious

Extremely clean

Fast

Intuitive

Modern

Professional

Trustworthy

Do NOT make it look like a traditional enterprise dashboard.

Do NOT overwhelm the user with menus, tables, settings, cards, charts, or technical information on the first screen.

Think:

Apple + ChatGPT + Linear + modern developer tooling

Use:

Large typography

Generous whitespace

Subtle borders

Soft shadows

Rounded corners

Smooth transitions

Very restrained use of color

Excellent spacing

Clear hierarchy

Minimal navigation

Use MISO-inspired branding subtly rather than making the interface visually heavy.

2. FIRST SCREEN

The first screen should primarily contain a centered conversational experience.

At the top:

MISO AI

Small subtitle:

Find MISO data without learning how to find it.

Center of the page:

Large heading:

What can I help you find?

Under it, place one large chat input.

Placeholder:

Ask about MISO data, markets, load, prices, generation, reports, or APIs...

The input should be large, elegant, and feel like the main interaction of the entire product.

Include a subtle send button inside the input.

The user should immediately understand:

“I can just ask for information.”

3. SUGGESTED REQUESTS

Under the chat box, provide a small set of intelligent suggestions.

Examples:

“What was the actual load yesterday?”

“Show me today's market prices.”

“Find the latest market report.”

“Give me the API for actual load data.”

“What were the power results for Indiana?”

These should be clickable and populate/send the request.

Keep them visually subtle.

Do not make them look like large dashboard cards.

4. LOGIN

The user must be able to log in.

Create:

Sign in

and

Create account

The login experience should be extremely clean and Apple-like.

After authentication, the application should associate the authenticated user with their authorized MISO API access.

IMPORTANT:

Do NOT expose MISO subscription keys in the frontend.

Do NOT display raw subscription keys.

The frontend should only know whether authorized MISO access is available.

Example:

MISO API Access
✓ Connected

The actual credentials/subscription key handling should occur securely on the backend.

5. CHAT EXPERIENCE

When the user sends:

What was the actual load yesterday?

Do NOT immediately show a giant technical interface.

Instead show a subtle processing state:

Understanding your request...

Then:

Finding the right MISO data...

Then:

Retrieving results...

Use elegant animated transitions.

After retrieval, show the answer naturally.

Example:

Actual Load — September 5, 2026

[Results]

Then a concise explanation:

I found this information using MISO's Actual Load data source.

Do not show the API request unless the user asked for it.

6. INTELLIGENT REQUEST ROUTING

The backend architecture should support an AI orchestration layer.

The AI should interpret natural language and determine:

What information the user wants

Which MISO source can answer it

Whether the source is an API, report, webpage, dataset, or document

Which parameters are required

Whether the user wants raw data, an explanation, visualization, downloadable data, or an API request

Whether authentication is required

Whether clarification is necessary

The AI should NEVER randomly invent an API endpoint.

Use a structured MISO source registry.

Example source definition:

{
  "source_id": "miso_actual_load",
  "name": "Actual Load",
  "type": "api",
  "description": "Actual electrical load data",
  "supports": [
    "actual load",
    "power usage",
    "historical load"
  ],
  "requires_authentication": true,
  "supports_api_generation": true,
  "supports_visualization": true
}


The AI should select from known/validated MISO sources.

7. SUPPORT BOTH TECHNICAL AND NONTECHNICAL USERS

This is one of the most important requirements.

The same request should produce different levels of information depending on what the user asks for.

Nontechnical request

User:

What was the actual load yesterday?

Return:

Answer

Relevant data

Short explanation

Source

Do NOT show technical API details.

Technical request

User:

What was the actual load yesterday and show me how you retrieved it?

Return:

Answer

Data

MISO source

Endpoint

Parameters

Request method

Relevant headers without exposing secrets

Reproducible code

API-only request

User:

Give me the API request for retrieving actual load.

Do NOT necessarily execute a large data request.

Instead provide:

API name

Endpoint

HTTP method

Required parameters

Optional parameters

Authentication requirements

Example request

Python example

JavaScript example

Copy button

Use:

YOUR_MISO_SUBSCRIPTION_KEY

instead of exposing a real credential.

8. API TRANSPARENCY

The application should provide an optional expandable section:

How this was found

When opened:

Request understood
✓ Actual Load

Source selected
✓ MISO Actual Load API

Parameters
✓ Date
✓ Time range

Authentication
✓ MISO access authorized

API request
✓ Request executed

Response
✓ Data received


Make this feel elegant and trustworthy rather than technical and intimidating.

Use progressive disclosure.

The user should only see technical details when they choose to expand them.

9. API REQUEST VIEW

If the user requests the API, display a beautiful developer-style panel.

Example:

MISO Actual Load API

GET

https://api.example.com/actual-load

Parameters

start_date    2026-09-05
end_date      2026-09-05
region        Indiana

Authentication

MISO Subscription Key


The actual secret should never be displayed.

Provide:

Copy request

Python

JavaScript

cURL

Tabs can switch between code formats.

10. DATA RESULTS

Results should be dynamic.

Do NOT automatically generate a chart for every request.

The AI should determine the appropriate presentation.

Possible output types:

Simple answer

Table

Metric

List

Downloadable CSV

JSON

Chart

Report

API request

Explanation

For example:

User:

What was the load yesterday?

→ concise result.

User:

Show me the load for the last 30 days.

→ table and/or chart.

User:

Download the last 30 days of load data.

→ downloadable CSV.

User:

Graph the last 30 days.

→ chart.

User:

Give me the API.

→ API interface.

11. MISO REPORTS

The system must not assume everything is available through an API.

The AI should also be able to find:

MISO market reports

Daily reports

Historical reports

Public datasets

MISO webpages

Documentation

Downloadable files

If a user's request is better answered by a report, the AI should use the report.

Example:

Find the latest market report.

The system should identify the appropriate MISO report and present it.

12. OPTIONAL CANVAS

Include a secondary experience called:

Canvas

The chat should remain the primary experience.

Do NOT put the canvas on the homepage.

The user can enter Canvas when they want to inspect or modify how the request works.

Canvas should visually represent:

User Request
      ↓
Intent
      ↓
MISO Source
      ↓
Parameters
      ↓
Authentication
      ↓
API / Report
      ↓
Validation
      ↓
Results


Use a node-based interface similar to modern visual programming tools.

Users should be able to:

Add nodes

Remove nodes

Edit nodes

Change parameters

Connect nodes

Re-run requests

Use:

Green = valid

Red = invalid/error

Gray = not yet executed

Blue/subtle accent = active

When a node is invalid, show a red outline and a concise explanation.

Example:

Date parameter

🔴 Invalid

End date is required.

Allow the AI to suggest/fix the issue.

13. EXECUTION LOG

When an API request runs, create a small expandable execution timeline.

Example:

Request
  ✓

Source discovery
  ✓

Parameter validation
  ✓

Authentication
  ✓

MISO request
  ✓

Response validation
  ✓

Result generated
  ✓


The purpose is to create trust.

The user should be able to verify:

“This isn't just an AI-generated answer. The system actually found the source and retrieved the data.”

14. ERROR HANDLING

Errors should be human-readable.

Never show:

HTTP 400
InvalidParameterException


as the primary message.

Instead:

We couldn't retrieve this data.

The MISO source requires both a start date and an end date.

Then provide:

Fix automatically

Edit request

Technical details can be placed inside:

View technical details

15. CONVERSATION HISTORY

After login, allow users to access previous requests.

Keep this minimal.

Sidebar:

New Request

Recent

Actual load yesterday

Indiana power results

Latest market report

30-day load data

Do not make the sidebar visually heavy.

16. USER PREFERENCES

Allow the application to remember preferences such as:

Preferred output format

Preferred units

Recent requests

Preferred region

Whether API details should be shown automatically

But never store sensitive MISO credentials in browser local storage.

17. RESPONSIVE DESIGN

The application must work beautifully on:

Desktop

Laptop

Tablet

Mobile

On mobile:

The chat should occupy most of the screen.

Canvas can become a separate full-screen experience.

18. COMPONENT ARCHITECTURE

Build reusable components:

ChatInterface
Message
Suggestion
RequestProcessor
SourceIndicator
ExecutionTimeline
ResultViewer
DataTable
ChartViewer
DownloadButton
ApiRequestViewer
CodeBlock
Canvas
CanvasNode
ParameterEditor
ErrorState
Auth
UserMenu
History


19. BACKEND FOUNDATION

Design the frontend so it can communicate with a backend through clean APIs.

Use structured objects such as:

{
  "request_id": "req_123",

  "intent": {
    "type": "retrieve_data",
    "confidence": 0.97
  },

  "source": {
    "id": "miso_actual_load",
    "type": "api"
  },

  "parameters": {
    "start_date": "2026-09-05",
    "end_date": "2026-09-05"
  },

  "execution": {
    "status": "success"
  },

  "output": {
    "mode": "data",
    "include_api": false,
    "include_chart": false
  }
}


The frontend should render itself dynamically based on this object.

20. DO NOT BUILD A STATIC MOCKUP

The application should be architected as a real working application.

Use realistic mock MISO data initially if live API credentials/backend integration are not available.

However, make the architecture ready to connect to the actual MISO APIs.

Separate:

UI

from

AI orchestration

from

MISO API clients

from

authentication

from

result processing.

Do not hardcode API responses into individual UI components.

21. VISUAL STYLE

Use an Apple-inspired visual system:

Background:

Very light neutral/white.

Text:

Near-black.

Secondary text:

Soft gray.

Borders:

Very subtle gray.

Cards:

White with extremely subtle borders/shadows.

Accent:

Use a restrained MISO-inspired accent color.

Typography:

Use a clean modern sans-serif.

Large headings.

High readability.

Avoid excessive bold text.

Avoid gradients unless extremely subtle.

Avoid excessive rounded cards.

Avoid dashboard-style colored widgets.

Avoid unnecessary icons.

Animations should be subtle and fast.

Use smooth:

fade

slide

scale

loading transitions

Do not make the application feel animated for the sake of animation.

22. HOMEPAGE SHOULD FEEL ALMOST EMPTY

This is intentional.

The first screen should primarily be:

                     MISO AI

             Find MISO data faster.

          What can I help you find?

   ┌─────────────────────────────────────────┐
   │ Ask anything about MISO data...      ↑ │
   └─────────────────────────────────────────┘

       Actual load yesterday
       Latest market prices
       Find a market report
       Get an API request


The complexity should appear only when the user needs it.

This principle is extremely important:

Simple entry point. Powerful system underneath.

23. PRIMARY USER FLOW

Implement this complete flow:

User opens MISO AI.

User sees the simple chat interface.

User enters:

“What was the actual load yesterday?”

If authentication is required, gracefully request login.

AI interprets the request.

AI identifies the correct MISO source.

AI identifies required parameters.

Backend authenticates against the user's authorized MISO access.

Backend constructs the API request.

Backend validates the request.

Backend calls MISO.

Backend validates the response.

UI displays the result.

UI provides an expandable “How this was found” section.

If the user asks for the API, dynamically reveal the API request and code.

If the user asks for a chart, dynamically generate the appropriate chart.

If the user asks for a download, generate the appropriate downloadable data file.

24. THE PRODUCT'S CORE MESSAGE

The application should communicate one simple idea:

You don't need to know where MISO's data lives. Just ask for it.

The system handles the complexity.

Build the experience around that principle.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/91c9dda6-b78d-4ad0-9c83-d08d066b65e7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
