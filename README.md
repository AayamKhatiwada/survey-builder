## Running it

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
npm start
```

## Pages

- `/` — survey list
- `/survey/<id>` — fill out a survey
- `/admin` — survey dashboard
- `/admin/surveys/new` — create a survey
- `/admin/surveys/<id>/edit` — edit a survey
- `/admin/surveys/<id>/analytics` — response analytics

## Project layout

```
src/
  app/
    page.tsx                         # survey list
    survey/[id]/page.tsx             # public survey form
    admin/                           # dashboard, builder, analytics
    api/
      surveys/route.ts                # list / create
      surveys/[id]/route.ts           # read / update / delete
      surveys/[id]/responses/route.ts # submit / list responses
      surveys/[id]/analytics/route.ts # aggregated analytics
  components/SurveyBuilder.tsx       # question builder, shared by new/edit
  lib/
    types.ts        # Survey / Question / SurveyResponse
    storage.ts       # JSON file persistence
    admin-fetch.ts   # fetch wrapper for admin pages
data/
  surveys/          # one file per survey
  responses/<id>/   # one file per response
```
