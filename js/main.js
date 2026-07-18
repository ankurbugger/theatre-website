/* Rangmanch Theatre Co. — interactions */

const REPO_OWNER = "ankurbugger";
const REPO_NAME = "theatre-website";

// ---------- Sticky nav ----------
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// ---------- Mobile menu ----------
const burger = document.getElementById("burger");
const mobileMenu = document.getElementById("mobileMenu");

function setMenu(open) {
  mobileMenu.hidden = !open;
  burger.classList.toggle("is-open", open);
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}
burger.addEventListener("click", () => setMenu(mobileMenu.hidden));
mobileMenu.addEventListener("click", (e) => {
  if (e.target.closest("a")) setMenu(false);
});

// ---------- Scroll reveal ----------
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.style.transitionDelay = `${Math.min(i * 60, 300)}ms`;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// ---------- Animated counters ----------
const fmt = new Intl.NumberFormat("en-IN");
const counterIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count);
      const dur = 1600;
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt.format(Math.round(target * eased)) + (p === 1 && target >= 1000 ? "+" : "");
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counterIO.unobserve(el);
    });
  },
  { threshold: 0.5 }
);
document.querySelectorAll("[data-count]").forEach((el) => counterIO.observe(el));

// ---------- Toast ----------
const toast = document.getElementById("toast");
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 4000);
}

// ---------- Shows from data/shows.json ----------
const POSTER_ART = {
  crimson:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="12" cy="12" r="9" stroke-dasharray="2 3"/><path d="M12 3v18M3 12h18"/></svg>',
  indigo:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M17 4a7 7 0 1 0 0 16 8.5 8.5 0 0 1 0-16Z"/><circle cx="7" cy="7" r=".6"/><circle cx="5" cy="12" r=".6"/><circle cx="8" cy="17" r=".6"/></svg>',
  teal:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M4 14c2-3 4-3 6 0s4 3 6 0 3-2 4-1M4 18c2-3 4-3 6 0s4 3 6 0 3-2 4-1M12 3v6M9 6l3 3 3-3"/></svg>',
};

const ICONS = {
  calendar:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  ticket:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6Z"/></svg>',
};

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
}

async function loadShows() {
  const grid = document.getElementById("showsGrid");
  if (!grid) return;
  try {
    const res = await fetch("data/shows.json", { cache: "no-cache" });
    if (!res.ok) return;
    const { shows } = await res.json();
    if (!Array.isArray(shows) || !shows.length) return;

    grid.innerHTML = "";
    shows.forEach((s) => {
      const theme = ["crimson", "indigo", "teal"].includes(s.theme) ? s.theme : "crimson";
      const titleBroken = esc(s.title).split(" ").length > 1
        ? esc(s.title).replace(" ", "<br/>")
        : esc(s.title);
      const posterInner = s.poster
        ? `<img class="poster__img" src="${esc(s.poster)}" alt="${esc(s.title)} poster" loading="lazy" />
           <span class="poster__lang">${esc(s.language)}</span>`
        : `<span class="poster__lang">${esc(s.language)}</span>
           <div class="poster__art" aria-hidden="true">${POSTER_ART[theme]}</div>
           <h3 class="poster__title">${titleBroken}</h3>
           <p class="poster__tag">${esc(s.tagline)}</p>`;
      const card = document.createElement("article");
      card.className = "show-card reveal";
      card.innerHTML = `
        <div class="show-card__poster poster poster--${theme}${s.poster ? " poster--img" : ""}">
          ${posterInner}
        </div>
        <div class="show-card__body">
          <div class="show-card__meta">
            <span>${esc(s.genre)} · ${esc(s.duration)}</span>
            <span class="rating">★ ${esc(s.rating)}</span>
          </div>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.description)}</p>
          <ul class="show-card__facts">
            <li>${ICONS.calendar} ${esc(s.date)}</li>
            <li>${ICONS.pin} ${esc(s.venue)}</li>
            <li>${ICONS.ticket} ${esc(s.price)}</li>
          </ul>
          <div class="show-card__actions">
            <a class="btn btn--gold" href="${esc(s.bookmyshow)}" target="_blank" rel="noopener">Book on BookMyShow</a>
            <div class="partner-links">
              <a href="${esc(s.district)}" target="_blank" rel="noopener">Also on District ↗</a>
            </div>
          </div>
        </div>`;
      grid.appendChild(card);
      io.observe(card);
    });

    // ticker from live shows
    const track = document.getElementById("tickerTrack");
    if (track) {
      const line = shows.map((s) => `${s.title} — ${s.venue}`).join("  ✦  ") + "  ✦  New season announced  ✦  ";
      track.innerHTML = "";
      for (let i = 0; i < 2; i++) {
        const span = document.createElement("span");
        span.textContent = line;
        track.appendChild(span);
      }
    }
  } catch {
    /* keep whatever is there */
  }
}
loadShows();

