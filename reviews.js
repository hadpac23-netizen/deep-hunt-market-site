(() => {
  const H = window.HuntCore;
  const sb = window.supabase;
  if (!H || !sb?.createClient) return;

  const SUPABASE_URL = "https://zszlnahjqmwozwubetkm.supabase.co";
  const client = sb.createClient(SUPABASE_URL, H.publishableKey);
  const params = new URLSearchParams(location.search);
  const provider = (params.get("provider") || "").trim();
  const itemId = (params.get("id") || params.get("product_id") || "").trim();
  if (!provider || !itemId) return;

  const $ = q => document.querySelector(q);
  const esc = H.esc;
  let selectedRating = 0;
  let selectedFiles = [];
  let session = null;
  let ownExisting = null;

  function stars(value) {
    const n = Math.max(0, Math.min(5, Number(value) || 0));
    return Array.from({length:5}, (_,i) => i < Math.round(n) ? "★" : "☆").join("");
  }

  function dateLabel(value) {
    try {
      return new Intl.DateTimeFormat(undefined, {year:"numeric",month:"short",day:"numeric"}).format(new Date(value));
    } catch { return ""; }
  }

  function publicImage(path) {
    return client.storage.from("hunt-review-images").getPublicUrl(path).data.publicUrl;
  }

  function setStatus(text, type="") {
    const el = $("#hd-review-status");
    if (!el) return;
    el.textContent = text || "";
    el.dataset.type = type;
  }

  function renderStarsInput() {
    const host = $("#hd-review-star-input");
    if (!host) return;
    host.innerHTML = Array.from({length:5}, (_,i) => {
      const value = i + 1;
      const active = value <= selectedRating;
      return `<button type="button" class="${active ? "active" : ""}" data-review-rating="${value}" aria-label="Rate ${value} out of 5">${active ? "★" : "☆"}</button>`;
    }).join("");
  }

  function renderFilePreview() {
    const host = $("#hd-review-file-preview");
    if (!host) return;
    host.innerHTML = selectedFiles.map((file,i) => {
      const url = URL.createObjectURL(file);
      return `<figure><img src="${url}" alt="Selected review photo ${i+1}"><button type="button" data-remove-review-photo="${i}" aria-label="Remove selected photo">&times;</button></figure>`;
    }).join("");
  }  function reviewCard(review) {
    const isOwn = session?.user?.id === review.user_id;
    const pending = review.status === "pending";
    const photos = Array.isArray(review.image_paths) ? review.image_paths : [];
    return `<article class="hd-review-card">
      <div class="hd-review-card-head">
        <div>
          <strong>${isOwn ? "You" : "HUNT shopper"}</strong>
          <span>${dateLabel(review.created_at)}</span>
        </div>
        <div class="hd-review-stars" aria-label="${review.rating} out of 5 stars">${stars(review.rating)}</div>
      </div>
      ${review.comment ? `<p>${esc(review.comment)}</p>` : ""}
      ${photos.length ? `<div class="hd-review-photos">${photos.map(path => `<a href="${esc(publicImage(path))}" target="_blank" rel="noopener"><img src="${esc(publicImage(path))}" alt="Photo from product review" loading="lazy"></a>`).join("")}</div>` : ""}
      ${pending ? '<small class="hd-review-pending">Photos are awaiting moderation. Only you can see this review until approved.</small>' : ""}
    </article>`;
  }

  function renderSummary(reviews) {
    const published = reviews.filter(r => r.status === "published");
    const count = published.length;
    const avg = count ? published.reduce((s,r) => s + Number(r.rating || 0), 0) / count : 0;
    $("#hd-review-average").textContent = count ? avg.toFixed(1) : "—";
    $("#hd-review-summary-stars").textContent = count ? stars(avg) : "☆☆☆☆☆";
    $("#hd-review-count").textContent = count === 1 ? "1 review" : `${count} reviews`;

    const list = $("#hd-review-list");
    if (!list) return;
    if (!reviews.length) {
      list.innerHTML = '<div class="hd-review-empty">No reviews yet. Be the first to rate this product.</div>';
      return;
    }
    list.innerHTML = reviews.map(reviewCard).join("");
  }

  async function loadReviews() {
    const {data, error} = await client
      .from("product_reviews")
      .select("id,user_id,rating,comment,image_paths,status,created_at,updated_at")
      .eq("provider", provider)
      .eq("item_id", itemId)
      .order("created_at", {ascending:false})
      .limit(80);

    if (error) {
      setStatus("Reviews are temporarily unavailable.", "error");
      return;
    }

    const rows = Array.isArray(data) ? data : [];
    ownExisting = session?.user ? rows.find(r => r.user_id === session.user.id) || null : null;
    renderSummary(rows);

    if (ownExisting) {
      selectedRating = Number(ownExisting.rating) || 0;
      const comment = $("#hd-review-comment");
      if (comment) comment.value = ownExisting.comment || "";
      renderStarsInput();
      const submit = $("#hd-review-submit");
      if (submit) submit.textContent = "Update review";
    }
  }  async function uploadImages(userId) {
    const paths = [];
    for (const file of selectedFiles) {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const safeProvider = provider.replace(/[^a-z0-9_-]/gi,"_").slice(0,60);
      const safeItem = itemId.replace(/[^a-z0-9_-]/gi,"_").slice(0,100);
      const path = `${userId}/${safeProvider}_${safeItem}/${crypto.randomUUID()}.${ext}`;
      const {error} = await client.storage.from("hunt-review-images").upload(path, file, {
        contentType:file.type,
        upsert:false,
        cacheControl:"3600"
      });
      if (error) throw error;
      paths.push(path);
    }
    return paths;
  }

  async function submitReview() {
    if (!session?.user) {
      location.href = `auth.html?next=${encodeURIComponent(location.pathname + location.search + "#reviews")}`;
      return;
    }
    if (!selectedRating) {
      setStatus("Choose a rating from 1 to 5 stars.", "error");
      return;
    }

    const comment = ($("#hd-review-comment")?.value || "").trim();
    if (comment.length > 2000) {
      setStatus("Review text is too long.", "error");
      return;
    }

    const button = $("#hd-review-submit");
    if (button) button.disabled = true;
    setStatus(selectedFiles.length ? "Uploading photos…" : "Saving review…");

    let newPaths = [];
    try {
      newPaths = await uploadImages(session.user.id);
      const status = newPaths.length ? "pending" : "published";
      const payload = {
        user_id:session.user.id,
        provider,
        item_id:itemId,
        rating:selectedRating,
        comment,
        image_paths:newPaths,
        status
      };

      const oldPaths = Array.isArray(ownExisting?.image_paths) ? ownExisting.image_paths : [];
      const {error} = await client.from("product_reviews").upsert(payload, {
        onConflict:"user_id,provider,item_id"
      });
      if (error) throw error;

      if (oldPaths.length) {
        await client.storage.from("hunt-review-images").remove(oldPaths);
      }

      selectedFiles = [];
      renderFilePreview();
      setStatus(status === "pending"
        ? "Review saved. Photos will appear to everyone after moderation."
        : "Review published.", "success");
      await loadReviews();
    } catch (error) {
      if (newPaths.length) await client.storage.from("hunt-review-images").remove(newPaths);
      setStatus(error?.message || "Could not save review.", "error");
    } finally {
      if (button) button.disabled = false;
    }
  }  function bind() {
    document.addEventListener("click", event => {
      const star = event.target.closest?.("[data-review-rating]");
      if (star) {
        selectedRating = Number(star.dataset.reviewRating) || 0;
        renderStarsInput();
        return;
      }
      const remove = event.target.closest?.("[data-remove-review-photo]");
      if (remove) {
        selectedFiles.splice(Number(remove.dataset.removeReviewPhoto), 1);
        renderFilePreview();
      }
    });

    $("#hd-review-images")?.addEventListener("change", event => {
      const files = Array.from(event.target.files || []);
      const accepted = files.filter(file =>
        ["image/jpeg","image/png","image/webp"].includes(file.type) && file.size <= 5 * 1024 * 1024
      ).slice(0,4);
      selectedFiles = accepted;
      renderFilePreview();
      if (files.length !== accepted.length) {
        setStatus("Use up to 4 JPG, PNG or WebP images, maximum 5 MB each.", "error");
      } else {
        setStatus(accepted.length ? `${accepted.length} photo${accepted.length === 1 ? "" : "s"} selected.` : "");
      }
    });

    $("#hd-review-submit")?.addEventListener("click", submitReview);
  }

  async function init() {
    renderStarsInput();
    bind();
    const {data} = await client.auth.getSession();
    session = data.session || null;
    const signin = $("#hd-review-signin-note");
    if (signin) signin.hidden = Boolean(session?.user);
    await loadReviews();
  }

  init();
})();