# TaskFlow — Postman Manual Screenshot Checklist

This checklist accompanies `TaskFlow.postman_collection.json` and
`TaskFlow.postman_environment.json`. It is a working procedure for capturing
Postman evidence in the desktop app — it is not the final submission README
or introduction document.

## Setup (once, before capturing anything)

1. Open Postman desktop.
2. Import `TaskFlow.postman_collection.json` (File → Import).
3. Import `TaskFlow.postman_environment.json` and select **TaskFlow Local**
   as the active environment (top-right environment selector).
4. In a terminal, start the API from `taskflow-api/`: `npm start` (or
   `npm run dev`). Confirm it is listening on `http://localhost:3000`.
5. Confirm `taskflow-api/data/tasks.json` currently contains `[]` before you
   begin — this keeps the run's task IDs and counts predictable.
6. Save screenshots into `taskflow-api/docs/screenshots/postman/` using the
   filenames given below.

## Required run order

Run folders top to bottom, request by request, inside each folder:

1. **CRUD** — creates and deletes one task; sets the `taskId` collection
   variable used by Get/Update/Delete in this folder.
2. **Advanced Listing** — the first 5 requests (`Seed - Create Task 1..5`)
   create the controlled dataset (2 tasks for Mehmet Ozdemir, 2 for Ayse
   Yilmaz, 1 for Ali Veli, mixed status/priority, Turkish-character titles).
   Run them before the filter/search/assignee/pagination/sort requests that
   follow — those requests read data created by the seed requests.
3. **Reports** — reads the same seeded dataset from step 2, so run this
   folder immediately after Advanced Listing for meaningful, non-zero
   counts.
4. **Validation and Errors** — self-contained; no dependency on prior
   folders.
5. **Persistence Verification** — self-contained; creates, reads, updates,
   reads, deletes, and re-reads its own task via `persistTaskId`.
6. **Cleanup - Remove Seed Data** — run last, after all screenshots are
   captured, to delete the 5 seeded tasks and return `tasks.json` to `[]`.

## Screenshots

For each numbered item below: run the request, wait for the response, then
capture a screenshot showing the request method + URL, the request body (if
any), the response status code, and the response body. Save with the given
filename.

### Mandatory (required by the brief)

1. **CRUD → Create Task** — `POST {{baseUrl}}/tasks` — body: title/
   description/priority/assignee (no `status`) — expect `201`, response
   `data.status` is `"pending"`.
   File: `01-create-task-201.png`
2. **CRUD → List Tasks** — `GET {{baseUrl}}/tasks` — expect `200`, response
   has `data` array and `meta` object.
   File: `02-list-tasks-200.png`
3. **CRUD → Get Task by ID** — `GET {{baseUrl}}/tasks/{{taskId}}` (needs
   `taskId` from step 1) — expect `200`, returned task matches the one
   created.
   File: `03-get-task-by-id-200.png`
4. **CRUD → Update Task** — `PUT {{baseUrl}}/tasks/{{taskId}}` — full body
   including `status` — expect `200`, `id`/`createdAt` unchanged,
   `updatedAt` refreshed.
   File: `04-update-task-200.png`
5. **CRUD → Delete Task** — `DELETE {{baseUrl}}/tasks/{{taskId}}` — expect
   `200`, deleted task returned in `data`.
   File: `05-delete-task-200.png`
6. **Validation and Errors → Missing Required Fields - 400** — `POST
   {{baseUrl}}/tasks` — body `{}` — expect `400`, `errors` array lists all
   missing fields.
   File: `06-validation-error-400.png`
7. **Validation and Errors → Task Not Found - 404** — `GET
   {{baseUrl}}/tasks/999999999999` — expect `404`, `message` is
   `"Task not found"`.
   File: `07-task-not-found-404.png`

### Recommended supporting evidence

8. **Advanced Listing → Combined Status and Priority Filter** — `GET
   {{baseUrl}}/tasks?status=pending&priority=high` — expect `200`, every
   returned task has `status: "pending"` and `priority: "high"`.
   File: `08-combined-advanced-listing.png`
9. **Advanced Listing → Assignee Listing - Mehmet Ozdemir** — `GET
   {{baseUrl}}/tasks/assignee/Mehmet Ozdemir` — expect `200`, all returned
   tasks belong to Mehmet Ozdemir.
   File: `09-assignee-listing.png`
10. **Reports → Completed Report** — `GET {{baseUrl}}/reports/completed` —
    expect `200`, `data.count` reflects seeded completed tasks.
    File: `10-completed-report.png`
11. **Reports → Pending Report** — `GET {{baseUrl}}/reports/pending` —
    expect `200`, `data.count` reflects seeded pending tasks (in-progress
    excluded).
    File: `11-pending-report.png`
12. **Reports → Summary Report** — `GET {{baseUrl}}/reports/summary` —
    expect `200`, `data.total` equals `pending + inProgress + completed`.
    File: `12-summary-report.png`

### Additional recommended evidence (not in the brief's minimum list, but
useful given the collection's own coverage)

13. **Validation and Errors → Malformed JSON - 400** — `POST
    {{baseUrl}}/tasks` with a body missing its closing brace — expect
    `400`, `message` is `"Invalid JSON payload"`.
    File: `13-malformed-json-400.png`
14. **Persistence Verification → Get Task After Update** — `GET
    {{baseUrl}}/tasks/{{persistTaskId}}` (run right after "Update Task
    (Persistence)") — expect `200`, `data.status` is `"completed"`,
    demonstrating the update was written to `data/tasks.json` and read back
    on a separate request.
    File: `14-persistence-after-update.png`
15. **Persistence Verification → Get Task After Delete (Expect 404)** — `GET
    {{baseUrl}}/tasks/{{persistTaskId}}` (run right after "Delete Task
    (Persistence)") — expect `404`, demonstrating the delete was written to
    `data/tasks.json`.
    File: `15-persistence-after-delete.png`

## After capturing screenshots

- Run the **Cleanup - Remove Seed Data** folder to delete the 5 seeded
  tasks and return `data/tasks.json` to `[]`.
- Confirm no leftover tasks remain: `GET {{baseUrl}}/tasks` should return
  `meta.total: 0`.
- Stop the server.

Do not fabricate or reuse screenshots from a different run — each image
must come from an actual response you captured in the Postman desktop app.
