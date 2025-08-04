document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("user-input");
  const chatLog = document.getElementById("chat-box");
  const scrollBtn = document.getElementById("scroll-btn");

  let conversation = [];

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    addMessage("user", message);
    conversation.push({ role: "user", content: message });
    input.value = "";
    input.focus();

    const botElement = addMessage("bot", "Valoran piše");
    botElement.classList.add("typing");

    try {
      const response = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation })
      });

      if (!response.ok || !response.body) {
        botElement.textContent = "Napaka pri povezavi z AI.";
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let botMsg = "";
      botElement.classList.remove("typing");
      botElement.textContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        botMsg += chunk;
        botElement.textContent = botMsg;
        chatLog.scrollTop = chatLog.scrollHeight;
      }

      conversation.push({ role: "assistant", content: botMsg });
    } catch (err) {
      botElement.textContent = "Prišlo je do napake. Poskusi znova.";
      console.error(err);
    }
  });

  // Shift+Enter = nova vrstica / Enter = pošlji
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.dispatchEvent(new Event("submit"));
    }
  });

  // Scroll gumb
  window.addEventListener("scroll", () => {
    scrollBtn.style.display = window.scrollY > 100 ? "block" : "none";
  });

  scrollBtn.addEventListener("click", () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  });

  function addMessage(role, text) {
    const div = document.createElement("div");
    // Samo sprememba class-ov za CSS podporo mehurčkov
    const roleClass = role === "user" ? "user-msg" : "bot-msg";
    div.className = `${roleClass} fade-in`;
    div.textContent = text;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
    return div;
  }
});






