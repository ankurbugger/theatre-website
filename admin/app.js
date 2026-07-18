/* Website Admin — commits changes to GitHub on behalf of the site owner.
   Requires a fine-grained personal access token (Contents: read/write on this repo). */

const OWNER = "ankurbugger";
const REPO = "theatre-website";
const BRANCH = "main";
const KEY_STORAGE = "rtc_admin_key";
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;

const IMG_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;
const VID_EXT = /\.(mp4|webm|m4v)$/i;

let token = localStorage.getItem(KEY_STORAGE) || "";
let showsSha = null;
let shows = [];

// ---------- helpers ----------
const $ = (id) => document.getElementById(id);

function gh(path, opts = {}) {
  return fetch(API + path, {
    ...opts,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + token,
      ...(opts.headers || {}),
    },
  });
}

function b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
function b64decode(b64) {
  const bin = atob(b64.replace(/\s/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function sanitizeName(name) {
  const dot = name.lastIndexOf(".");
  const ext = dot > -1 ? name.slice(dot).toLowerCase() : "";
  const base = (dot > -1 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "file";
  return base + ext;
}

const toast = $("toast");
let toastTimer;
function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.classList.toggle("is-error", isError);
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 4500);
}

// ---------- gate ----------
async function validateToken() {
  try {
    const res = await gh("");
    return res.ok;
  } catch {
    return false;
  }
}

async function unlock() {
  $("gate").hidden = true;
  $("app").hidden = false;
  loadShows();
  loadMedia("hero");
  loadMedia("gallery");
  loadListEditor("artists");
  loadListEditor("productions");
}

$("gateForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("gateBtn");
  btn.disabled = true;
  btn.textContent = "Checking…";
  token = $("gateKey").value.trim();
  const ok = await validateToken();
  btn.disabled = false;
  btn.textContent = "Unlock Admin";
  if (!ok) {
    $("gateError").textContent = "That key didn't work. Check it and try again, or ask your website manager for a new one.";
    return;
  }
  localStorage.setItem(KEY_STORAGE, token);
  $("gateError").textContent = "";
  unlock();
});

$("lockBtn").addEventListener("click", () => {
  localStorage.removeItem(KEY_STORAGE);
  location.reload();
});

// auto-unlock if a stored key still works
(async () => {
  if (token && (await validateToken())) unlock();
  else localStorage.removeItem(KEY_STORAGE);
})();

// ---------- tabs ----------
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("is-active"));
    tab.classList.add("is-active");
    $("panel-" + tab.dataset.tab).classList.add("is-active");
  });
});

// ---------- shows editor ----------
const SHOW_FIELDS = [
  ["title", "Show title", "text"],
  ["tagline", "Tagline (short punchy line)", "text"],
  ["language", "Language", "text"],
  ["genre", "Genre (Drama / Musical / Comedy…)", "text"],
  ["duration", "Duration (e.g. 1h 50m)", "text"],
  ["rating", "Rating (e.g. 4.8)", "text"],
  ["date", "Date & time (as shown to audience)", "text"],
  ["venue", "Venue & city", "text"],
  ["price", "Price (e.g. ₹349 onwards)", "text"],
  ["theme", "Poster colour", "select"],
  ["bookmyshow", "BookMyShow ticket link", "url"],
  ["district", "District ticket link", "url"],
  ["description", "Description (2–3 lines)", "textarea"],
];

async function loadShows() {
  try {
    const res = await gh(`/contents/data/shows.json?ref=${BRANCH}`);
    if (!res.ok) throw new Error();
    const json = await res.json();
    showsSha = json.sha;
    shows = JSON.parse(b64decode(json.content)).shows || [];
    renderShows();
  } catch {
    $("showsList").innerHTML = '<p class="mediagrid__empty">Could not load shows. Check your internet connection and refresh.</p>';
  }
}

