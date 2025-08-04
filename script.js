document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("user-input");
  const chatLog = document.getElementById("chat-box");
  const scrollBtn = document.getElementById("scroll-btn");
  const newChatBtn = document.getElementById("new-chat-btn");
  const conversationList = document.getElementById("conversation-list");

  let conversation = [];
  let currentId = null;
  let firstMessage = "";

  // NALOŽI SHRANJENE POGOVORE
  function loadConversations() {
    conversationList.innerHTML = "";
    const all = JSON.parse(localStorage.getItem("valoransave") || "{}");
    Object.entries(all).forEach(([id, data]) => {
      const li = document.createElement("li");
      li.textContent = data.title || "Pogovor";
      li.addEventListener("click", () => {
        loadConversation(id, data.messages);
      });
      conversationList.appendChild(li);
    });
  }

  // SHRANI AKTUALNI POGOVOR
  function saveConversation() {
    if (!firstMessage.trim()) return;
    const all = JSON.parse(localStorage.getItem("valoransave") || "{}");
    all[currentId] = {
      title: firstMessage.length > 50 ? firstMessage.slice(0, 50) + "..." : firstMessage,
      messages: conversation
    };
    localStorage.setItem("valoransave", JSON.stringify(all));
    loadConversations();
  }

  // NALOŽI STARI POGOVOR
  function loadConversation(id, messages) {
    currentId = id;
    conversation = [...messages];
    chatLog.innerHTML = "";
    messages.forEach((msg) => {
      addMessage(msg.role === "user" ? "user" : "bot", msg.content);
    });
  }

  // ZAČNI NOV POGOVOR
  newChatBtn.addEventListener("click", () => {
    conversation = [];
    currentId = crypto.randomUUID();
    chatLog.innerHTML = "";
    firstMessage = "";
  });

  // POŠLJI VPRAŠANJE
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    if (!currentId) currentId = crypto.randomUUID();
    if (!firstMessage) firstMessage = message;

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
      saveConversation();

    } catch (err) {
      botElement.textContent = "Prišlo je do napake. Poskusi znova.";
      console.error(err);
    }
  });

  // ENTER = POŠLJI, SHIFT+ENTER = NOVA VRSTICA
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.dispatchEvent(new Event("submit"));
    }
  });

  // SCROLL GUMB
  window.addEventListener("scroll", () => {
    scrollBtn.style.display = window.scrollY > 100 ? "block" : "none";
  });

  scrollBtn.addEventListener("click", () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  });

  // DODAJ SPOROČILO V UI
  function addMessage(role, text) {
    const div = document.createElement("div");
    const roleClass = role === "user" ? "user-msg" : "bot-msg";
    div.className = `${roleClass} fade-in`;
    div.textContent = text;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
    return div;
  }

  // OB ZAGONU
  loadConversations();
});



