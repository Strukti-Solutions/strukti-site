"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { landingContent } from "@/content/landing";
import { diagnosticoFormSchema, PROBLEM_MAX_LENGTH } from "@/lib/validation";
import { siteConfig } from "@/config/site";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { LinkedText } from "@/components/LinkedText";
import { Reveal } from "@/components/motion/Reveal";
import { useTapHover } from "@/lib/motion";

type Status = "idle" | "submitting" | "success" | "error";
type SubmitErrorKind = "rateLimit" | "generic";

type FieldKey = "name" | "company" | "whatsapp" | "problem" | "consent";

const FIELD_ORDER: FieldKey[] = ["name", "company", "whatsapp", "problem", "consent"];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.7rem 0.85rem",
  borderRadius: "0.5rem",
  border: "1px solid var(--color-border-input)",
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

const helpStyle: React.CSSProperties = {
  margin: "0.3rem 0 0",
  fontSize: "0.85rem",
  color: "var(--color-ink-muted)",
};

export function Diagnostico() {
  const { title, intro, highlight, howItWorksTitle, steps, form } = landingContent.diagnostico;
  const [status, setStatus] = useState<Status>("idle");
  const [submitErrorKind, setSubmitErrorKind] = useState<SubmitErrorKind>("generic");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submittedName, setSubmittedName] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const statusErrorRef = useRef<HTMLParagraphElement>(null);
  const tapHover = useTapHover();

  const errorCount = Object.keys(fieldErrors).length;

  useEffect(() => {
    if (status === "success") {
      successHeadingRef.current?.focus();
    } else if (status === "error" && errorCount === 0) {
      statusErrorRef.current?.focus();
    }
    // errorCount só importa no instante em que status muda para "error";
    // não precisa re-rodar se só o número de campos inválidos mudar depois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function focusFirstInvalidField(errors: Partial<Record<FieldKey, string>>) {
    const firstKey = FIELD_ORDER.find((key) => errors[key]);
    if (!firstKey) return;
    const el = formRef.current?.querySelector<HTMLElement>(`#${firstKey}`);
    el?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const formEl = event.currentTarget;
    const formData = new FormData(formEl);
    const payload = {
      name: String(formData.get("name") ?? ""),
      company: String(formData.get("company") ?? ""),
      whatsapp: String(formData.get("whatsapp") ?? ""),
      problem: String(formData.get("problem") ?? ""),
      consent: formData.get("consent") === "on",
      codigoParceiro: String(formData.get("codigoParceiro") ?? ""),
    };

    const parsed = diagnosticoFormSchema.safeParse(payload);

    if (!parsed.success) {
      const errors: Partial<Record<FieldKey, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key !== "string" || !(FIELD_ORDER as string[]).includes(key)) continue;
        const field = key as FieldKey;
        if (errors[field]) continue;
        errors[field] = issue.message;
      }
      setFieldErrors(errors);
      setStatus("error");
      setSubmitErrorKind("generic");
      focusFirstInvalidField(errors);
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
        setSubmitErrorKind(response.status === 429 ? "rateLimit" : "generic");
        setStatus("error");
        return;
      }

      setSubmittedName(parsed.data.name);
      setStatus("success");
      formEl.reset();
    } catch {
      setSubmitErrorKind("generic");
      setStatus("error");
    }
  }

  return (
    <section id="diagnostico" className="section" aria-labelledby="diagnostico-title">
      <div className="container" style={{ maxWidth: "640px" }}>
        <h2 id="diagnostico-title" className="section-title">
          {title}
        </h2>
        <p className="section-subtitle" style={{ marginBottom: "1rem" }}>
          {intro}
        </p>
        <p style={{ color: "var(--color-petrol-700)", fontWeight: 600, marginBottom: "1.5rem" }}>
          {highlight}
        </p>

        <Reveal>
          <h3 style={{ color: "var(--color-petrol-900)", marginBottom: "0.75rem" }}>{howItWorksTitle}</h3>
          <ol
            style={{
              margin: "0 0 2.5rem",
              padding: 0,
              listStyle: "none",
              display: "grid",
              gap: "0.75rem",
            }}
          >
            {steps.map((step, index) => (
              <li key={step.lead} style={{ display: "flex", gap: "0.75rem" }}>
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    width: "1.75rem",
                    height: "1.75rem",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-petrol-100)",
                    color: "var(--color-petrol-900)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                  }}
                >
                  {index + 1}
                </span>
                <p style={{ margin: 0, color: "var(--color-ink-muted)" }}>
                  <strong style={{ color: "var(--color-petrol-900)" }}>{step.lead}</strong> {step.rest}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>

        {status === "success" ? (
          <div role="status">
            <h3 ref={successHeadingRef} tabIndex={-1} style={{ color: "var(--color-petrol-900)" }}>
              {form.success.title}
            </h3>
            <p style={{ color: "var(--color-ink-muted)" }}>
              {form.success.text.replace("{nome}", submittedName)}
            </p>
            <p style={{ color: "var(--color-ink-muted)", marginBottom: "1.25rem" }}>
              {form.success.text2}
            </p>
            <WhatsAppButton message={landingContent.whatsappMessages.general}>
              {form.success.button}
            </WhatsAppButton>
          </div>
        ) : (
          <>
            <h3 style={{ color: "var(--color-petrol-900)", marginBottom: "0.25rem" }}>{form.title}</h3>
            <p style={{ color: "var(--color-ink-muted)", marginBottom: "0.25rem" }}>{form.intro}</p>
            <p style={{ color: "var(--color-ink-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              {form.requiredNotice}
            </p>

            {errorCount > 0 && (
              <p
                role="alert"
                style={{
                  color: "#b3261e",
                  fontWeight: 600,
                  marginBottom: "1rem",
                }}
              >
                {errorCount === 1
                  ? form.errorSummarySingle
                  : form.errorSummaryMultiple.replace("{n}", String(errorCount))}
              </p>
            )}

            <form ref={formRef} onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: "1.25rem" }}>
                <label htmlFor="name" style={labelStyle}>
                  {form.fields.name.label}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  maxLength={120}
                  style={inputStyle}
                  required
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? "name-error" : undefined}
                />
                {fieldErrors.name && <FieldError id="name-error" message={fieldErrors.name} />}
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label htmlFor="company" style={labelStyle}>
                  {form.fields.company.label}
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  autoComplete="organization"
                  maxLength={150}
                  style={inputStyle}
                  required
                  aria-invalid={Boolean(fieldErrors.company)}
                  aria-describedby={fieldErrors.company ? "company-error" : undefined}
                />
                {fieldErrors.company && <FieldError id="company-error" message={fieldErrors.company} />}
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label htmlFor="whatsapp" style={labelStyle}>
                  {form.fields.whatsapp.label}
                </label>
                <input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={20}
                  style={inputStyle}
                  required
                  aria-invalid={Boolean(fieldErrors.whatsapp)}
                  aria-describedby={fieldErrors.whatsapp ? "whatsapp-error" : "whatsapp-help"}
                />
                {fieldErrors.whatsapp ? (
                  <FieldError id="whatsapp-error" message={fieldErrors.whatsapp} />
                ) : (
                  <p id="whatsapp-help" style={helpStyle}>
                    {form.fields.whatsapp.help}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label htmlFor="problem" style={labelStyle}>
                  {form.fields.problem.label}
                </label>
                <textarea
                  id="problem"
                  name="problem"
                  rows={4}
                  maxLength={PROBLEM_MAX_LENGTH}
                  style={inputStyle}
                  required
                  aria-invalid={Boolean(fieldErrors.problem)}
                  aria-describedby={fieldErrors.problem ? "problem-error" : "problem-help"}
                />
                {fieldErrors.problem ? (
                  <FieldError id="problem-error" message={fieldErrors.problem} />
                ) : (
                  <p id="problem-help" style={helpStyle}>
                    {form.fields.problem.help}
                  </p>
                )}
              </div>

              {/* Honeypot: invisível para pessoas, visível para bots que preenchem todos os campos. */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  width: "1px",
                  height: "1px",
                  overflow: "hidden",
                }}
              >
                <label htmlFor="codigoParceiro">{form.honeypotLabel}</label>
                <input
                  id="codigoParceiro"
                  name="codigoParceiro"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div style={{ marginBottom: "0.5rem", display: "flex", gap: "0.6rem" }}>
                <input
                  id="consent"
                  name="consent"
                  type="checkbox"
                  required
                  aria-invalid={Boolean(fieldErrors.consent)}
                  aria-describedby={fieldErrors.consent ? "consent-error" : undefined}
                  style={{ width: "1.25rem", height: "1.25rem", marginTop: "0.15rem", flexShrink: 0 }}
                />
                <label htmlFor="consent" style={{ color: "var(--color-ink-muted)" }}>
                  {form.consentLabelPrefix}
                  <a href="/privacidade" style={{ color: "var(--color-petrol-700)", textDecoration: "underline" }}>
                    {form.consentLinkLabel}
                  </a>
                  {form.consentLabelSuffix}
                </label>
              </div>
              {fieldErrors.consent && <FieldError id="consent-error" message={fieldErrors.consent} />}
              <p style={{ ...helpStyle, marginBottom: "1.5rem" }}>{form.consentHelperLine}</p>

              <motion.button
                type="submit"
                aria-disabled={status === "submitting"}
                aria-busy={status === "submitting"}
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
                {...(status === "submitting" ? {} : tapHover)}
              >
                {status === "submitting" ? form.submittingLabel : form.submitLabel}
              </motion.button>

              <p style={{ marginTop: "1rem", color: "var(--color-ink-muted)" }}>
                {form.whatsappAlternativePrefix}
                <a
                  href={siteConfig.whatsapp.linkWithMessage(landingContent.whatsappMessages.diagnostico)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--color-petrol-700)", textDecoration: "underline" }}
                >
                  {form.whatsappAlternativeLinkLabel}
                </a>
              </p>

              <div aria-live="polite" style={{ marginTop: "0.5rem" }}>
                {status === "error" && errorCount === 0 && (
                  <p ref={statusErrorRef} tabIndex={-1} style={{ color: "#b3261e" }}>
                    <LinkedText
                      text={submitErrorKind === "rateLimit" ? form.rateLimitError : form.submitError}
                      linkLabel="fale com a gente pelo WhatsApp"
                      href={siteConfig.whatsapp.linkWithMessage(landingContent.whatsappMessages.diagnostico)}
                      external
                    />
                  </p>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </section>
  );
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} style={{ color: "#b3261e", fontSize: "0.9rem", margin: "0.35rem 0 0" }}>
      {message}
    </p>
  );
}