function renderShows() {
  const list = $("showsList");
  list.innerHTML = "";
  shows.forEach((show, idx) => {
    const card = document.createElement("div");
    card.className = "show-edit";
    const top = document.createElement("div");
    top.className = "show-edit__top";
    top.innerHTML = `<h3>Show ${idx + 1}</h3>`;
    const rm = document.createElement("button");
    rm.className = "show-edit__remove";
    rm.textContent = "Remove this show";
    rm.addEventListener("click", () => {
      if (confirm(`Remove "${show.title || "this show"}" from the website?\n(Nothing happens until you press "Save all shows".)`)) {
        shows.splice(idx, 1);
        renderShows();
      }
    });
    top.appendChild(rm);
    card.appendChild(top);

    // poster image
    const posterRow = document.createElement("div");
    posterRow.className = "poster-row";
    const thumb = document.createElement("div");
    thumb.className = "poster-row__thumb";
    if (show.poster) {
      const img = document.createElement("img");
      img.src = "../" + show.poster;
      img.alt = "Poster";
      thumb.appendChild(img);
    } else {
      thumb.textContent = "No poster yet";
    }
    posterRow.appendChild(thumb);

    const posterInfo = document.createElement("div");
    posterInfo.className = "poster-row__info";
    posterInfo.innerHTML =
      '<strong>Show poster</strong><span>Portrait or landscape photo/artwork for this show’s card. After uploading, press “Save all shows” to publish.</span>';
    const posterBtns = document.createElement("div");
    posterBtns.className = "poster-row__btns";

    const upLabel = document.createElement("label");
    upLabel.className = "btn btn--ghost poster-row__upload";
    upLabel.textContent = show.poster ? "Replace poster" : "Upload poster";
    const upInput = document.createElement("input");
    upInput.type = "file";
    upInput.accept = ".jpg,.jpeg,.png,.webp,.avif";
    upInput.hidden = true;
    upLabel.appendChild(upInput);
    upInput.addEventListener("change", async () => {
      const file = upInput.files[0];
      upInput.value = "";
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        showToast("Poster is too large (max 10 MB). Please compress it first.", true);
        return;
      }
      upLabel.textContent = "Uploading…";
      try {
        const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
        const slug = sanitizeName((show.title || "show") + ext).replace(/\.[^.]+$/, "");
        const name = `${slug}-${Date.now()}${ext}`;
        const content = await fileToBase64(file);
        const res = await gh(`/contents/media/posters/${encodeURIComponent(name)}`, {
          method: "PUT",
          body: JSON.stringify({
            message: `Upload show poster: ${name} (via admin)`,
            content,
            branch: BRANCH,
          }),
        });
        if (!res.ok) throw new Error();
        show.poster = `media/posters/${name}`;
        renderShows();
        showToast('Poster uploaded ✔ Now press "Save all shows" to publish it.');
      } catch {
        upLabel.textContent = "Upload poster";
        showToast("Could not upload the poster. Try again.", true);
      }
    });
    posterBtns.appendChild(upLabel);

    if (show.poster) {
      const rmPoster = document.createElement("button");
      rmPoster.className = "show-edit__remove";
      rmPoster.textContent = "Remove poster";
      rmPoster.addEventListener("click", () => {
        show.poster = "";
        renderShows();
        showToast('Poster removed — press "Save all shows" to publish the change.');
      });
      posterBtns.appendChild(rmPoster);
    }
    posterInfo.appendChild(posterBtns);
    posterRow.appendChild(posterInfo);
    card.appendChild(posterRow);

    const grid = document.createElement("div");
    grid.className = "show-edit__grid";
    SHOW_FIELDS.forEach(([key, label, type]) => {
      const field = document.createElement("div");
      field.className = "field" + (type === "textarea" ? " field--full" : "") + (type === "url" ? " field--link" : "");
      const id = `show-${idx}-${key}`;
      const lab = document.createElement("label");
      lab.htmlFor = id;
      lab.textContent = label;
      field.appendChild(lab);

      let input;
      if (type === "textarea") {
        input = document.createElement("textarea");
      } else if (type === "select") {
        input = document.createElement("select");
        [["crimson", "Deep Red"], ["indigo", "Midnight Blue"], ["teal", "Forest Teal"]].forEach(([v, t]) => {
          const o = document.createElement("option");
          o.value = v;
          o.textContent = t;
          input.appendChild(o);
        });
      } else {
        input = document.createElement("input");
        input.type = type === "url" ? "url" : "text";
      }
      input.id = id;
      input.value = show[key] || "";
      input.addEventListener("input", () => (show[key] = input.value));
      if (type === "select") input.addEventListener("change", () => (show[key] = input.value));
      field.appendChild(input);
      grid.appendChild(field);
    });
    card.appendChild(grid);
    list.appendChild(card);
  });
}

$("addShowBtn").addEventListener("click", () => {
  shows.push({
    title: "", tagline: "", language: "Hindi", genre: "Drama", duration: "",
    rating: "", description: "", date: "", venue: "", price: "",
    bookmyshow: "https://in.bookmyshow.com", district: "https://www.district.in",
    theme: "crimson", poster: "",
  });
  renderShows();
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
});

