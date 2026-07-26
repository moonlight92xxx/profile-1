/* ============================================================
   SYX // "no peeking" layer — casual-snooping deterrent ONLY.

   Read this before you assume this "protects" the site:
   Nothing that runs in a browser can ever be made un-inspectable.
   To show this page at all, the browser must receive the full
   HTML/CSS/JS — DevTools, View Source, and "Save Page As" are
   BROWSER features the user controls, not something a website can
   truly switch off. Anyone who really wants the code can always:
     - open DevTools from the browser's own ⋮ menu (not a shortcut),
     - or type view-source: in the address bar,
     - or just disable JavaScript for this page.
   None of that can be blocked from here, by this file or any other.

   What this file actually does: removes the most casual shortcuts
   (right-click "Inspect", F12, Ctrl+Shift+I/J/C, Ctrl+U) and makes
   dragging/selecting things a little less convenient. It's a speed
   bump for the casually curious, not a lock. The one thing that
   actually matters — the Groq key — was never in reach of any of
   this anyway; it lives only on the Cloudflare Worker.

   On purpose, this does NOT try to detect "DevTools is open" and
   block/redirect the page. That trick is unreliable (constant false
   positives on split screens, zoomed displays, mobile, accessibility
   tools), trivially defeated, and — worth remembering — would also
   lock YOU out of ever debugging your own site again.
   ============================================================ */
(function(){
  const isFormField = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

  // right-click context menu off, except inside actual input fields
  // (so pasting your Groq key or right-click-paste in chat still works)
  document.addEventListener('contextmenu', (e) => {
    if(!isFormField(e.target)) e.preventDefault();
  });

  // common "open devtools / view source" keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    const blockCombo =
      k === 'f12' ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) ||
      ((e.ctrlKey || e.metaKey) && k === 'u');
    if(blockCombo) e.preventDefault();
  });

  // dragging images/svg out of the page
  document.addEventListener('dragstart', (e) => {
    if(e.target && (e.target.tagName === 'IMG' || e.target.tagName === 'SVG')) e.preventDefault();
  });

  // text selection off site-wide, EXCEPT inside form fields — you can
  // still type/select/paste in the chat box and the Groq-key field
  const style = document.createElement('style');
  style.textContent = `
    body{ -webkit-user-select:none; user-select:none; }
    input, textarea{ -webkit-user-select:text; user-select:text; }
  `;
  document.head.appendChild(style);

  console.log('%cStop.', 'color:#9c1218; font-size:32px; font-weight:bold;');
  console.log('%cThis is just a browser feature, not a hack — nothing sensitive lives in this code. The one key that matters was never sent here.', 'color:#D4AF37; font-size:13px;');
})();
