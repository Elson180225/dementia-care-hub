import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import request from "supertest";
import { createApp } from "../server/app.js";
import { migrate } from "../database/migrate.mjs";
import { seed, demoCredentials } from "../database/seed.mjs";

test("database-backed RCBC workflows and access boundaries", async (t) => {
  const pg = new PGlite();
  const dir = await mkdtemp(join(tmpdir(), "rcbc-portal-"));
  const previousUpload = process.env.UPLOAD_DIRECTORY;
  process.env.UPLOAD_DIRECTORY = dir;
  const db = {
    query: (...a) => pg.query(...a),
    exec: (s) => pg.exec(s),
    transaction: async (fn) => {
      await pg.exec("BEGIN");
      try {
        const r = await fn(pg);
        await pg.exec("COMMIT");
        return r;
      } catch (e) {
        await pg.exec("ROLLBACK");
        throw e;
      }
    },
  };
  try {
    await migrate(db);
    await seed(db);
    const app = createApp(db, { uploadDirectory: dir });
    const admin = request.agent(app),
      trainer = request.agent(app);
    let ac, tc, workspace;
    const post = (agent, token, path, body = {}) =>
      agent
        .post("/api" + path)
        .set("X-CSRF-Token", token)
        .send(body);
    const put = (agent, token, path, body) =>
      agent
        .put("/api" + path)
        .set("X-CSRF-Token", token)
        .send(body);
    await t.test(
      "login rejects wrong password and unauthorized Admin access",
      async () => {
        await request(app).get("/api/admin/workspace").expect(401);
        await request(app)
          .post("/api/auth/login")
          .send({ ...demoCredentials.admin, password: "incorrect" })
          .expect(401);
        const a = await admin
          .post("/api/auth/login")
          .send(demoCredentials.admin)
          .expect(200);
        ac = a.body.csrfToken;
        assert.ok(a.headers["set-cookie"][0].includes("HttpOnly"));
        assert.equal(a.body.user.role, "admin");
        const tr = await trainer
          .post("/api/auth/login")
          .send(demoCredentials.trainer)
          .expect(200);
        tc = tr.body.csrfToken;
        await trainer.get("/api/admin/workspace").expect(403);
        workspace = (await admin.get("/api/admin/workspace").expect(200)).body;
        assert.ok(workspace.activities.length >= 8);
        assert.ok(!JSON.stringify(workspace).includes("$argon2id$"));
      },
    );
    await t.test("CSRF and foreign origin block writes", async () => {
      await admin.post("/api/admin/users").send({}).expect(403);
      await post(admin, ac, "/admin/users", {})
        .set("Origin", "https://untrusted.example")
        .expect(403);
    });
    await t.test(
      "sign-up creates a request; only Admin approval creates access",
      async () => {
        const fields = {
          name: "Test Trainer",
          email: "signup@example.test",
          password: "Test-Password-2026!",
          certificate_reference: "TEST-TTT-01",
          city: "Bintulu",
        };
        await request(app)
          .post("/api/auth/signup")
          .send({ ...fields, role: "admin" })
          .expect(422);
        await request(app).post("/api/auth/signup").send(fields).expect(202);
        await request(app)
          .post("/api/auth/login")
          .send({ email: fields.email, password: fields.password })
          .expect(401);
        const w = (await admin.get("/api/admin/workspace")).body;
        const r = w.requests.find((r) => r.email === fields.email);
        assert.ok(r);
        await post(admin, ac, "/admin/requests/" + r.id + "/review", {
          decision: "approved",
        }).expect(200);
        const login = await request(app)
          .post("/api/auth/login")
          .send({ email: fields.email, password: fields.password })
          .expect(200);
        assert.equal(login.body.user.role, "certified_trainer");
      },
    );
    await t.test("Admin creates accounts, trainers cannot", async () => {
      const fields = {
        display_name: "Additional Admin",
        email: "second-admin@example.test",
        password: "Second-Admin-2026!",
        role: "admin",
      };
      await post(trainer, tc, "/admin/users", fields).expect(403);
      const u = await post(admin, ac, "/admin/users", fields).expect(201);
      assert.equal(u.body.role, "admin");
      assert.ok(!u.body.password_hash);
    });
    let own;
    await t.test(
      "profile updates cannot modify certification and require reapproval",
      async () => {
        own = (await trainer.get("/api/trainer/workspace")).body;
        const fields = {
          city: "Sibu",
          language_code: "en",
          short_profile: "Updated test profile",
          qualifications: "Test qualification",
          experience: "Test experience",
          document_ids: own.documents.map((d) => d.asset_id),
        };
        await put(trainer, tc, "/trainer/profile", {
          ...fields,
          certified_status: "certified",
        }).expect(422);
        await put(trainer, tc, "/trainer/profile", fields).expect(200);
        const hidden = (await request(app).get("/api/public/trainers")).body;
        assert.ok(!hidden.some((p) => p.id === own.profile.id));
        await post(admin, ac, "/admin/profiles/" + own.profile.id + "/review", {
          decision: "returned",
          comment: "",
        }).expect(422);
        await post(admin, ac, "/admin/profiles/" + own.profile.id + "/review", {
          decision: "approved",
        }).expect(200);
        assert.ok(
          (await request(app).get("/api/public/trainers")).body.some(
            (p) => p.city === "Sibu",
          ),
        );
      },
    );
    let newActivity;
    const fields = {
      title: "Integration test activity",
      starts_at: "2026-01-02T10:00:00+08:00",
      ends_at: "2026-01-02T12:00:00+08:00",
      type_code: "workshop",
      mode: "online",
      language_code: "en",
      target_audience: "Family caregivers",
      description: "Meaningful demo activity",
      planned_hours: 2,
    };
    await t.test(
      "activity submission, return, amendment and publication use one ID",
      async () => {
        await post(trainer, tc, "/activities", {
          ...fields,
          status: "approved",
        }).expect(422);
        newActivity = (
          await post(trainer, tc, "/activities", fields).expect(201)
        ).body;
        await post(
          trainer,
          tc,
          "/activities/" + newActivity.id + "/submit",
        ).expect(200);
        assert.ok(
          !(await request(app).get("/api/public/activities")).body.some(
            (a) => a.id === newActivity.id,
          ),
        );
        await post(
          admin,
          ac,
          "/admin/activities/" + newActivity.id + "/action",
          { action: "return", comment: "Clarify the venue" },
        ).expect(200);
        await put(trainer, tc, "/activities/" + newActivity.id, {
          ...fields,
          venue: "Online",
        }).expect(200);
        await post(
          trainer,
          tc,
          "/activities/" + newActivity.id + "/submit",
        ).expect(200);
        await post(
          admin,
          ac,
          "/admin/activities/" + newActivity.id + "/action",
          { action: "approve" },
        ).expect(200);
        await post(
          admin,
          ac,
          "/admin/activities/" + newActivity.id + "/action",
          { action: "publish" },
        ).expect(200);
        assert.ok(
          (await request(app).get("/api/public/activities")).body.some(
            (a) => a.id === newActivity.id,
          ),
        );
      },
    );
    await t.test(
      "completion verification changes calculated totals; archive retains them",
      async () => {
        const before = (
          await trainer.get("/api/trainer/workspace")
        ).body.annual.find((r) => r.year === 2026);
        const hours = Number(before.verified_hours);
        await put(
          trainer,
          tc,
          "/activities/" + newActivity.id + "/completion",
          {
            actual_venue: "Online",
            participant_count: 18,
            actual_hours: 2,
            assets: [],
          },
        ).expect(200);
        const submitted = (await trainer.get("/api/trainer/workspace")).body;
        assert.equal(
          Number(submitted.annual.find((r) => r.year === 2026).verified_hours),
          hours,
        );
        await post(
          trainer,
          tc,
          "/admin/activities/" + newActivity.id + "/action",
          { action: "verify" },
        ).expect(403);
        await post(
          admin,
          ac,
          "/admin/activities/" + newActivity.id + "/action",
          { action: "verify" },
        ).expect(200);
        const after = (await trainer.get("/api/trainer/workspace")).body;
        assert.equal(
          Number(after.annual.find((r) => r.year === 2026).verified_hours),
          hours + 2,
        );
        await put(
          trainer,
          tc,
          "/activities/" + newActivity.id + "/completion",
          {
            actual_venue: "Online",
            participant_count: 100,
            actual_hours: 8,
            assets: [],
          },
        ).expect(409);
        await post(
          admin,
          ac,
          "/admin/activities/" + newActivity.id + "/action",
          { action: "archive" },
        ).expect(200);
        assert.equal(
          Number(
            (await trainer.get("/api/trainer/workspace")).body.annual.find(
              (r) => r.year === 2026,
            ).verified_hours,
          ),
          hours + 2,
        );
        await post(
          admin,
          ac,
          "/admin/activities/" + newActivity.id + "/action",
          { action: "reopen", comment: "Correct participant count" },
        ).expect(200);
        assert.equal(
          Number(
            (await trainer.get("/api/trainer/workspace")).body.annual.find(
              (r) => r.year === 2026,
            ).verified_hours,
          ),
          hours,
        );
      },
    );
    await t.test(
      "ownership and future-event completion are enforced",
      async () => {
        const other = await post(admin, ac, "/activities", {
          ...fields,
          title: "Admin-owned example",
        }).expect(201);
        await put(trainer, tc, "/activities/" + other.body.id, fields).expect(
          403,
        );
        const future = own.activities.find(
          (a) =>
            a.lifecycle === "published" && new Date(a.starts_at) > new Date(),
        );
        await put(trainer, tc, "/activities/" + future.id + "/completion", {
          actual_venue: "Online",
          participant_count: 10,
          actual_hours: 1,
          assets: [],
        }).expect(422);
      },
    );
    await t.test(
      "directory review, terms and publication control public availability",
      async () => {
        const org = await post(admin, ac, "/admin/organisations", {
          name: "Test directory record",
          kind: "support_group",
          city: "Sibu",
          language_codes: "en, ms",
          need_tags: "caregiver",
          support_type_tags: "support",
          accepting_volunteers: true,
        }).expect(201);
        await post(
          admin,
          ac,
          "/admin/organisations/" + org.body.id + "/action",
          { action: "approve" },
        ).expect(200);
        await post(
          admin,
          ac,
          "/admin/organisations/" + org.body.id + "/action",
          { action: "publish" },
        ).expect(422);
        const data = {
          name: "Test directory record",
          kind: "support_group",
          city: "Sibu",
          language_codes: "en, ms",
          terms_accepted_at: "2026-10-17",
          terms_version: "v1",
          accepting_volunteers: true,
        };
        await put(
          admin,
          ac,
          "/admin/organisations/" + org.body.id,
          data,
        ).expect(200);
        await post(
          admin,
          ac,
          "/admin/organisations/" + org.body.id + "/action",
          { action: "approve" },
        ).expect(200);
        await post(
          admin,
          ac,
          "/admin/organisations/" + org.body.id + "/action",
          { action: "publish" },
        ).expect(200);
        assert.ok(
          (await request(app).get("/api/public/organisations")).body.some(
            (r) => r.id === org.body.id,
          ),
        );
        await post(
          admin,
          ac,
          "/admin/organisations/" + org.body.id + "/action",
          { action: "remove", comment: "Demo removed" },
        ).expect(200);
        assert.ok(
          !(await request(app).get("/api/public/organisations")).body.some(
            (r) => r.id === org.body.id,
          ),
        );
      },
    );
    await t.test(
      "learning-resource rights approval is separate from activity publication",
      async () => {
        const r = await post(admin, ac, "/admin/resources", {
          title: "Test handout",
          resource_type: "handout",
          language_code: "en",
          external_url: "https://example.com/test",
          rights_approved: false,
        }).expect(201);
        await post(admin, ac, "/admin/resources/" + r.body.id + "/action", {
          action: "approve",
        }).expect(200);
        await post(admin, ac, "/admin/resources/" + r.body.id + "/action", {
          action: "publish",
        }).expect(422);
      },
    );
    await t.test(
      "subscription requires consent, unsubscribe is recorded, no public account created",
      async () => {
        const data = {
          name: "Consent Test",
          email: "consent@example.test",
          city: "Sibu",
          state: "Sarawak",
          preferred_language: "en",
          consent_given: false,
        };
        await request(app).post("/api/public/subscribe").send(data).expect(422);
        await request(app)
          .post("/api/public/subscribe")
          .send({ ...data, consent_given: true })
          .expect(202);
        await request(app)
          .post("/api/public/unsubscribe")
          .send({ email: data.email })
          .expect(200);
        const w = (await admin.get("/api/admin/workspace")).body;
        assert.ok(
          w.subscribers.find((s) => s.email === data.email).unsubscribed_at,
        );
        assert.ok(!w.users.some((u) => u.email === data.email));
      },
    );
    await t.test(
      "certificate verification requires name + number and masks results",
      async () => {
        const r = await request(app)
          .post("/api/public/certificates/verify")
          .send({ name: "Alex Demo", certificate_number: "DEMO-DCS-2026-001" })
          .expect(200);
        assert.equal(r.body.found, true);
        assert.ok(r.body.name.includes("***"));
        assert.ok(!r.body.participant_name);
        const missing = await request(app)
          .post("/api/public/certificates/verify")
          .send({ name: "Wrong name", certificate_number: "DEMO-DCS-2026-001" })
          .expect(200);
        assert.equal(missing.body.found, false);
      },
    );
    await t.test(
      "file upload validation and private supporting-document access",
      async () => {
        await trainer
          .post("/api/assets")
          .set("X-CSRF-Token", tc)
          .attach("file", Buffer.from("<script>alert(1)</script>"), "bad.html")
          .expect(422);
        const doc = await trainer
          .post("/api/assets")
          .set("X-CSRF-Token", tc)
          .attach("file", Buffer.from("%PDF-1.4\nDemo test"), "test.pdf")
          .expect(201);
        await request(app)
          .get("/api/assets/" + doc.body.id)
          .expect(403);
        await trainer.get("/api/assets/" + doc.body.id).expect(200);
        const original = workspace.documents[0];
        await post(
          admin,
          ac,
          "/admin/assets/" + original.asset_id + "/review",
          { publication_approved: true, rights_note: "Should stay private" },
        ).expect(422);
      },
    );
    await t.test(
      "content and translated resources preserve approved publication boundaries",
      async () => {
        const c = await post(admin, ac, "/admin/content", {
          slug: "test-faq",
          locale: "en",
          title: "Test FAQ",
          body: "Reviewed test content",
          section: "faq",
        }).expect(201);
        await post(admin, ac, "/admin/content/" + c.body.id + "/action", {
          action: "publish",
        }).expect(409);
        await post(admin, ac, "/admin/content/" + c.body.id + "/action", {
          action: "approve",
        }).expect(200);
        await post(admin, ac, "/admin/content/" + c.body.id + "/action", {
          action: "publish",
        }).expect(200);
        assert.ok(
          (await request(app).get("/api/public/content")).body.some(
            (r) => r.slug === "test-faq",
          ),
        );
        const resource = await post(admin, ac, "/admin/resources", {
          title: "Translated resource",
          resource_type: "guide",
          language_code: "en",
          external_url: "https://example.com/guide",
          rights_approved: true,
          translations: [
            {
              locale: "ms",
              title: "Panduan demonstrasi",
              description: "Contoh",
            },
          ],
        }).expect(201);
        await post(
          admin,
          ac,
          "/admin/resources/" + resource.body.id + "/action",
          { action: "approve" },
        ).expect(200);
        await post(
          admin,
          ac,
          "/admin/resources/" + resource.body.id + "/action",
          { action: "publish" },
        ).expect(200);
        const publicResource = (
          await request(app).get("/api/public/resources")
        ).body.find((r) => r.id === resource.body.id);
        assert.equal(
          publicResource.translations[0].title,
          "Panduan demonstrasi",
        );
        await post(admin, ac, "/admin/resources", {
          title: "Unsafe URL",
          resource_type: "guide",
          language_code: "en",
          external_url: "javascript:alert(1)",
        }).expect(422);
      },
    );
    await t.test(
      "contact submissions are stored in the dashboard and deduplicated",
      async () => {
        const fields = {
          id: "10000000-0000-4000-8000-000000000001",
          name: "Contact Test",
          email: "contact@example.test",
          type: "General Enquiry",
          message: "Please tell me about the project",
          website: "",
          startedAt: Date.now() - 5000,
        };
        await request(app).post("/api/enquiries").send(fields).expect(200);
        await request(app)
          .post("/api/enquiries")
          .send({ ...fields, id: "10000000-0000-4000-8000-000000000002" })
          .expect(200);
        const w = (await admin.get("/api/admin/workspace")).body;
        assert.equal(
          w.enquiries.filter((e) => e.email === fields.email).length,
          1,
        );
        const enquiry = w.enquiries.find((e) => e.email === fields.email);
        await post(admin, ac, "/admin/enquiries/" + enquiry.id, {
          status: "resolved",
          admin_comment: "Test completed",
        }).expect(200);
      },
    );
    await t.test(
      "deactivation revokes existing sessions and prevents login",
      async () => {
        const a = request.agent(app);
        const u = await post(admin, ac, "/admin/users", {
          display_name: "Revoked Admin",
          email: "revoked@example.test",
          password: "Revoked-Admin-2026!",
          role: "admin",
        }).expect(201);
        await a
          .post("/api/auth/login")
          .send({
            email: "revoked@example.test",
            password: "Revoked-Admin-2026!",
          })
          .expect(200);
        await post(admin, ac, "/admin/users/" + u.body.id + "/access", {
          active: false,
        }).expect(200);
        await a.get("/api/admin/workspace").expect(401);
        await request(app)
          .post("/api/auth/login")
          .send({
            email: "revoked@example.test",
            password: "Revoked-Admin-2026!",
          })
          .expect(401);
        const csv = await admin
          .get("/api/admin/subscribers/export")
          .expect(200);
        assert.ok(csv.text.includes("subscriber1@rcbc.example"));
        assert.ok(!csv.text.includes("subscriber2@rcbc.example"));
      },
    );
    await t.test(
      "audit identifies actors, preserves comments and never stores hashes",
      async () => {
        const w = (await admin.get("/api/admin/workspace")).body;
        assert.ok(
          w.audit.some((a) => a.admin_comment === "Correct participant count"),
        );
        assert.ok(!JSON.stringify(w.audit).includes("$argon2id$"));
        await assert.rejects(pg.query("DELETE FROM rcbc.audit_log"));
      },
    );
    await t.test(
      "sessions renew on activity, expire after five idle minutes, and cannot be revived",
      async () => {
        const agent = request.agent(app);
        const login = await agent
          .post("/api/auth/login")
          .send(demoCredentials.admin)
          .expect(200);
        const token = login.body.csrfToken;
        const session = (
          await pg.query(
            "SELECT token_hash,expires_at FROM rcbc.sessions ORDER BY created_at DESC LIMIT 1",
          )
        ).rows[0];
        const remaining = new Date(session.expires_at).getTime() - Date.now();
        assert.ok(remaining > 290000 && remaining <= 300000);
        await pg.query(
          "UPDATE rcbc.sessions SET expires_at=now()+interval '1 minute' WHERE token_hash=$1",
          [session.token_hash],
        );
        await agent.get("/api/auth/me").expect(200);
        const before = (
          await pg.query(
            "SELECT expires_at FROM rcbc.sessions WHERE token_hash=$1",
            [session.token_hash],
          )
        ).rows[0];
        assert.ok(new Date(before.expires_at).getTime() - Date.now() < 61000);
        await post(agent, token, "/auth/activity").expect(200);
        const after = (
          await pg.query(
            "SELECT expires_at FROM rcbc.sessions WHERE token_hash=$1",
            [session.token_hash],
          )
        ).rows[0];
        assert.ok(new Date(after.expires_at).getTime() - Date.now() > 290000);
        await pg.query(
          "UPDATE rcbc.sessions SET expires_at=now()-interval '1 second' WHERE token_hash=$1",
          [session.token_hash],
        );
        await agent.get("/api/admin/workspace").expect(401);
        await post(agent, token, "/auth/activity").expect(401);
      },
    );
    await t.test("logout invalidates the database session", async () => {
      await post(trainer, tc, "/auth/logout").expect(200);
      const r = await trainer.get("/api/auth/me").expect(200);
      assert.equal(r.body.user, null);
      await trainer.get("/api/trainer/workspace").expect(401);
    });
  } finally {
    await pg.close();
    if (previousUpload === undefined) delete process.env.UPLOAD_DIRECTORY;
    else process.env.UPLOAD_DIRECTORY = previousUpload;
    await rm(dir, { recursive: true, force: true });
  }
});
