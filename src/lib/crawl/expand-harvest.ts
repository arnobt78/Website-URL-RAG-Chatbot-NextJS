import type { FirecrawlAction } from "@/lib/crawl/firecrawl-client";

/** Visible DOM id so markdown extractors include harvested text. */
export const RAG_HARVEST_NODE_ID = "rag-crawl-harvest";

/** Max dialog openers to click in one expand/dialog pass. */
export const MAX_DIALOG_OPENERS = 5;

/** Path segments that always get an expand scrape (FAQ-like). */
export const FAQ_LIKE_PATH_RE = /^\/(faq|faqs|help|support)(\/|$)/i;

/** Paths that get a dedicated dialog-heavy harvest (e.g. dialog-modal demos). */
export const DIALOG_PATH_RE = /dialog/i;

/** Settle time after each accordion/dialog click (must be async — sync busy-wait blocks React). */
export const HARVEST_SETTLE_MS = 450;

export function isCrawlExpandHiddenEnabled(): boolean {
  const raw = process.env.CRAWL_EXPAND_HIDDEN?.trim().toLowerCase();
  if (raw === "false" || raw === "0") return false;
  return true;
}

function waitMs(ms: number): FirecrawlAction {
  return { type: "wait", milliseconds: ms };
}

/**
 * Async expand + harvest. Uses await delays so React/Radix can mount panel content.
 * Sync busy-wait blocks the main thread and leaves accordion panels empty.
 */
export const EXPAND_HARVEST_SCRIPT = `(async function(){
  var HARVEST_ID = ${JSON.stringify(RAG_HARVEST_NODE_ID)};
  var SETTLE = ${HARVEST_SETTLE_MS};
  var parts = [];

  function textOf(el) {
    if (!el) return "";
    return (el.innerText || el.textContent || "").replace(/\\s+/g, " ").trim();
  }

  function sleep(ms) {
    return new Promise(function(resolve){ setTimeout(resolve, ms); });
  }

  function isChrome(el) {
    if (!el || !el.getAttribute) return true;
    var popup = (el.getAttribute("aria-haspopup") || "").toLowerCase();
    if (popup === "menu" || popup === "listbox" || popup === "true" || popup === "dialog") return true;
    // Default <button> type is "submit"; only skip real form submits.
    if (el.type === "submit" && el.closest && el.closest("form")) return true;
    var label = ((el.getAttribute("aria-label") || "") + " " + textOf(el)).toLowerCase();
    if (/cookie|consent|language|locale|chat|assistant|sign in|log in|login|download|menu|navigation|open menu|close/.test(label)) return true;
    return false;
  }

  function ensureHarvest() {
    var node = document.getElementById(HARVEST_ID);
    if (!node) {
      node = document.createElement("div");
      node.id = HARVEST_ID;
      node.setAttribute("data-rag-expanded", "true");
      node.style.cssText = "display:block;visibility:visible;opacity:1;position:static;width:100%;max-width:100%;padding:1rem;margin:1rem 0;white-space:pre-wrap;";
      var host = document.querySelector("main, [role='main'], article") || document.body || document.documentElement;
      host.appendChild(node);
    }
    return node;
  }

  function pushQa(question, answer) {
    var q = (question || "").trim();
    var a = (answer || "").trim();
    if (!a || a.length < 12) return;
    if (q && (a === q || (a.indexOf(q) === 0 && a.length < q.length + 12))) return;
    if (q && a.indexOf(q) === 0) a = a.slice(q.length).replace(/^[:\\-–—\\s]+/, "").trim();
    if (!a || a.length < 12) return;
    if (q) parts.push(q + "\\n" + a);
    else parts.push(a);
  }

  document.querySelectorAll("details:not([open]) > summary").forEach(function(s) {
    try { s.click(); } catch (e) {}
  });
  await sleep(SETTLE);
  document.querySelectorAll("details").forEach(function(d) {
    var summary = d.querySelector("summary");
    var clone = d.cloneNode(true);
    var sum2 = clone.querySelector("summary");
    if (sum2) sum2.remove();
    pushQa(textOf(summary), textOf(clone));
  });

  var triggers = Array.from(document.querySelectorAll(
    'h3 button[aria-expanded], button[aria-expanded][data-orientation], [data-radix-collection-item], button[aria-expanded], [role="button"][aria-expanded]'
  )).filter(function(el) {
    return !isChrome(el);
  });

  var seen = new Set();
  triggers = triggers.filter(function(el) {
    if (seen.has(el)) return false;
    seen.add(el);
    return true;
  });

  for (var i = 0; i < triggers.length; i++) {
    var btn = triggers[i];
    try { btn.click(); } catch (e) {}
    await sleep(SETTLE);
    var id = btn.getAttribute && btn.getAttribute("aria-controls");
    var panel = id ? document.getElementById(id) : null;
    if (!panel || textOf(panel).length < 8) {
      var item = btn.closest && btn.closest("[data-orientation], [data-state]");
      panel = item
        ? item.querySelector('[role="region"][data-state="open"], [data-state="open"][role="region"], [data-state="open"]')
        : null;
    }
    if (!panel || textOf(panel).length < 8) {
      panel = document.querySelector('[role="region"][data-state="open"]');
    }
    pushQa(textOf(btn), textOf(panel));
  }

  var moreRe = /^(read more|show more|see more|expand|view more|load more)$/i;
  var moreBtns = Array.from(document.querySelectorAll("button, a, [role='button'], span")).filter(function(el) {
    if (isChrome(el)) return false;
    var label = (el.getAttribute("aria-label") || textOf(el) || "").trim();
    return moreRe.test(label);
  });
  for (var j = 0; j < moreBtns.length; j++) {
    var el = moreBtns[j];
    var label = (el.getAttribute("aria-label") || textOf(el) || "").trim();
    // Prefer a real content host — nearest bare div is often just the button chrome.
    var host =
      el.closest("section, article, main, [role='main'], .w3-example, [class*='example']") ||
      el.parentElement && el.parentElement.parentElement ||
      el.parentElement ||
      document.body;
    var before = textOf(host);
    try { el.click(); } catch (e) {}
    await sleep(SETTLE);
    var after = textOf(host);
    var newLabel = (el.getAttribute("aria-label") || textOf(el) || "").trim();
    if (after.length > before.length + 12) {
      pushQa(label, after);
    } else if (/read less|show less|see less|view less/i.test(newLabel)) {
      // Toggle worked but host text delta was tiny (e.g. wrong host); harvest body/main.
      pushQa(label, textOf(document.querySelector("main, [role='main'], article") || document.body));
    }
  }

  // APG / generic tablists (inactive panels often not in markdown until activated)
  var tabNodes = Array.from(document.querySelectorAll('[role="tab"]')).filter(function(el) {
    return !isChrome(el);
  });
  for (var t = 0; t < tabNodes.length; t++) {
    var tab = tabNodes[t];
    try { tab.click(); } catch (e) {}
    await sleep(SETTLE);
    var tabId = tab.getAttribute && tab.getAttribute("aria-controls");
    var tabPanel = tabId ? document.getElementById(tabId) : null;
    if (!tabPanel || textOf(tabPanel).length < 8) {
      tabPanel = document.querySelector('[role="tabpanel"]:not([hidden]), [role="tabpanel"][aria-hidden="false"]');
    }
    pushQa(textOf(tab), textOf(tabPanel));
  }

  var harvest = ensureHarvest();
  harvest.textContent = parts.filter(Boolean).join("\\n\\n");
  return parts.length;
})()`;

