/* ============================================================
   Healthcare AI GYM — interactions & animated diagrams
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const SVGNS = "http://www.w3.org/2000/svg";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- nav scrolled state + scrollspy ---------- */
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const navLinks = $$(".nav__links a");
  const spy = new IntersectionObserver(
    (es) => {
      es.forEach((e) => {
        if (e.isIntersecting) {
          const id = e.target.id;
          navLinks.forEach((a) =>
            a.classList.toggle("active", a.getAttribute("href") === "#" + id)
          );
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$("main section[id]").forEach((s) => spy.observe(s));

  /* ---------- reveal on scroll ---------- */
  const revealEls = $$(
    ".h2, .section-intro, .lead, .card, .fail, .finding, .env__block, .diagram, .tablewrap, .resultfig, .bibtex, .taxo, .pswstat, .analysis__lead"
  );
  revealEls.forEach((el) => el.classList.add("reveal"));
  const revObs = new IntersectionObserver(
    (es, o) => {
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          o.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => revObs.observe(el));

  /* ---------- generators: domains, reward bars ---------- */
  const DOMAINS = [
    ["🩺", "Clinical Diagnosis", "differential dx, lab/imaging ordering"],
    ["💊", "Drug Interaction", "multi-drug safety & contraindications"],
    ["📋", "EHR Management", "structured EHR reasoning & prediction"],
    ["❓", "Medical QA", "evidence-based question answering"],
    ["🚨", "Triage", "emergency severity & resource allocation"],
    ["🧠", "Psychiatry", "validated mental-health screening"],
    ["🤰", "Obstetrics / Gynecology", "prenatal care & labor management"],
    ["🔬", "Visual Diagnosis", "pathology, radiology, dermatology"],
    ["🩻", "Radiology Report", "structured report generation"],
    ["🔀", "Cross-Domain Pathways", "multi-specialty diagnostic chains"],
  ];
  const SHORT = ["Diagnosis", "Drug Int.", "EHR", "Med QA", "Triage", "Psychiatry", "OB/GYN", "Visual Dx", "Radiology", "Cross-Dom"];

  // domain list (environment section)
  const dl = $("#domainList");
  if (dl)
    dl.innerHTML = DOMAINS.map(
      (d) =>
        `<li><span class="emoji">${d[0]}</span><div class="dtext"><b>${d[1]}</b><span>${d[2]}</span></div></li>`
    ).join("");

  // domain grid inside the GYM SVG node
  const dg = $("#domainGrid");
  if (dg) {
    let g = "";
    SHORT.forEach((label, i) => {
      const col = i % 2,
        row = (i / 2) | 0;
      const x = 366 + col * 116,
        y = 196 + row * 35.5;
      g += `<rect x="${x}" y="${y}" width="106" height="27" rx="7"/>`;
      g += `<text x="${x + 53}" y="${y + 14}">${label}</text>`;
    });
    dg.innerHTML = g;
  }

  // 5D reward bars
  const REWARD = [
    ["Accuracy", 0.25],
    ["Process", 0.2],
    ["Safety", 0.2],
    ["Format", 0.1],
    ["Coherence", 0.1],
  ];
  const rb = $("#rewardBars");
  if (rb) {
    rb.innerHTML = REWARD.map(
      (r) =>
        `<li><span>${r[0]}</span><span class="bar"><i data-w="${(r[1] / 0.25) * 100}"></i></span><span class="w">${r[1].toFixed(2)}</span></li>`
    ).join("");
    const rbObs = new IntersectionObserver(
      (es, o) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            $$("i", rb).forEach((i) => (i.style.width = i.dataset.w + "%"));
            o.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    rbObs.observe(rb);
  }

  /* ---------- count-up (analysis stats) ---------- */
  function countUp(el, to, dur, suffix) {
    if (reduce) {
      el.textContent = to + (suffix || "");
      return;
    }
    const start = performance.now();
    const from = parseFloat(el.dataset.from || "0");
    function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      const v = from + (to - from) * e;
      el.textContent = (Number.isInteger(to) ? Math.round(v) : v.toFixed(1)) + (suffix || "");
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  $$(".countup").forEach((el) => {
    const o = new IntersectionObserver(
      (es, ob) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            countUp(el, parseFloat(el.dataset.to), 1100, el.dataset.suffix || "");
            ob.disconnect();
          }
        });
      },
      { threshold: 0.6 }
    );
    o.observe(el);
  });

  /* ============================================================
     Animated step diagram engine
     ============================================================ */
  class StepDiagram {
    constructor(opts) {
      this.scene = $(opts.scene);
      this.steps = opts.steps;
      this.ui = opts.ui;
      this.dur = opts.dur || 3000; // autoplay ms per step
      this.i = 0;
      this.playing = false;
      this.timer = null;
      this.raf = null;
      this.progRaf = null;
      // particle layer on top
      this.pLayer = document.createElementNS(SVGNS, "g");
      this.pLayer.setAttribute("class", "particles");
      this.scene.appendChild(this.pLayer);
      this.loopBadge = opts.loopBadge ? $(opts.loopBadge) : null;
      this.buildDots();
      this.bind();
      this.go(0, false);
    }

    buildDots() {
      const ol = $(this.ui.dots);
      ol.innerHTML = this.steps.map((_, i) => `<li data-i="${i}"></li>`).join("");
      this.dots = $$("li", ol);
      this.dots.forEach((d) =>
        d.addEventListener("click", () => {
          this.pause();
          this.go(+d.dataset.i, true);
        })
      );
    }

    bind() {
      $(this.ui.prev).addEventListener("click", () => {
        this.pause();
        this.go((this.i - 1 + this.steps.length) % this.steps.length, true);
      });
      $(this.ui.next).addEventListener("click", () => {
        this.pause();
        this.go((this.i + 1) % this.steps.length, true);
      });
      $(this.ui.restart).addEventListener("click", () => {
        this.pause();
        this.go(0, true);
      });
      this.playBtn = $(this.ui.play);
      this.playBtn.addEventListener("click", () => (this.playing ? this.pause() : this.play()));

      // autoplay when scrolled into view the first time
      const io = new IntersectionObserver(
        (es, o) => {
          es.forEach((e) => {
            if (e.isIntersecting && !this._seen) {
              this._seen = true;
              if (!reduce) this.play();
              o.disconnect();
            }
          });
        },
        { threshold: 0.45 }
      );
      io.observe(this.scene);
    }

    clear() {
      $$(".node", this.scene).forEach((n) => n.classList.remove("active", "pulse"));
      $$(".wire", this.scene).forEach((w) => w.classList.remove("live", "flow"));
      this.scene.classList.remove("has-active");
      this.pLayer.innerHTML = "";
      if (this.loopBadge) this.loopBadge.classList.remove("show");
      if (this.raf) cancelAnimationFrame(this.raf);
      if (this.progRaf) cancelAnimationFrame(this.progRaf);
    }

    go(i, fromUser) {
      this.i = i;
      const step = this.steps[i];
      this.clear();
      this.scene.classList.add("has-active");

      // caption (fade)
      const card = $(this.ui.card);
      card.style.opacity = 0;
      setTimeout(() => {
        $(this.ui.no).textContent = String(i + 1).padStart(2, "0");
        $(this.ui.tag).textContent = step.tag;
        $(this.ui.title).textContent = step.title;
        $(this.ui.body).textContent = step.body;
        card.style.opacity = 1;
      }, 130);

      // nodes
      (step.active || []).forEach((id) => {
        const n = $("#" + id, this.scene);
        if (n) n.classList.add("active");
      });
      if (step.pulse) step.pulse.forEach((id) => $("#" + id, this.scene)?.classList.add("pulse"));
      if (step.loop && this.loopBadge) this.loopBadge.classList.add("show");

      // wires + particles
      (step.flows || []).forEach((f) => {
        const w = $("#" + f.wire, this.scene);
        if (!w) return;
        const delay = f.delay || 0;
        setTimeout(() => {
          w.classList.add("live", "flow");
          if (!reduce) this.sendParticle(w, f.count || 1);
        }, delay);
      });

      // dots + progress
      this.dots.forEach((d, k) => {
        d.classList.toggle("active", k === i);
        d.classList.toggle("done", k < i);
      });
      this.runProgress();
      if (this.playing) this.schedule();
    }

    sendParticle(pathEl, count) {
      const L = pathEl.getTotalLength();
      const color = getComputedStyle(pathEl).stroke;
      const travel = Math.min(1500, Math.max(750, L * 1.6));
      for (let k = 0; k < count; k++) {
        for (let t = 0; t < 3; t++) {
          // main + 2 trailing
          const c = document.createElementNS(SVGNS, "circle");
          c.setAttribute("r", t === 0 ? 5.5 : 4 - t);
          c.setAttribute("class", "particle" + (t ? " trail" : ""));
          c.style.fill = color;
          this.pLayer.appendChild(c);
          this.animateAlong(c, pathEl, L, travel, k * 360 + t * 70);
        }
      }
    }

    animateAlong(circle, pathEl, L, dur, delay) {
      const start = performance.now() + delay;
      const step = (now) => {
        const t = (now - start) / dur;
        if (t < 0) {
          this.raf = requestAnimationFrame(step);
          return;
        }
        if (t > 1) {
          circle.remove();
          return;
        }
        const p = pathEl.getPointAtLength(t * L);
        circle.setAttribute("cx", p.x);
        circle.setAttribute("cy", p.y);
        circle.style.opacity = t < 0.1 ? t * 10 : t > 0.85 ? (1 - t) / 0.15 : 1;
        this.raf = requestAnimationFrame(step);
      };
      this.raf = requestAnimationFrame(step);
    }

    runProgress() {
      const bar = $(this.ui.progress);
      if (!bar) return;
      bar.style.width = "0%";
      if (!this.playing) {
        bar.style.width = ((this.i + 1) / this.steps.length) * 100 + "%";
        return;
      }
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / this.dur);
        bar.style.width = t * 100 + "%";
        if (t < 1 && this.playing) this.progRaf = requestAnimationFrame(tick);
      };
      this.progRaf = requestAnimationFrame(tick);
    }

    schedule() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.go((this.i + 1) % this.steps.length, false);
      }, this.dur);
    }

    play() {
      this.playing = true;
      this.playBtn.classList.add("playing");
      this.runProgress();
      this.schedule();
    }
    pause() {
      this.playing = false;
      this.playBtn.classList.remove("playing");
      clearTimeout(this.timer);
      if (this.progRaf) cancelAnimationFrame(this.progRaf);
    }
  }

  /* ---------- ARCHITECTURE diagram (Figure 1) ---------- */
  if ($("#archScene")) {
    new StepDiagram({
      scene: "#archScene",
      loopBadge: "#loopBadge",
      dur: 3200,
      ui: {
        card: "#archCard", no: "#archNo", tag: "#archTag", title: "#archTitle", body: "#archBody",
        prev: "#archPrev", next: "#archNext", play: "#archPlay", restart: "#archRestart",
        dots: "#archDots", progress: "#archProgress",
      },
      steps: [
        { tag: "env.reset()", title: "A patient case is loaded",
          body: "The GYM samples a clinical task and returns the first observation — a patient scenario plus the available tool menu — to the agent.",
          active: ["n-gym", "n-agent"], flows: [{ wire: "w-obs" }] },
        { tag: "πθ(aₜ | sₜ)", title: "The agent thinks, then acts",
          body: "The VLM agent reasons in a private think step, then emits an action aₜ — either a tool call or a final answer submission.",
          active: ["n-agent", "n-gym"], flows: [{ wire: "w-act" }] },
        { tag: "step(aₜ) · 135 tools", title: "A clinical tool is invoked",
          body: "The environment executes the action, calling one of 135 domain tools: search, a validated assessment score, a lab/imaging order, or a reasoning scaffold.",
          active: ["n-gym", "n-tools"], flows: [{ wire: "w-calls" }, { wire: "w-results", delay: 850 }] },
        { tag: "BM25 · 828K KB", title: "Evidence is retrieved",
          body: "Knowledge tools query the 828K-passage KB via BM25. Grounded passages return as observations, so the agent reasons over real evidence — not just its prior.",
          active: ["n-gym", "n-kb"], flows: [{ wire: "w-kbq" }, { wire: "w-kbret", delay: 850 }] },
        { tag: "multi-turn loop", title: "The loop repeats, turn after turn",
          body: "The environment returns the next state sₜ₊₁ and the agent acts again. A clinical episode sustains 7–10 turns of think → search → submit.",
          active: ["n-agent", "n-gym"], flows: [{ wire: "w-obs" }], loop: true },
        { tag: "trajectory τ → 5D reward", title: "The full episode is scored",
          body: "On submission, the trajectory τ is graded on five dimensions — accuracy, process, safety, format, coherence — with cosine length control. A critical safety violation caps the score at 0.1.",
          active: ["n-gym", "n-reward"], flows: [{ wire: "w-tau" }] },
        { tag: "GRPO + TT-OPD", title: "The policy is updated",
          body: "The reward drives the RL trainer — GRPO policy gradient plus TT-OPD distillation — and ∇θ ℒ flows back to update the agent. Then the next episode begins.",
          active: ["n-reward", "n-rl", "n-agent"], flows: [{ wire: "w-reward" }, { wire: "w-update", delay: 700 }] },
      ],
    });
  }

  /* ---------- TT-OPD pipeline diagram (Figure 2) ---------- */
  if ($("#ttScene")) {
    new StepDiagram({
      scene: "#ttScene",
      dur: 3200,
      ui: {
        card: "#ttCard", no: "#ttNo", tag: "#ttTag", title: "#ttTitle", body: "#ttBody",
        prev: "#ttPrev", next: "#ttNext", play: "#ttPlay", restart: "#ttRestart",
        dots: "#ttDots", progress: "#ttProgress",
      },
      steps: [
        { tag: "1 · rollout", title: "Student rollout",
          body: "For each prompt the student samples n = 3 multi-turn trajectories, interleaving think, search and submit actions inside the GYM.",
          active: ["t-student"], pulse: ["t-student"] },
        { tag: "2 · outcome → hint", title: "Outcome-conditioned classification",
          body: "Each trajectory's outcome decides its hint: correct ones receive a confirmatory cue, incorrect ones a corrective redirection.",
          active: ["t-student", "t-classify"], flows: [{ wire: "t-sc" }] },
        { tag: "3 · EMA teacher", title: "Teacher re-scoring",
          body: "A gradient-free EMA copy of the student re-scores every turn with the hint-augmented context, producing dense, outcome-aware logprobs — without ever revealing the hints to the student.",
          active: ["t-classify", "t-teacher"], flows: [{ wire: "t-ct" }] },
        { tag: "4 · ∇θₛ ℒ", title: "Policy update + EMA tracking",
          body: "The student is updated by the GRPO reward loss plus a turn-level KL term that pulls it toward the teacher. The teacher then tracks the student by EMA — taking no gradient of its own.",
          active: ["t-teacher", "t-update", "t-student"],
          flows: [{ wire: "t-tu" }, { wire: "t-up", delay: 750 }, { wire: "t-ema", delay: 1500 }] },
      ],
    });
  }

  /* ---------- copy BibTeX ---------- */
  const cb = $("#copyBib");
  if (cb)
    cb.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText($("#bibtex").textContent);
        cb.textContent = "Copied!";
        cb.classList.add("copied");
        setTimeout(() => {
          cb.textContent = "Copy";
          cb.classList.remove("copied");
        }, 1800);
      } catch (e) {
        const r = document.createRange();
        r.selectNode($("#bibtex"));
        getSelection().removeAllRanges();
        getSelection().addRange(r);
      }
    });
})();
