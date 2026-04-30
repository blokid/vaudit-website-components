# faq-accordion-head.html

> Source from `vaudit-website-pages/faq-accordion-head.html`. Pasted into Webflow Custom Code or Embed elements — **not consumed by the Vite build**. Kept here as a reference snapshot of the legacy workflow.

```html
<style>
  /* FAQ Accordion - Dark Theme Override */
  .accordion-item---brix {
    background: transparent !important;
  }
  .accordion-1---brix {
    background: transparent !important;
  }
  .accordion-arrow-wrap---brix {
    background: transparent !important;
    box-shadow: none !important;
  }
  .accordion-arrow-wrapper---brix {
    color: var(--primary) !important;
    transition: transform 0.3s ease !important;
  }
  .accordion-content---brix {
    overflow: hidden !important;
    max-height: 0 !important;
    transition: max-height 0.3s ease;
  }
  .faq-open > .accordion-content---brix {
    max-height: 2000px !important;
  }
  .faq-open .accordion-arrow-wrapper---brix {
    transform: rotate(0deg) !important;
  }
</style>

```
