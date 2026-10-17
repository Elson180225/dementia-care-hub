import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { post } from "../shared/api";
import "../admin/Admin.css";
export default function Login({ admin = false }) {
  const auth = useAuth();
  const [signup, setSignup] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  if (auth.loading)
    return (
      <main className="ad-page">
        <p role="status">Checking session…</p>
      </main>
    );
  if (auth.user)
    return (
      <Navigate
        to={auth.user.role === "admin" ? "/admin" : "/trainer-portal"}
        replace
      />
    );
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (signup) {
        const result = await post("/auth/signup", fields);
        setMessage(result.message);
      } else await auth.login(fields.email, fields.password);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="ad-login">
      <section className="ad-login-intro">
        <span className="ad-eyebrow">RCBC · DEMENTIA CARE CONNECT</span>
        <h1>
          {signup
            ? "Request trainer access"
            : admin
              ? "A place to manage care and community."
              : "Welcome back, trainer."}
        </h1>
        <p>
          {admin
            ? "Review contributions, maintain trusted information, and recognise the people behind the project."
            : "Maintain your profile, submit activities, and see your verified contribution."}
        </p>
        <Link to="/">← Back to the website</Link>
      </section>
      <section className="ad-login-card">
        <span className="ad-eyebrow">
          {signup
            ? "IDENTITY & CERTIFICATE REVIEW"
            : admin
              ? "AUTHORISED RCBC TEAM"
              : "CERTIFIED TRAINER PORTAL"}
        </span>
        <h2>{signup ? "Request access" : "Sign in"}</h2>
        <p>
          {signup
            ? "RCBC will review your identity and certificate before activating your account."
            : "Use your RCBC-authorised account."}
        </p>
        <form onSubmit={submit}>
          {signup && (
            <label>
              Full name
              <input name="name" autoComplete="name" required />
            </label>
          )}
          <label>
            Email address
            <input type="email" name="email" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete={signup ? "new-password" : "current-password"}
              minLength={signup ? 12 : 1}
              required
            />
          </label>
          {signup && (
            <>
              <label>
                Certificate reference number
                <input name="certificate_reference" required />
              </label>
              <label>
                City / location
                <input name="city" required />
              </label>
            </>
          )}
          {(error || auth.error) && (
            <p className="ad-error" role="alert">
              {error || auth.error}
            </p>
          )}
          {message && (
            <p className="ad-success" role="status">
              {message}
            </p>
          )}
          <button disabled={busy}>
            {busy
              ? "Please wait…"
              : signup
                ? "Submit access request"
                : "Sign in"}
          </button>
        </form>
        {!admin && (
          <button
            className="ad-link"
            onClick={() => {
              setSignup(!signup);
              setError("");
              setMessage("");
            }}
          >
            {signup
              ? "Already approved? Sign in"
              : "New certified trainer? Request access"}
          </button>
        )}
        <p className="ad-small">
          {admin
            ? "Administrator accounts are created internally by RCBC."
            : "Public visitors do not need a website account."}
        </p>
        <Link to={admin ? "/login" : "/admin/login"}>
          {admin ? "Trainer sign in" : "RCBC Admin access"}
        </Link>
      </section>
    </main>
  );
}
