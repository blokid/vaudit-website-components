# presignup-agent-static.test.html

> Source from `vaudit-website-pages/test/presignup-agent-static.test.html`. Pasted into Webflow Custom Code or Embed elements — **not consumed by the Vite build**. Kept here as a reference snapshot of the legacy workflow.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pre-signup agent — static-shell harness</title>

    <script>
      (function () {
        try {
          var saved = localStorage.getItem("vaudit-theme");
          var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          var isDark = saved === "dark" || (!saved && prefersDark);
          document.documentElement.classList.toggle("dark", isDark);
        } catch (e) {}
      })();
    </script>

    <link rel="stylesheet" href="../webflow/body-dark-cascade.css" />
    <link rel="stylesheet" href="../webflow/presignup-agent.css" />

    <style>
      html, body {
        margin: 0; padding: 0; min-height: 100vh;
        background: var(--bg);
        color: var(--text-primary);
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      }
      .harness-toolbar {
        position: fixed; top: 0.75rem; right: 0.75rem; z-index: 9999;
        display: flex; gap: 0.5rem; padding: 0.5rem;
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 999px;
        box-shadow: 0 4px 18px rgba(26, 26, 24, 0.12);
        font-size: 0.8125rem;
      }
      .harness-toolbar button {
        border: 0; background: transparent;
        color: var(--text-primary);
        cursor: pointer; padding: 0.375rem 0.75rem;
        border-radius: 999px; font: inherit;
      }
      .harness-toolbar button:hover {
        background: rgba(254, 96, 44, 0.12);
        color: var(--primary);
      }
      .harness-toolbar button[aria-pressed="true"] {
        background: var(--primary); color: #fff;
      }
      .harness-hero { margin-top: 4.5rem; }
    </style>
  </head>
  <body class="body-16">
    <div class="harness-toolbar" role="toolbar" aria-label="Test harness">
      <button id="harness-theme" type="button">Toggle dark</button>
      <button id="harness-fixture" type="button" aria-pressed="true">Fixture: ON</button>
      <button id="harness-prefill" type="button">Prefill domain</button>
    </div>

    <div class="harness-hero"></div>

    <!-- ============================================================
         STATIC SHELL — loaded from webflow/presignup-agent.html
         This is the exact block that would be pasted into Webflow.
         ============================================================ -->
    <div id="shell-mount"></div>

    <script>
      // Inline-load the shell so this harness renders the real static HTML.
      fetch("../webflow/presignup-agent.html")
        .then(function (r) { return r.text(); })
        .then(function (html) {
          // Strip the HTML comment header before the <section>.
          var idx = html.indexOf("<section");
          document.getElementById("shell-mount").innerHTML =
            idx >= 0 ? html.slice(idx) : html;
          // After the shell mounts, load the controller which will hydrate it.
          var s = document.createElement("script");
          s.src = "../webflow/presignup-agent.js";
          document.body.appendChild(s);
        });
    </script>

    <!-- ======================================================================
         Harness fetch interceptor — fixture replay (same as the JS-build harness)
         ====================================================================== -->
    <script>
      (function () {
        var FIXTURE_URL = "../pre_signup_response.txt";
        var fixturePromise = null;
        window.__presignupFixture = true;
        window.__nativeFetch = window.fetch.bind(window);

        function loadFixture() {
          if (!fixturePromise) {
            fixturePromise = window.__nativeFetch(FIXTURE_URL).then(function (r) {
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
                if (i >= pieces.length) { controller.close(); return; }
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

        window.fetch = function (input, init) {
          if (!window.__presignupFixture) {
            return window.__nativeFetch(input, init);
          }
          var url = typeof input === "string" ? input : (input && input.url) || "";
          var method = (init && init.method) ||
            (input && input.method) || "GET";
          method = String(method).toUpperCase();
          // Let the fixture fetch pass through.
          if (url.indexOf("pre_signup_response.txt") !== -1) {
            return window.__nativeFetch(input, init);
          }
          if (method === "POST") {
            return loadFixture().then(fixtureResponse);
          }
          if (url.indexOf("/presignup/token") !== -1) {
            return Promise.resolve(new Response(
              JSON.stringify({ token: "fixture-token" }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            ));
          }
          return window.__nativeFetch(input, init);
        };

        // Toolbar wiring
        document.getElementById("harness-theme").addEventListener("click", function () {
          var isDark = document.documentElement.classList.toggle("dark");
          try { localStorage.setItem("vaudit-theme", isDark ? "dark" : "light"); } catch (e) {}
        });
        var fixBtn = document.getElementById("harness-fixture");
        fixBtn.addEventListener("click", function () {
          window.__presignupFixture = !window.__presignupFixture;
          fixBtn.setAttribute("aria-pressed", window.__presignupFixture ? "true" : "false");
          fixBtn.textContent = "Fixture: " + (window.__presignupFixture ? "ON" : "OFF");
        });
        document.getElementById("harness-prefill").addEventListener("click", function () {
          var ta = document.getElementById("presignup-agent-input");
          if (ta) { ta.value = "sportforlife.co.th"; ta.focus(); }
        });
      })();
    </script>
  </body>
</html>

```
