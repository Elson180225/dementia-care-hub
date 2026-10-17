import argon2 from "argon2";
import { randomUUID, createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { openDatabase, withActor } from "../server/database.js";
import { insert } from "../server/validation.js";
import { migrate } from "./migrate.mjs";
export const demoCredentials = {
  admin: { email: "admin@rcbc.example", password: "RCBC-Admin-2026!" },
  trainer: { email: "trainer@rcbc.example", password: "RCBC-Trainer-2026!" },
};
export async function seed(db) {
  if (
    (
      await db.query(
        "SELECT id FROM rcbc.users WHERE lower(email)='admin@rcbc.example'",
      )
    ).rows.length
  ) {
    console.log("Demo records already exist; existing records were preserved.");
    return;
  }
  if (process.env.NODE_ENV === "production")
    throw new Error("Demo seeding is disabled in production");
  const admin = randomUUID();
  await withActor(db, admin, async (c) => {
    await insert(c, "users", {
      id: admin,
      email: demoCredentials.admin.email,
      display_name: "RCBC Demo Administrator",
      password_hash: await argon2.hash(demoCredentials.admin.password),
      role: "admin",
      active: true,
      created_by: admin,
      activated_by: admin,
      activated_at: new Date(),
    });
    const profiles = [];
    for (const [i, name] of [
      "Aina Demo",
      "Daniel Demo",
      "Mei Demo",
    ].entries()) {
      const u = await insert(c, "users", {
        email:
          i === 0
            ? demoCredentials.trainer.email
            : `trainer${i + 1}@rcbc.example`,
        display_name: name,
        password_hash: await argon2.hash(demoCredentials.trainer.password),
        role: "certified_trainer",
        active: true,
        created_by: admin,
        activated_by: admin,
        activated_at: new Date(),
      });
      profiles.push(
        await insert(c, "trainer_profiles", {
          user_id: u.id,
          city: ["Bintulu", "Kuching", "Miri"][i],
          language_code: ["en", "ms", "zh"][i],
          short_profile:
            "Fictional demonstration trainer. This is not a real professional listing.",
          qualifications: "Demo DCS-TTT completion",
          experience: "Community education demonstration",
          certified_status: "certified",
          certificate_reference: `DEMO-TTT-2026-00${i + 1}`,
          status: i === 1 ? "submitted" : "approved",
          reviewed_by: i === 1 ? null : admin,
          reviewed_at: i === 1 ? null : new Date(),
        }),
      );
    }
    await insert(c, "trainer_access_requests", {
      name: "Sara Demo",
      email: "pending@rcbc.example",
      city: "Sibu",
      certificate_reference: "DEMO-TTT-PENDING",
      requested_password_hash: await argon2.hash("RCBC-Pending-2026!"),
    });
    const org = await insert(c, "organisations", {
      name: "Demo Community Support Centre (fictional)",
      registration_number: "DEMO-ORG-001",
      kind: "support_group",
      city: "Bintulu",
      state: "Sarawak",
      address: "Demonstration address only",
      contact_email: "support@rcbc.example",
      language_codes: ["en", "ms"],
      focus: "Family caregiver peer support (demo)",
      activity_frequency: "Monthly demonstration session",
      accepting_volunteers: true,
      need_tags: ["caregiver", "services"],
      support_type_tags: ["Support Group / NGO"],
      source_note: "Fictional demo dataset; not a service recommendation",
      terms_accepted_at: new Date(),
      terms_version: "demo-v1",
      status: "approved",
      verified_by: admin,
      verified_at: new Date(),
      last_reviewed_at: new Date(),
      next_review_on: "2027-01-01",
      published_at: new Date(),
    });
    await insert(c, "organisations", {
      name: "Demo Care Facility (fictional)",
      kind: "care_facility",
      city: "Kuching",
      state: "Sarawak",
      focus: "Example record requiring review",
      language_codes: ["en"],
      need_tags: ["services"],
      support_type_tags: ["Respite / Elderly Care"],
      next_review_on: "2026-01-01",
      status: "submitted",
      source_note: "Fictional demo data",
    });
    const activities = [];
    const specs = [
      ["Caregiver communication workshop", "submitted", "planned", 30],
      ["Understanding dementia seminar", "approved", "published", 45],
      ["Community education: completed session", "approved", "completed", -12],
      ["Verified caregiver learning workshop", "approved", "verified", -30],
      ["Archived community seminar", "approved", "archived", -60],
      ["Workshop draft for review", "draft", "planned", 60],
      ["Workshop returned for amendment", "returned", "planned", 75],
      ["DCS-Family demonstration class", "approved", "verified", -45],
    ];
    for (const [i, [title, status, lifecycle, offset]] of specs.entries()) {
      const start = new Date(Date.now() + offset * 86400000);
      start.setUTCHours(2, 0, 0, 0);
      const end = new Date(start.getTime() + 2 * 3600000);
      const completed = ["completed", "verified", "archived"].includes(
          lifecycle,
        ),
        verified = ["verified", "archived"].includes(lifecycle);
      const a = await insert(c, "activities", {
        created_by: profiles[0].user_id,
        organiser_id: org.id,
        title: "[DEMO] " + title,
        starts_at: start,
        ends_at: end,
        type_code: i === 7 ? "dcs_family" : i % 2 ? "seminar" : "workshop",
        mode: i % 2 ? "online" : "physical",
        city: "Bintulu",
        venue: i % 2 ? "Online" : "Demo community hall",
        language_code: "en",
        target_audience: "Family caregivers and community members",
        description:
          "Fictional activity for demonstrating submission, publication and verification. Not a real event.",
        registration_url: "https://example.com/demo-registration",
        registration_deadline: start,
        capacity: 50,
        planned_hours: 2,
        status,
        admin_comment:
          status === "returned"
            ? "Please clarify the intended audience."
            : null,
        reviewed_by: status === "approved" ? admin : null,
        reviewed_at: status === "approved" ? new Date() : null,
        lifecycle,
        published_at: status === "approved" ? new Date() : null,
        completed_at: completed ? end : null,
        archived_at: lifecycle === "archived" ? new Date() : null,
        actual_venue: completed ? "Demo community hall" : null,
        participant_count: completed ? 24 + i : null,
        actual_hours: completed ? 2 : null,
        completion_status: completed
          ? verified
            ? "verified"
            : "submitted"
          : null,
        completion_submitted_by: completed ? profiles[0].user_id : null,
        completion_submitted_at: completed ? end : null,
        completion_reviewed_by: verified ? admin : null,
        completion_reviewed_at: verified ? new Date() : null,
      });
      activities.push(a);
      await c.query(
        "INSERT INTO rcbc.activity_trainers VALUES($1,$2,'trainer')",
        [a.id, profiles[0].id],
      );
      if (i === 3)
        await c.query(
          "INSERT INTO rcbc.activity_trainers VALUES($1,$2,'co_trainer')",
          [a.id, profiles[2].id],
        );
    }
    await insert(c, "learning_resources", {
      activity_id: activities[3].id,
      title: "[DEMO] Caregiver communication handout",
      description:
        "Example approved learning resource linked to the original activity.",
      resource_type: "handout",
      language_code: "en",
      external_url: "https://example.com/demo-handout",
      source_note: "Fictional demonstration resource",
      rights_note: "Demonstration only",
      rights_approved: true,
      status: "approved",
      reviewed_by: admin,
      reviewed_at: new Date(),
      published_at: new Date(),
    });
    await insert(c, "learning_resources", {
      title: "[DEMO] Recording awaiting rights review",
      resource_type: "recording",
      language_code: "en",
      external_url: "https://example.com/demo-recording",
      status: "submitted",
      rights_note: "Permission evidence needs review",
    });
    await insert(c, "dcs_certificates", {
      certificate_number: "DEMO-DCS-2026-001",
      participant_name: "Alex Demo",
      programme: "dcs_family",
      activity_id: activities[7].id,
      city: "Bintulu",
      completion_year: new Date().getFullYear(),
      issued_on: new Date(),
      verification_status: "valid",
      cpd_points: 2,
      issued_by: admin,
    });
    for (const [i, name] of [
      "Subscriber One Demo",
      "Subscriber Two Demo",
    ].entries())
      await insert(c, "subscribers", {
        name,
        email: `subscriber${i + 1}@rcbc.example`,
        city: "Bintulu",
        state: "Sarawak",
        preferred_language: i ? "ms" : "en",
        consent_given: true,
        consent_at: new Date(),
        consent_text_version: "demo-v1",
        privacy_notice_version: "demo-v1",
        unsubscribe_token_hash: createHash("sha256")
          .update(randomUUID())
          .digest("hex"),
        unsubscribed_at: i ? new Date() : null,
      });
    await insert(c, "content_pages", {
      slug: "demo-caregiver-guidance",
      locale: "en",
      title: "[DEMO] Caregiver guidance",
      body: "Demonstration content for the administrative editing and publication workflow. Replace with professionally reviewed project content before public launch.",
      section: "caregiver",
      source_note: "Fictional demo content",
      status: "approved",
      reviewed_by: admin,
      reviewed_at: new Date(),
      last_reviewed_at: new Date(),
      published_at: new Date(),
    });
    await insert(c, "enquiries", {
      name: "Visitor Demo",
      email: "visitor@rcbc.example",
      type: "General Enquiry",
      message:
        "Demonstration enquiry: please share information about the project.",
    });
    // Use a tiny generated PNG as a safe fictional poster/photo asset.
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
      "base64",
    );
    const directory = resolve(process.env.UPLOAD_DIRECTORY || ".local/uploads");
    await mkdir(directory, { recursive: true });
    for (const purpose of ["poster", "supporting_document"]) {
      const key = randomUUID();
      await writeFile(join(directory, key), png);
      const f = await insert(c, "assets", {
        storage_key: key,
        original_filename: `demo-${purpose}.png`,
        media_type: "image/png",
        byte_size: png.length,
        uploaded_by: profiles[0].user_id,
        publication_approved: purpose === "poster",
        rights_note: "Generated demo placeholder",
      });
      if (purpose === "poster") {
        await c.query(
          "UPDATE rcbc.activities SET poster_asset_id=$1 WHERE id=$2",
          [f.id, activities[1].id],
        );
        await c.query(
          "INSERT INTO rcbc.activity_assets VALUES($1,$2,'photo')",
          [activities[3].id, f.id],
        );
      } else
        await c.query("INSERT INTO rcbc.trainer_documents VALUES($1,$2,$3)", [
          profiles[0].id,
          f.id,
          "Private demo supporting document",
        ]);
    }
  });
  console.log(
    "Fictional demo data created. Login details are in docs/admin-dashboard.md.",
  );
}
if (process.argv[1]?.replaceAll("\\", "/").endsWith("/seed.mjs")) {
  const db = await openDatabase();
  try {
    await migrate(db);
    await seed(db);
  } finally {
    await db.end();
  }
}