export const DIALOG_HARVEST_SCRIPT = `(async function(){
  var HARVEST_ID = ${JSON.stringify(RAG_HARVEST_NODE_ID)};
  var MAX_DIALOGS = ${MAX_DIALOG_OPENERS};
  var SETTLE = ${HARVEST_SETTLE_MS};
  var parts = [];

  function textOf(el) {
    if (!el) return "";
    return (el.innerText || el.textContent || "").replace(/\\s+/g, " ").trim();
  }

  function sleep(ms) {
    return new Promise(function(resolve){ setTimeout(resolve, ms); });
  }

  function isChrome(el) {
    if (!el || !el.getAttribute) return true;
    var popup = (el.getAttribute("aria-haspopup") || "").toLowerCase();
    if (popup === "menu" || popup === "listbox") return true;
    if (el.type === "submit" && el.closest && el.closest("form")) return true;
    var label = ((el.getAttribute("aria-label") || "") + " " + textOf(el)).toLowerCase();
    if (/cookie|consent|language|locale|chat|assistant|sign in|log in|login|menu|navigation|search|skip to/.test(label)) return true;
    return false;
  }

  function ensureHarvest() {
    var node = document.getElementById(HARVEST_ID);
    if (!node) {
      node = document.createElement("div");
      node.id = HARVEST_ID;
      node.setAttribute("data-rag-expanded", "true");
      node.style.cssText = "display:block;visibility:visible;opacity:1;position:static;width:100%;padding:1rem;margin:1rem 0;white-space:pre-wrap;";
      var host = document.querySelector("main, [role='main'], article") || document.body || document.documentElement;
      host.appendChild(node);
    }
    return node;
  }

  async function closeOpenDialogs() {
    try {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    } catch (e) {}
    await sleep(150);
    var buttons = Array.from(document.querySelectorAll('[role="dialog"] button, dialog button'));
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var t = ((btn.getAttribute("aria-label") || "") + " " + textOf(btn)).toLowerCase();
      if (/close|cancel|dismiss|ok|done/.test(t)) {
        try { btn.click(); } catch (e) {}
      }
    }
    await sleep(150);
  }

  var openers = Array.from(document.querySelectorAll(
    'button[aria-haspopup="dialog"], [role="button"][aria-haspopup="dialog"], button, [role="button"]'
  )).filter(function(el) {
    if (isChrome(el)) return false;
    var popup = (el.getAttribute("aria-haspopup") || "").toLowerCase();
    if (popup === "dialog") return true;
    var t = textOf(el).toLowerCase();
    return /add |edit |delete |open |show |launch |start |delivery|address|subscribe|confirm|alert|modal|dialog/.test(t);
  }).slice(0, MAX_DIALOGS);

  for (var o = 0; o < openers.length; o++) {
    var opener = openers[o];
    await closeOpenDialogs();
    try { opener.click(); } catch (e) {}
    await sleep(SETTLE);
    var dialog = document.querySelector('[role="dialog"]:not([aria-hidden="true"]), dialog[open], [aria-modal="true"]');
    var body = textOf(dialog);
    if (body && body.length > 20) parts.push("Dialog: " + textOf(opener) + "\\n" + body);
    await closeOpenDialogs();
  }

  var harvest = ensureHarvest();
  harvest.textContent = parts.filter(Boolean).join("\\n\\n");
  return parts.length;
})()`;

export function expandHarvestActions(): FirecrawlAction[] {
  return [
    waitMs(1000),
    { type: "executeJavascript", script: EXPAND_HARVEST_SCRIPT },
    waitMs(2500),
  ];
}

export function dialogHarvestActions(): FirecrawlAction[] {
  return [
    waitMs(1000),
    { type: "executeJavascript", script: DIALOG_HARVEST_SCRIPT },
    waitMs(2500),
  ];
}