$("saveShowsBtn").addEventListener("click", async () => {
  const btn = $("saveShowsBtn");
  const status = $("showsStatus");
  btn.disabled = true;
  status.textContent = "Saving…";
  try {
    const body = {
      message: "Update shows (via admin)",
      content: b64encode(JSON.stringify({ shows }, null, 2) + "\n"),
      branch: BRANCH,
      sha: showsSha,
    };
    const res = await gh("/contents/data/shows.json", {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error();
    const out = await res.json();
    showsSha = out.content.sha;
    status.textContent = "Saved! Live on the website in about a minute.";
    showToast("Shows saved ✔");
  } catch {
    status.textContent = "";
    showToast("Could not save. Check your connection and try again.", true);
  }
  btn.disabled = false;
  setTimeout(() => (status.textContent = ""), 6000);
});

// ---------- generic list editors (artists, productions) ----------
const LIST_EDITORS = {
  artists: {
    path: "data/artists.json",
    key: "artists",
    listEl: "artistsList",
    addBtn: "addArtistBtn",
    saveBtn: "saveArtistsBtn",
    statusEl: "artistsStatus",
    itemName: "person",
    fields: [
      ["name", "Name", "text"],
      ["role", "Role (e.g. Director, Lead Actor)", "text"],
      ["lead", "⭐ Main member — show at the top with a big profile", "checkbox"],
      ["note", "One-line intro (shown on the Artists page)", "textarea"],
    ],
    blank: { name: "", role: "", note: "", photo: "", lead: false },
    avatar: { folder: "media/artists", key: "photo", label: "profile photo" },
  },
  productions: {
    path: "data/productions.json",
    key: "productions",
    listEl: "productionsList",
    addBtn: "addProductionBtn",
    saveBtn: "saveProductionsBtn",
    statusEl: "productionsStatus",
    itemName: "production",
    fields: [
      ["year", "Tag (e.g. Season One, 2027)", "text"],
      ["title", "Production title", "text"],
      ["detail", "One-line detail (what & where)", "textarea"],
    ],
    blank: { year: "Season One", title: "", detail: "" },
  },
};

const editorState = {};

async function loadListEditor(kind) {
  const conf = LIST_EDITORS[kind];
  try {
    const res = await gh(`/contents/${conf.path}?ref=${BRANCH}`);
    if (!res.ok) throw new Error();
    const json = await res.json();
    editorState[kind] = {
      sha: json.sha,
      items: JSON.parse(b64decode(json.content))[conf.key] || [],
    };
    renderListEditor(kind);
  } catch {
    $(conf.listEl).innerHTML =
      '<p class="mediagrid__empty">Could not load this list. Check your connection and refresh.</p>';
  }
}

function renderListEditor(kind) {
  const conf = LIST_EDITORS[kind];
  const state = editorState[kind];
  const list = $(conf.listEl);
  list.innerHTML = "";
  if (!state.items.length) {
    list.innerHTML = `<p class="mediagrid__empty">Nothing here yet — use "+ Add" above to create the first entry.</p>`;
  }
  state.items.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "show-edit";
    const top = document.createElement("div");
    top.className = "show-edit__top";
    top.innerHTML = `<h3>${idx + 1}. ${item.name || item.title || "New " + conf.itemName}</h3>`;
    const rm = document.createElement("button");
    rm.className = "show-edit__remove";
    rm.textContent = `Remove this ${conf.itemName}`;
    rm.addEventListener("click", () => {
      if (confirm(`Remove "${item.name || item.title || "this entry"}"?\n(Nothing happens until you press Save.)`)) {
        state.items.splice(idx, 1);
        renderListEditor(kind);
      }
    });
    top.appendChild(rm);
    card.appendChild(top);

    if (conf.avatar) card.appendChild(avatarRow(kind, item));

    const grid = document.createElement("div");
    grid.className = "show-edit__grid";
    conf.fields.forEach(([key, label, type]) => {
      const field = document.createElement("div");
      field.className = "field" + (type === "textarea" ? " field--full" : "") + (type === "checkbox" ? " field--check" : "");
      const id = `${kind}-${idx}-${key}`;
      const lab = document.createElement("label");
      lab.htmlFor = id;
      lab.textContent = label;

      if (type === "checkbox") {
        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = id;
        input.checked = Boolean(item[key]);
        input.addEventListener("change", () => (item[key] = input.checked));
        field.appendChild(input);
        field.appendChild(lab);
      } else {
        field.appendChild(lab);
        const input = type === "textarea" ? document.createElement("textarea") : document.createElement("input");
        if (type !== "textarea") input.type = "text";
        input.id = id;
        input.value = item[key] || "";
        input.addEventListener("input", () => (item[key] = input.value));
        field.appendChild(input);
      }
      grid.appendChild(field);
    });
    card.appendChild(grid);
    list.appendChild(card);
  });
}

