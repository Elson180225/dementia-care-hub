import express from "express";
import { rateLimit } from "express-rate-limit";
import multer from "multer";
import argon2 from "argon2";
import { randomBytes, createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { z } from "zod";
import { withActor } from "./database.js";
import {
  HttpError,
  fail,
  parse,
  uuid,
  email,
  password,
  schemas,
  activitySchema,
  profileSchema,
  insert,
  update,
  one,
  cleanLists,
} from "./validation.js";
import { validateEnquiry } from "../shared/enquiry.js";
const digest = (value) => createHash("sha256").update(value).digest("hex");
const safeUser = (u) => ({
  id: u.id,
  email: u.email,
  name: u.display_name,
  role: u.role,
  active: u.active,
});
const tables = {
  organisations: "organisations",
  resources: "learning_resources",
  certificates: "dcs_certificates",
  content: "content_pages",
};
const cookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  path: "/api",
};
export function createApp(
  db,
  {
    origins = (
      process.env.PUBLIC_ORIGIN ||
      "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3001"
    ).split(","),
    uploadDirectory = resolve(process.env.UPLOAD_DIRECTORY || ".local/uploads"),
  } = {},
) {
  const app = express();
  app.disable("x-powered-by");
  app.use("/api", (_req, res, next) => {
    res.set({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    next();
  });
  app.use("/api", express.json({ limit: "100kb" }));
  app.use("/api", async (req, res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers.origin &&
      !origins.includes(req.headers.origin)
    )
      return res.status(403).json({ error: "Origin rejected" });
    try {
      const token = req.headers.cookie
        ?.split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("rcbc_session="))
        ?.slice(13);
      if (token) {
        const result = await db.query(
          `SELECT u.id,u.email,u.display_name,u.role,u.active,s.csrf_token FROM rcbc.sessions s JOIN rcbc.users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.active`,
          [digest(token)],
        );
        req.user = result.rows[0];
      }
      if (
        req.user &&
        !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
        req.get("X-CSRF-Token") !== req.user.csrf_token
      )
        return res
          .status(403)
          .json({ error: "Session token missing. Refresh and try again." });
      next();
    } catch (e) {
      next(e);
    }
  });
  const requireLogin = async (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, "Please sign in"));
    if (req.user.role === "certified_trainer") {
      const p = (
        await db.query(
          "SELECT certified_status FROM rcbc.trainer_profiles WHERE user_id=$1",
          [req.user.id],
        )
      ).rows[0];
      if (p?.certified_status !== "certified")
        return next(
          new HttpError(403, "Current trainer certification is required"),
        );
    }
    next();
  };
  const admin = (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, "Please sign in"));
    if (req.user.role !== "admin")
      return next(new HttpError(403, "Admin access required"));
    next();
  };
  const trainer = (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, "Please sign in"));
    if (req.user.role !== "certified_trainer")
      return next(new HttpError(403, "Trainer account required"));
    next();
  };
  const limited = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many attempts. Please try again later." },
  });
  const publicActor = async () => {
    const u = (
      await db.query(
        "SELECT id FROM rcbc.users WHERE role='admin' AND active ORDER BY created_at LIMIT 1",
      )
    ).rows[0];
    if (!u) fail(503, "RCBC account setup is not complete");
    return u.id;
  };
  const write = (req, fn, comment = "") =>
    withActor(db, req.user.id, fn, comment);
  app.get("/api/health", async (_req, res) => {
    await db.query("SELECT 1");
    res.json({
      status: "OK",
      service: "Dementia Care Hub API",
      database: db.mode,
    });
  });
  app.get("/api/auth/me", (req, res) =>
    res.json({
      user: req.user ? safeUser(req.user) : null,
      csrfToken: req.user?.csrf_token || null,
    }),
  );
  app.post("/api/auth/login", limited, async (req, res) => {
    const data = parse(
      z.strictObject({ email, password: z.string().min(1).max(128) }),
      req.body,
    );
    const user = (
      await db.query("SELECT * FROM rcbc.users WHERE lower(btrim(email))=$1", [
        data.email,
      ])
    ).rows[0];
    const hash =
      user?.password_hash || (await argon2.hash("unknown-account-placeholder"));
    const valid = await argon2.verify(hash, data.password);
    if (!user || !user.active || !valid)
      fail(401, "Email or password is incorrect, or access is not active");
    const token = randomBytes(32).toString("hex"),
      csrf = randomBytes(32).toString("hex");
    await db.query("DELETE FROM rcbc.sessions WHERE expires_at<now()");
    await db.query(
      "INSERT INTO rcbc.sessions(token_hash,user_id,csrf_token,expires_at) VALUES($1,$2,$3,now()+interval '5 minutes')",
      [digest(token), user.id, csrf],
    );
    res
      .cookie("rcbc_session", token, {
        ...cookieOptions,
        maxAge: 5 * 60 * 1000,
      })
      .json({ user: safeUser(user), csrfToken: csrf });
  });
  // Renew only on explicit user activity, never on background reads/polling.
  app.post("/api/auth/activity", requireLogin, async (req, res) => {
    const token = req.headers.cookie
      ?.split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("rcbc_session="))
      ?.slice(13);
    const renewed = await db.query(
      "UPDATE rcbc.sessions SET expires_at=now()+interval '5 minutes' WHERE token_hash=$1 AND expires_at>now() RETURNING expires_at",
      [digest(token || "")],
    );
    if (!renewed.rows.length)
      fail(401, "Your session expired. Please sign in again.");
    res
      .cookie("rcbc_session", token, {
        ...cookieOptions,
        maxAge: 5 * 60 * 1000,
      })
      .json({ expiresAt: renewed.rows[0].expires_at });
  });
  app.post("/api/auth/logout", requireLogin, async (req, res) => {
    const token = req.headers.cookie
      ?.split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("rcbc_session="))
      ?.slice(13);
    await db.query("DELETE FROM rcbc.sessions WHERE token_hash=$1", [
      digest(token || ""),
    ]);
    res.clearCookie("rcbc_session", cookieOptions).json({ ok: true });
  });
  app.post("/api/auth/signup", limited, async (req, res) => {
    const data = parse(
      z.strictObject({
        name: z.string().trim().min(1).max(200),
        email,
        password,
        certificate_reference: z.string().trim().min(1).max(200),
        city: z.string().trim().min(1).max(200),
      }),
      req.body,
    );
    const { password: secret, ...fields } = data;
    await withActor(db, await publicActor(), async (client) => {
      const exists = await client.query(
        "SELECT id FROM rcbc.trainer_access_requests WHERE lower(email)=$1 AND status IN ('submitted','approved')",
        [fields.email],
      );
      if (!exists.rows.length)
        await insert(client, "trainer_access_requests", {
          ...fields,
          requested_password_hash: await argon2.hash(secret),
        });
    });
    res.status(202).json({
      message:
        "Your request has been received. RCBC must verify your identity and certificate before you can sign in.",
    });
  });
  app.get("/api/admin/workspace", admin, async (_req, res) => {
    const result = {};
    const queries = {
      users:
        "SELECT id,email,display_name,role,active,created_at FROM rcbc.users ORDER BY created_at",
      requests:
        "SELECT id,name,email,certificate_reference,city,status,admin_comment,created_at FROM rcbc.trainer_access_requests ORDER BY created_at DESC",
      profiles:
        "SELECT p.*,u.display_name AS name,u.email FROM rcbc.trainer_profiles p JOIN rcbc.users u ON u.id=p.user_id",
      activities:
        "SELECT * FROM rcbc.activities ORDER BY starts_at DESC NULLS LAST",
      assignments: "SELECT * FROM rcbc.activity_trainers",
      organisations: "SELECT * FROM rcbc.organisations ORDER BY name",
      resources:
        "SELECT * FROM rcbc.learning_resources ORDER BY created_at DESC",
      certificates:
        "SELECT * FROM rcbc.dcs_certificates ORDER BY issued_on DESC",
      content: "SELECT * FROM rcbc.content_pages ORDER BY title",
      subscribers:
        "SELECT id,name,email,city,state,preferred_language,consent_at,consent_text_version,privacy_notice_version,unsubscribed_at FROM rcbc.subscribers ORDER BY created_at DESC",
      enquiries: "SELECT * FROM rcbc.enquiries ORDER BY created_at DESC",
      audit:
        "SELECT a.*,u.display_name AS actor_name FROM rcbc.audit_log a JOIN rcbc.users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT 150",
      annual: "SELECT * FROM rcbc.trainer_annual_totals",
      project: "SELECT * FROM rcbc.project_annual_totals",
      assets:
        "SELECT id,original_filename,media_type,publication_approved,rights_note,uploaded_by FROM rcbc.assets ORDER BY created_at DESC",
      documents: "SELECT * FROM rcbc.trainer_documents",
      activityAssets: "SELECT * FROM rcbc.activity_assets",
      translations: "SELECT * FROM rcbc.activity_translations",
      resourceTranslations: "SELECT * FROM rcbc.learning_resource_translations",
    };
    await Promise.all(
      Object.entries(queries).map(async ([key, sql]) => {
        result[key] = (await db.query(sql)).rows;
      }),
    );
    res.json(result);
  });
  app.post("/api/admin/users", admin, async (req, res) => {
    const data = parse(
      z.strictObject({
        display_name: z.string().trim().min(1).max(200),
        email,
        password,
        role: z.enum(["admin", "certified_trainer"]),
        certificate_reference: z.string().min(1).optional(),
      }),
      req.body,
    );
    if (data.role === "certified_trainer" && !data.certificate_reference)
      fail(422, "Certificate reference is required");
    const account = await write(req, async (client) => {
      const user = await insert(client, "users", {
        display_name: data.display_name,
        email: data.email,
        password_hash: await argon2.hash(data.password),
        role: data.role,
        active: true,
        created_by: req.user.id,
        activated_by: req.user.id,
        activated_at: new Date(),
      });
      if (data.role === "certified_trainer")
        await insert(client, "trainer_profiles", {
          user_id: user.id,
          certificate_reference: data.certificate_reference,
          certified_status: "certified",
        });
      return safeUser(user);
    });
    res.status(201).json(account);
  });
  app.post("/api/admin/users/:id/access", admin, async (req, res) => {
    const data = parse(z.strictObject({ active: z.boolean() }), req.body);
    if (req.params.id === req.user.id && !data.active)
      fail(409, "You cannot deactivate your own account");
    const row = await write(req, async (client) => {
      await one(client, "users", req.params.id, true);
      const u = await update(client, "users", req.params.id, {
        active: data.active,
        activated_by: req.user.id,
        activated_at: new Date(),
      });
      if (!data.active)
        await client.query("DELETE FROM rcbc.sessions WHERE user_id=$1", [
          u.id,
        ]);
      return safeUser(u);
    });
    res.json(row);
  });
  app.post("/api/admin/requests/:id/review", admin, async (req, res) => {
    const data = parse(
      z.strictObject({
        decision: z.enum(["approved", "returned", "rejected"]),
        comment: z.string().max(2000).default(""),
      }),
      req.body,
    );
    if (data.decision !== "approved" && !data.comment.trim())
      fail(422, "Explain what must be corrected");
    await write(
      req,
      async (client) => {
        const request = await one(
          client,
          "trainer_access_requests",
          req.params.id,
          true,
        );
        if (!["submitted", "returned"].includes(request.status))
          fail(409, "This request has already been reviewed");
        let userId = null;
        if (data.decision === "approved") {
          if (!request.requested_password_hash)
            fail(
              409,
              "This legacy request has no password. Create the account in User management.",
            );
          const user = await insert(client, "users", {
            email: request.email,
            display_name: request.name,
            password_hash: request.requested_password_hash,
            role: "certified_trainer",
            active: true,
            created_by: req.user.id,
            activated_by: req.user.id,
            activated_at: new Date(),
          });
          userId = user.id;
          await insert(client, "trainer_profiles", {
            user_id: userId,
            city: request.city,
            certificate_reference: request.certificate_reference,
            certified_status: "certified",
          });
        }
        await update(client, "trainer_access_requests", request.id, {
          status: data.decision,
          admin_comment: data.comment,
          reviewed_by: req.user.id,
          reviewed_at: new Date(),
          user_id: userId,
          ...(data.decision === "approved"
            ? { requested_password_hash: null }
            : {}),
        });
      },
      data.comment,
    );
    res.json({ ok: true });
  });
  app.get("/api/trainer/workspace", requireLogin, trainer, async (req, res) => {
    const profile = (
      await db.query(
        "SELECT p.*,u.display_name AS name,u.email FROM rcbc.trainer_profiles p JOIN rcbc.users u ON u.id=p.user_id WHERE p.user_id=$1",
        [req.user.id],
      )
    ).rows[0];
    if (!profile) fail(409, "Trainer profile is missing");
    const activities = (
      await db.query(
        "SELECT a.*,t.role FROM rcbc.activities a JOIN rcbc.activity_trainers t ON t.activity_id=a.id WHERE t.trainer_id=$1 ORDER BY a.starts_at DESC",
        [profile.id],
      )
    ).rows;
    const assets = (
      await db.query(
        "SELECT id,original_filename,media_type FROM rcbc.assets WHERE uploaded_by=$1",
        [req.user.id],
      )
    ).rows;
    const documents = (
      await db.query(
        "SELECT asset_id FROM rcbc.trainer_documents WHERE trainer_id=$1",
        [profile.id],
      )
    ).rows;
    const activityAssets = (
      await db.query(
        "SELECT aa.* FROM rcbc.activity_assets aa JOIN rcbc.activity_trainers t ON t.activity_id=aa.activity_id WHERE t.trainer_id=$1",
        [profile.id],
      )
    ).rows;
    res.json({
      profile,
      activities,
      assets,
      documents,
      activityAssets,
      organisations: (
        await db.query(
          "SELECT id,name FROM rcbc.organisations WHERE status='approved' AND published_at IS NOT NULL AND archived_at IS NULL AND removed_at IS NULL",
        )
      ).rows,
      annual: (
        await db.query(
          "SELECT * FROM rcbc.trainer_annual_totals WHERE trainer_id=$1",
          [profile.id],
        )
      ).rows,
    });
  });
  async function assetOwned(client, id, user) {
    if (!id) return;
    const asset = await one(client, "assets", id);
    if (user.role !== "admin" && asset.uploaded_by !== user.id)
      fail(403, "Asset belongs to another account");
  }
  app.put("/api/trainer/profile", requireLogin, trainer, async (req, res) => {
    const data = parse(profileSchema, req.body);
    await write(req, async (client) => {
      const p = (
        await client.query(
          "SELECT * FROM rcbc.trainer_profiles WHERE user_id=$1 FOR UPDATE",
          [req.user.id],
        )
      ).rows[0];
      if (!p) fail(404, "Profile not found");
      if (p.status === "submitted") fail(409, "Profile is awaiting review");
      const { document_ids = [], ...fields } = data;
      await assetOwned(client, fields.photo_asset_id, req.user);
      for (const id of document_ids) await assetOwned(client, id, req.user);
      await update(client, "trainer_profiles", p.id, {
        ...fields,
        status: "submitted",
        admin_comment: null,
        reviewed_by: null,
        reviewed_at: null,
      });
      await client.query(
        "DELETE FROM rcbc.trainer_documents WHERE trainer_id=$1",
        [p.id],
      );
      for (const id of document_ids)
        await client.query(
          "INSERT INTO rcbc.trainer_documents(trainer_id,asset_id) VALUES($1,$2)",
          [p.id, id],
        );
    });
    res.json({ ok: true });
  });
  app.post("/api/admin/profiles/:id/certification", admin, async (req, res) => {
    const data = parse(
      z.strictObject({
        certified_status: z.enum([
          "pending",
          "certified",
          "suspended",
          "revoked",
        ]),
        certificate_reference: z.string().trim().min(1).max(200),
      }),
      req.body,
    );
    await write(req, async (client) => {
      await one(client, "trainer_profiles", req.params.id, true);
      await update(client, "trainer_profiles", req.params.id, data);
    });
    res.json({ ok: true });
  });
  app.post("/api/admin/profiles/:id/review", admin, async (req, res) => {
    const data = parse(
      z.strictObject({
        decision: z.enum(["approved", "returned"]),
        comment: z.string().max(2000).default(""),
        certified_status: z
          .enum(["pending", "certified", "suspended", "revoked"])
          .optional(),
        certificate_reference: z.string().min(1).optional(),
      }),
      req.body,
    );
    if (data.decision === "returned" && !data.comment.trim())
      fail(422, "A return comment is required");
    await write(
      req,
      async (client) => {
        const p = await one(client, "trainer_profiles", req.params.id, true);
        if (p.status !== "submitted")
          fail(409, "Profile is not awaiting review");
        const fields = {
          status: data.decision,
          admin_comment: data.comment,
          reviewed_by: req.user.id,
          reviewed_at: new Date(),
        };
        if (data.certified_status)
          fields.certified_status = data.certified_status;
        if (data.certificate_reference)
          fields.certificate_reference = data.certificate_reference;
        await update(client, "trainer_profiles", p.id, fields);
      },
      data.comment,
    );
    res.json({ ok: true });
  });
  async function editableActivity(client, id, user) {
    const a = await one(client, "activities", id, true);
    if (user.role !== "admin" && a.created_by !== user.id)
      fail(403, "Only the activity owner may change this activity");
    return a;
  }
  async function storeActivity(req, res) {
    const data = parse(activitySchema, req.body);
    if (
      req.user.role !== "admin" &&
      !["workshop", "seminar"].includes(data.type_code)
    )
      fail(403, "Trainers can submit workshops and seminars only");
    const row = await write(req, async (client) => {
      if (req.params.id) {
        const a = await editableActivity(client, req.params.id, req.user);
        if (
          !["draft", "returned"].includes(a.status) ||
          a.lifecycle !== "planned"
        )
          fail(409, "Return or unpublish this activity before editing");
      }
      const { trainers: assignments, translations, ...fields } = data;
      await assetOwned(client, fields.poster_asset_id, req.user);
      if (fields.mode === "physical" && (!fields.city || !fields.venue))
        fail(422, "Physical activities require city and venue");
      if (
        fields.ends_at &&
        Date.parse(fields.ends_at) < Date.parse(fields.starts_at)
      )
        fail(422, "End must be after start");
      const a = req.params.id
        ? await update(client, "activities", req.params.id, {
            ...fields,
            status: "draft",
            admin_comment: null,
          })
        : await insert(client, "activities", {
            ...fields,
            created_by: req.user.id,
          });
      if (req.user.role === "admin" && assignments) {
        if (
          new Set(assignments.map((t) => t.trainer_id)).size !==
          assignments.length
        )
          fail(422, "A trainer can only be assigned once");
        await client.query(
          "DELETE FROM rcbc.activity_trainers WHERE activity_id=$1",
          [a.id],
        );
        for (const t of assignments) {
          const p = await one(client, "trainer_profiles", t.trainer_id);
          if (p.certified_status !== "certified")
            fail(422, "Assign certified trainers only");
          await client.query(
            "INSERT INTO rcbc.activity_trainers VALUES($1,$2,$3)",
            [a.id, t.trainer_id, t.role],
          );
        }
      } else if (req.user.role === "certified_trainer") {
        if (assignments)
          fail(403, "Trainer assignments are controlled by Admin");
        const p = (
          await client.query(
            "SELECT id,certified_status FROM rcbc.trainer_profiles WHERE user_id=$1",
            [req.user.id],
          )
        ).rows[0];
        if (!p || p.certified_status !== "certified")
          fail(403, "Current certification is required");
        await client.query(
          "INSERT INTO rcbc.activity_trainers VALUES($1,$2,'trainer') ON CONFLICT DO NOTHING",
          [a.id, p.id],
        );
      }
      if (translations) {
        if (req.user.role !== "admin")
          fail(403, "Translations require Admin review");
        await client.query(
          "DELETE FROM rcbc.activity_translations WHERE activity_id=$1",
          [a.id],
        );
        for (const t of translations)
          await client.query(
            "INSERT INTO rcbc.activity_translations(activity_id,locale,title,target_audience,description) VALUES($1,$2,$3,$4,$5)",
            [
              a.id,
              t.locale,
              t.title,
              t.target_audience || null,
              t.description || null,
            ],
          );
      }
      return a;
    });
    res.status(req.params.id ? 200 : 201).json(row);
  }
  app.post("/api/activities", requireLogin, storeActivity);
  app.put("/api/activities/:id", requireLogin, storeActivity);
  app.post("/api/activities/:id/submit", requireLogin, async (req, res) => {
    await write(req, async (client) => {
      const a = await editableActivity(client, req.params.id, req.user);
      if (
        !["draft", "returned"].includes(a.status) ||
        a.lifecycle !== "planned"
      )
        fail(409, "Activity cannot be submitted in this state");
      await update(client, "activities", a.id, {
        status: "submitted",
        admin_comment: null,
        reviewed_by: null,
        reviewed_at: null,
      });
    });
    res.json({ ok: true });
  });
  app.post("/api/admin/activities/:id/action", admin, async (req, res) => {
    const { action, comment } = parse(
      z.strictObject({
        action: z.enum([
          "approve",
          "return",
          "publish",
          "unpublish",
          "archive",
          "cancel",
          "verify",
          "return_completion",
          "reopen",
        ]),
        comment: z.string().max(2000).default(""),
      }),
      req.body,
    );
    if (
      ["return", "return_completion", "cancel", "reopen"].includes(action) &&
      !comment.trim()
    )
      fail(422, "An Admin comment is required");
    await write(
      req,
      async (client) => {
        const a = await one(client, "activities", req.params.id, true);
        let fields;
        if (["approve", "return"].includes(action)) {
          if (a.status !== "submitted" || a.lifecycle !== "planned")
            fail(409, "Activity is not awaiting review");
          fields = {
            status: action === "approve" ? "approved" : "returned",
            reviewed_by: req.user.id,
            reviewed_at: new Date(),
            admin_comment: comment,
          };
        } else if (action === "publish") {
          if (a.status !== "approved" || a.lifecycle !== "planned")
            fail(409, "Approve the activity before publication");
          fields = { lifecycle: "published", published_at: new Date() };
        } else if (action === "unpublish") {
          if (!["planned", "published"].includes(a.lifecycle))
            fail(
              409,
              "Completed activities must be corrected through completion review",
            );
          fields = {
            lifecycle: "planned",
            published_at: null,
            status: "returned",
            admin_comment: comment || "Unpublished for review",
          };
        } else if (action === "archive") {
          if (!["completed", "verified"].includes(a.lifecycle))
            fail(409, "Only completed or verified activities can be archived");
          fields = { lifecycle: "archived", archived_at: new Date() };
        } else if (action === "cancel") {
          if (!["planned", "published"].includes(a.lifecycle))
            fail(409, "Completed activities cannot be cancelled");
          fields = {
            lifecycle: "cancelled",
            cancelled_at: new Date(),
            cancellation_reason: comment,
          };
        } else if (action === "reopen") {
          if (a.completion_status !== "verified")
            fail(409, "Only verified completion can be reopened");
          fields = {
            lifecycle: "completed",
            archived_at: null,
            completion_status: "returned",
            completion_admin_comment: comment,
            completion_reviewed_by: req.user.id,
            completion_reviewed_at: new Date(),
          };
        } else {
          if (a.completion_status !== "submitted")
            fail(409, "Completion is not awaiting review");
          fields = {
            lifecycle: action === "verify" ? "verified" : "completed",
            completion_status: action === "verify" ? "verified" : "returned",
            completion_admin_comment: comment,
            completion_reviewed_by: req.user.id,
            completion_reviewed_at: new Date(),
          };
        }
        await update(client, "activities", a.id, fields);
      },
      comment,
    );
    res.json({ ok: true });
  });
  app.put("/api/activities/:id/completion", requireLogin, async (req, res) => {
    const data = parse(
      z.strictObject({
        actual_venue: z.string().trim().min(1).max(1000),
        participant_count: z.number().int().nonnegative().max(1000000),
        actual_hours: z.number().positive().max(999999),
        assets: z
          .array(
            z.strictObject({
              asset_id: uuid,
              purpose: z.enum([
                "photo",
                "recording",
                "slides",
                "qa",
                "handout",
                "other",
              ]),
            }),
          )
          .max(30)
          .default([]),
      }),
      req.body,
    );
    await write(req, async (client) => {
      const a = await editableActivity(client, req.params.id, req.user);
      if (
        a.status !== "approved" ||
        !["planned", "published", "completed"].includes(a.lifecycle) ||
        ["submitted", "verified"].includes(a.completion_status)
      )
        fail(409, "Activity is not eligible for completion editing");
      if (Date.parse(a.ends_at || a.starts_at) > Date.now())
        fail(422, "Wait until the activity has ended");
      const { assets, ...fields } = data;
      for (const f of assets) await assetOwned(client, f.asset_id, req.user);
      await update(client, "activities", a.id, {
        ...fields,
        lifecycle: "completed",
        completed_at: a.completed_at || new Date(),
        completion_status: "submitted",
        completion_submitted_by: req.user.id,
        completion_submitted_at: new Date(),
        completion_admin_comment: null,
        completion_reviewed_by: null,
        completion_reviewed_at: null,
      });
      await client.query(
        "DELETE FROM rcbc.activity_assets WHERE activity_id=$1",
        [a.id],
      );
      for (const f of assets)
        await client.query(
          "INSERT INTO rcbc.activity_assets VALUES($1,$2,$3)",
          [a.id, f.asset_id, f.purpose],
        );
    });
    res.json({ ok: true });
  });
  for (const [module, table] of Object.entries(tables)) {
    const save = async (req, res) => {
      const parsed = cleanLists(parse(schemas[module], req.body));
      const { translations, ...data } = parsed;
      const row = await write(req, async (client) => {
        if (data.asset_id) await assetOwned(client, data.asset_id, req.user);
        if (
          module === "organisations" &&
          data.language_codes.some((l) => !["en", "ms", "zh"].includes(l))
        )
          fail(422, "Unknown language code");
        if (module === "certificates") {
          if (!data.issued_on) fail(422, "Issue date is required");
          if (!Number.isInteger(data.completion_year))
            fail(422, "Completion year must be an integer");
          if (data.programme === "dcs_worker") {
            if (!data.prerequisite_certificate_id)
              fail(422, "DCS-Family prerequisite is required");
            const prerequisite = await one(
              client,
              "dcs_certificates",
              data.prerequisite_certificate_id,
            );
            if (
              prerequisite.programme !== "dcs_family" ||
              prerequisite.verification_status !== "valid" ||
              prerequisite.participant_name.toLowerCase() !==
                data.participant_name.toLowerCase()
            )
              fail(
                422,
                "Prerequisite must be a valid DCS-Family certificate for this participant",
              );
          }
          if (data.activity_id) {
            const activity = await one(client, "activities", data.activity_id);
            if (
              activity.type_code !== data.programme ||
              activity.completion_status !== "verified"
            )
              fail(
                422,
                "Certificate requires a matching verified programme activity",
              );
          }
          data.issued_by = req.user.id;
          data.revoked_at =
            data.verification_status === "revoked" ? new Date() : null;
        }
        let saved;
        if (req.params.id) {
          const old = await one(client, table, req.params.id, true);
          if (module !== "certificates")
            Object.assign(data, { status: "draft", published_at: null });
          if (old.archived_at) data.archived_at = null;
          saved = await update(client, table, old.id, data);
        } else saved = await insert(client, table, data);
        if (module === "resources" && translations) {
          await client.query(
            "DELETE FROM rcbc.learning_resource_translations WHERE resource_id=$1",
            [saved.id],
          );
          for (const t of translations)
            await client.query(
              "INSERT INTO rcbc.learning_resource_translations(resource_id,locale,title,description) VALUES($1,$2,$3,$4)",
              [saved.id, t.locale, t.title, t.description || null],
            );
        }
        return saved;
      });
      res.status(req.params.id ? 200 : 201).json(row);
    };
    app.post("/api/admin/" + module, admin, save);
    app.put("/api/admin/" + module + "/:id", admin, save);
    if (module === "certificates") continue;
    app.post(
      "/api/admin/" + module + "/:id/action",
      admin,
      async (req, res) => {
        const data = parse(
          z.strictObject({
            action: z.enum([
              "approve",
              "return",
              "publish",
              "unpublish",
              "archive",
              "remove",
            ]),
            comment: z.string().max(2000).default(""),
          }),
          req.body,
        );
        if (["return", "remove"].includes(data.action) && !data.comment.trim())
          fail(422, "Comment required");
        await write(
          req,
          async (client) => {
            const r = await one(client, table, req.params.id, true);
            let f = {};
            if (data.action === "approve") {
              f = { status: "approved", admin_comment: data.comment };
              if (module === "organisations")
                Object.assign(f, {
                  verified_by: req.user.id,
                  verified_at: new Date(),
                  last_reviewed_at: new Date(),
                });
              else
                Object.assign(f, {
                  reviewed_by: req.user.id,
                  reviewed_at: new Date(),
                  last_reviewed_at: new Date(),
                });
            }
            if (data.action === "return")
              f = {
                status: "returned",
                admin_comment: data.comment,
                published_at: null,
              };
            if (data.action === "publish") {
              if (r.status !== "approved")
                fail(409, "Approve before publishing");
              if (module === "resources" && !r.rights_approved)
                fail(422, "Review copyright / consent first");
              f = { published_at: new Date(), archived_at: null };
              if (module === "organisations") f.removed_at = null;
            }
            if (data.action === "unpublish") f = { published_at: null };
            if (["archive", "remove"].includes(data.action)) {
              f = { published_at: null, archived_at: new Date() };
              if (module === "organisations") {
                f.correction_note = data.comment;
                if (data.action === "remove") f.removed_at = new Date();
              }
            }
            await update(client, table, r.id, f);
          },
          data.comment,
        );
        res.json({ ok: true });
      },
    );
  }
  app.get("/api/admin/subscribers/export", admin, async (_req, res) => {
    const rows = (
      await db.query(
        "SELECT name,email,city,state,preferred_language FROM rcbc.subscribers WHERE consent_given AND unsubscribed_at IS NULL ORDER BY email",
      )
    ).rows;
    const cell = (v) =>
      '"' +
      String(v ?? "")
        .replace(/^[=+@-]/, "'$&")
        .replaceAll('"', '""') +
      '"';
    const keys = ["name", "email", "city", "state", "preferred_language"];
    res
      .type("text/csv")
      .set(
        "Content-Disposition",
        'attachment; filename="consented-subscribers.csv"',
      )
      .send(
        [
          keys.join(","),
          ...rows.map((r) => keys.map((k) => cell(r[k])).join(",")),
        ].join("\r\n"),
      );
  });
  app.post(
    "/api/admin/subscribers/:id/unsubscribe",
    admin,
    async (req, res) => {
      await write(req, async (client) => {
        await one(client, "subscribers", req.params.id);
        await update(client, "subscribers", req.params.id, {
          unsubscribed_at: new Date(),
        });
      });
      res.json({ ok: true });
    },
  );
  app.post("/api/admin/enquiries/:id", admin, async (req, res) => {
    const data = parse(
      z.strictObject({
        status: z.enum(["new", "in_progress", "resolved"]),
        admin_comment: z.string().max(2000),
      }),
      req.body,
    );
    await write(
      req,
      (client) => update(client, "enquiries", parse(uuid, req.params.id), data),
      data.admin_comment,
    );
    res.json({ ok: true });
  });
  app.get("/api/public/trainers", async (_req, res) =>
    res.json((await db.query("SELECT * FROM rcbc.public_trainers")).rows),
  );
  app.get("/api/public/activities", async (_req, res) =>
    res.json(
      (
        await db.query(
          `SELECT a.*,coalesce((SELECT json_agg(json_build_object('trainer_id',p.id,'name',p.name,'role',t.role)) FROM rcbc.activity_trainers t JOIN rcbc.public_trainers p ON p.id=t.trainer_id WHERE t.activity_id=a.id),'[]') AS trainers FROM rcbc.public_activities a ORDER BY starts_at`,
        )
      ).rows,
    ),
  );
  app.get("/api/public/activities/:id", async (req, res) => {
    parse(uuid, req.params.id);
    const activity = (
      await db.query("SELECT * FROM rcbc.public_activities WHERE id=$1", [
        req.params.id,
      ])
    ).rows[0];
    if (!activity) fail(404, "Activity not found");
    const translations = (
      await db.query(
        "SELECT locale,title,target_audience,description FROM rcbc.activity_translations WHERE activity_id=$1",
        [activity.id],
      )
    ).rows;
    res.json({
      ...activity,
      translations,
      assets: (
        await db.query(
          "SELECT f.id,f.original_filename,aa.purpose FROM rcbc.activity_assets aa JOIN rcbc.assets f ON f.id=aa.asset_id WHERE aa.activity_id=$1 AND f.publication_approved",
          [activity.id],
        )
      ).rows,
    });
  });
  app.get("/api/public/organisations", async (_req, res) =>
    res.json(
      (
        await db.query(
          "SELECT id,name,registration_number,kind,city,state,address,contact_email,contact_phone,official_url,language_codes,focus,activity_frequency,accepting_volunteers,need_tags,support_type_tags,last_reviewed_at FROM rcbc.organisations WHERE status='approved' AND published_at IS NOT NULL AND archived_at IS NULL AND removed_at IS NULL ORDER BY name",
        )
      ).rows,
    ),
  );
  app.get("/api/public/resources", async (_req, res) =>
    res.json(
      (
        await db.query(
          "SELECT r.id,r.activity_id,r.title,r.description,r.resource_type,r.language_code,r.external_url,CASE WHEN EXISTS(SELECT 1 FROM rcbc.assets f WHERE f.id=r.asset_id AND f.publication_approved) THEN r.asset_id END AS asset_id,coalesce((SELECT json_agg(json_build_object('locale',t.locale,'title',t.title,'description',t.description)) FROM rcbc.learning_resource_translations t WHERE t.resource_id=r.id),'[]') AS translations FROM rcbc.learning_resources r WHERE status='approved' AND rights_approved AND published_at IS NOT NULL AND archived_at IS NULL",
        )
      ).rows,
    ),
  );
  app.get("/api/public/content", async (_req, res) =>
    res.json(
      (
        await db.query(
          "SELECT slug,locale,title,body,section,last_reviewed_at FROM rcbc.content_pages WHERE status='approved' AND published_at IS NOT NULL AND archived_at IS NULL",
        )
      ).rows,
    ),
  );
  app.post("/api/public/subscribe", limited, async (req, res) => {
    const data = parse(
      z.strictObject({
        name: z.string().trim().min(1).max(200),
        email,
        city: z.string().trim().min(1).max(200),
        state: z.string().trim().min(1).max(200),
        preferred_language: z.enum(["en", "ms", "zh"]),
        consent_given: z.literal(true),
      }),
      req.body,
    );
    const token = randomBytes(32).toString("hex");
    await withActor(db, await publicActor(), async (client) => {
      const existing = (
        await client.query(
          "SELECT id FROM rcbc.subscribers WHERE lower(btrim(email))=$1 FOR UPDATE",
          [data.email],
        )
      ).rows[0];
      const fields = {
        ...data,
        consent_at: new Date(),
        consent_text_version: "2026-10-demo-v1",
        privacy_notice_version: "2026-10-demo-v1",
        unsubscribed_at: null,
        unsubscribe_token_hash: digest(token),
      };
      if (!existing) await insert(client, "subscribers", fields);
    });
    res.status(202).json({
      message:
        "Your subscription request was received. To unsubscribe, enter this email on the unsubscribe page.",
    });
  });
  app.post("/api/public/unsubscribe", limited, async (req, res) => {
    const data = parse(z.strictObject({ email }), req.body);
    await withActor(db, await publicActor(), (client) =>
      client.query(
        "UPDATE rcbc.subscribers SET unsubscribed_at=now() WHERE lower(btrim(email))=$1",
        [data.email],
      ),
    );
    res.json({
      message: "If that email is subscribed, updates have been stopped.",
    });
  });
  app.post("/api/public/certificates/verify", limited, async (req, res) => {
    const data = parse(
      z.strictObject({
        name: z.string().trim().min(1).max(200),
        certificate_number: z.string().trim().min(1).max(200),
      }),
      req.body,
    );
    const c = (
      await db.query(
        "SELECT participant_name,programme,city,completion_year,verification_status FROM rcbc.dcs_certificates WHERE lower(participant_name)=lower($1) AND certificate_number=$2",
        [data.name, data.certificate_number],
      )
    ).rows[0];
    res.json(
      c
        ? {
            found: true,
            name: c.participant_name
              .split(/\s+/)
              .map((n) => n[0] + "***")
              .join(" "),
            programme: c.programme,
            city: c.city,
            year: c.completion_year,
            status: c.verification_status,
          }
        : { found: false },
    );
  });
  app.post("/api/enquiries", limited, async (req, res) => {
    const data = req.body || {};
    const errors = validateEnquiry(data);
    if (Object.keys(errors).length) return res.status(422).json({ errors });
    if (
      data.website !== "" ||
      !Number.isFinite(data.startedAt) ||
      Date.now() - data.startedAt < 2000 ||
      Date.now() - data.startedAt > 86400000
    )
      fail(400, "Please try again");
    await withActor(db, await publicActor(), (client) =>
      client.query(
        "INSERT INTO rcbc.enquiries(id,name,email,type,message,fingerprint) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING",
        [
          parse(uuid, data.id),
          data.name.trim(),
          data.email.trim(),
          data.type,
          data.message.trim(),
          digest(
            JSON.stringify([
              data.name.trim(),
              data.email.trim(),
              data.type,
              data.message.trim(),
            ]),
          ),
        ],
      ),
    );
    res.json({ ok: true });
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  });
  app.post(
    "/api/assets",
    requireLogin,
    upload.single("file"),
    async (req, res) => {
      const file = req.file;
      if (!file) fail(422, "Select a file");
      const bytes = file.buffer;
      let mime;
      if (bytes.subarray(0, 5).toString() === "%PDF-") mime = "application/pdf";
      else if (
        bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      )
        mime = "image/png";
      else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
        mime = "image/jpeg";
      else fail(422, "Upload a PDF, PNG or JPEG file");
      const key = randomUUID();
      await mkdir(uploadDirectory, { recursive: true });
      await writeFile(join(uploadDirectory, key), bytes, { mode: 0o600 });
      const asset = await write(req, (client) =>
        insert(client, "assets", {
          storage_key: key,
          original_filename: file.originalname.slice(0, 200),
          media_type: mime,
          byte_size: bytes.length,
          uploaded_by: req.user.id,
        }),
      );
      res.status(201).json({ id: asset.id, name: asset.original_filename });
    },
  );
  app.post("/api/admin/assets/:id/review", admin, async (req, res) => {
    const data = parse(
      z.strictObject({
        publication_approved: z.boolean(),
        rights_note: z.string().trim().min(1).max(2000),
      }),
      req.body,
    );
    await write(req, async (client) => {
      await one(client, "assets", req.params.id, true);
      const privateDoc = await client.query(
        "SELECT 1 FROM rcbc.trainer_documents WHERE asset_id=$1",
        [req.params.id],
      );
      if (privateDoc.rows.length && data.publication_approved)
        fail(422, "Supporting documents cannot be made public");
      await update(client, "assets", req.params.id, data);
    });
    res.json({ ok: true });
  });
  app.get("/api/assets/:id", async (req, res) => {
    const asset = await one(db, "assets", req.params.id);
    let allowed =
      req.user &&
      (req.user.role === "admin" || req.user.id === asset.uploaded_by);
    if (!allowed && asset.publication_approved) {
      const refs = await db.query(
        `SELECT 1 FROM rcbc.public_trainers WHERE photo_asset_id=$1 UNION ALL SELECT 1 FROM rcbc.public_activities WHERE poster_asset_id=$1 UNION ALL SELECT 1 FROM rcbc.learning_resources WHERE asset_id=$1 AND status='approved' AND published_at IS NOT NULL AND archived_at IS NULL AND rights_approved UNION ALL SELECT 1 FROM rcbc.activity_assets aa JOIN rcbc.public_activities a ON a.id=aa.activity_id WHERE aa.asset_id=$1`,
        [asset.id],
      );
      const privateDoc = await db.query(
        "SELECT 1 FROM rcbc.trainer_documents WHERE asset_id=$1",
        [asset.id],
      );
      allowed = refs.rows.length > 0 && !privateDoc.rows.length;
    }
    if (!allowed) fail(403, "This file is private");
    if (!/^[a-f0-9-]{36}$/.test(asset.storage_key))
      fail(404, "File unavailable");
    res
      .type(asset.media_type)
      .set(
        "Content-Disposition",
        `inline; filename="${asset.original_filename.replace(/[^a-zA-Z0-9_. -]/g, "_")}"`,
      )
      .send(await readFile(join(uploadDirectory, asset.storage_key)));
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "API endpoint not found" }),
  );
  app.use((error, _req, res, _next) => {
    if (error instanceof HttpError)
      return res.status(error.status).json({ error: error.message });
    if (error.code === "23505")
      return res.status(409).json({
        error: "This email, certificate number, or assignment already exists",
      });
    if (
      ["23514", "23503", "22P02", "22007", "22008", "23502"].includes(
        error.code,
      )
    )
      return res.status(422).json({
        error:
          "Required fields or linked records are invalid. Check the form and workflow status.",
      });
    if (error.code === "LIMIT_FILE_SIZE" || error.type === "entity.too.large")
      return res.status(413).json({ error: "File or request is too large" });
    if (error.type === "entity.parse.failed")
      return res.status(400).json({ error: "Invalid JSON" });
    console.error("API error:", error.message);
    res.status(503).json({
      error:
        "Unable to complete this request. Check the database connection and retry.",
    });
  });
  return app;
}
