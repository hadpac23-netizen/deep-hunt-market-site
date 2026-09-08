(() => {
  const endpoint = "https://zszlnahjqmwozwubetkm.supabase.co/functions/v1/hunt-partner-intake";
  const publishableKey = "sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
  const form = document.querySelector("#partner-form");
  const status = document.querySelector("#partner-form-status");
  if (!form || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    const data = new FormData(form);
    const payload = {
      company: data.get("company") || "",
      contact_name: data.get("contact_name") || "",
      email: data.get("email") || "",
      website: data.get("website") || "",
      platform: data.get("platform") || "",
      partnership_type: data.get("partnership_type") || "",
      market: data.get("market") || "",
      api_available: data.get("api_available") || "Not sure",
      message: data.get("message") || "",
      bot_field: data.get("bot-field") || "",
      authorized_to_submit: data.get("authorized_to_submit") === "on"
    };

    status.textContent = "Submitting partnership request…";
    if (submit) submit.disabled = true;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": publishableKey
        },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Request could not be submitted.");
      status.textContent = result.duplicate
        ? "Request already received recently. We’ll review it."
        : "Partnership request received. HUNT DEAL will review the technical and commercial fit.";
      form.reset();
    } catch (error) {
      status.textContent = error?.message || "Request could not be submitted.";
    } finally {
      if (submit) submit.disabled = false;
    }
  });
})();