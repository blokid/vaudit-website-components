# presignup-agent.test.html

> Source from `vaudit-website-pages/test/presignup-agent.test.html`. Pasted into Webflow Custom Code or Embed elements — **not consumed by the Vite build**. Kept here as a reference snapshot of the legacy workflow.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pre-signup agent — local harness</title>

    <!-- Theme bootstrap (mirrors webflow/theme-custom-code.html HEAD) -->
    <script>
      (function () {
        try {
          var saved = localStorage.getItem("vaudit-theme");
          var prefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
          ).matches;
          var isDark = saved === "dark" || (!saved && prefersDark);
          document.documentElement.classList.toggle("dark", isDark);
        } catch (e) {}
      })();
    </script>

    <link rel="stylesheet" href="../webflow/body-dark-cascade.css" />
    <link rel="stylesheet" href="../webflow/presignup-agent.css" />

    <style>
      html,
      body {
        margin: 0;
        padding: 0;
        min-height: 100vh;
        background: var(--bg);
        color: var(--text-primary);
        font-family:
          system-ui,
          -apple-system,
          "Segoe UI",
          Roboto,
          "Helvetica Neue",
          Arial,
          sans-serif;
      }

      .harness-toolbar {
        position: fixed;
        top: 0.75rem;
        right: 0.75rem;
        z-index: 9999;
        display: flex;
        gap: 0.5rem;
        padding: 0.5rem;
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 999px;
        box-shadow: 0 4px 18px rgba(26, 26, 24, 0.12);
        font-size: 0.8125rem;
      }

      .harness-toolbar button {
        border: 0;
        background: transparent;
        color: var(--text-primary);
        cursor: pointer;
        padding: 0.375rem 0.75rem;
        border-radius: 999px;
        font: inherit;
      }

      .harness-toolbar button:hover {
        background: rgba(254, 96, 44, 0.12);
        color: var(--primary);
      }

      .harness-toolbar button[aria-pressed="true"] {
        background: var(--primary);
        color: #fff;
      }

      .harness-hero {
        margin-top: 4.5rem;
      }
    </style>
  </head>
  <body class="body-16">
    <!-- ======================================================================
         Harness toolbar — fixed top-right. Not part of the Webflow paste.
         ====================================================================== -->
    <div class="harness-toolbar" role="toolbar" aria-label="Test harness">
      <button id="harness-theme" type="button">Toggle dark</button>
      <button id="harness-fixture" type="button" aria-pressed="true">
        Fixture: ON
      </button>
      <button id="harness-prefill" type="button">Prefill domain</button>
    </div>

    <!-- ======================================================================
         Root element — the script builds the whole sim section inside this div.
         ====================================================================== -->
    <section class="presignup-agent-section harness-hero">
      <div id="presignup-agent-root"></div>
    </section>

    <!-- ======================================================================
         Harness fetch interceptor — fixture replay
         ======================================================================
         When fixture mode is ON, any POST is answered with a synthetic SSE
         response streamed from pre_signup_response.txt. Other requests pass
         through.
         ====================================================================== -->
    <script>
      (function () {
        var FIXTURE_URL = "../pre_signup_response.txt";
        var fixturePromise = null;

        window.__presignupFixture = false;

        function loadFixture() {
          if (!fixturePromise) {
            fixturePromise = window
              .__nativeFetch(FIXTURE_URL)
              .then(function (r) {
                if (!r.ok) throw new Error("Failed to load fixture: " + r.status);
                return r.text();
              });
          }
          return fixturePromise;
        }

        function chunk(text, pieces) {
          var out = [];
          var n = Math.max(1, pieces);
          var size = Math.ceil(text.length / n);
          for (var i = 0; i < text.length; i += size) {
            out.push(text.slice(i, i + size));
          }
          return out;
        }

        function fixtureResponse(text) {
          var encoder = new TextEncoder();
          var pieces = chunk(text, 12);
          var stream = new ReadableStream({
            start: function (controller) {
              var i = 0;
              function push() {
                if (i >= pieces.length) {
                  controller.close();
                  return;
                }
                controller.enqueue(encoder.encode(pieces[i]));
                i++;
                setTimeout(push, 180);
              }
              setTimeout(push, 120);
            },
          });
          return new Response(stream, {
            status: 200,
            headers: { "Content-Type": "text/event-stream" },
          });
        }

        // Preserve native fetch for the harness itself.
        window.__nativeFetch = window.fetch.bind(window);

        window.fetch = function (resource, init) {
          var method =
            (init && init.method) ||
            (resource && resource.method) ||
            "GET";
          var isPost = String(method).toUpperCase() === "POST";
          if (window.__presignupFixture && isPost) {
            return loadFixture().then(function (text) {
              return fixtureResponse(text);
            });
          }
          return window.__nativeFetch(resource, init);
        };
      })();
    </script>

    <!-- ======================================================================
         Agent script under test
         ====================================================================== -->
    <script src="../webflow/presignup-agent.js"></script>

    <!-- ======================================================================
         Harness toolbar handlers
         ====================================================================== -->
    <script>
      (function () {
        var STORAGE_KEY = "vaudit-theme";

        function applyTheme(isDark) {
          document.documentElement.classList.toggle("dark", isDark);
          try {
            localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
          } catch (_) {}
        }

        var themeBtn = document.getElementById("harness-theme");
        themeBtn.addEventListener("click", function () {
          var isDark = !document.documentElement.classList.contains("dark");
          applyTheme(isDark);
        });

        var fixtureBtn = document.getElementById("harness-fixture");
        function setFixtureLabel() {
          var on = window.__presignupFixture === true;
          fixtureBtn.setAttribute("aria-pressed", on ? "true" : "false");
          fixtureBtn.textContent = on ? "Fixture: ON" : "Fixture: OFF";
        }
        setFixtureLabel();
        fixtureBtn.addEventListener("click", function () {
          window.__presignupFixture = !window.__presignupFixture;
          setFixtureLabel();
        });

        var prefillBtn = document.getElementById("harness-prefill");
        prefillBtn.addEventListener("click", function () {
          var input = document.getElementById("presignup-agent-input");
          if (!input) return;
          input.value = "sportforlife.co.th";
          input.focus();
        });
      })();
    </script>
  </body>
</html>

```
