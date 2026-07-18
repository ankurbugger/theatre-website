/* Rangmanch Theatre Co. — interactions */

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
  if (e.target.closest("a") || e.target.closest("button")) setMenu(false);
});

// ---------- Scroll reveal ----------
const revealEls = document.querySelectorAll(".reveal");
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
revealEls.forEach((el) => io.observe(el));

// ---------- Animated counters ----------
const counters = document.querySelectorAll("[data-count]");
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
counters.forEach((el) => counterIO.observe(el));

// ---------- Toast ----------
const toast = document.getElementById("toast");
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 4000);
}

// ---------- Booking modal + seat map ----------
const modal = document.getElementById("bookingModal");
const seatmap = document.getElementById("seatmap");
const bmShow = document.getElementById("bmShow");
const bmSeats = document.getElementById("bmSeats");
const bmTotal = document.getElementById("bmTotal");
const bmPay = document.getElementById("bmPay");

const SHOW_INFO = {
  "Andha Yug": "Andha Yug · Prithvi Theatre, Mumbai · 26 Jul, 7:30 PM",
  "Chandni Raatein": "Chandni Raatein · Kamani Auditorium, Delhi · 8 Aug, 8:00 PM",
  "The Last Monsoon": "The Last Monsoon · Ranga Shankara, Bengaluru · 22 Aug, 6:00 PM",
};

const ROWS = ["A", "B", "C", "D", "E", "F"];
const COLS = 10;
const PREMIUM_ROWS = ["A", "B"];
const PRICE = { premium: 699, regular: 349 };
let selected = new Map();
let lastFocused = null;

function buildSeatmap() {
  seatmap.innerHTML = "";
  selected.clear();
  // deterministic-ish "sold" pattern so the map looks alive
  const sold = new Set();
  ROWS.forEach((r, ri) => {
    for (let c = 1; c <= COLS; c++) {
      if ((ri * 7 + c * 3) % 11 === 0 || (ri === 2 && (c === 4 || c === 5))) {
        sold.add(`${r}${c}`);
      }
    }
  });

  ROWS.forEach((r) => {
    const row = document.createElement("div");
    row.className = "seatmap__row";
    const label = document.createElement("span");
    label.className = "seatmap__rowlabel";
    label.textContent = r;
    row.appendChild(label);

    for (let c = 1; c <= COLS; c++) {
      const id = `${r}${c}`;
      const premium = PREMIUM_ROWS.includes(r);
      const seat = document.createElement("button");
      seat.type = "button";
      seat.className = "seat" + (premium ? " seat--premium" : "");
      seat.dataset.id = id;
      seat.dataset.price = premium ? PRICE.premium : PRICE.regular;
      seat.setAttribute("aria-label", `Seat ${id}${premium ? ", premium" : ""}`);
      if (sold.has(id)) {
        seat.classList.add("seat--sold");
        seat.disabled = true;
        seat.setAttribute("aria-label", `Seat ${id}, sold`);
      }
      seat.addEventListener("click", () => toggleSeat(seat));
      row.appendChild(seat);
    }
    seatmap.appendChild(row);
  });
  updateSummary();
}

function toggleSeat(seat) {
  const id = seat.dataset.id;
  if (selected.has(id)) {
    selected.delete(id);
    seat.classList.remove("seat--selected");
  } else {
    if (selected.size >= 8) {
      showToast("Maximum 8 seats per booking.");
      return;
    }
    selected.set(id, Number(seat.dataset.price));
    seat.classList.add("seat--selected");
  }
  updateSummary();
}

function updateSummary() {
  const total = [...selected.values()].reduce((a, b) => a + b, 0);
  bmTotal.textContent = "₹" + fmt.format(total);
  bmSeats.textContent = selected.size
    ? `${selected.size} seat${selected.size > 1 ? "s" : ""}: ${[...selected.keys()].join(", ")}`
    : "No seats selected";
  bmPay.disabled = selected.size === 0;
}

function openBooking(showName) {
  bmShow.textContent = SHOW_INFO[showName] || showName;
  buildSeatmap();
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  lastFocused = document.activeElement;
  modal.querySelector(".modal__close").focus();
}

function closeBooking() {
  modal.hidden = true;
  document.body.style.overflow = "";
  if (lastFocused) lastFocused.focus();
}

document.querySelectorAll("[data-open-booking]").forEach((btn) =>
  btn.addEventListener("click", () => openBooking(btn.dataset.show))
);
document.querySelectorAll("[data-close-booking]").forEach((el) =>
  el.addEventListener("click", closeBooking)
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.hidden) closeBooking();
});

bmPay.addEventListener("click", () => {
  showToast("Direct payments launch soon — for now, please complete your booking on BookMyShow or District. 🎭");
});

// ---------- Newsletter ----------
const nlForm = document.getElementById("newsletterForm");
const nlMsg = document.getElementById("newsletterMsg");

nlForm.addEventListener("submit", (e) => {
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
