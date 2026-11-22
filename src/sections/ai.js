/* ------------------------------------------------------------------
   AI STUDY ASSISTANT — a small, honest simulation. It asks first,
   explains, then checks. Voice is simulated and labelled as such.
   ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

export function initAI({ reduce = false } = {}) {
  const chat = document.querySelector("[data-chat]");
  if (!chat) return;

  const log = chat.querySelector("[data-chat-log]");
  const hint = chat.querySelector("[data-chat-hint]");
  const questionsEl = chat.querySelector("[data-chat-questions]");
  const mic = chat.querySelector("[data-chat-mic]");
  const replay = chat.querySelector("[data-chat-replay]");

  if (!log) return;

  log.setAttribute("aria-live", "off");
  if (hint) hint.setAttribute("aria-live", "polite");

  let token = 0;
  let started = false;
  let recording = false;
  let micTimer = 0;
  let voiceBusy = false;

  const scroll = () => {
    log.scrollTop = log.scrollHeight;
  };

  const addMessage = (kind, text, roleLabel) => {
    const wrap = document.createElement("div");
    wrap.className = `msg msg--${kind}`;
    if (roleLabel) {
      const label = document.createElement("span");
      label.className = "msg__role";
      label.textContent = roleLabel;
      wrap.appendChild(label);
    }
    const p = document.createElement("p");
    p.textContent = text;
    wrap.appendChild(p);
    log.appendChild(wrap);
    scroll();
    return { wrap, p };
  };

  const typeText = async (el, text, myToken) => {
    if (reduce) {
      el.textContent = text;
      scroll();
      return;
    }
    el.textContent = "";
    for (let i = 0; i < text.length; i += 1) {
      if (token !== myToken) return;
      el.textContent = text.slice(0, i + 1);
      if (i % 2 === 0) scroll();
      await sleep(11);
    }
    scroll();
  };

  const aiSay = async (text, myToken, { delay = 520, role = "ATTESTA · ASSISTANT" } = {}) => {
    if (!reduce) await sleep(delay);
    if (token !== myToken) return;
    const { wrap, p } = addMessage("ai", "", role);
    if (!reduce) {
      const dots = document.createElement("span");
      dots.className = "typing";
      dots.innerHTML = "<i></i><i></i><i></i>";
      wrap.appendChild(dots);
      scroll();
      await sleep(620);
      if (token !== myToken) return;
      dots.remove();
    }
    await typeText(p, text, myToken);
    if (hint && token === myToken) hint.textContent = "ANSWER READY";
  };

  const userSay = async (text, myToken) => {
    if (token !== myToken) return;
    const { p } = addMessage("user", "", "YOU");
    await typeText(p, text, myToken);
  };

  const note = (text) => {
    const { p } = addMessage("note", "", "");
    p.textContent = text;
    scroll();
  };

  const askQuestion = () => {
    if (!questionsEl) return;
    questionsEl.innerHTML = "";
    const options = [
      {
        label: "1NF",
        correct: false,
        feedback:
          "Not quite. 1NF is about atomic values — one fact per cell. A partial dependency is exactly what 2NF removes.",
      },
      {
        label: "2NF",
        correct: true,
        feedback:
          "Correct. 2NF removes partial dependencies — a non-key field that depends on only part of a composite key.",
      },
      {
        label: "3NF",
        correct: false,
        feedback:
          "Close. 3NF goes one step further and removes transitive dependencies. Partial dependency is the 2NF problem.",
      },
    ];

    const myToken = token;
    options.forEach((option) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = option.label;
      btn.addEventListener("click", async () => {
        if (token !== myToken) return;
        const active = token;
        questionsEl.innerHTML = "";
        await userSay(option.label, active);
        if (token !== active) return;
        await aiSay(option.feedback, active, { delay: 380 });
        if (token !== active) return;
        note("SOURCE · IS2103_LECTURE06.PDF, SLIDE 14 · REPLAY TO TRY AGAIN");
      });
      questionsEl.appendChild(btn);
    });
  };

  const conversation = async (myToken) => {
    note("READING · LECTURE06.PDF · COURSE MATERIAL");
    await sleep(reduce ? 0 : 350);

    await aiSay(
      "Before I explain — what do you already know about normalisation?",
      myToken,
      { delay: 420 }
    );
    if (token !== myToken) return;

    await userSay("I get 1NF. After that I lose the thread.", myToken);
    if (token !== myToken) return;

    await aiSay(
      "Good. Start with why we split tables at all: one fact, one place. If changing one fact means editing three rows, the table is carrying too much.",
      myToken,
      { delay: 480 }
    );
    if (token !== myToken) return;

    await aiSay(
      "Quick check: a partial dependency breaks which normal form?",
      myToken,
      { delay: 520 }
    );
    if (token !== myToken) return;

    askQuestion();
    if (hint) hint.textContent = "PICK AN ANSWER · OR ASK BY VOICE";
  };

  const reset = () => {
    token += 1;
    window.clearTimeout(micTimer);
    voiceBusy = false;
    recording = false;
    chat.removeAttribute("data-recording");
    mic?.setAttribute("aria-label", "Record a voice question");
    if (questionsEl) questionsEl.innerHTML = "";
    log.innerHTML = "";
    if (hint) hint.textContent = "ASK ABOUT WEEK 06";
  };

  const start = () => {
    if (started) return;
    started = true;
    reset();
    conversation(token);
  };

  /* start as soon as the story carousel opens this slide */
  document.querySelector("#story")?.addEventListener("story:change", (e) => {
    if (e.detail?.index === 1) start();
  });

  replay?.addEventListener("click", () => {
    reset();
    conversation(token);
  });

  /* voice demo */
  const finishVoice = async () => {
    if (!recording) return;
    recording = false;
    chat.removeAttribute("data-recording");
    mic?.setAttribute("aria-label", "Record a voice question");
    if (voiceBusy) return;
    voiceBusy = true;
    const myToken = token;

    if (hint) hint.textContent = "HEARING YOU…";
    await sleep(reduce ? 0 : 500);
    if (token !== myToken) {
      voiceBusy = false;
      return;
    }

    note("VOICE DEMO · SIMULATED TRANSCRIPT");
    await userSay("Can you explain that again, slower?", myToken);
    if (token !== myToken) {
      voiceBusy = false;
      return;
    }
    await aiSay(
      "Of course. One step at a time: every table should describe one thing. Then check that every column depends on the whole key. That’s 2NF.",
      myToken,
      { delay: 380 }
    );
    voiceBusy = false;
    if (token === myToken && hint) hint.textContent = "ASK ABOUT WEEK 06";
  };

  mic?.addEventListener("click", () => {
    if (recording) {
      window.clearTimeout(micTimer);
      finishVoice();
      return;
    }
    recording = true;
    chat.setAttribute("data-recording", "true");
    mic.setAttribute("aria-label", "Stop recording");
    if (hint) hint.textContent = "LISTENING — TAP TO STOP";
    micTimer = window.setTimeout(finishVoice, 2400);
  });

  /* start when the chat is actually looked at */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        start();
        io.disconnect();
      },
      { threshold: 0.3 }
    );
    io.observe(chat);
  } else {
    start();
  }
}
