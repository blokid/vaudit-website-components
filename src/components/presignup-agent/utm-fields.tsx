const UTM_NAMES = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

/**
 * Hidden UTM inputs. React never reads or submits these — the site's
 * campaign-tracking script injects the values and the form-capture tooling
 * harvests them. We only render the named fields (off-screen, unfocusable)
 * for those scripts to find. Kept in one place so both forms stay identical.
 */
export default function UtmFields() {
  return (
    <div className="rc-pa-utm" aria-hidden="true">
      {UTM_NAMES.map((name) => (
        <input key={name} type="text" name={name} tabIndex={-1} autoComplete="off" />
      ))}
    </div>
  );
}