function avatarRow(kind, item) {
  const conf = LIST_EDITORS[kind];
  const row = document.createElement("div");
  row.className = "poster-row";

  const thumb = document.createElement("div");
  thumb.className = "poster-row__thumb poster-row__thumb--round";
  if (item[conf.avatar.key]) {
    const img = document.createElement("img");
    img.src = "../" + item[conf.avatar.key];
    img.alt = "Profile photo";
    thumb.appendChild(img);
  } else {
    thumb.textContent = "No photo";
  }
  row.appendChild(thumb);

  const info = document.createElement("div");
  info.className = "poster-row__info";
  info.innerHTML =
    "<strong>Profile photo (optional)</strong><span>A square photo looks best. Without one, a coloured circle with initials is shown. After uploading, press Save to publish.</span>";
  const btns = document.createElement("div");
  btns.className = "poster-row__btns";

  const upLabel = document.createElement("label");
  upLabel.className = "btn btn--ghost poster-row__upload";
  upLabel.textContent = item[conf.avatar.key] ? "Replace photo" : "Upload photo";
  const upInput = document.createElement("input");
  upInput.type = "file";
  upInput.accept = ".jpg,.jpeg,.png,.webp,.avif";
  upInput.hidden = true;
  upLabel.appendChild(upInput);
  upInput.addEventListener("change", async () => {
    const file = upInput.files[0];
    upInput.value = "";
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast("Photo is too large (max 8 MB). Please compress it first.", true);
      return;
    }
    upLabel.textContent = "Uploading…";
    try {
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      const slug = sanitizeName((item.name || "member") + ext).replace(/\.[^.]+$/, "");
      const fname = `${slug}-${Date.now()}${ext}`;
      const content = await fileToBase64(file);
      const res = await gh(`/contents/${conf.avatar.folder}/${encodeURIComponent(fname)}`, {
        method: "PUT",
        body: JSON.stringify({
          message: `Upload ${conf.avatar.label}: ${fname} (via admin)`,
          content,
          branch: BRANCH,
        }),
      });
      if (!res.ok) throw new Error();
      item[conf.avatar.key] = `${conf.avatar.folder}/${fname}`;
      renderListEditor(kind);
      showToast('Photo uploaded ✔ Now press "Save" to publish it.');
    } catch {
      upLabel.textContent = "Upload photo";
      showToast("Could not upload the photo. Try again.", true);
    }
  });
  btns.appendChild(upLabel);

  if (item[conf.avatar.key]) {
    const rmBtn = document.createElement("button");
    rmBtn.className = "show-edit__remove";
    rmBtn.textContent = "Remove photo";
    rmBtn.addEventListener("click", () => {
      item[conf.avatar.key] = "";
      renderListEditor(kind);
      showToast('Photo removed — press "Save" to publish the change.');
    });
    btns.appendChild(rmBtn);
  }
  info.appendChild(btns);
  row.appendChild(info);
  return row;
}

Object.keys(LIST_EDITORS).forEach((kind) => {
  const conf = LIST_EDITORS[kind];
  $(conf.addBtn).addEventListener("click", () => {
    if (!editorState[kind]) return;
    editorState[kind].items.push({ ...conf.blank });
    renderListEditor(kind);
  });
  $(conf.saveBtn).addEventListener("click", async () => {
    const state = editorState[kind];
    if (!state) return;
    const btn = $(conf.saveBtn);
    const status = $(conf.statusEl);
    btn.disabled = true;
    status.textContent = "Saving…";
    try {
      const res = await gh(`/contents/${conf.path}`, {
        method: "PUT",
        body: JSON.stringify({
          message: `Update ${conf.key} (via admin)`,
          content: b64encode(JSON.stringify({ [conf.key]: state.items }, null, 2) + "\n"),
          branch: BRANCH,
          sha: state.sha,
        }),
      });
      if (!res.ok) throw new Error();
      const out = await res.json();
      state.sha = out.content.sha;
      status.textContent = "Saved! Live on the website in about a minute.";
      showToast("Saved ✔");
    } catch {
      status.textContent = "";
      showToast("Could not save. Check your connection and try again.", true);
    }
    btn.disabled = false;
    setTimeout(() => (status.textContent = ""), 6000);
  });
});

// ---------- media managers ----------
const MEDIA_CONF = {
  hero: { folder: "media/hero", grid: "heroGrid", input: "heroUpload", label: "slider photo" },
  gallery: { folder: "media/gallery", grid: "galleryGrid", input: "galleryUpload", label: "gallery file" },
};

