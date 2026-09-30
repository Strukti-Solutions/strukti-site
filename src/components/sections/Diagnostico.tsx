"use client";

import { useState, type FormEvent } from "react";
import { landingContent } from "@/content/landing";
import { diagnosticoFormSchema } from "@/lib/validation";

type Status = "idle" | "submitting" | "success" | "error";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.7rem 0.85rem",
  borderRadius: "0.5rem",
  border: "1px solid var(--color-border)",
  fontSize: "1rem",
  fontFamily: "inherit",
  minHeight: "48px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "0.35rem",
  fontWeight: 600,
  color: "var(--color-petrol-900)",
};

export function Diagnostico() {
  const { title, subtitle, form } = landingContent.diagnostico;
  const [status, setStatus] = useState<Status>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      company: String(formData.get("company") ?? ""),
      whatsapp: String(formData.get("whatsapp") ?? ""),
      problem: String(formData.get("problem") ?? ""),
      consent: formData.get("consent") === "on",
      website: String(formData.get("website") ?? ""),
    };

    const parsed = diagnosticoFormSchema.safeParse(payload);

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in errors)) {
          errors[key] = issue.message;
        }
      }
      setFieldErrors(errors);
      setStatus("error");
      return;
    }

    setFieldErrors({});
    setStatus("submitting");

    try {
      const response = await fetch("/api/diagnostico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
      event.currentTarget.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="diagnostico" className="section" aria-labelledby="diagnostico-title">
      <div className="container" style={{ maxWidth: "640px" }}>
        <h2 id="diagnostico-title" className="section-title">
          {title}
        </h2>
        <p className="section-subtitle">{subtitle}</p>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="name" style={labelStyle}>
              {form.nameLabel}
            </label>
            <input id="name" name="name" type="text" style={inputStyle} required />
            {fieldErrors.name && <FieldError message={fieldErrors.name} />}
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="company" style={labelStyle}>
              {form.companyLabel}
            </label>
            <input id="company" name="company" type="text" style={inputStyle} required />
            {fieldErrors.company && <FieldError message={fieldErrors.company} />}
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="whatsapp" style={labelStyle}>
              {form.whatsappLabel}
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              style={inputStyle}
              required
            />
            {fieldErrors.whatsapp && <FieldError message={fieldErrors.whatsapp} />}
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="problem" style={labelStyle}>
              {form.problemLabel}
            </label>
            <textarea id="problem" name="problem" rows={4} style={inputStyle} required />
            {fieldErrors.problem && <FieldError message={fieldErrors.problem} />}
          </div>

          {/* Honeypot: invisível para pessoas, visível para bots que preenchem todos os campos. */}
          <div
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}
          >
            <label htmlFor="website">Deixe este campo em branco</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          <div style={{ marginBottom: "1.5rem", display: "flex", gap: "0.6rem" }}>
            <input
              id="consent"
              name="consent"
              type="checkbox"
              required
              style={{ width: "1.25rem", height: "1.25rem", marginTop: "0.15rem", flexShrink: 0 }}
            />
            <label htmlFor="consent" style={{ color: "var(--color-ink-muted)" }}>
              {form.consentLabel}{" "}
              <a href="/privacidade" style={{ color: "var(--color-petrol-700)", textDecoration: "underline" }}>
                {form.consentLinkLabel}
              </a>
              .
            </label>
          </div>
          {fieldErrors.consent && <FieldError message={fieldErrors.consent} />}

          <button
            type="submit"
            disabled={status === "submitting"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.85rem 1.75rem",
              borderRadius: "999px",
              backgroundColor: "var(--color-petrol-800)",
              color: "#fff",
              fontWeight: 600,
              fontSize: "1rem",
              border: "none",
              minHeight: "48px",
              cursor: status === "submitting" ? "not-allowed" : "pointer",
              opacity: status === "submitting" ? 0.7 : 1,
            }}
          >
            {status === "submitting" ? "Enviando..." : form.submitLabel}
          </button>

          <div role="status" aria-live="polite" style={{ marginTop: "1rem" }}>
            {status === "success" && (
              <p style={{ color: "var(--color-whatsapp)" }}>{form.successMessage}</p>
            )}
            {status === "error" && Object.keys(fieldErrors).length === 0 && (
              <p style={{ color: "#b3261e" }}>{form.errorMessage}</p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p role="alert" style={{ color: "#b3261e", fontSize: "0.9rem", margin: "0.35rem 0 0" }}>
      {message}
    </p>
  );
}