// ---------- Artists from data/artists.json ----------
async function loadArtists() {
  const home = document.getElementById("artistsGrid");
  const page = document.getElementById("artistsPageGrid");
  if (!home && !page) return;
  try {
    const res = await fetch("data/artists.json", { cache: "no-cache" });
    if (!res.ok) return;
    const { artists } = await res.json();
    if (!Array.isArray(artists) || !artists.length) return;

    const initials = (name) =>
      name.split(/\s+/).map((w) => w[0] || "").join("").slice(0, 2).toUpperCase();
    const avatar = (a, i) =>
      a.photo
        ? `<div class="artist__ph artist__ph--photo"><img src="${esc(a.photo)}" alt="${esc(a.name)}" loading="lazy" /></div>`
        : `<div class="artist__ph artist__ph--${(i % 6) + 1}"><span>${esc(initials(a.name))}</span></div>`;

    const leads = artists.filter((a) => a.lead);
    const rest = artists.filter((a) => !a.lead);
    const ordered = [...leads, ...rest];

    if (home) {
      home.innerHTML = "";
      ordered.slice(0, 4).forEach((a, i) => {
        const el = document.createElement("article");
        el.className = "artist";
        el.innerHTML = `
          ${avatar(a, i)}
          <h3>${esc(a.name)}</h3>
          <p>${esc(a.role)}</p>`;
        home.appendChild(el);
      });
    }

    if (page) {
      // main leaders: big circular profiles at the top
      const leadSection = document.getElementById("artistsLeadSection");
      const leadGrid = document.getElementById("artistsLeadGrid");
      const restHead = document.getElementById("artistsRestHead");
      if (leadSection && leadGrid && leads.length) {
        leadSection.hidden = false;
        leadGrid.innerHTML = "";
        leads.forEach((a, i) => {
          const el = document.createElement("article");
          el.className = "artist artist--lead reveal";
          el.innerHTML = `
            ${avatar(a, i)}
            <h3>${esc(a.name)}</h3>
            <p>${esc(a.role)}</p>
            ${a.note ? `<p class="artist--lead__note">${esc(a.note)}</p>` : ""}`;
          leadGrid.appendChild(el);
          io.observe(el);
        });
        if (restHead && rest.length) restHead.hidden = false;
      }

      const others = leads.length ? rest : artists;
      page.innerHTML = "";
      others.forEach((a, i) => {
        const el = document.createElement("article");
        el.className = "artist-card reveal";
        el.innerHTML = `
          ${avatar(a, i + leads.length)}
          <div class="artist-card__body">
            <h3>${esc(a.name)}</h3>
            <p class="artist-card__role">${esc(a.role)}</p>
            ${a.note ? `<p class="artist-card__note">${esc(a.note)}</p>` : ""}
          </div>`;
        page.appendChild(el);
        io.observe(el);
      });
    }
  } catch {
    /* keep whatever is there */
  }
}
loadArtists();

// ---------- Productions from data/productions.json ----------
async function loadProductions() {
  const home = document.getElementById("journeyGrid");
  const page = document.getElementById("productionsPageGrid");
  if (!home && !page) return;
  try {
    const res = await fetch("data/productions.json", { cache: "no-cache" });
    if (!res.ok) return;
    const { productions } = await res.json();
    if (!Array.isArray(productions)) return;

    const card = (p) => {
      const el = document.createElement("article");
      el.className = "archive__item";
      el.innerHTML = `
        <span class="archive__year">${esc(p.year)}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.detail)}</p>`;
      return el;
    };

    if (home) {
      home.innerHTML = "";
      productions.slice(0, 5).forEach((p) => home.appendChild(card(p)));
      const cta = document.createElement("article");
      cta.className = "archive__item archive__item--cta";
      cta.innerHTML = `<h3>Want us in your city?</h3>
        <a class="btn btn--ghost" href="contact.html">Invite Us ↗</a>`;
      home.appendChild(cta);
    }

    if (page) {
      page.innerHTML = "";
      productions.forEach((p) => {
        const el = card(p);
        el.classList.add("reveal");
        page.appendChild(el);
        io.observe(el);
      });
    }
  } catch {
    /* keep whatever is there */
  }
}
loadProductions();

