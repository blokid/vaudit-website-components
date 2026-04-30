# product-cards.html

> Source from `vaudit-website-pages/webflow/product-cards.html`. Pasted into Webflow Custom Code or Embed elements — **not consumed by the Vite build**. Kept here as a reference snapshot of the legacy workflow.

```html
<!-- Standalone product-card grid. Paste into any Webflow embed that needs
     the Vaudit product cards. Requires webflow/product-card.css loaded on
     the page (per-page embed or site-wide).

     Per-page filtering: set `data-show` on the grid to a space-separated
     list of product keys. Cards not listed are removed at load time.
       data-show="kloud token seat"   → only those 3 render
       data-show=""   or no attribute → all 6 render
     Valid keys: ship kloud seat token ad pay

     Safe to drop on any page — the filter script is scoped to
     `.product-card-grid` nodes and will not touch the presignup agent. -->

<div class="product-card-grid" data-show="">

  <a class="pa-card preview" data-key="ship" href="/ship-id">
    <div class="card-preview-viz">
      <div class="viz viz-ship">
        <div class="ship-path" aria-hidden="true"></div>
        <div class="ship-box" aria-hidden="true"></div>
        <div class="ship-credit" aria-hidden="true">+$</div>
      </div>
    </div>
    <div class="preview-head">
      <div class="preview-title">
        <span class="emoji"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H2v14h2"/><path d="M14 9h4l4 4v5h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg></span>Ship ID
      </div>
      <div class="preview-logos">
        <img class="p-logo" src="https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9a37f220d58951c852a_fedex.svg" alt="FedEx" loading="lazy">
        <img class="p-logo" src="https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9a3e807d12509c3513b_ups.svg" alt="UPS" loading="lazy">
        <img class="p-logo" src="https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9a3d59d49c6bf3d32dd_dhl.svg" alt="DHL" loading="lazy">
        <img class="p-logo" src="https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9a350def4cbca4a92eb_usps.svg" alt="USPS" loading="lazy">
      </div>
    </div>
    <p class="preview-desc">Verifies shipping charges against carrier terms to identify overcharges and missed refunds.</p>
  </a>

  <a class="pa-card preview" data-key="kloud" href="/kloud-id">
    <div class="card-preview-viz">
      <div class="viz viz-kloud">
        <div class="k-ceiling" aria-hidden="true"></div>
        <div class="k-bars" aria-hidden="true">
          <span class="kb"></span><span class="kb"></span><span class="kb"></span>
          <span class="kb"></span><span class="kb"></span><span class="kb"></span>
          <span class="kb"></span>
        </div>
      </div>
    </div>
    <div class="preview-head">
      <div class="preview-title">
        <span class="emoji"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg></span>Kloud ID
      </div>
      <div class="preview-logos">
        <img class="p-logo" src="https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a986401a04fdfb516c2f_aws.svg" alt="AWS" loading="lazy">
        <img class="p-logo" src="https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a98614c119b6d0b24519_gcp.svg" alt="Google Cloud" loading="lazy">
      </div>
    </div>
    <p class="preview-desc">Verifies cloud usage against billing to identify overcharges and unused spend.</p>
  </a>

  <a class="pa-card preview" data-key="seat" href="/seat-id">
    <div class="card-preview-viz">
      <div class="viz viz-seat">
        <div class="seat-grid" aria-hidden="true">
          <span class="ss"></span><span class="ss"></span><span class="ss ss-empty"></span>
          <span class="ss"></span><span class="ss"></span>
          <span class="ss"></span><span class="ss ss-empty"></span><span class="ss"></span>
          <span class="ss"></span><span class="ss"></span>
        </div>
        <div class="seat-scan" aria-hidden="true"></div>
      </div>
    </div>
    <div class="preview-head">
      <div class="preview-title">
        <span class="emoji"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20"/><circle cx="6" cy="6.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="6.5" r=".5" fill="currentColor"/></svg></span>Seat ID
      </div>
      <div class="preview-logos">
        <img class="p-logo" src="https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8aa1be867fd9d7a66f538_salesforce.svg" alt="Salesforce" loading="lazy">
        <img class="p-logo" src="https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a997ae02448a9e62d5c0_google-workspace.svg" alt="Google Workspace" loading="lazy">
      </div>
    </div>
    <p class="preview-desc">Verifies SaaS usage against billing to identify unused licenses and overcharges.</p>
  </a>

  <a class="pa-card preview" data-key="token" href="/token-id">
    <div class="card-preview-viz">
      <div class="viz viz-token">
        <div class="token-chip" aria-hidden="true">
          <span class="token-node"></span><span class="token-node"></span>
          <span class="token-node"></span><span class="token-node"></span>
        </div>
        <span class="t-flow tf1" aria-hidden="true"></span>
        <span class="t-flow tf2" aria-hidden="true"></span>
        <span class="t-flow tf3" aria-hidden="true"></span>
      </div>
    </div>
    <div class="preview-head">
      <div class="preview-title">
        <span class="emoji"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg></span>Token ID
      </div>
      <div class="preview-logos">
        <img class="p-logo" src="https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9ac553a539363414ad2_openai.svg" alt="OpenAI" loading="lazy">
        <img class="p-logo" src="https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9ac046b54c24d008aed_anthropic.svg" alt="Anthropic" loading="lazy">
        <img class="p-logo" src="https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8abaccd7cfdce2d3ae140_gemini-color.svg" alt="Gemini" loading="lazy">
      </div>
    </div>
    <p class="preview-desc">Verifies AI usage against billing to identify overcharges and inefficient spend.</p>
  </a>

  <a class="pa-card preview" data-key="ad" href="/ad-id">
    <div class="card-preview-viz">
      <div class="viz viz-ad">
        <div class="ad-target" aria-hidden="true"></div>
        <div class="ad-ring" aria-hidden="true"></div>
        <div class="ad-ring r2" aria-hidden="true"></div>
        <span class="ad-click ac1" aria-hidden="true">&times;</span>
        <span class="ad-click ac2" aria-hidden="true">&times;</span>
        <span class="ad-click ac3" aria-hidden="true">&times;</span>
      </div>
    </div>
    <div class="preview-head">
      <div class="preview-title">
        <span class="emoji"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4.1 12 6"/><path d="m5.1 8-2.9-.8"/><path d="m6 12-1.9 2"/><path d="M7.2 2.2 8 5.1"/><path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"/></svg></span>Ad ID
      </div>
      <div class="preview-logos">
        <img class="p-logo" src="https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a965ab121368400dc44f_google-ads.svg" alt="Google Ads" loading="lazy">
        <img class="p-logo" src="https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a965d6f564a86b177302_meta-ads.svg" alt="Meta Ads" loading="lazy">
        <img class="p-logo" src="https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a965a560d2adf0a6e474_tiktok-ads.svg" alt="TikTok Ads" loading="lazy">
        <img class="p-logo" src="https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9651ab5a69f0c7e99c1_applovin-ads.svg" alt="AppLovin" loading="lazy">
      </div>
    </div>
    <p class="preview-desc">Verifies ad traffic against billing to identify invalid charges and discrepancies.</p>
  </a>

  <a class="pa-card preview" data-key="pay" href="/paymentid">
    <div class="card-preview-viz">
      <div class="viz viz-pay">
        <div class="pay-rows" aria-hidden="true">
          <div class="pr"></div><div class="pr pr-flag"></div>
          <div class="pr"></div><div class="pr"></div>
        </div>
        <div class="pay-scan" aria-hidden="true"></div>
      </div>
    </div>
    <div class="preview-head">
      <div class="preview-title">
        <span class="emoji"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg></span>Payment ID
      </div>
      <div class="preview-logos">
        <img class="p-logo" src="https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a98d555377a44d02f6f1_stripe.svg" alt="Stripe" loading="lazy">
        <img class="p-logo" src="https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a98df379ab43b9e1f8fc_adyen.svg" alt="Adyen" loading="lazy">
        <img class="p-logo" src="https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a98de0d6b803860417b8_shopify.svg" alt="Shopify" loading="lazy">
      </div>
    </div>
    <p class="preview-desc">Verifies payment fees against contracted rates to identify overcharges and hidden markups.</p>
  </a>

</div>

<script>
  (function () {
    document.querySelectorAll('.product-card-grid[data-show]').forEach(function (grid) {
      var raw = grid.getAttribute('data-show').trim();
      if (!raw) return;
      var allowed = new Set(raw.split(/\s+/));
      grid.querySelectorAll('.pa-card[data-key]').forEach(function (card) {
        if (!allowed.has(card.dataset.key)) card.remove();
      });
    });
  })();
</script>

```