async function loadMedia(kind) {
  const conf = MEDIA_CONF[kind];
  const grid = $(conf.grid);
  grid.innerHTML = '<p class="mediagrid__loading">Loading…</p>';
  try {
    const res = await gh(`/contents/${conf.folder}?ref=${BRANCH}`);
    if (res.status === 404) {
      grid.innerHTML = '<p class="mediagrid__empty">Nothing here yet — upload your first files with the gold button above.</p>';
      return;
    }
    if (!res.ok) throw new Error();
    const files = (await res.json()).filter(
      (f) => f.type === "file" && (IMG_EXT.test(f.name) || VID_EXT.test(f.name))
    );
    if (!files.length) {
      grid.innerHTML = '<p class="mediagrid__empty">Nothing here yet — upload your first files with the gold button above.</p>';
      return;
    }
    grid.innerHTML = "";
    files.forEach((f) => grid.appendChild(mediaCard(kind, f)));
  } catch {
    grid.innerHTML = '<p class="mediagrid__empty">Could not load files. Check your connection and refresh.</p>';
  }
}

function mediaCard(kind, f) {
  const conf = MEDIA_CONF[kind];
  const card = document.createElement("div");
  card.className = "mediacard";

  const thumb = document.createElement("div");
  thumb.className = "mediacard__thumb";
  if (VID_EXT.test(f.name)) {
    const vid = document.createElement("video");
    vid.src = f.download_url;
    vid.muted = true;
    vid.preload = "metadata";
    thumb.appendChild(vid);
    const badge = document.createElement("span");
    badge.className = "isvideo";
    badge.textContent = "▶";
    thumb.appendChild(badge);
  } else {
    const img = document.createElement("img");
    img.src = f.download_url;
    img.alt = f.name;
    img.loading = "lazy";
    thumb.appendChild(img);
  }
  card.appendChild(thumb);

  const body = document.createElement("div");
  body.className = "mediacard__body";
  const name = document.createElement("p");
  name.className = "mediacard__name";
  name.textContent = f.name;
  body.appendChild(name);

  const del = document.createElement("button");
  del.className = "mediacard__del";
  del.textContent = "Delete";
  del.addEventListener("click", async () => {
    if (!confirm(`Delete "${f.name}" from the website?`)) return;
    del.disabled = true;
    del.textContent = "Deleting…";
    try {
      const res = await gh(`/contents/${conf.folder}/${encodeURIComponent(f.name)}`, {
        method: "DELETE",
        body: JSON.stringify({
          message: `Delete ${conf.label}: ${f.name} (via admin)`,
          sha: f.sha,
          branch: BRANCH,
        }),
      });
      if (!res.ok) throw new Error();
      card.remove();
      showToast(`Deleted ${f.name} ✔`);
    } catch {
      del.disabled = false;
      del.textContent = "Delete";
      showToast("Could not delete. Try again.", true);
    }
  });
  body.appendChild(del);
  card.appendChild(body);
  return card;
}

Object.entries(MEDIA_CONF).forEach(([kind, conf]) => {
  $(conf.input).addEventListener("change", async (e) => {
    const files = [...e.target.files];
    e.target.value = "";
    if (!files.length) return;

    const tooBig = files.filter((f) => f.size > 45 * 1024 * 1024);
    if (tooBig.length) {
      showToast(`${tooBig[0].name} is too large (max ~45 MB). Please compress it first.`, true);
      return;
    }

    let done = 0;
    showToast(`Uploading ${files.length} file${files.length > 1 ? "s" : ""}…`);
    for (const file of files) {
      const name = sanitizeName(file.name);
      try {
        const content = await fileToBase64(file);
        const res = await gh(`/contents/${conf.folder}/${encodeURIComponent(name)}`, {
          method: "PUT",
          body: JSON.stringify({
            message: `Upload ${conf.label}: ${name} (via admin)`,
            content,
            branch: BRANCH,
          }),
        });
        if (!res.ok && res.status !== 422) throw new Error();
        if (res.status === 422) {
          showToast(`"${name}" already exists — rename the file and try again.`, true);
          continue;
        }
        done++;
        showToast(`Uploaded ${done} of ${files.length}…`);
      } catch {
        showToast(`Could not upload ${name}. Try again.`, true);
      }
    }
    if (done) showToast(`${done} file${done > 1 ? "s" : ""} uploaded ✔ Live in about a minute.`);
    loadMedia(kind);
  });
});