// ---------- GitHub media listing helper ----------
const MEDIA_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/`;
const IMG_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;
const VID_EXT = /\.(mp4|webm|m4v)$/i;

async function listMedia(folder) {
  const res = await fetch(MEDIA_BASE + folder, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) return [];
  return (await res.json()).filter(
    (f) => f.type === "file" && (IMG_EXT.test(f.name) || VID_EXT.test(f.name))
  );
}

function captionFrom(name) {
  const base = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}

// ---------- Hero slider from media/hero ----------
async function loadHeroSlider() {
  const wrap = document.getElementById("heroSlides");
  const dots = document.getElementById("heroDots");
  if (!wrap) return;
  let files = [];
  try {
    files = (await listMedia("media/hero")).filter((f) => IMG_EXT.test(f.name));
  } catch {
    return;
  }
  if (!files.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const caption = document.getElementById("heroCaption");
  const slides = files.map((f, i) => {
    const el = document.createElement("div");
    el.className = "hero__slide" + (i === 0 ? " is-active" : "");
    el.style.backgroundImage = `url("media/hero/${encodeURIComponent(f.name)}")`;
    wrap.appendChild(el);
    return el;
  });
  document.querySelector(".hero").classList.add("hero--has-slides");
  const setCaption = (i) => {
    if (!caption) return;
    const text = captionFrom(files[i].name);
    // hide captions for machine-named files (e.g. camera exports, UUIDs)
    const digits = (text.match(/\d/g) || []).length;
    const meaningful = digits / text.length < 0.3 && text.length <= 40;
    caption.textContent = meaningful ? text : "";
  };
  setCaption(0);

  if (slides.length < 2) return;

  let current = 0;
  let timer = null;

  const dotEls = slides.map((_, i) => {
    const b = document.createElement("button");
    b.className = "hero__dot" + (i === 0 ? " is-active" : "");
    b.setAttribute("aria-label", `Slide ${i + 1}`);
    b.addEventListener("click", () => {
      goTo(i);
      restart();
    });
    dots.appendChild(b);
    return b;
  });

  function goTo(i) {
    slides[current].classList.remove("is-active");
    dotEls[current].classList.remove("is-active");
    current = (i + slides.length) % slides.length;
    slides[current].classList.add("is-active");
    dotEls[current].classList.add("is-active");
    setCaption(current);
  }

  function restart() {
    if (reduced) return;
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 6000);
  }
  restart();
}
loadHeroSlider();

// ---------- Auto gallery from media/gallery ----------
async function loadGallery() {
  const homeGrid = document.getElementById("galleryGrid");
  const pageGrid = document.getElementById("galleryPageGrid");
  const grid = pageGrid || homeGrid;
  if (!grid) return;
  try {
    let files = await listMedia("media/gallery");
    if (!files.length) return; // folder empty — keep placeholder tiles
    if (!pageGrid) files = files.slice(0, 6); // homepage shows a taste

    grid.innerHTML = "";
    grid.classList.add("gallery--media");
    files.forEach((f, i) => {
      const src = "media/gallery/" + encodeURIComponent(f.name);
      const caption = captionFrom(f.name);
      const fig = document.createElement("figure");
      fig.className = "gallery__item gallery__item--media" + (i % 5 === 0 ? " gallery__item--big" : "");

      if (VID_EXT.test(f.name)) {
        const vid = document.createElement("video");
        vid.src = src;
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        vid.preload = "metadata";
        fig.appendChild(vid);
        fig.addEventListener("mouseenter", () => vid.play().catch(() => {}));
        fig.addEventListener("mouseleave", () => vid.pause());
      } else {
        const img = document.createElement("img");
        img.src = src;
        img.alt = caption;
        img.loading = "lazy";
        fig.appendChild(img);
      }

      const cap = document.createElement("figcaption");
      cap.textContent = caption;
      fig.appendChild(cap);
      fig.tabIndex = 0;
      fig.setAttribute("role", "button");
      fig.setAttribute("aria-label", "View " + caption);
      fig.addEventListener("click", () => openLightbox(src, caption, VID_EXT.test(f.name)));
      fig.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(src, caption, VID_EXT.test(f.name));
        }
      });
      grid.appendChild(fig);
    });
  } catch {
    /* offline or rate-limited — placeholder tiles stay */
  }
}
loadGallery();

// ---------- Lightbox ----------
let lightbox = null;
function openLightbox(src, caption, isVideo) {
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.innerHTML = '<div class="lightbox__media"></div><p class="lightbox__caption"></p>';
    lightbox.addEventListener("click", closeLightbox);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLightbox();
    });
    document.body.appendChild(lightbox);
  }
  const slot = lightbox.querySelector(".lightbox__media");
  slot.innerHTML = "";
  if (isVideo) {
    const vid = document.createElement("video");
    vid.src = src;
    vid.controls = true;
    vid.autoplay = true;
    vid.playsInline = true;
    slot.appendChild(vid);
  } else {
    const img = document.createElement("img");
    img.src = src;
    img.alt = caption;
    slot.appendChild(img);
  }
  lightbox.querySelector(".lightbox__caption").textContent = caption;
  lightbox.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  if (!lightbox) return;
  const vid = lightbox.querySelector("video");
  if (vid) vid.pause();
  lightbox.classList.remove("is-open");
  document.body.style.overflow = "";
}

// ---------- Contact page: show thank-you after redirect ----------
const contactSent = document.getElementById("contactSent");
if (contactSent && new URLSearchParams(location.search).get("sent") === "1") {
  contactSent.hidden = false;
  const cf = document.getElementById("contactForm");
  if (cf) cf.style.display = "none";
}

// ---------- Newsletter ----------
const nlForm = document.getElementById("newsletterForm");
const nlMsg = document.getElementById("newsletterMsg");

if (nlForm) nlForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = nlForm.email.value.trim();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!valid) {
    nlMsg.textContent = "Please enter a valid email address.";
    return;
  }
  nlMsg.textContent = "You're on the list! See you in the front row. ✨";
  nlForm.reset();
});
