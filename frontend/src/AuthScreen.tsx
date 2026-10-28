
import { useState, type FormEvent } from "react";
import { ArrowRight, Command, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { login, register } from "./lib/api";

type AuthScreenProps = {
  onAuthenticated: () => void;
};

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "register" && fullName.trim().length < 2) {
      setError("Enter your full name (at least 2 characters).");
      return;
    }

    if (password.length < (mode === "register" ? 12 : 1)) {
      setError(
        mode === "register"
          ? "Your password must contain at least 12 characters."
          : "Enter your password.",
      );
      return;
    }

    setLoading(true);

    try {
      if (mode === "register") {
        await register(fullName.trim(), email.trim(), password);
      }

      await login(email.trim(), password);
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setError("");
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <a className="auth-brand" href="/" aria-label="MeetOrbit home">
          <span className="auth-brand-icon"><Command size={23} /></span>
          <span>MeetOrbit<span className="brand-period">.</span></span>
        </a>

        <div className="auth-brand-message">
          <span className="auth-eyebrow">MEETINGS, MADE INTELLIGENT</span>
          <h1>Make every conversation count.</h1>
          <p>
            Bring your meetings together. Turn conversations into knowledge,
            decisions, and meaningful progress.
          </p>
          <div className="auth-orbit-art" aria-hidden="true">
            <span className="auth-orbit auth-orbit-one" />
            <span className="auth-orbit auth-orbit-two" />
            <span className="auth-orbit auth-orbit-three" />
            <span className="auth-orbit-core"><Command size={30} /></span>
          </div>
        </div>

        <p className="auth-brand-footer">Your team's conversations, in sync.</p>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <span className="auth-brand-icon"><Command size={21} /></span>
            <strong>MeetOrbit<span className="brand-period">.</span></strong>
          </div>

          <div className="auth-heading">
            <span className="auth-heading-icon"><LockKeyhole size={22} /></span>
            <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
            <p>
              {mode === "login"
                ? "Sign in to continue to your workspace."
                : "Get started with your meeting workspace."}
            </p>
          </div>

          <div className="auth-mode-tabs">
            <button
              type="button"
              className={mode === "login" ? "auth-mode-active" : ""}
              onClick={() => changeMode("login")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === "register" ? "auth-mode-active" : ""}
              onClick={() => changeMode("register")}
            >
              Create account
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "register" && (
              <>
                <label htmlFor="auth-full-name">Full name</label>
                <div className="auth-input-wrap">
                  <UserRound size={17} />
                  <input
                    id="auth-full-name"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Your full name"
                    minLength={2}
                    maxLength={120}
                    required
                  />
                </div>
              </>
            )}

            <label htmlFor="auth-email">Email address</label>
            <div className="auth-input-wrap">
              <Mail size={17} />
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                maxLength={320}
                required
              />
            </div>

            <label htmlFor="auth-password">Password</label>
            <div className="auth-input-wrap">
              <LockKeyhole size={17} />
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === "register" ? "At least 12 characters" : "Enter your password"}
                minLength={mode === "register" ? 12 : undefined}
                maxLength={128}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in to MeetOrbit"
                  : "Create account"}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="auth-switch-copy">
            {mode === "login" ? "New to MeetOrbit?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => changeMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>

          <p className="auth-security-note">
            Your workspace is protected by authenticated access.
          </p>
        </div>
      </section>
    </main>
  );
}
