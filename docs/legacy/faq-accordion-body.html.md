# faq-accordion-body.html

> Source from `vaudit-website-pages/faq-accordion-body.html`. Pasted into Webflow Custom Code or Embed elements — **not consumed by the Vite build**. Kept here as a reference snapshot of the legacy workflow.

```html
<script>
window.addEventListener('load', function () {
  document.querySelectorAll('.accordion-item---brix').forEach(function (el) {
    // Add neon-card class to item and arrow wrap
    el.classList.add('neon-card');
    var arrowWrap = el.querySelector('.accordion-arrow-wrap---brix');
    if (arrowWrap) arrowWrap.classList.add('neon-card');

    // Strip IX2 bindings and inline styles
    el.querySelectorAll('*').forEach(function (e) {
      e.removeAttribute('data-w-id');
      e.removeAttribute('style');
    });
    el.removeAttribute('data-w-id');
    el.removeAttribute('style');

    // Clone to remove IX2 event listeners
    var clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);

    // Add click handler
    var trigger = clone.querySelector('.accordion-trigger---brix');
    if (trigger) {
      trigger.style.cursor = 'pointer';
      trigger.addEventListener('click', function () {
        clone.classList.toggle('faq-open');
      });
    }
  });
});
</script>

```
