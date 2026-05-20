import { useState, type FormEvent } from "react";
import clsx from "clsx";
import type { ComponentMeta } from "../../registry";
import "./contact-form.css";

type ContactFormProps = {
  /** Left-panel headline. */
  headline?: string;
  /** Left-panel description text under the headline. */
  subtext?: string;
  /** Contact email shown in the left panel. */
  email?: string;
  /** Copy beside the response-time pill on the left panel. */
  responseNote?: string;
  /** Submit button label. */
  submitLabel?: string;
  /** Success state title shown after submit. */
  successTitle?: string;
  /** Success state body shown after submit. */
  successBody?: string;
  /** URL the privacy link points to. */
  privacyUrl?: string;
  /** Endpoint the form POSTs to. */
  endpoint?: string;
};

export const meta: ComponentMeta<ContactFormProps> = {
  description:
    "Two-panel contact card with a configurable headline, an email block, and a request form. Submits client-side and swaps to a success state. Drop on the /contact page (or anywhere Webflow can host a `data-rc` marker).",
  props: {
    headline: {
      type: "string",
      description: "Left-panel headline.",
      default: '"Talk to the Vaudit Team"',
    },
    subtext: {
      type: "string",
      description: "Left-panel description.",
      default:
        '"Independent spend verification across ads, AI, SaaS, cloud, payments, shipping, and operational vendor spend."',
    },
    email: {
      type: "string",
      description: "Contact email shown in the left panel.",
      default: '"support@vaudit.com"',
    },
    responseNote: {
      type: "string",
      description: "Copy beside the response-time pill.",
      default: '"Our team typically responds shortly"',
    },
    submitLabel: {
      type: "string",
      description: "Submit button label.",
      default: '"GET IN TOUCH"',
    },
    successTitle: {
      type: "string",
      description: "Success state title.",
      default: '"We\'ll be in touch soon"',
    },
    successBody: {
      type: "string",
      description: "Success state body.",
      default:
        '"Thanks for reaching out.\\nA member of the Vaudit team will get back to you shortly."',
    },
    privacyUrl: {
      type: "string",
      description: "Privacy policy URL.",
      default: '"https://app.vaudit.com/privacy-policy"',
    },
    endpoint: {
      type: "string",
      description: "POST endpoint for lead submissions.",
      default: '"https://api.vaudit.com/public/leads/v4"',
    },
  },
  variants: {
    Default: {},
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STORAGE_KEY = "vaudit:contact-form:submitted";

function readSubmitted(): boolean {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSubmitted(): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore — Safari private mode etc. */
  }
}

type FieldKey = "name" | "email" | "company";
type Errors = Partial<Record<FieldKey, boolean>>;

export default function ContactForm({
  headline = "Talk to the Vaudit Team",
  subtext = "Independent spend verification across ads, AI, SaaS, cloud, payments, shipping, and operational vendor spend.",
  email = "support@vaudit.com",
  responseNote = "Our team typically responds shortly",
  submitLabel = "GET IN TOUCH",
  successTitle = "We'll be in touch soon",
  successBody = "Thanks for reaching out.\nA member of the Vaudit team will get back to you shortly.",
  privacyUrl = "https://app.vaudit.com/privacy-policy",
  endpoint = "https://api.vaudit.com/public/leads/v4",
}: ContactFormProps) {
  const [values, setValues] = useState({
    name: "",
    email: "",
    company: "",
    details: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<boolean>(readSubmitted);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = (key: keyof typeof values) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (key in errors) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as FieldKey];
        return next;
      });
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors: Errors = {};
    if (!values.name.trim()) nextErrors.name = true;
    if (!values.email.trim() || !EMAIL_RE.test(values.email))
      nextErrors.email = true;
    if (!values.company.trim()) nextErrors.company = true;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: values.name.trim(),
          company_name: values.company.trim(),
          company_email: values.email.trim(),
          additional_details: values.details.trim(),
          page_uri: window.location.href,
          page_name: document.title,
        }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      writeSubmitted();
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error && err.message
          ? `Couldn’t send your request — ${err.message}. Please try again or email us directly.`
          : "Couldn’t send your request. Please try again or email us directly.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rc-contact-form">
      <div className="rc-contact-form__card">
        {/* Left panel — contact info */}
        <div className="rc-contact-form__info">
          <div className="rc-contact-form__top-group">
            <h2 className="rc-contact-form__headline">{headline}</h2>
            <p className="rc-contact-form__subtext">{subtext}</p>
          </div>

          <div className="rc-contact-form__divider" />

          <div className="rc-contact-form__block">
            <div className="rc-contact-form__block-header">
              <div className="rc-contact-form__email-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <div className="rc-contact-form__reach-label">Get in Touch</div>
            </div>
            <div className="rc-contact-form__block-sep" />
            <div className="rc-contact-form__email-row">
              <a
                className="rc-contact-form__email-link"
                href={`mailto:${email}`}
              >
                {email}
              </a>
              <div className="rc-contact-form__timing-row">
                <span className="rc-contact-form__response-desc">
                  {responseNote}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="rc-contact-form__panel">
          {submitted ? (
            <div
              className="rc-contact-form__success"
              role="status"
              aria-live="polite"
            >
              <div className="rc-contact-form__success-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="rc-contact-form__success-title">{successTitle}</h3>
              <p className="rc-contact-form__success-body">{successBody}</p>
            </div>
          ) : (
            <form
              className="rc-contact-form__form"
              noValidate
              onSubmit={onSubmit}
            >
              <div className="rc-contact-form__row">
                <div className="rc-contact-form__field">
                  <label className="rc-contact-form__label" htmlFor="cf-name">
                    Full name <span className="rc-contact-form__req">*</span>
                  </label>
                  <input
                    id="cf-name"
                    name="name"
                    type="text"
                    placeholder="Jane Smith"
                    autoComplete="name"
                    required
                    className={clsx("rc-contact-form__input", {
                      "is-invalid": errors.name,
                    })}
                    value={values.name}
                    onChange={update("name")}
                  />
                </div>
                <div className="rc-contact-form__field">
                  <label className="rc-contact-form__label" htmlFor="cf-email">
                    Work email <span className="rc-contact-form__req">*</span>
                  </label>
                  <input
                    id="cf-email"
                    name="email"
                    type="email"
                    placeholder="jane@company.com"
                    autoComplete="email"
                    required
                    className={clsx("rc-contact-form__input", {
                      "is-invalid": errors.email,
                    })}
                    value={values.email}
                    onChange={update("email")}
                  />
                </div>
              </div>

              <div className="rc-contact-form__field">
                <label className="rc-contact-form__label" htmlFor="cf-company">
                  Company name <span className="rc-contact-form__req">*</span>
                </label>
                <input
                  id="cf-company"
                  name="company"
                  type="text"
                  placeholder="Acme Corp"
                  autoComplete="organization"
                  required
                  className={clsx("rc-contact-form__input", {
                    "is-invalid": errors.company,
                  })}
                  value={values.company}
                  onChange={update("company")}
                />
              </div>

              <div className="rc-contact-form__field">
                <label className="rc-contact-form__label" htmlFor="cf-details">
                  Additional details?
                  <span className="rc-contact-form__label-hint">(optional)</span>
                </label>
                <textarea
                  id="cf-details"
                  name="details"
                  placeholder="Tell us what spend category or billing challenge you’d like reviewed."
                  className="rc-contact-form__textarea"
                  value={values.details}
                  onChange={update("details")}
                />
              </div>

              <p className="rc-contact-form__privacy">
                By submitting this form, you agree to Vaudit processing your
                details to respond to your enquiry. Please see our{" "}
                <a href={privacyUrl} target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>{" "}
                for more information.
              </p>

              <button
                type="submit"
                className="rc-contact-form__submit"
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting ? (
                  <>
                    <span
                      className="rc-contact-form__spinner"
                      aria-hidden="true"
                    />
                    Sending…
                  </>
                ) : (
                  submitLabel
                )}
              </button>

              {submitError && (
                <p className="rc-contact-form__error" role="alert">
                  {submitError}
                </p>
              )}

              <div className="rc-contact-form__spam">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Protected by invisible reCAPTCHA · No spam
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
