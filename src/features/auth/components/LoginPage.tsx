import { useEffect, useState, type FormEvent } from "react";
import { HeroSides } from "../../landing/components/HeroSides";
import { useAuth } from "../context/authContext";
import { sendSignInLink, signOut } from "../services/authService";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const { status, user, callbackFailed } = useAuth();
  const staff = new URLSearchParams(window.location.search).get("next") === "admin";
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Sign in | Soul Bites";
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status !== "ready" || busy) return;
    setBusy(true);
    setError("");
    try {
      const address = email.trim();
      await sendSignInLink(address, staff);
      setSentTo(address);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Try again in a moment.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function endSession() {
    setBusy(true);
    setError("");
    try {
      await signOut();
      setSentTo("");
      setEmail("");
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Try again in a moment.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a href="/" aria-label="Soul Bites home">
          <img
            src="/images/soul_bites_logo_small.webp"
            alt=""
            width={192}
            height={138}
          />
        </a>
        <a href="/#menu">
          Back to the menu <span aria-hidden="true">↗</span>
        </a>
      </header>
      <main className={styles.layout}>
        <div className={styles.editorial} aria-hidden="true">
          <p className={styles.label}>The Soul Bites kitchen</p>
          <div className={styles.meal}>
            <HeroSides still />
            <img
              className={styles.burger}
              src="/images/landing/aloo-burger-720.webp"
              width={720}
              height={720}
              alt=""
            />
          </div>
          <p className={styles.posterTitle}>
            Big bites. <em>Big soul.</em>
          </p>
        </div>
        <section className={styles.panel} aria-labelledby="login-title">
          <div className={styles.inner}>
            <p className={styles.label}>Soul Bites / Account</p>
            <h1 id="login-title">
              {user ? (
                <>
                  You’re <em>in.</em>
                </>
              ) : sentTo ? (
                <>
                  Check your <em>inbox.</em>
                </>
              ) : (
                <>
                  Welcome <em>back.</em>
                </>
              )}
            </h1>
            {user ? (
              <>
                <p className={styles.description}>
                  Signed in as{" "}
                  <strong>{user.email ?? "a Soul Bites member"}</strong>.
                </p>
                <a className={styles.primary} href={staff ? "/admin" : "/#menu"}>
                  {staff ? "Open kitchen console" : "Explore the menu"} <span aria-hidden="true">↗</span>
                </a>
                <button
                  className={styles.secondary}
                  type="button"
                  disabled={busy}
                  onClick={endSession}
                >
                  {busy ? "Signing out…" : "Sign out"}
                </button>
              </>
            ) : sentTo ? (
              <>
                <p className={styles.description} role="status">
                  We sent a sign-in link to <strong>{sentTo}</strong>. Open the
                  link in this browser to continue.
                </p>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => setSentTo("")}
                >
                  Use a different email
                </button>
              </>
            ) : (
              <>
                <p className={styles.description}>
                  Enter your email to sign in or create an account. We’ll send
                  you a one-time link.
                </p>
                {callbackFailed && (
                  <p className={styles.feedback} role="alert">
                    This sign-in link couldn’t be used. Request a new link and
                    open it in this browser.
                  </p>
                )}
                <form className={styles.form} onSubmit={submit}>
                  <label htmlFor="account-email">Email address</label>
                  <input
                    id="account-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    maxLength={254}
                    value={email}
                    required
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                    }}
                  />
                  <button
                    className={styles.primary}
                    type="submit"
                    disabled={busy || status !== "ready"}
                  >
                    {busy ? "Sending link…" : "Send sign-in link"}{" "}
                    <span aria-hidden="true">↗</span>
                  </button>
                </form>
                {status === "loading" && (
                  <p className={styles.feedback} role="status">
                    Checking your session…
                  </p>
                )}
                {status === "unavailable" && (
                  <p className={styles.feedback} role="status">
                    Account sign-in is currently unavailable. The menu is open
                    to guests.
                  </p>
                )}
              </>
            )}
            {error && (
              <p className={styles.feedback} role="alert">
                {error}
              </p>
            )}
            {!user && (
              <a className={styles.guest} href="/#menu">
                Continue as guest <span aria-hidden="true">→</span>
              </a>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
