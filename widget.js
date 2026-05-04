(function () {
  console.log("🤖 Chatbot Widget v2 Loaded");

  const SUPABASE_URL = "https://nwldvgafmyaagmyezena.supabase.co";
  const SUPABASE_KEY = "sb_publishable_gWMY1sQRn3fqip0JfAQPRQ_F79rlYyZ";

  // =========================
  // SITE KEY (NOT customer_id)
  // =========================
  function getSiteKey() {
    const script =
      document.currentScript ||
      document.querySelector("script[data-site-key]");

    return script?.getAttribute("data-site-key") || null;
  }

  const SITE_KEY = getSiteKey();

  if (!SITE_KEY) {
    console.error("❌ Missing site-key");
    return;
  }

  // =========================
  // CUSTOMER ID (FIXED v2)
  // =========================
  function getCustomerId() {
    let id = localStorage.getItem("cw_customer_id");

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("cw_customer_id", id);
    }

    return id;
  }

  const CUSTOMER_ID = getCustomerId();

  // =========================
  // LOAD SUPABASE
  // =========================
  async function loadSupabase() {
    if (window.supabase) return;

    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://unpkg.com/@supabase/supabase-js@2";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function init() {
    await loadSupabase();

    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // =========================
    // UI (UNCHANGED)
    // =========================
    const style = document.createElement("style");
    style.innerHTML = `/* (keep your existing styles unchanged) */`;
    document.head.appendChild(style);

    const icon = document.createElement("div");
    icon.id = "cw-icon";
    icon.innerText = "🤖";

    const box = document.createElement("div");
    box.id = "cw-box";

    box.innerHTML = `
      <div id="cw-header">Assistant</div>
      <div id="cw-messages"></div>
      <div id="cw-input">
        <div id="cw-suggestions"></div>
        <input type="text" placeholder="Ask something..." />
        <button>Send</button>
      </div>
    `;

    document.body.appendChild(icon);
    document.body.appendChild(box);

    icon.onclick = () => {
      box.style.display = box.style.display === "flex" ? "none" : "flex";
    };

    const input = box.querySelector("input");
    const button = box.querySelector("button");
    const messages = box.querySelector("#cw-messages");

    function addMessage(text, type) {
      const div = document.createElement("div");
      div.className = `cw-msg ${type}`;
      div.innerText = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    // =========================
    // 🔥 V2 API CALL (IMPORTANT FIX)
    // =========================
    async function sendMessage() {
      const question = input.value.trim();
      if (!question) return;

      addMessage(question, "cw-user");
      input.value = "";

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/chat-handler`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({
            site_key: SITE_KEY,
            customer_id: CUSTOMER_ID,
            message: question
          })
        }
      );

      const data = await res.json();

      addMessage(data.reply || "No response", "cw-bot");
    }

    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });

    button.onclick = sendMessage;

    // =========================
    // LOAD THEME (SAFE)
    // =========================
    const { data } = await sb
      .from("chatbot_signups")
      .select("theme_color")
      .eq("site_key", SITE_KEY)
      .single();

    if (data?.theme_color) {
      icon.style.background = data.theme_color;
      box.querySelector("#cw-header").style.background = data.theme_color;
      button.style.background = data.theme_color;
    }
  }

  init();
})();
