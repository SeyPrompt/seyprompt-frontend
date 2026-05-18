"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  forgotPassword,
  loginUser,
  registerUser,
  resetPassword,
  verifyEmail
} from "@/lib/user-auth";
import { useUserAuth } from "@/components/user-auth-provider";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const otpPattern = /^\d{6}$/;
const emailVerificationLoginMessage = "Please verify your email before logging in.";
const inactiveAccountLoginMessage = "Account is not active.";

function getFieldErrors(details = []) {
  return details.reduce((errors, detail) => {
    if (detail?.field && detail?.message) {
      errors[detail.field] = detail.message;
    }

    return errors;
  }, {});
}

function readForm(event) {
  const formData = new FormData(event.currentTarget);
  return Object.fromEntries(formData.entries());
}

function validateEmail(value) {
  if (!value) {
    return "Email is required.";
  }

  if (!emailPattern.test(value)) {
    return "Enter a valid email address.";
  }

  return "";
}

function validatePassword(value, fieldName = "Password") {
  if (!value) {
    return `${fieldName} is required.`;
  }

  if (value.length < 8) {
    return `${fieldName} must be at least 8 characters.`;
  }

  return "";
}

function validateOtp(value) {
  if (!otpPattern.test(value || "")) {
    return "OTP must be exactly 6 digits.";
  }

  return "";
}

function isEmailVerificationLoginError(error) {
  return error.status === 403 && error.message === emailVerificationLoginMessage;
}

function handleLoginError(form, error) {
  if (error.status === 400) {
    form.handleError(error);
    return;
  }

  if (error.status === 401) {
    form.setFormError("Invalid email or password.");
    return;
  }

  if (isEmailVerificationLoginError(error)) {
    form.setFormError(emailVerificationLoginMessage);
    return;
  }

  if (error.status === 403 && error.message === inactiveAccountLoginMessage) {
    form.setFormError("Your account is inactive. Please contact support.");
    return;
  }

  if (error.status >= 500) {
    form.setFormError("Something went wrong. Please try again later.");
    return;
  }

  form.handleError(error);
}

function useEmailFromRoute() {
  const searchParams = useSearchParams();
  return searchParams.get("email") || "";
}

function useAuthFormState() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!cooldownUntil) {
      return undefined;
    }

    const interval = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

  const cooldownSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

  function clearMessages() {
    setFieldErrors({});
    setFormError("");
    setSuccess("");
  }

  function handleError(error) {
    setFieldErrors(getFieldErrors(error.details));
    setFormError(error.message || "Something went wrong. Please try again.");

    if (error.status === 429) {
      setCooldownUntil(Date.now() + 10000);
    }
  }

  return {
    cooldownSeconds,
    disabled: loading || cooldownSeconds > 0,
    fieldErrors,
    formError,
    loading,
    success,
    clearMessages,
    handleError,
    setFieldErrors,
    setFormError,
    setLoading,
    setSuccess
  };
}

function FieldError({ id, message }) {
  return message ? (
    <p className="error-text" id={id}>
      {message}
    </p>
  ) : null;
}

function FormMessages({ error, success, cooldownSeconds }) {
  return (
    <>
      {error ? <p className="error-text auth-message">{error}</p> : null}
      {success ? <p className="success-text auth-message">{success}</p> : null}
      {cooldownSeconds > 0 ? (
        <p className="field-hint">
          Please wait {cooldownSeconds}s before trying again.
        </p>
      ) : null}
    </>
  );
}

function AuthFooter({ children }) {
  return <div className="auth-form-footer">{children}</div>;
}

