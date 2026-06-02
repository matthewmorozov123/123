(function () {
  if (window.BrightscaleChatWidget) return;

  var script = document.currentScript;
  var apiBase =
    (script && script.getAttribute("data-api-base")) ||
    "https://brightscale-ai-chat-widget.vercel.app";
  var ctaUrl =
    (script && script.getAttribute("data-cta-url")) ||
    "https://brightscale.us/contact";
  var storageKey = "brightscale_chat_session";
  var sessionId = getSessionId();

  var messages = [
    {
      role: "assistant",
      content:
        "Hi, I am Brightscale AI. Tell me what you want to improve and I can point you toward the right automation solution."
    }
  ];

  var styles = document.createElement("style");
  styles.textContent = [
    "#bs-chat-root{position:fixed;right:22px;bottom:22px;z-index:2147483000;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#10131a}",
    "#bs-chat-root *{box-sizing:border-box}",
    ".bs-bubble{width:64px;height:64px;border:0;border-radius:22px;background:linear-gradient(135deg,#121826,#6d5dfc);color:white;box-shadow:0 22px 60px rgba(20,24,36,.32);cursor:pointer;display:grid;place-items:center;transition:transform .18s ease,box-shadow .18s ease}",
    ".bs-bubble:hover{transform:translateY(-2px);box-shadow:0 26px 70px rgba(20,24,36,.4)}",
    ".bs-panel{position:absolute;right:0;bottom:78px;width:min(390px,calc(100vw - 28px));height:min(650px,calc(100vh - 110px));background:rgba(255,255,255,.96);border:1px solid rgba(18,24,38,.1);border-radius:24px;box-shadow:0 32px 90px rgba(10,14,25,.28);overflow:hidden;display:none;backdrop-filter:blur(18px)}",
    ".bs-panel.bs-open{display:flex;flex-direction:column;animation:bs-pop .18s ease}",
    "@keyframes bs-pop{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}",
    ".bs-head{padding:18px 18px 16px;background:linear-gradient(135deg,#10131a,#1f2a44 55%,#6d5dfc);color:white}",
    ".bs-brand{display:flex;align-items:center;gap:12px}",
    ".bs-mark{width:38px;height:38px;border-radius:14px;background:rgba(255,255,255,.14);display:grid;place-items:center;font-weight:800}",
    ".bs-title{font-weight:750;font-size:15px;letter-spacing:0}",
    ".bs-sub{font-size:12px;color:rgba(255,255,255,.74);margin-top:2px}",
    ".bs-close{margin-left:auto;border:0;background:rgba(255,255,255,.12);color:white;border-radius:12px;width:34px;height:34px;cursor:pointer}",
    ".bs-body{flex:1;overflow:auto;padding:16px;background:linear-gradient(#f7f8fc,#fff)}",
    ".bs-row{display:flex;margin:0 0 12px}.bs-row.user{justify-content:flex-end}",
    ".bs-msg{max-width:82%;border-radius:18px;padding:11px 13px;font-size:14px;line-height:1.4;box-shadow:0 8px 24px rgba(20,24,36,.07);white-space:pre-wrap}",
    ".bs-row.assistant .bs-msg{background:white;border:1px solid rgba(18,24,38,.08);color:#151923;border-bottom-left-radius:6px}",
    ".bs-row.user .bs-msg{background:#111827;color:white;border-bottom-right-radius:6px}",
    ".bs-time{font-size:10px;opacity:.52;margin-top:5px}",
    ".bs-typing{display:inline-flex;gap:4px;align-items:center}.bs-dot{width:6px;height:6px;border-radius:999px;background:#7b8497;animation:bs-pulse 1s infinite}.bs-dot:nth-child(2){animation-delay:.12s}.bs-dot:nth-child(3){animation-delay:.24s}@keyframes bs-pulse{50%{opacity:.35;transform:translateY(-2px)}}",
    ".bs-lead{margin:0 16px 14px;padding:13px;border:1px solid rgba(109,93,252,.22);border-radius:18px;background:#f7f6ff}",
    ".bs-lead input{width:100%;height:38px;border:1px solid rgba(18,24,38,.12);border-radius:12px;padding:0 11px;margin:6px 0;background:white;font-size:13px}",
    ".bs-lead button,.bs-send{border:0;border-radius:13px;background:#6d5dfc;color:white;font-weight:700;cursor:pointer}",
    ".bs-lead button{height:38px;width:100%;margin-top:6px}",
    ".bs-foot{display:flex;gap:10px;padding:12px;border-top:1px solid rgba(18,24,38,.08);background:white}",
    ".bs-input{flex:1;border:1px solid rgba(18,24,38,.12);border-radius:16px;padding:0 13px;height:44px;font-size:14px;outline:none}",
    ".bs-input:focus{border-color:#6d5dfc;box-shadow:0 0 0 3px rgba(109,93,252,.13)}",
    ".bs-send{width:46px;height:44px}.bs-send:disabled{opacity:.55;cursor:not-allowed}",
    ".bs-link{display:inline-block;margin-top:8px;color:#5b4df2;font-weight:700;text-decoration:none}",
    "@media(max-width:520px){#bs-chat-root{right:0;bottom:0;left:0;top:0;pointer-events:none}.bs-bubble{position:fixed;right:14px;bottom:14px;width:60px;height:60px;pointer-events:auto}.bs-panel{position:fixed;inset:0;width:100vw;height:100dvh;max-height:none;border-radius:0;border:0;box-shadow:none;pointer-events:auto}.bs-panel.bs-open+.bs-bubble{display:none}.bs-head{padding:18px 16px 15px}.bs-body{padding:16px}.bs-foot{padding:12px 14px calc(12px + env(safe-area-inset-bottom))}.bs-input{height:46px}.bs-send{height:46px;width:48px}}",
    "@media(prefers-color-scheme:dark){.bs-panel{background:rgba(18,22,32,.96);border-color:rgba(255,255,255,.1);color:#f7f8fb}.bs-body{background:linear-gradient(#151a26,#10131a)}.bs-row.assistant .bs-msg,.bs-foot{background:#171d2a;color:#f7f8fb;border-color:rgba(255,255,255,.1)}.bs-input{background:#111723;color:white;border-color:rgba(255,255,255,.14)}.bs-lead{background:#17182b;border-color:rgba(109,93,252,.35)}.bs-lead input{background:#10131a;color:white;border-color:rgba(255,255,255,.14)}}"
  ].join("");
  document.head.appendChild(styles);

  var root = document.createElement("div");
  root.id = "bs-chat-root";
  root.innerHTML =
    '<section class="bs-panel" aria-live="polite">' +
    '<div class="bs-head"><div class="bs-brand"><div class="bs-mark">B</div><div><div class="bs-title">Brightscale AI</div><div class="bs-sub">AI automation guidance for SMBs</div></div><button class="bs-close" aria-label="Close chat">x</button></div></div>' +
    '<div class="bs-body"></div>' +
    '<form class="bs-foot"><input class="bs-input" aria-label="Message Brightscale" placeholder="Ask about AI agents..." autocomplete="off"/><button class="bs-send" aria-label="Send">-></button></form>' +
    "</section>" +
    '<button class="bs-bubble" aria-label="Open Brightscale chat"><svg width="29" height="29" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 7.8C5 5.7 6.7 4 8.8 4h6.4C17.3 4 19 5.7 19 7.8v3.7c0 2.1-1.7 3.8-3.8 3.8h-3.6l-4 3.1c-.7.5-1.6 0-1.6-.8v-2.5C4.8 14.6 4 13.2 4 11.6V7.8Z" fill="currentColor"/></svg></button>';
  document.body.appendChild(root);

  var panel = root.querySelector(".bs-panel");
  var bubble = root.querySelector(".bs-bubble");
  var close = root.querySelector(".bs-close");
  var body = root.querySelector(".bs-body");
  var form = root.querySelector(".bs-foot");
  var input = root.querySelector(".bs-input");
  var send = root.querySelector(".bs-send");

  function time() {
    return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function getSessionId() {
    var generated =
      window.crypto && window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : "bs_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    var uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    try {
      var existing = window.localStorage && window.localStorage.getItem(storageKey);
      var value = existing && uuidPattern.test(existing) ? existing : generated;
      if (window.localStorage) {
        window.localStorage.setItem(storageKey, value);
      }
      return value;
    } catch (error) {
      return generated;
    }
  }

  function render() {
    body.innerHTML = messages
      .map(function (m) {
        return (
          '<div class="bs-row ' +
          m.role +
          '"><div class="bs-msg">' +
          escapeHtml(m.content) +
          '<div class="bs-time">' +
          (m.time || time()) +
          "</div></div></div>"
        );
      })
      .join("");
    body.scrollTop = body.scrollHeight;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showTyping() {
    var row = document.createElement("div");
    row.className = "bs-row assistant";
    row.setAttribute("data-typing", "true");
    row.innerHTML =
      '<div class="bs-msg"><span class="bs-typing"><span class="bs-dot"></span><span class="bs-dot"></span><span class="bs-dot"></span></span></div>';
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
    return row;
  }

  function showLeadForm(lastMessage) {
    if (root.querySelector(".bs-lead")) return;
    var wrap = document.createElement("form");
    wrap.className = "bs-lead";
    wrap.innerHTML =
      '<strong>Book a free consultation with Brightscale.</strong>' +
      '<input name="name" placeholder="Name" required />' +
      '<input name="email" type="email" placeholder="Email" required />' +
      '<input name="businessType" placeholder="Business type" required />' +
      '<input name="phone" placeholder="Phone (optional)" />' +
      '<button>Send to Brightscale</button>';
    panel.insertBefore(wrap, form);
    wrap.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(wrap);
      fetch(apiBase + "/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId,
          name: data.get("name"),
          email: data.get("email"),
          businessType: data.get("businessType"),
          phone: data.get("phone") || undefined,
          source: "brightscale_website_widget",
          lastMessage: lastMessage
        })
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Lead failed");
          wrap.innerHTML =
            '<strong>Thanks.</strong><div style="font-size:13px;margin-top:6px;color:#596174">Brightscale received your details and can follow up soon.</div><a class="bs-link" href="' +
            ctaUrl +
            '">Book a free consultation with Brightscale</a>';
        })
        .catch(function () {
          wrap.insertAdjacentHTML(
            "beforeend",
            '<div style="font-size:12px;color:#b42318;margin-top:8px">Could not send that yet. Please contact Brightscale directly.</div>'
          );
        });
    });
  }

  async function ask(content) {
    if (!content.trim()) return;
    messages.push({ role: "user", content: content.trim(), time: time() });
    render();
    input.value = "";
    send.disabled = true;
    var typing = showTyping();
    var assistant = "";

    try {
      var res = await fetch(apiBase + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId, messages: messages })
      });
      if (!res.ok || !res.body) throw new Error("Chat failed");

      typing.remove();
      messages.push({ role: "assistant", content: "", time: time() });
      render();

      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buffer = "";
      var doneMeta = null;

      while (true) {
        var part = await reader.read();
        if (part.done) break;
        buffer += decoder.decode(part.value, { stream: true });
        var events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || "";
        events.forEach(function (eventText) {
          var lines = eventText.split(/\r?\n/);
          var eventName = "";
          var dataLine = "";
          lines.forEach(function (line) {
            line = line.trim();
            if (line.indexOf("event: ") === 0) eventName = line.slice(7).trim();
            if (line.indexOf("data: ") === 0) dataLine = line.slice(6).trim();
          });
          if (!dataLine) return;
          var data = JSON.parse(dataLine);
          if (eventName === "token") {
            assistant += data.token || "";
            messages[messages.length - 1].content = assistant;
            render();
          }
          if (eventName === "done") doneMeta = data;
        });
      }

      if (!assistant && doneMeta && doneMeta.answer) {
        assistant = doneMeta.answer;
        messages[messages.length - 1].content = assistant;
        render();
      }

      if (doneMeta && doneMeta.leadCapture) showLeadForm(assistant);
    } catch (error) {
      typing.remove();
      messages.push({
        role: "assistant",
        content:
          "I am not fully sure about that yet. Please contact Brightscale directly.",
        time: time()
      });
      render();
    } finally {
      send.disabled = false;
      input.focus();
    }
  }

  bubble.addEventListener("click", function () {
    panel.classList.add("bs-open");
    render();
    setTimeout(function () {
      input.focus();
    }, 50);
  });
  close.addEventListener("click", function () {
    panel.classList.remove("bs-open");
  });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    ask(input.value);
  });
  window.BrightscaleChatWidget = { open: function () { panel.classList.add("bs-open"); } };
})();
