# presignup-agent.html

> Source from `vaudit-website-pages/webflow/presignup-agent.html`. Pasted into Webflow Custom Code or Embed elements — **not consumed by the Vite build**. Kept here as a reference snapshot of the legacy workflow.

```html
<!-- Pre-signup agent shell. Paste into the presignup-html embed. JS hydrates it on load. -->

<section class="presignup-agent-section">
  <div class="presignup-agent-container sim" id="presignup-agent-root">

    <h2 class="sim-title">Connect. Audit. Get Money Back</h2>
    <p class="sim-sub">See what Vaudit would recover for your business in under 10 seconds.</p>

    <div class="sim-input-row" id="presignup-agent-form">
      <div class="sim-input-top">
        <span class="caret-i" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </span>
        <textarea id="presignup-agent-input" rows="3" placeholder="Enter your website (e.g. stripe.com), describe your stack, or paste a list of vendors you want audited…"></textarea>
      </div>

      <div class="sim-input-bottom">
        <button type="button" class="sim-run" id="presignup-agent-submit">
          Audit My Vendors<kbd class="sim-kbd" id="presignup-agent-kbd" aria-hidden="true">↵</kbd>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </button>
      </div>

      <div class="scan-panel" id="presignup-agent-scan-panel" aria-live="polite">
        <div class="scan-header">
          <div class="scan-title-wrap">
            <span class="scan-eyebrow">Live Audit</span>
            <div class="scan-title" id="presignup-agent-scan-title"></div>
          </div>
        </div>
        <div class="scan-list" id="presignup-agent-scan-list"></div>
        <div class="scan-progress">
          <div class="scan-progress-fill" id="presignup-agent-scan-progress"></div>
        </div>
      </div>
    </div>

    <div class="presignup-agent-steps" id="presignup-agent-steps" hidden>
      <div class="presignup-agent-step" data-step="finding">
        <span class="presignup-agent-step-dot"></span>
        <span class="presignup-agent-step-label">Finding your vendors</span>
      </div>
      <span class="presignup-agent-step-sep" aria-hidden="true">›</span>
      <div class="presignup-agent-step" data-step="sizing">
        <span class="presignup-agent-step-dot"></span>
        <span class="presignup-agent-step-label">Sizing your business</span>
      </div>
      <span class="presignup-agent-step-sep" aria-hidden="true">›</span>
      <div class="presignup-agent-step" data-step="auditing">
        <span class="presignup-agent-step-dot"></span>
        <span class="presignup-agent-step-label">Running the audit</span>
      </div>
    </div>

    <div class="template-row" id="presignup-agent-template-row">
      <button class="template" type="button" data-domain="stripe.com" data-label="B2B SaaS">
        <svg class="t-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
        <span>B2B SaaS</span>
      </button>
      <button class="template" type="button" data-domain="sportforlife.co.th" data-label="D2C E-commerce">
        <svg class="t-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <span>D2C E-commerce</span>
      </button>
      <button class="template" type="button" data-domain="plaid.com" data-label="Enterprise Fintech">
        <svg class="t-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
        <span>Enterprise Fintech</span>
      </button>
      <button class="template-refresh" id="presignup-agent-template-refresh" type="button" aria-label="Shuffle template">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-15-6.7L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/><path d="M21 21v-5h-5"/></svg>
      </button>
    </div>

    <div id="presignup-agent-status" class="presignup-agent-status" aria-live="polite"></div>

    <div class="platform-display" id="platformDisplay" role="img" aria-label="Supported ad platforms: Google Ads, Meta Ads, TikTok Ads, AppLovin">
      <div class="platform-display-title">
        <strong>Start with ads.</strong> <span>Expand to every bill.</span>
      </div>
      <div class="platform-row">
        <div class="platform-card">
          <span class="platform-icon platform-icon--google" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_4767_108)"><path d="M1.51213 16.47L8.90274 3.81738C9.84152 4.37008 14.5754 6.9899 15.34 7.48817L7.94934 20.1415C7.14108 21.2093 0.488127 18.0904 1.51213 16.4693V16.47Z" fill="#FBBC04"/><path d="M22.7463 16.4697L15.3557 3.81791C14.3225 2.09843 12.0972 1.47356 10.2695 2.48913C8.44176 3.50469 7.88524 5.69234 8.91846 7.4886L16.3091 20.142C17.3423 21.8607 19.5676 22.4855 21.3953 21.47C23.1432 20.4543 23.7795 18.1891 22.7463 16.4712V16.4697Z" fill="#4285F4"/><path d="M4.70991 21.959C6.75884 21.959 8.41983 20.3393 8.41983 18.3412C8.41983 16.3432 6.75884 14.7235 4.70991 14.7235C2.66098 14.7235 1 16.3432 1 18.3412C1 20.3393 2.66098 21.959 4.70991 21.959Z" fill="#34A853"/></g><defs><clipPath id="clip0_4767_108"><rect width="22.2609" height="20" fill="white" transform="translate(1 2)"/></clipPath></defs></svg>
          </span>
          <span class="platform-name">Google Ads</span>
        </div>
        <div class="platform-card">
          <span class="platform-icon platform-icon--meta" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_4767_139)"><path d="M4.16023 13.7606C4.16023 14.5243 4.32789 15.1106 4.54695 15.4653C4.83422 15.9299 5.26258 16.1267 5.69938 16.1267C6.26273 16.1267 6.77813 15.9869 7.77125 14.6133C8.56695 13.5123 9.50453 11.9669 10.1353 10.998L11.2037 9.35664C11.9458 8.21672 12.8047 6.94953 13.7896 6.09055C14.5934 5.38945 15.4608 5 16.3336 5C17.7991 5 19.1949 5.84922 20.2633 7.44195C21.4324 9.18625 22 11.3834 22 13.6507C22 14.9986 21.7344 15.989 21.2823 16.7715C20.8455 17.5282 19.9941 18.2842 18.5621 18.2842V16.1267C19.7883 16.1267 20.0943 15 20.0943 13.7105C20.0943 11.873 19.6659 9.83375 18.7221 8.37672C18.0523 7.34313 17.1843 6.71164 16.2294 6.71164C15.1966 6.71164 14.3654 7.49055 13.4313 8.87961C12.9348 9.6175 12.4249 10.5168 11.8526 11.5315L11.2224 12.6478C9.95656 14.8922 9.63594 15.4034 9.00305 16.247C7.89367 17.7244 6.94648 18.2842 5.69938 18.2842C4.22008 18.2842 3.28453 17.6436 2.70523 16.6783C2.23227 15.8916 2 14.8595 2 13.6834L4.16023 13.7606Z" fill="#0081FB"/><path d="M3.70312 7.59422C4.69359 6.06766 6.12281 5 7.76211 5C8.71156 5 9.65531 5.28102 10.6409 6.0857C11.7188 6.96547 12.8678 8.41422 14.3013 10.802L14.8153 11.6588C16.056 13.7259 16.762 14.7892 17.1751 15.2908C17.7065 15.9348 18.0786 16.1267 18.562 16.1267C19.7881 16.1267 20.0941 15 20.0941 13.7105L21.9998 13.6507C21.9998 14.9986 21.7342 15.989 21.2821 16.7715C20.8453 17.5282 19.994 18.2842 18.562 18.2842C17.6717 18.2842 16.883 18.0909 16.0109 17.268C15.3404 16.6366 14.5566 15.5147 13.9535 14.5062L12.1598 11.5099C11.2598 10.0063 10.4342 8.88516 9.95648 8.37734C9.44258 7.83141 8.7818 7.17203 7.72742 7.17203C6.87406 7.17203 6.1493 7.77094 5.54281 8.68688L3.70312 7.59422Z" fill="url(#paint0_linear_4767_139)"/><path d="M7.7275 7.17203C6.87414 7.17203 6.14937 7.77094 5.54289 8.68688C4.68539 9.98125 4.16023 11.9091 4.16023 13.7606C4.16023 14.5243 4.32789 15.1106 4.54695 15.4653L2.70523 16.6783C2.23227 15.8916 2 14.8595 2 13.6834C2 11.5447 2.58703 9.31563 3.70328 7.59422C4.69375 6.06766 6.12297 5 7.76227 5L7.7275 7.17203Z" fill="url(#paint1_linear_4767_139)"/></g><defs><linearGradient id="paint0_linear_4767_139" x1="257.625" y1="748.039" x2="1633.09" y2="817.509" gradientUnits="userSpaceOnUse"><stop stop-color="#0064E1"/><stop offset="0.4" stop-color="#0064E1"/><stop offset="0.83" stop-color="#0073EE"/><stop offset="1" stop-color="#0082FB"/></linearGradient><linearGradient id="paint1_linear_4767_139" x1="314.977" y1="971.751" x2="314.977" y2="464.038" gradientUnits="userSpaceOnUse"><stop stop-color="#0082FB"/><stop offset="1" stop-color="#0064E0"/></linearGradient><clipPath id="clip0_4767_139"><rect width="20" height="13.3594" fill="white" transform="translate(2 5)"/></clipPath></defs></svg>
          </span>
          <span class="platform-name">Meta Ads</span>
        </div>
        <div class="platform-card">
          <span class="platform-icon platform-icon--tiktok" aria-hidden="true">
            <svg fill="#ffffff" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
          </span>
          <span class="platform-name">TikTok Ads</span>
        </div>
        <div class="platform-card">
          <span class="platform-icon platform-icon--applovin" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><path fill="#fff" fill-rule="evenodd" clip-rule="evenodd" d="M23.9858 3.14392C20.9544 3.14392 18.4969 5.60137 18.4969 8.63279C18.4969 9.84493 18.8899 10.9653 19.5553 11.8735L19.4945 11.981L7.53539 33.5074C6.90296 33.2531 6.21226 33.1132 5.48887 33.1132C2.45745 33.1132 0 35.5706 0 38.602C0 41.6335 2.45745 44.0909 5.48887 44.0909C8.52029 44.0909 10.9777 41.6335 10.9777 38.602C10.9777 37.3266 10.5427 36.1528 9.81295 35.2208C14.5096 34.1184 19.3262 33.6069 24.1509 33.6986C28.8699 33.6513 33.5772 34.1687 38.1725 35.2395C37.4515 36.1684 37.0223 37.3351 37.0223 38.602C37.0223 41.6335 39.4797 44.0909 42.5112 44.0909C45.5426 44.0909 48 41.6335 48 38.602C48 35.5706 45.5426 33.1132 42.5112 33.1132C41.7593 33.1132 41.0427 33.2643 40.3901 33.538L28.4139 11.9627L28.3864 11.914C29.07 10.9987 29.4747 9.86301 29.4747 8.63279C29.4747 7.17705 28.8964 5.78094 27.867 4.75157C26.8377 3.72221 25.4416 3.14392 23.9858 3.14392ZM26.5954 13.4628C25.8193 13.8831 24.9304 14.1217 23.9858 14.1217C23.0247 14.1217 22.1213 13.8746 21.3356 13.4406L21.3333 13.4447L10.6483 32.6557C15.0882 31.7325 19.6166 31.3029 24.1509 31.375C28.5569 31.3413 32.9542 31.7736 37.2693 32.6649L26.5954 13.4628ZM27.2243 8.63279C27.2243 9.94262 26.4352 11.1235 25.2251 11.6247C24.015 12.126 22.6221 11.8489 21.6959 10.9227C20.7697 9.99653 20.4926 8.60362 20.9939 7.3935C21.4951 6.18338 22.676 5.39436 23.9858 5.39436C25.7723 5.39938 27.2192 6.84634 27.2243 8.63279ZM5.47674 41.8222C7.26288 41.8289 8.71721 40.3882 8.72731 38.602L8.70901 38.5837C8.70904 36.8023 7.27026 35.3554 5.48887 35.3453C3.70272 35.3453 2.25384 36.7915 2.25049 38.5777C2.24715 40.3638 3.69061 41.8154 5.47674 41.8222ZM43.7392 41.5948C44.9504 41.0941 45.7404 39.9127 45.7404 38.602V38.5837C45.7354 36.8038 44.2911 35.3636 42.5112 35.3636C41.2005 35.3599 40.0168 36.1466 39.5127 37.3564C39.0086 38.5662 39.2834 39.9606 40.2088 40.8887C41.1343 41.8168 42.5279 42.0955 43.7392 41.5948Z"/></svg>
          </span>
          <span class="platform-name">AppLovin</span>
        </div>
      </div>
    </div>

    <div id="presignup-agent-results" class="presignup-agent-results" aria-live="polite"></div>

  </div>
</section>

```