export function RegisterForm() {
  const router = useRouter();
  const form = useAuthFormState();

  async function handleSubmit(event) {
    event.preventDefault();
    form.clearMessages();

    const payload = readForm(event);
    const errors = {
      name: !payload.name
        ? "Name is required."
        : payload.name.length < 2 || payload.name.length > 120
          ? "Name must be 2 to 120 characters."
          : "",
      email: validateEmail(payload.email),
      password: validatePassword(payload.password)
    };

    const activeErrors = Object.fromEntries(
      Object.entries(errors).filter(([, message]) => message)
    );

    if (Object.keys(activeErrors).length) {
      form.setFieldErrors(activeErrors);
      return;
    }

    form.setLoading(true);

    try {
      const result = await registerUser(payload);
      form.setSuccess(
        result.message || "OTP sent. Please verify your email to complete registration."
      );
      router.push(`/verify-email?email=${encodeURIComponent(payload.email)}`);
    } catch (error) {
      form.handleError(error);
    } finally {
      form.setLoading(false);
    }
  }

  return (
    <form className="panel form-card stack auth-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" autoComplete="name" required />
        <FieldError id="name-error" message={form.fieldErrors.name} />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError id="email-error" message={form.fieldErrors.email} />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <FieldError id="password-error" message={form.fieldErrors.password} />
      </div>
      <FormMessages
        cooldownSeconds={form.cooldownSeconds}
        error={form.formError}
        success={form.success}
      />
      <button className="button" disabled={form.disabled} type="submit">
        {form.loading ? "Sending OTP..." : "Create account"}
      </button>
      <AuthFooter>
        Already have an account? <Link href="/login">Log in</Link>
      </AuthFooter>
    </form>
  );
}

export function VerifyEmailForm() {
  const router = useRouter();
  const emailFromRoute = useEmailFromRoute();
  const [email, setEmail] = useState(emailFromRoute);
  const form = useAuthFormState();
  const auth = useUserAuth();

  async function handleSubmit(event) {
    event.preventDefault();
    form.clearMessages();

    const payload = { ...readForm(event), email };
    const errors = {
      email: validateEmail(payload.email),
      otp: validateOtp(payload.otp)
    };
    const activeErrors = Object.fromEntries(
      Object.entries(errors).filter(([, message]) => message)
    );

    if (Object.keys(activeErrors).length) {
      form.setFieldErrors(activeErrors);
      return;
    }

    form.setLoading(true);

    try {
      const result = await verifyEmail(payload);
      auth.login(result);
      router.replace("/saved");
    } catch (error) {
      form.handleError(error);
    } finally {
      form.setLoading(false);
    }
  }

  return (
    <form className="panel form-card stack auth-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          value={email}
        />
        <FieldError id="email-error" message={form.fieldErrors.email} />
      </div>
      <div className="field">
        <label htmlFor="otp">Verification OTP</label>
        <input
          id="otp"
          name="otp"
          inputMode="numeric"
          maxLength={6}
          pattern="\d{6}"
          required
        />
        <p className="field-hint">The OTP expires in 10 minutes.</p>
        <FieldError id="otp-error" message={form.fieldErrors.otp} />
      </div>
      <FormMessages
        cooldownSeconds={form.cooldownSeconds}
        error={form.formError}
        success={form.success}
      />
      <button className="button" disabled={form.disabled} type="submit">
        {form.loading ? "Verifying..." : "Verify email"}
      </button>
    </form>
  );
}

