"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { landingContent } from "@/content/landing";
import { contatoFormSchema, PROBLEM_MAX_LENGTH } from "@/lib/validation";
import { INTERESTS, onInterestSelected, type Interest } from "@/lib/interest";
import { siteConfig } from "@/config/site";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { LinkedText } from "@/components/LinkedText";
import { useTapHover } from "@/lib/motion";

type Status = "idle" | "submitting" | "success" | "error";
type SubmitErrorKind = "rateLimit" | "generic";

type FieldKey = "name" | "company" | "whatsapp" | "interest" | "problem" | "consent";

const FIELD_ORDER: FieldKey[] = ["name", "company", "whatsapp", "interest", "problem", "consent"];

export function Contato() {
  const { title, intro, form } = landingContent.contato;
  const [status, setStatus] = useState<Status>("idle");
  const [submitErrorKind, setSubmitErrorKind] = useState<SubmitErrorKind>("generic");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submittedName, setSubmittedName] = useState("");
  const [interest, setInterest] = useState<Interest | "">("");
  const formRef = useRef<HTMLFormElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const statusErrorRef = useRef<HTMLParagraphElement>(null);
  const tapHover = useTapHover();

  const errorCount = Object.keys(fieldErrors).length;

  // Chamadas da página (InterestLink) marcam o interesse. O select só existe
  // com o formulário à mostra: depois do sucesso, o evento não muda nada.
  useEffect(() => onInterestSelected(setInterest), []);

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
      interest: String(formData.get("interest") ?? ""),
      problem: String(formData.get("problem") ?? ""),
      consent: formData.get("consent") === "on",
      codigoParceiro: String(formData.get("codigoParceiro") ?? ""),
    };

    const parsed = contatoFormSchema.safeParse(payload);

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
      setInterest("");
    } catch {
      setSubmitErrorKind("generic");
      setStatus("error");
    }
  }

  return (
    <section id="contato" className="section section--seam surface-paper" aria-labelledby="contato-title">
      <div className="container">
        <div className="diag">
          <div>
            <h2 id="contato-title" className="section-title">
              {title}
            </h2>
            <p className="body-muted" style={{ marginTop: "var(--space-4)", maxWidth: "62ch" }}>
              {intro}
            </p>
          </div>

          <div className="form-card" data-hides-fab="">
            {status === "success" ? (
              <div role="status" className="form-success">
                <h3 ref={successHeadingRef} tabIndex={-1} className="block-title form-card__title">
                  {form.success.title}
                </h3>
                <p>{form.success.text.replace("{nome}", submittedName)}</p>
                <p>{form.success.text2}</p>
                <WhatsAppButton message={landingContent.whatsappMessages.general}>
                  {form.success.button}
                </WhatsAppButton>
              </div>
            ) : (
              <>
                <h3 className="block-title form-card__title">{form.title}</h3>
                <p className="body-muted">{form.intro}</p>
                <p className="form-card__notice">{form.requiredNotice}</p>

                {errorCount > 0 && (
                  <p role="alert" className="form-error-summary">
                    {errorCount === 1
                      ? form.errorSummarySingle
                      : form.errorSummaryMultiple.replace("{n}", String(errorCount))}
                  </p>
                )}

                <form ref={formRef} onSubmit={handleSubmit} noValidate>
                  <div className="field">
                    <label htmlFor="name" className="field__label">
                      {form.fields.name.label}
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      maxLength={120}
                      className="field__input"
                      required
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? "name-error" : undefined}
                    />
                    {fieldErrors.name && <FieldError id="name-error" message={fieldErrors.name} />}
                  </div>

                  <div className="field">
                    <label htmlFor="company" className="field__label">
                      {form.fields.company.label}
                    </label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      autoComplete="organization"
                      maxLength={150}
                      className="field__input"
                      required
                      aria-invalid={Boolean(fieldErrors.company)}
                      aria-describedby={fieldErrors.company ? "company-error" : undefined}
                    />
                    {fieldErrors.company && <FieldError id="company-error" message={fieldErrors.company} />}
                  </div>

                  <div className="field">
                    <label htmlFor="whatsapp" className="field__label">
                      {form.fields.whatsapp.label}
                    </label>
                    <input
                      id="whatsapp"
                      name="whatsapp"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      maxLength={20}
                      className="field__input"
                      required
                      aria-invalid={Boolean(fieldErrors.whatsapp)}
                      aria-describedby={fieldErrors.whatsapp ? "whatsapp-error" : "whatsapp-help"}
                    />
                    {fieldErrors.whatsapp ? (
                      <FieldError id="whatsapp-error" message={fieldErrors.whatsapp} />
                    ) : (
                      <p id="whatsapp-help" className="field__help">
                        {form.fields.whatsapp.help}
                      </p>
                    )}
                  </div>

                  <div className="field">
                    <label htmlFor="interest" className="field__label">
                      {form.fields.interest.label}
                    </label>
                    <select
                      id="interest"
                      name="interest"
                      className="field__input"
                      required
                      value={interest}
                      onChange={(event) => setInterest(event.target.value as Interest | "")}
                      aria-invalid={Boolean(fieldErrors.interest)}
                      aria-describedby={fieldErrors.interest ? "interest-error" : undefined}
                    >
                      <option value="">{form.fields.interest.placeholder}</option>
                      {INTERESTS.map((value) => (
                        <option key={value} value={value}>
                          {form.fields.interest.options[value]}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.interest && <FieldError id="interest-error" message={fieldErrors.interest} />}
                  </div>

                  <div className="field">
                    <label htmlFor="problem" className="field__label">
                      {form.fields.problem.label}
                    </label>
                    <textarea
                      id="problem"
                      name="problem"
                      rows={4}
                      maxLength={PROBLEM_MAX_LENGTH}
                      className="field__input"
                      required
                      aria-invalid={Boolean(fieldErrors.problem)}
                      aria-describedby={fieldErrors.problem ? "problem-error" : "problem-help"}
                    />
                    {fieldErrors.problem ? (
                      <FieldError id="problem-error" message={fieldErrors.problem} />
                    ) : (
                      <p id="problem-help" className="field__help">
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

                  <div className="consent">
                    <input
                      id="consent"
                      name="consent"
                      type="checkbox"
                      required
                      aria-invalid={Boolean(fieldErrors.consent)}
                      aria-describedby={fieldErrors.consent ? "consent-error" : undefined}
                    />
                    <label htmlFor="consent">
                      {form.consentLabelPrefix}
                      <a href="/privacidade">{form.consentLinkLabel}</a>
                      {form.consentLabelSuffix}
                    </label>
                  </div>
                  {fieldErrors.consent && <FieldError id="consent-error" message={fieldErrors.consent} />}
                  <p className="field__help" style={{ marginBottom: "var(--space-5)" }}>
                    {form.consentHelperLine}
                  </p>

                  <motion.button
                    type="submit"
                    className="btn btn--primary"
                    aria-disabled={status === "submitting"}
                    aria-busy={status === "submitting"}
                    {...(status === "submitting" ? {} : tapHover)}
                  >
                    {status === "submitting" ? form.submittingLabel : form.submitLabel}
                  </motion.button>

                  <p className="form-card__alt">
                    {form.whatsappAlternativePrefix}
                    <a
                      href={siteConfig.whatsapp.linkWithMessage(landingContent.whatsappMessages.general)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {form.whatsappAlternativeLinkLabel}
                    </a>
                  </p>

                  <div aria-live="polite">
                    {status === "error" && errorCount === 0 && (
                      <p ref={statusErrorRef} tabIndex={-1} className="form-status-error">
                        <LinkedText
                          text={submitErrorKind === "rateLimit" ? form.rateLimitError : form.submitError}
                          linkLabel="fale com a gente pelo WhatsApp"
                          href={siteConfig.whatsapp.linkWithMessage(landingContent.whatsappMessages.general)}
                          external
                        />
                      </p>
                    )}
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="field__error">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <circle cx="8" cy="8" r="7" fill="currentColor" />
        <path d="M8 4.2v4.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="8" cy="11.4" r="1.05" fill="#fff" />
      </svg>
      <span>{message}</span>
    </p>
  );
}
