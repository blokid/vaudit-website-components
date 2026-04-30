# presignup-agent.js

> Source from `vaudit-website-pages/webflow/presignup-agent.js`. Pasted into Webflow Custom Code or Embed elements — **not consumed by the Vite build**. Kept here as a reference snapshot of the legacy workflow.

```js
/* Pre-signup agent — hero input + audit-reveal card grid.
   Depends on the static shell: #presignup-agent-root containing
   #presignup-agent-form, #presignup-agent-status, #presignup-agent-results. */

(function () {
  "use strict";

  // Config

  // Base URL for the agent API. Leave empty ("") for same-origin (recommended),
  // or set to an absolute origin like "https://api.vaudit.com" if the backend
  // lives on a different host (requires matching CORS config).
  var AGENT_BASE_URL = "https://onboarding-agent.staging.vaudit.com";
  try {
    if (String(window.location && window.location.href || "").indexOf("https://vaudit.com") === 0) {
      AGENT_BASE_URL = "https://onboarding-agent.vaudit.com";
    }
  } catch (_) {}

  // Endpoints (relative to AGENT_BASE_URL):
  //   GET  /presignup/token
  //     → { token: "..." } — short-lived bearer used for the two calls below.
  //   POST /apps/presignup_agent/users/anonymous/sessions/<sessionId>
  //     → creates (or no-ops on) a server-side session for this visitor.
  //   POST /run_sse
  //     → streams the agent's SSE response for the given message.
  var TOKEN_ENDPOINT = "/presignup/token";
  var SESSION_ENDPOINT = "/apps/presignup_agent/users/anonymous/sessions/";
  var RUN_SSE_ENDPOINT = "/run_sse";
  var AUDIT_REPORT_ENDPOINT = "/presignup/audit-report/";


  var APP_NAME = "presignup_agent";
  var USER_ID = "anonymous";
  var SESSION_KEY = "vaudit-presignup-session";

  // Scan sequence timings (mirror hero.html runScanSequence).
  var TITLE_STEP_MS = 650;
  var PER_VENDOR_MS = 300;
  var PER_VENDOR_NEXT_MS = 280;
  var POST_MODULE_MS = 180;
  var POST_FINAL_MS = 350;
  var TOTALING_MS = 500;

  // Signup URL opened when the email-capture form submits.

  // Vendor icons — Webflow-hosted SVG URLs keyed by lowercased vendor name.
  // Unknown vendors fall through to text-only. Aliases added where the agent
  // may return alternate casings/spellings (e.g. "gcp" vs "google cloud").
  // Source SVGs live in `/preonboarding-icons/brand-logos-svg/`.
  var VENDOR_ICONS = {
    "google ads":       "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a965ab121368400dc44f_google-ads.svg",
    "meta ads":         "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a965d6f564a86b177302_meta-ads.svg",
    "tiktok ads":       "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a965a560d2adf0a6e474_tiktok-ads.svg",
    "applovin ads":     "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9651ab5a69f0c7e99c1_applovin-ads.svg",
    "applovin":         "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9651ab5a69f0c7e99c1_applovin-ads.svg",
    "aws":              "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a986401a04fdfb516c2f_aws.svg",
    "google cloud":     "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a98614c119b6d0b24519_gcp.svg",
    "gcp":              "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a98614c119b6d0b24519_gcp.svg",
    "fedex":            "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9a37f220d58951c852a_fedex.svg",
    "ups":              "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9a3e807d12509c3513b_ups.svg",
    "dhl":              "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9a3d59d49c6bf3d32dd_dhl.svg",
    "usps":             "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9a350def4cbca4a92eb_usps.svg",
    "stripe":           "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a98d555377a44d02f6f1_stripe.svg",
    "adyen":            "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a98df379ab43b9e1f8fc_adyen.svg",
    "shopify":          "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a98de0d6b803860417b8_shopify.svg",
    "salesforce":       "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8aa1be867fd9d7a66f538_salesforce.svg",
    "google workspace": "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a997ae02448a9e62d5c0_google-workspace.svg",
    "openai":           "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9ac553a539363414ad2_openai.svg",
    "anthropic":        "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9ac046b54c24d008aed_anthropic.svg",
    "gemini":           "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8abaccd7cfdce2d3ae140_gemini-color.svg",
    "google gemini":    "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8abaccd7cfdce2d3ae140_gemini-color.svg"
  };

  function vendorKey(name) {
    return String(name || "").toLowerCase().trim();
  }

  // -------- Product icons (Lucide-style SVG strings) --------
  var ICON_CLOUD =
    "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z'/></svg>";
  var ICON_CHIP =
    "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='4' y='4' width='16' height='16' rx='2'/><rect x='9' y='9' width='6' height='6'/><path d='M15 2v2'/><path d='M15 20v2'/><path d='M2 15h2'/><path d='M2 9h2'/><path d='M20 15h2'/><path d='M20 9h2'/><path d='M9 2v2'/><path d='M9 20v2'/></svg>";
  var ICON_WINDOW =
    "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='2' y='4' width='20' height='16' rx='2'/><path d='M2 9h20'/><circle cx='6' cy='6.5' r='.5' fill='currentColor'/><circle cx='8.5' cy='6.5' r='.5' fill='currentColor'/></svg>";
  var ICON_TRUCK =
    "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M14 18V6a2 2 0 0 0-2-2H2v14h2'/><path d='M14 9h4l4 4v5h-2'/><circle cx='7' cy='18' r='2'/><circle cx='17' cy='18' r='2'/></svg>";
  var ICON_CARD =
    "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='2' y='5' width='20' height='14' rx='2'/><line x1='2' x2='22' y1='10' y2='10'/></svg>";
  var ICON_CLICK =
    "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M14 4.1 12 6'/><path d='m5.1 8-2.9-.8'/><path d='m6 12-1.9 2'/><path d='M7.2 2.2 8 5.1'/><path d='M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z'/></svg>";
  var ICON_GENERIC =
    "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><path d='M12 6v6l4 2'/></svg>";

  // -------- Preview VIZ HTML (hero.html verbatim, one per product) --------
  var VIZ = {
    ship:
      "<div class='viz viz-ship'>" +
        "<div class='ship-path' aria-hidden='true'></div>" +
        "<div class='ship-box' aria-hidden='true'></div>" +
        "<div class='ship-credit' aria-hidden='true'>+$</div>" +
      "</div>",
    kloud:
      "<div class='viz viz-kloud'>" +
        "<div class='k-ceiling' aria-hidden='true'></div>" +
        "<div class='k-bars' aria-hidden='true'>" +
          "<span class='kb'></span><span class='kb'></span><span class='kb'></span>" +
          "<span class='kb'></span><span class='kb'></span><span class='kb'></span>" +
          "<span class='kb'></span>" +
        "</div>" +
      "</div>",
    seat:
      "<div class='viz viz-seat'>" +
        "<div class='seat-grid' aria-hidden='true'>" +
          "<span class='ss'></span><span class='ss'></span><span class='ss ss-empty'></span>" +
          "<span class='ss'></span><span class='ss'></span>" +
          "<span class='ss'></span><span class='ss ss-empty'></span><span class='ss'></span>" +
          "<span class='ss'></span><span class='ss'></span>" +
        "</div>" +
        "<div class='seat-scan' aria-hidden='true'></div>" +
      "</div>",
    token:
      "<div class='viz viz-token'>" +
        "<div class='token-chip' aria-hidden='true'>" +
          "<span class='token-node'></span><span class='token-node'></span>" +
          "<span class='token-node'></span><span class='token-node'></span>" +
        "</div>" +
        "<span class='t-flow tf1' aria-hidden='true'></span>" +
        "<span class='t-flow tf2' aria-hidden='true'></span>" +
        "<span class='t-flow tf3' aria-hidden='true'></span>" +
      "</div>",
    ad:
      "<div class='viz viz-ad'>" +
        "<div class='ad-target' aria-hidden='true'></div>" +
        "<div class='ad-ring' aria-hidden='true'></div>" +
        "<div class='ad-ring r2' aria-hidden='true'></div>" +
        "<span class='ad-click ac1' aria-hidden='true'>×</span>" +
        "<span class='ad-click ac2' aria-hidden='true'>×</span>" +
        "<span class='ad-click ac3' aria-hidden='true'>×</span>" +
      "</div>",
    pay:
      "<div class='viz viz-pay'>" +
        "<div class='pay-rows' aria-hidden='true'>" +
          "<div class='pr'></div><div class='pr pr-flag'></div>" +
          "<div class='pr'></div><div class='pr'></div>" +
        "</div>" +
        "<div class='pay-scan' aria-hidden='true'></div>" +
      "</div>",
  };

  // -------- PRODUCT_SPECS — known product keys → display + content.
  // Keys are the short form (no `_id` suffix). SSE returns ids like `ad_id`;
  // `idToKey(id)` normalizes. Unknown ids fall through to `specForKey()` fallback.
  var PRODUCT_SPECS = {
    ship: {
      key: "ship",
      id: "ship_id",
      name: "Ship ID",
      emoji: ICON_TRUCK,
      desc: "Shipping & logistics overcharges.",
      longDesc:
        "Verifies shipping charges against carrier terms to identify overcharges and missed refunds.",
    },
    kloud: {
      key: "kloud",
      id: "kloud_id",
      name: "Kloud ID",
      emoji: ICON_CLOUD,
      desc: "Idle cloud spend and overprovisioned resources.",
      longDesc:
        "Verifies cloud usage against billing to identify overcharges and unused spend.",
    },
    seat: {
      key: "seat",
      id: "seat_id",
      name: "Seat ID",
      emoji: ICON_WINDOW,
      desc: "Unused SaaS seats and tool overlap.",
      longDesc:
        "Verifies SaaS usage against billing to identify unused licenses and overcharges.",
    },
    token: {
      key: "token",
      id: "token_id",
      name: "Token ID",
      emoji: ICON_CHIP,
      desc: "AI and LLM usage waste.",
      longDesc:
        "Verifies AI usage against billing to identify overcharges and inefficient spend.",
    },
    ad: {
      key: "ad",
      id: "ad_id",
      name: "Ad ID",
      emoji: ICON_CLICK,
      desc: "Ad spend waste and audience overlap.",
      longDesc:
        "Verifies ad traffic against billing to identify invalid charges and discrepancies.",
    },
    pay: {
      key: "pay",
      id: "pay_id",
      name: "Payment ID",
      emoji: ICON_CARD,
      desc: "Payment processor fee leakage.",
      longDesc:
        "Verifies payment fees against contracted rates to identify overcharges and hidden markups.",
    },
  };

  // Order the preview grid renders (also defines the "default" set of known keys).
  var KNOWN_KEYS = ["ship", "kloud", "seat", "token", "ad", "pay"];

  var USD = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  // Session

  function getSessionId() {
    try {
      var cached = localStorage.getItem(SESSION_KEY);
      if (cached) return cached;
      var next =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "sess-" + Math.random().toString(36).slice(2) + Date.now();
      localStorage.setItem(SESSION_KEY, next);
      return next;
    } catch (_) {
      return (
        "sess-" + Math.random().toString(36).slice(2) + Date.now()
      );
    }
  }

  // Domain normalization + validation

  function normalizeDomain(raw) {
    if (!raw) return "";
    var s = String(raw).trim().toLowerCase();
    s = s.replace(/^https?:\/\//, "");
    s = s.replace(/^www\./, "");
    s = s.split("/")[0];
    s = s.replace(/\s+/g, "");
    return s;
  }

  function isValidDomain(d) {
    return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d);
  }

  // SSE reader — ported from client.ts runSSE (raw fetch + ReadableStream).

  function getToken(signal) {
    return fetch(AGENT_BASE_URL + TOKEN_ENDPOINT, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: signal,
    }).then(function (res) {
      if (!res.ok) {
        throw new Error("Token request failed: " + res.status);
      }
      return res.json();
    }).then(function (data) {
      var token = data && (data.token || data.access_token);
      if (!token) {
        throw new Error("Token response missing token field");
      }
      return token;
    });
  }

  function ensureSession(sessionId, token, signal) {
    var url = AGENT_BASE_URL + SESSION_ENDPOINT + encodeURIComponent(sessionId);
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Presignup-Token": token,
      },
      signal: signal,
    }).then(function (res) {
      // Treat 200/201 as success; backends sometimes return 409 on a re-used
      // sessionId, which we also accept since the session already exists.
      if (!res.ok && res.status !== 409) {
        throw new Error("Session create failed: " + res.status);
      }
      return sessionId;
    });
  }

  function streamAgent(body, token, signal) {
    var headers = { "Content-Type": "application/json" };
    if (token) headers["X-Presignup-Token"] = token;
    return fetch(AGENT_BASE_URL + RUN_SSE_ENDPOINT, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
      signal: signal,
    }).then(function (res) {
      if (!res.ok || !res.body) {
        throw new Error("Agent request failed: " + res.status);
      }
      return res.body;
    });
  }

  async function consumeSSE(stream, onEvent) {
    var reader = stream.getReader();
    var decoder = new TextDecoder();
    var buffer = "";
    try {
      while (true) {
        var chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        var lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          if (!line || line.indexOf("data: ") !== 0) continue;
          var data = line.slice(6).trim();
          if (!data || data === "[DONE]") continue;
          try {
            onEvent(JSON.parse(data));
          } catch (_) {
            // Malformed SSE payload — skip.
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // Widget extraction — ported from parseWidgets + widgetRegistry.audit_products

  function extractAuditProducts(text) {
    if (!text) return null;
    // Match `:::audit_products{...}\n:::` (JSON payload can span multiple lines).
    var m = text.match(/:::audit_products(\{[\s\S]*?\})\s*\n:::/);
    if (!m) return null;
    var parsed;
    try {
      parsed = JSON.parse(m[1]);
    } catch (_) {
      return null;
    }
    var raw = Array.isArray(parsed.products) ? parsed.products : [];
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var p = raw[i];
      if (!p || typeof p.id !== "string") continue;
      var vendorsRaw = Array.isArray(p.vendors) ? p.vendors : [];
      var vendors = [];
      for (var j = 0; j < vendorsRaw.length; j++) {
        var v = vendorsRaw[j];
        if (!v || typeof v.name !== "string" || !v.name) continue;
        vendors.push({
          name: v.name,
          estSpend: Number(v.est_spend || 0),
          waste: Number(v.waste || 0),
        });
      }
      out.push({
        id: p.id,
        wasteTotal: Number(p.waste_total || 0),
        vendors: vendors,
      });
    }
    return out.length ? out : null;
  }

  // Label resolution

  function prettify(id) {
    var stem = String(id || "").replace(/_id$/i, "");
    if (!stem) return id;
    return (
      stem.charAt(0).toUpperCase() + stem.slice(1).replace(/_/g, " ") + " ID"
    );
  }

  // Normalize SSE product id (e.g. "ad_id") → short key ("ad"). Falls back to
  // the input lower-cased if there's no `_id` suffix.
  function idToKey(id) {
    return String(id || "")
      .trim()
      .toLowerCase()
      .replace(/_id$/i, "");
  }

  // Return the spec for a short key. Unknown keys get a generic fallback
  // (no viz, generic icon, prettified name) so the UI stays functional when
  // the backend returns an id we haven't onboarded yet.
  function specForKey(key) {
    var known = PRODUCT_SPECS[key];
    if (known) return known;
    return {
      key: key,
      id: key + "_id",
      name: prettify(key + "_id"),
      emoji: ICON_GENERIC,
      desc: "Vendor spend and estimated waste.",
      longDesc:
        "Vendor spend and estimated waste detected by the Vaudit audit agent.",
    };
  }

  // DOM helpers

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        var v = attrs[k];
        if (v == null) continue;
        if (k === "class") el.className = v;
        else if (k === "text") el.textContent = v;
        else if (k === "style") el.setAttribute("style", v);
        else el.setAttribute(k, v);
      }
    }
    if (children) {
      for (var i = 0; i < children.length; i++) {
        var c = children[i];
        if (c == null) continue;
        if (typeof c === "string") el.appendChild(document.createTextNode(c));
        else el.appendChild(c);
      }
    }
    return el;
  }

  function clear(el) {
    while (el && el.firstChild) el.removeChild(el.firstChild);
  }

  // Card rendering + sequencer

  // Card markup — hero.html style. A card has a `preview` state (viz + title +
  // long desc) and a `complete` state (head + hero amount + vendor rows). CSS
  // swaps visibility via the `.preview` class.

  function escapeHTML(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function vendorRowHTML(v) {
    var iconUrl = VENDOR_ICONS[vendorKey(v.name)];
    var logo = iconUrl
      ? '<img class="card-vendor-logo" src="' +
        escapeHTML(iconUrl) +
        '" alt="" aria-hidden="true" loading="lazy" onerror="this.style.display=\'none\'" />'
      : "";
    return (
      '<div class="card-vendor">' +
      '<div class="card-vendor-name">' +
      logo +
      escapeHTML(v.name) +
      "</div>" +
      '<div class="card-vendor-fig">' +
      '<span class="card-vendor-spend">' +
      USD.format(v.estSpend || 0) +
      " spend</span>" +
      '<span class="card-vendor-waste">' +
      USD.format(v.waste || 0) +
      " wasted</span>" +
      "</div>" +
      "</div>"
    );
  }

  function moduleCardHTML(spec) {
    var viz = VIZ[spec.key] || "<div class='viz'></div>";
    return (
      '<div class="card-preview-viz">' +
      viz +
      "</div>" +
      '<div class="preview-head">' +
      '<div class="preview-title"><span class="emoji">' +
      spec.emoji +
      "</span>" +
      escapeHTML(spec.name) +
      "</div>" +
      "</div>" +
      '<p class="preview-desc">' +
      escapeHTML(spec.longDesc || spec.desc) +
      "</p>" +
      '<div class="card-head">' +
      '<div class="card-name"><span class="emoji">' +
      spec.emoji +
      "</span>" +
      escapeHTML(spec.name) +
      "</div>" +
      '<div class="card-badge">Completed</div>' +
      "</div>" +
      '<div class="card-hero">' +
      '<div class="card-amount" data-role="amount" data-target="0">$0</div>' +
      '<p class="card-desc">' +
      escapeHTML(spec.desc) +
      "</p>" +
      "</div>" +
      '<div class="card-vendors" data-role="vendors"></div>'
    );
  }

  // Render every known product as a preview card into the grid. Called on boot
  // so visitors see the full set of audit threads before submitting.
  function renderPreviewGrid(grid) {
    clear(grid);
    for (var i = 0; i < KNOWN_KEYS.length; i++) {
      var key = KNOWN_KEYS[i];
      var spec = PRODUCT_SPECS[key];
      var card = document.createElement("article");
      card.className = "pa-card preview";
      card.setAttribute("data-key", key);
      card.innerHTML = moduleCardHTML(spec);
      grid.appendChild(card);
    }
  }

  // Tick-animate a dollar value from current → target.
  function animateNumber(el, target, duration, onDone) {
    var from =
      parseFloat(String(el.textContent || "0").replace(/[^0-9.-]/g, "")) || 0;
    var t0 = (performance && performance.now && performance.now()) || Date.now();
    function frame(now) {
      var t = (now || Date.now()) - t0;
      var p = Math.min(1, duration > 0 ? t / duration : 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.round(from + (target - from) * eased);
      el.textContent = USD.format(val);
      if (p < 1) requestAnimationFrame(frame);
      else if (onDone) onDone();
    }
    requestAnimationFrame(frame);
  }

  // Reveal a card: flip from preview to complete, populate vendor rows and
  // animate the amount. If the grid has no matching card (unknown id from the
  // backend), create a fresh card and append it.
  function revealCard(key, product, grid) {
    var card = grid.querySelector('.pa-card[data-key="' + key + '"]');
    if (!card) {
      card = document.createElement("article");
      card.className = "pa-card preview";
      card.setAttribute("data-key", key);
      card.innerHTML = moduleCardHTML(specForKey(key));
      grid.appendChild(card);
    }

    var vendorsEl = card.querySelector('[data-role="vendors"]');
    if (vendorsEl) {
      vendorsEl.innerHTML = (product.vendors || []).map(vendorRowHTML).join("");
    }
    var amountEl = card.querySelector('[data-role="amount"]');
    if (amountEl) {
      amountEl.setAttribute("data-target", String(product.wasteTotal || 0));
    }

    // Cards are hidden at the start of each run; un-hide as each one reveals.
    card.classList.remove("pa-card-hidden");
    card.style.removeProperty("display");

    card.classList.remove("preview");
    card.classList.add("revealing");
    setTimeout(function () {
      card.classList.remove("revealing");
    }, 700);

    if (amountEl) {
      animateNumber(amountEl, product.wasteTotal || 0, 900, function () {
        amountEl.classList.add("pulse");
        setTimeout(function () {
          amountEl.classList.remove("pulse");
        }, 500);
      });
    }
  }

  function setScanTitle(el, text) {
    if (!el) return;
    el.innerHTML = escapeHTML(text) + '<span class="scan-caret"></span>';
  }

  function wait(ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  }

  // Build the scan-list markup: SSE products first, then remaining known keys
  // without data (just "n/a"). Returns an array of { row, product, key } for
  // the animated-enabled rows (the SSE products).
  function populateScanList(scanList, products) {
    clear(scanList);
    var returnedKeys = products.map(function (p) {
      return idToKey(p.id);
    });
    var animated = [];
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      var key = idToKey(p.id);
      var spec = specForKey(key);
      var row = document.createElement("div");
      row.className = "scan-item pending";
      row.setAttribute("data-key", key);
      row.innerHTML =
        '<span class="scan-status"></span>' +
        '<span class="scan-item-name"><span class="emoji">' +
        spec.emoji +
        "</span>" +
        escapeHTML(spec.name) +
        "</span>" +
        '<span class="scan-item-vendor" data-role="vendor">pending</span>' +
        '<span class="scan-item-amount" data-role="amount">$0</span>';
      scanList.appendChild(row);
      animated.push({ row: row, product: p, key: key });
    }

    for (var j = 0; j < KNOWN_KEYS.length; j++) {
      var k = KNOWN_KEYS[j];
      if (returnedKeys.indexOf(k) !== -1) continue;
      var s = PRODUCT_SPECS[k];
      var row2 = document.createElement("div");
      row2.className = "scan-item pending";
      row2.setAttribute("data-key", k);
      row2.innerHTML =
        '<span class="scan-status"></span>' +
        '<span class="scan-item-name"><span class="emoji">' +
        s.emoji +
        "</span>" +
        escapeHTML(s.name) +
        "</span>" +
        '<span class="scan-item-vendor">n/a</span>' +
        '<span class="scan-item-amount">—</span>';
      scanList.appendChild(row2);
    }

    return animated;
  }

  // The scan sequence: cycle phase titles, animate the scan-list rows one at a
  // time, reveal the matching card in the grid, advance the progress bar.
  async function runScanSequence(ctx) {
    var section = ctx.section;
    var scanTitle = ctx.scanTitle;
    var scanList = ctx.scanList;
    var progressFill = ctx.progressFill;
    var grid = ctx.grid;
    var products = ctx.products;
    var isCancelled = ctx.isCancelled || function () {
      return false;
    };

    section.classList.add("scanning");

    setScanTitle(scanTitle, "Finding your vendors");
    await wait(TITLE_STEP_MS);
    if (isCancelled()) return;
    setScanTitle(scanTitle, "Sizing your business");
    await wait(TITLE_STEP_MS);
    if (isCancelled()) return;
    setScanTitle(scanTitle, "Running the audit");

    var animated = populateScanList(scanList, products);

    for (var i = 0; i < animated.length; i++) {
      if (isCancelled()) return;
      var ar = animated[i];
      var vendorEl = ar.row.querySelector('[data-role="vendor"]');
      var amountEl = ar.row.querySelector('[data-role="amount"]');
      var vendors = ar.product.vendors || [];

      ar.row.classList.remove("pending");
      ar.row.classList.add("active");

      if (vendors[0]) {
        if (vendorEl) {
          vendorEl.textContent = "checking " + vendors[0].name + "…";
        }
        await wait(PER_VENDOR_MS);
        if (isCancelled()) return;
      }
      if (vendors[1]) {
        if (vendorEl) {
          vendorEl.textContent = "checking " + vendors[1].name + "…";
        }
        await wait(PER_VENDOR_NEXT_MS);
        if (isCancelled()) return;
      }

      ar.row.classList.remove("active");
      ar.row.classList.add("done");
      if (vendorEl) {
        vendorEl.textContent = vendors
          .map(function (v) {
            return v.name;
          })
          .join(", ") || "—";
      }
      if (amountEl) {
        animateNumber(amountEl, ar.product.wasteTotal || 0, 500);
      }

      revealCard(ar.key, ar.product, grid);

      var pct = ((i + 1) / Math.max(1, animated.length)) * 100;
      if (progressFill) progressFill.style.width = pct + "%";
      await wait(POST_MODULE_MS);
    }

    if (isCancelled()) return;
    setScanTitle(scanTitle, "Totaling your recoverable");
    await wait(TOTALING_MS);
    if (isCancelled()) return;
    setScanTitle(scanTitle, "Audit complete");
    await wait(POST_FINAL_MS);

    section.classList.remove("scanning");
  }


  // Controller — single in-flight run at a time.
  // Requires the static shell from webflow/presignup-agent.html to be in
  // the DOM (no JS-build fallback — the embed CDN size limit doesn't allow it).

  function Controller(root) {
    this.root = root;
    this.form = root.querySelector("#presignup-agent-form");
    this.input = root.querySelector("#presignup-agent-input");
    this.status = root.querySelector("#presignup-agent-status");
    this.results = root.querySelector("#presignup-agent-results");
    this.templateRow = root.querySelector("#presignup-agent-template-row");
    this.templateRefresh = root.querySelector(
      "#presignup-agent-template-refresh"
    );
    this.submit = root.querySelector("#presignup-agent-submit");
    this.scanPanel = root.querySelector("#presignup-agent-scan-panel");
    this.scanTitle = root.querySelector("#presignup-agent-scan-title");
    this.scanList = root.querySelector("#presignup-agent-scan-list");
    this.scanProgress = root.querySelector("#presignup-agent-scan-progress");
    this.steps = root.querySelector("#presignup-agent-steps");
    this.abort = null;
    this.sequenceCancel = null;
    this.sizingTimer = null;

    // Cards are no longer shown on page load — the results grid stays empty
    // until an audit run. revealCard() creates each card from scratch as the
    // SSE stream returns products.
  }

  Controller.prototype.init = function () {
    if (!this.form || !this.input || !this.results || !this.status) return;
    var self = this;

    // The shell may be a real <form> (legacy JS build) or a plain <div>
    // (Webflow-authored). Wire both: submit event if available, plus a click
    // on the run button so either path triggers handleSubmit.
    if (typeof this.form.requestSubmit === "function") {
      this.form.addEventListener("submit", function (e) {
        e.preventDefault();
        self.handleSubmit();
      });
    }
    if (this.submit) {
      this.submit.addEventListener("click", function (e) {
        e.preventDefault();
        self.handleSubmit();
      });
    }

    // Enter submits; Shift+Enter inserts a newline. Mirrors hero.html behavior.
    this.input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        self.handleSubmit();
      }
    });

    // Template chip click — mark active + fill textarea with the preset domain.
    if (this.templateRow) {
      this.templateRow.addEventListener("click", function (e) {
        var btn = e.target.closest(".template");
        if (!btn) return;
        var chips = self.templateRow.querySelectorAll(".template");
        for (var i = 0; i < chips.length; i++) {
          chips[i].classList.remove("active");
        }
        btn.classList.add("active");
        var domain = btn.getAttribute("data-domain") || "";
        if (domain) {
          self.input.value = domain;
          self.input.focus();
        }
      });
    }

    // Template refresh — pick a random non-active template and mark it.
    if (this.templateRefresh) {
      this.templateRefresh.addEventListener("click", function (e) {
        var btn = e.currentTarget;
        var all = Array.prototype.slice.call(
          self.templateRow.querySelectorAll(".template")
        );
        if (!all.length) return;
        var current = self.templateRow.querySelector(".template.active");
        var pool = all.filter(function (t) {
          return t !== current;
        });
        var pick = pool[Math.floor(Math.random() * pool.length)];
        all.forEach(function (t) {
          t.classList.remove("active");
        });
        pick.classList.add("active");
        var domain = pick.getAttribute("data-domain") || "";
        if (domain) self.input.value = domain;
        btn.classList.add("spin");
        setTimeout(function () {
          btn.classList.remove("spin");
        }, 300);
      });
    }

    window.addEventListener("beforeunload", function () {
      self.cancelActive();
    });
  };

  Controller.prototype.setFormLoading = function (loading) {
    this.form.setAttribute("data-state", loading ? "loading" : "");
    this.input.disabled = !!loading;
    if (this.submit) this.submit.disabled = !!loading;
  };

  Controller.prototype.setStatus = function (text, opts) {
    clear(this.status);
    if (!text) return;
    var showDot = opts && opts.dot;
    if (showDot) {
      this.status.appendChild(
        h("span", {
          class: "presignup-agent-status-dot",
          "aria-hidden": "true",
        })
      );
    }
    this.status.appendChild(document.createTextNode(text));
  };

  Controller.prototype.showError = function (message) {
    clear(this.status);
    var self = this;
    var err = h("div", { class: "presignup-agent-error", role: "alert" }, [
      h("span", { text: message }),
      h("button", {
        type: "button",
        class: "presignup-agent-error-retry",
        text: "Try again",
      }),
    ]);
    var retry = err.querySelector(".presignup-agent-error-retry");
    retry.addEventListener("click", function () {
      self.setStatus("");
      self.input.focus();
      self.input.select();
    });
    this.status.appendChild(err);
  };

  Controller.prototype.cancelActive = function () {
    if (this.abort) {
      try {
        this.abort.abort();
      } catch (_) {}
      this.abort = null;
    }
    if (this.sequenceCancel) {
      this.sequenceCancel();
      this.sequenceCancel = null;
    }
    // Reset sim section + form-loading state in case a scan was mid-flight.
    if (this.root) this.root.classList.remove("scanning");
    if (this.scanList) clear(this.scanList);
    if (this.scanProgress) this.scanProgress.style.width = "0%";
  };

  Controller.prototype.handleSubmit = function () {
    var raw = this.input.value;
    var domain = normalizeDomain(raw);
    if (!isValidDomain(domain)) {
      this.showError("Enter a valid domain, like sportforlife.co.th.");
      return;
    }

    this.cancelActive();
    // Reset card state, then hide all cards for the loading phase. Each card
    // is un-hidden by revealCard() as the agent returns data for it.
    this.resetCardsToPreview();
    this.hideAllCards();
    this.removeBanner();
    this.setFormLoading(true);
    this.setStatus("", {});
    this.setStep("finding");

    this.abort = new AbortController();
    var self = this;
    var signal = this.abort.signal;
    var accumulatedText = "";
    var sessionId = getSessionId();
    var payload = {
      appName: APP_NAME,
      userId: USER_ID,
      sessionId: sessionId,
      newMessage: { role: "user", parts: [{ text: domain }] },
      streaming: true,
    };

    self.setStatus("Authenticating…", { dot: true });
    getToken(signal)
      .then(function (token) {
        self.setStatus("Creating session…", { dot: true });
        return ensureSession(sessionId, token, signal);
      })
      .then(function () {
        // Tokens are single-use, so fetch a fresh one for run_sse.
        return getToken(signal);
      })
      .then(function (token) {
        self.setStatus("", {});
        return streamAgent(payload, token, signal);
      })
      .then(function (stream) {
        return consumeSSE(stream, function (event) {
          if (!event || !event.content || !Array.isArray(event.content.parts)) {
            return;
          }
          for (var i = 0; i < event.content.parts.length; i++) {
            var part = event.content.parts[i];
            if (!part) continue;
            // functionResponse arrives once the tool call completes — that
            // payload contains tech_profile + business_profile + spend_estimate
            // in one shot, so we hop to the synthetic "Sizing" beat and
            // schedule the auto-advance to "Running the audit".
            if (part.functionResponse) {
              self.setStep("sizing");
              if (self.sizingTimer) clearTimeout(self.sizingTimer);
              self.sizingTimer = setTimeout(function () {
                self.setStep("auditing");
              }, 1500);
            }
            if (part && typeof part.text === "string") {
              // First streaming text chunk = the model is writing the audit;
              // jump to the final phase even if the sizing timer hasn't fired.
              if (event.partial === true) self.setStep("auditing");
              accumulatedText += part.text;
            }
          }
        });
      })
      .then(function () {
        var products = extractAuditProducts(accumulatedText);
        if (!products || !products.length) {
          throw new Error("Agent did not return any audit products.");
        }
        self.setStep("auditing");
        return self.runScan(products);
      })
      .then(function () {
        // Collapse the grid to just the cards the agent returned data for.
        self.hideUnmatchedCards();
        // After the scan finishes we drop the total banner below the grid.
        // (Kept per your preference; hero.html folds this into a summary card.)
        self.renderTotalBanner();
      })
      .catch(function (err) {
        if (err && err.name === "AbortError") return;
        self.showError(
          (err && err.message) || "Something went wrong. Please try again."
        );
      })
      .finally(function () {
        self.setFormLoading(false);
        self.hideStepper();
        if (self.sizingTimer) {
          clearTimeout(self.sizingTimer);
          self.sizingTimer = null;
        }
        self.abort = null;
      });
  };

  // Run the scan sequence — narrates the audit inside the form and reveals
  // each matching card in the grid as its scan-item completes.
  Controller.prototype.runScan = function (products) {
    var self = this;
    self.lastProducts = products;
    var cancelled = false;
    self.sequenceCancel = function () {
      cancelled = true;
    };
    return runScanSequence({
      section: self.root,
      scanTitle: self.scanTitle,
      scanList: self.scanList,
      progressFill: self.scanProgress,
      grid: self.results,
      products: products,
      isCancelled: function () {
        return cancelled;
      },
    }).then(function () {
      self.sequenceCancel = null;
    });
  };

  // Reset every card in the grid back to the preview state. Used on re-submit
  // so the UI isn't a mix of completed + preview from the previous run.
  // Also un-hides any cards that were hidden at the end of the last run
  // because the agent didn't return data for them.
  Controller.prototype.resetCardsToPreview = function () {
    if (!this.results) return;
    var cards = this.results.querySelectorAll(".pa-card");
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      c.classList.add("preview");
      c.classList.remove("revealing");
      c.classList.remove("pa-card-hidden");
      c.style.removeProperty("display");
      var vendorsEl = c.querySelector('[data-role="vendors"]');
      if (vendorsEl) vendorsEl.innerHTML = "";
      var amountEl = c.querySelector('[data-role="amount"]');
      if (amountEl) {
        amountEl.textContent = "$0";
        amountEl.setAttribute("data-target", "0");
        amountEl.classList.remove("pulse");
      }
    }
    this.removeBanner();
  };

  // Activate one of the three loading phases. Steps before the active one
  // get marked done; steps after stay idle. Called by handleSubmit / SSE.
  Controller.prototype.setStep = function (name) {
    if (!this.steps) return;
    var order = ["finding", "sizing", "auditing"];
    var idx = order.indexOf(name);
    if (idx < 0) return;
    this.steps.hidden = false;
    var nodes = this.steps.querySelectorAll(".presignup-agent-step");
    for (var i = 0; i < nodes.length; i++) {
      var stepName = nodes[i].getAttribute("data-step");
      var pos = order.indexOf(stepName);
      nodes[i].classList.remove("is-active", "is-done");
      if (pos < idx) nodes[i].classList.add("is-done");
      else if (pos === idx) nodes[i].classList.add("is-active");
    }
  };

  Controller.prototype.hideStepper = function () {
    if (!this.steps) return;
    this.steps.hidden = true;
    var nodes = this.steps.querySelectorAll(".presignup-agent-step");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].classList.remove("is-active", "is-done");
    }
  };

  // Hide every card in the grid. Called at the start of an audit so the
  // default preview cards disappear during the loading/scan phase. Each card
  // is un-hidden by revealCard() as the agent reveals data for it.
  Controller.prototype.hideAllCards = function () {
    if (!this.results) return;
    var cards = this.results.querySelectorAll(".pa-card");
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.add("pa-card-hidden");
      cards[i].style.display = "none";
    }
  };

  // After a run completes, hide any card that didn't get data from the agent
  // (still in .preview state). Defensive — should be a no-op now that
  // hideAllCards runs upfront, but kept for fallback paths.
  Controller.prototype.hideUnmatchedCards = function () {
    if (!this.results) return;
    var cards = this.results.querySelectorAll(".pa-card.preview");
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.add("pa-card-hidden");
      cards[i].style.display = "none";
    }
  };

  Controller.prototype.removeBanner = function () {
    if (!this.results) return;
    var banner = this.results.querySelector(".presignup-agent-total");
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
  };

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  Controller.prototype.renderTotalBanner = function () {
    var self = this;
    var products = this.lastProducts || [];
    var total = 0;
    for (var i = 0; i < products.length; i++) {
      total += Number(products[i].wasteTotal || 0);
    }

    var banner = document.createElement("div");
    banner.className = "presignup-agent-total";
    banner.setAttribute("role", "group");
    banner.style.gridColumn = "1 / -1";
    banner.innerHTML =
      '<div class="presignup-agent-total-stack">' +
      '<span class="presignup-agent-total-label">Total Recoverable</span>' +
      '<span class="presignup-agent-total-value">' +
      escapeHTML(USD.format(total)) +
      "</span>" +
      "</div>" +
      '<form class="presignup-agent-total-form" data-role="form" novalidate>' +
      '<svg class="presignup-agent-total-form-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>' +
      '<input type="email" class="presignup-agent-total-email" data-role="email" required ' +
      'placeholder="you@company.com" aria-label="Email for report" autocomplete="email" />' +
      '<button type="submit" class="presignup-agent-total-cta" data-role="cta" disabled>' +
      "<svg aria-hidden='true' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' x2='12' y1='15' y2='3'/></svg>" +
      "<span>Download Report</span>" +
      "</button>" +
      "</form>";

    var form = banner.querySelector('[data-role="form"]');
    var emailInput = banner.querySelector('[data-role="email"]');
    var cta = banner.querySelector('[data-role="cta"]');

    emailInput.addEventListener("input", function () {
      cta.disabled = !EMAIL_RE.test(emailInput.value.trim());
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var email = emailInput.value.trim();
      if (!EMAIL_RE.test(email)) return;
      self.submitDownloadReport(email);
    });

    this.results.appendChild(banner);
  };

  // POST /presignup/audit-report/<session-id> with { email } body. Called only
  // after client-side email validation passes. Disables the CTA during the
  // request; clears loading state on both success and failure.
  Controller.prototype.submitDownloadReport = function (email) {
    var self = this;
    var banner = this.results && this.results.querySelector(".presignup-agent-total");
    var cta = banner && banner.querySelector('[data-role="cta"]');
    var emailInput = banner && banner.querySelector('[data-role="email"]');
    if (!EMAIL_RE.test(String(email || "").trim())) return;

    function setCtaLoading(isLoading) {
      if (!cta) return;
      var labelEl = cta.querySelector("span");
      if (labelEl && !cta.getAttribute("data-label")) {
        cta.setAttribute("data-label", labelEl.textContent || "");
      }

      if (isLoading) {
        cta.disabled = true;
        cta.classList.add("is-loading");
        cta.setAttribute("aria-busy", "true");
        if (labelEl) labelEl.textContent = "Preparing…";
        return;
      }

      cta.classList.remove("is-loading");
      cta.removeAttribute("aria-busy");
      if (labelEl) {
        var orig = cta.getAttribute("data-label") || "Download Report";
        labelEl.textContent = orig;
      }

      var currentEmail = emailInput ? emailInput.value.trim() : String(email || "").trim();
      cta.disabled = !EMAIL_RE.test(currentEmail);
    }

    setCtaLoading(true);

    var sessionId = getSessionId();

    getToken()
      .then(function (token) {
        var url =
          AGENT_BASE_URL +
          AUDIT_REPORT_ENDPOINT +
          encodeURIComponent(sessionId);
        return fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Presignup-Token": token,
          },
          body: JSON.stringify({ email: String(email).trim() }),
        });
      })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("Audit report request failed: " + res.status);
        }
        // Prefer server-supplied filename via Content-Disposition; fall back.
        var filename = "vaudit-audit-report.pdf";
        var disposition = res.headers.get("Content-Disposition");
        if (disposition) {
          var m = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^";\r\n]+)/i);
          if (m && m[1]) {
            try { filename = decodeURIComponent(m[1].trim().replace(/^["']|["']$/g, "")); }
            catch (_) { filename = m[1].trim().replace(/^["']|["']$/g, ""); }
          }
        }
        return res.blob().then(function (blob) { return { blob: blob, filename: filename }; });
      })
      .then(function (r) {
        // Trigger a client-side download of the returned PDF.
        var url = URL.createObjectURL(r.blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = r.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        setCtaLoading(false);
      })
      .catch(function (err) {
        if (window.console && window.console.error) {
          window.console.error("[presignup-agent] audit report failed:", err);
        }
        setCtaLoading(false);
      });
  };

  // Boot
  // Canvas-hide reveal logic now lives in webflow/canvas-hide.js (loaded
  // separately) so it can run site-wide without bloating this bundle.

  function boot() {
    var root = document.getElementById("presignup-agent-root");
    if (!root) return;
    var controller = new Controller(root);
    controller.init();
    // Expose for harness/debug; not used in production.
    window.__presignupAgent = controller;
  }

  if (document.readyState !== "loading") {
    boot();
  } else {
    document.addEventListener("DOMContentLoaded", boot);
  }
})();

```