export function LoginForm() {
  const router = useRouter();
  const emailFromRoute = useEmailFromRoute();
  const [email, setEmail] = useState(emailFromRoute);
  const form = useAuthFormState();
  const auth = useUserAuth();

  async function handleSubmit(event) {
    event.preventDefault();
    form.clearMessages();

    const payload = readForm(event);
    const errors = {
      email: validateEmail(payload.email),
      password: validatePassword(payload.password)
    };
    const activeErrors = Object.fromEntries(
      Object.entries(errors).filter(([, message]) => message)
    );

    if (Object.keys(activeErrors).length) {
      form.setFieldErrors(activeErrors);
      return;
    }

    form.setLoading(true);

    try {
      const result = await loginUser(payload);
      auth.login(result);
      router.replace("/saved");
    } catch (error) {
      handleLoginError(form, error);
    } finally {
      form.setLoading(false);
    }
  }

  const verifyHref = useMemo(
    () => `/verify-email${email ? `?email=${encodeURIComponent(email)}` : ""}`,
    [email]
  );

  return (
    <form className="panel form-card stack auth-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          value={email}
        />
        <FieldError id="email-error" message={form.fieldErrors.email} />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <FieldError id="password-error" message={form.fieldErrors.password} />
      </div>
      <FormMessages
        cooldownSeconds={form.cooldownSeconds}
        error={form.formError}
        success={form.success}
      />
      {form.formError === emailVerificationLoginMessage ? (
        <Link className="button-secondary auth-inline-action" href={verifyHref}>
          Verify email
        </Link>
      ) : null}
      <button className="button" disabled={form.disabled} type="submit">
        {form.loading ? "Signing in..." : "Log in"}
      </button>
      <AuthFooter>
        <Link href="/forgot-password">Forgot password?</Link>
        <span>New here? <Link href="/register">Create account</Link></span>
      </AuthFooter>
    </form>
  );
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const form = useAuthFormState();

  async function handleSubmit(event) {
    event.preventDefault();
    form.clearMessages();

    const payload = readForm(event);
    const emailError = validateEmail(payload.email);

    if (emailError) {
      form.setFieldErrors({ email: emailError });
      return;
    }

    form.setLoading(true);

    try {
      const result = await forgotPassword(payload);
      form.setSuccess(
        result.message || "If an account exists, a password reset OTP has been sent."
      );
      router.push(`/reset-password?email=${encodeURIComponent(payload.email)}`);
    } catch (error) {
      form.handleError(error);
    } finally {
      form.setLoading(false);
    }
  }

  return (
    <form className="panel form-card stack auth-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError id="email-error" message={form.fieldErrors.email} />
      </div>
      <FormMessages
        cooldownSeconds={form.cooldownSeconds}
        error={form.formError}
        success={form.success}
      />
      <button className="button" disabled={form.disabled} type="submit">
        {form.loading ? "Sending OTP..." : "Send reset OTP"}
      </button>
      <AuthFooter>
        Remembered it? <Link href="/login">Log in</Link>
      </AuthFooter>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const emailFromRoute = useEmailFromRoute();
  const [email, setEmail] = useState(emailFromRoute);
  const form = useAuthFormState();

  async function handleSubmit(event) {
    event.preventDefault();
    form.clearMessages();

    const payload = { ...readForm(event), email };
    const errors = {
      email: validateEmail(payload.email),
      otp: validateOtp(payload.otp),
      newPassword: validatePassword(payload.newPassword, "New password")
    };
    const activeErrors = Object.fromEntries(
      Object.entries(errors).filter(([, message]) => message)
    );

    if (Object.keys(activeErrors).length) {
      form.setFieldErrors(activeErrors);
      return;
    }

    form.setLoading(true);

    try {
      const result = await resetPassword(payload);
      form.setSuccess(result.message || "Password reset successful.");
      router.push(`/login?email=${encodeURIComponent(payload.email)}`);
    } catch (error) {
      form.handleError(error);
    } finally {
      form.setLoading(false);
    }
  }

  return (
    <form className="panel form-card stack auth-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          value={email}
        />
        <FieldError id="email-error" message={form.fieldErrors.email} />
      </div>
      <div className="field">
        <label htmlFor="otp">Reset OTP</label>
        <input
          id="otp"
          name="otp"
          inputMode="numeric"
          maxLength={6}
          pattern="\d{6}"
          required
        />
        <FieldError id="otp-error" message={form.fieldErrors.otp} />
      </div>
      <div className="field">
        <label htmlFor="newPassword">New password</label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <FieldError id="newPassword-error" message={form.fieldErrors.newPassword} />
      </div>
      <FormMessages
        cooldownSeconds={form.cooldownSeconds}
        error={form.formError}
        success={form.success}
      />
      <button className="button" disabled={form.disabled} type="submit">
        {form.loading ? "Resetting..." : "Reset password"}
      </button>
      <AuthFooter>
        Back to <Link href="/login">login</Link>
      </AuthFooter>
    </form>
  );
}
