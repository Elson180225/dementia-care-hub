import { z } from "zod";
import { modules, activityFields, profileFields } from "../shared/records.js";
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const fail = (status, message) => {
  throw new HttpError(status, message);
};
export const uuid = z.uuid();
export const password = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(128);
export const email = z
  .email()
  .max(254)
  .transform((s) => s.trim().toLowerCase());
export function fieldSchema(fields, { partial = false } = {}) {
  const shape = {};
  for (const f of fields) {
    let s;
    if (f.type === "checkbox") s = z.boolean().default(false);
    else if (f.type === "number")
      s = z.number().finite().nonnegative().max(999999);
    else if (f.type === "select") s = z.enum(f.options);
    else if (f.key.endsWith("_id")) s = uuid;
    else if (f.key.endsWith("_url"))
      s = z
        .url()
        .refine((s) => /^https?:\/\//.test(s), "Use an HTTP or HTTPS URL");
    else if (f.type === "date" || f.type === "datetime-local")
      s = z
        .string()
        .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date");
    else if (f.key === "contact_email") s = email;
    else
      s = z
        .string()
        .trim()
        .max(f.type === "textarea" ? 20000 : 1000)
        .min(f.required ? 1 : 0);
    if (!f.required && f.type !== "checkbox") s = s.nullable().optional();
    shape[f.key] = s;
  }
  const schema = z.strictObject(shape);
  return partial ? schema.partial() : schema;
}
export const schemas = Object.fromEntries(
  Object.entries(modules).map(([k, m]) => [k, fieldSchema(m.fields)]),
);
export const activitySchema = fieldSchema(activityFields).extend({
  trainers: z
    .array(
      z.strictObject({
        trainer_id: uuid,
        role: z.enum(["trainer", "co_trainer", "speaker"]),
      }),
    )
    .max(30)
    .optional(),
  translations: z
    .array(
      z.strictObject({
        locale: z.enum(["en", "ms", "zh"]),
        title: z.string().min(1).max(1000),
        target_audience: z.string().max(20000).nullable().optional(),
        description: z.string().max(20000).nullable().optional(),
      }),
    )
    .max(3)
    .optional(),
});
export const profileSchema = fieldSchema(profileFields).extend({
  document_ids: z.array(uuid).max(20).optional(),
});
export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success)
    fail(
      422,
      result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    );
  return result.data;
}
export async function insert(client, table, data) {
  const keys = Object.keys(data);
  return (
    await client.query(
      `INSERT INTO rcbc.${table} (${keys.join(",")}) VALUES (${keys.map((_, i) => "$" + (i + 1)).join(",")}) RETURNING *`,
      Object.values(data),
    )
  ).rows[0];
}
export async function update(client, table, id, data) {
  const keys = Object.keys(data);
  if (!keys.length) fail(422, "No changes supplied");
  return (
    await client.query(
      `UPDATE rcbc.${table} SET ${keys.map((k, i) => `${k}=$${i + 2}`).join(",")} WHERE id=$1 RETURNING *`,
      [id, ...Object.values(data)],
    )
  ).rows[0];
}
export async function one(client, table, id, lock = false) {
  parse(uuid, id);
  const row = (
    await client.query(
      `SELECT * FROM rcbc.${table} WHERE id=$1${lock ? " FOR UPDATE" : ""}`,
      [id],
    )
  ).rows[0];
  if (!row) fail(404, "Record not found");
  return row;
}
export function cleanLists(data) {
  for (const k of ["language_codes", "need_tags", "support_type_tags"])
    if (k in data)
      data[k] = data[k]
        ? data[k]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
  return data;
}

schemas.resources = schemas.resources.extend({
  translations: z
    .array(
      z.strictObject({
        locale: z.enum(["en", "ms", "zh"]),
        title: z.string().trim().min(1).max(1000),
        description: z.string().max(20000).nullable().optional(),
      }),
    )
    .max(3)
    .optional(),
});
