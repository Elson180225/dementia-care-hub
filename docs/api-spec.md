> Current implementation: see [Admin Dashboard setup and API-backed workflows](admin-dashboard.md). This initial specification predates the implemented portal.


# Dementia Care Hub — Initial REST API Specification

## 1. Purpose

The API provides communication between the React frontend
and the Node.js backend.

## 2. Existing endpoint

| Method | Endpoint | Purpose | Status |
|---|---|---|---|
| GET | /api/health | Check backend availability | Implemented |
| GET | /api | View API overview | Implemented |
| POST | /api/enquiries | Submit a contact enquiry | Existing implementation |

## 3. Planned authentication endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/login | Authenticate an approved user |
| GET | /api/auth/me | Retrieve the authenticated user's profile |
| POST | /api/auth/logout | End the user's session or invalidate a token |

## 4. Planned content endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/content | Retrieve published content |
| GET | /api/content/:id | Retrieve a content item |
| POST | /api/content | Create content (Admin) |
| PUT | /api/content/:id | Update content (Admin) |
| DELETE | /api/content/:id | Delete content (Admin) |

## 5. Other planned modules

- FAQs
- Healthcare resources
- Education and events
- Trainer profiles and training records
- Trainer-event assignments
- Annual trainer training hours

Events must support filtering by city and delivery language.
An event may involve multiple trainers.

## 6. Access control design

- Public users: view approved public information.
- Trainers: access authorised trainer functions and their own records.
- Administrators: manage approved website content and authorised
  administrative functions.

All protected endpoints must verify authentication and permissions
on the server.

## 7. Implementation status

Only endpoints explicitly marked as implemented have been
implemented and tested. Planned endpoints require further
development, validation and database integration.
