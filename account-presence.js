(() => {
  const supabaseUrl = "https://zszlnahjqmwozwubetkm.supabase.co";
  const publishableKey = "sb_publishable_SCGT8rsQsVrAt5CtlKVMzA_wGjT2I6X";
  const desktopLinks = [...document.querySelectorAll(".hd-account-link[href='auth.html']")];
  const mobileLinks = [...document.querySelectorAll(".hd-mobile-nav a[href='auth.html']")];
  if (!desktopLinks.length && !mobileLinks.length) return;

  const safeText = value => String(value || "").trim();

  function signedOut() {
    desktopLinks.forEach(link => {
      link.classList.remove("hd-account-connected");
      link.removeAttribute("title");
      link.setAttribute("aria-label", "Sign in");
      link.replaceChildren(document.createTextNode("Sign in"));
    });
    mobileLinks.forEach(link => {
      link.classList.remove("hd-account-connected");
      const icon = link.querySelector("span");
      const label = link.querySelector("small");
      if (icon) {
        icon.replaceChildren(document.createTextNode("○"));
        icon.classList.remove("hd-mobile-avatar-wrap");
      }
      if (label) label.textContent = "Sign in";
      link.setAttribute("aria-label", "Sign in");
      link.removeAttribute("title");
    });
  }

  function signedIn(user) {
    if (!user) return signedOut();
    const meta = user.user_metadata || {};
    const name = safeText(meta.full_name || meta.name || user.email?.split("@")[0] || "HUNT user");
    const avatar = safeText(meta.avatar_url || meta.picture);
    const email = safeText(user.email);
    const label = name ? `Account — ${name}` : "Account";

    desktopLinks.forEach(link => {
      link.classList.add("hd-account-connected");
      link.replaceChildren();
      const avatarWrap = document.createElement("span");
      avatarWrap.className = "hd-account-avatar-mini";
      if (avatar) {
        const img = document.createElement("img");
        img.src = avatar;
        img.alt = "";
        img.referrerPolicy = "no-referrer";
        avatarWrap.appendChild(img);
      } else {
        avatarWrap.textContent = (name || "H").slice(0, 1).toUpperCase();
      }
      const dot = document.createElement("i");
      dot.setAttribute("aria-hidden", "true");
      avatarWrap.appendChild(dot);

      const text = document.createElement("span");
      text.className = "hd-account-link-copy";
      text.textContent = "Connected";
      link.append(avatarWrap, text);
      link.setAttribute("aria-label", label);
      link.title = email ? `${name} · ${email}` : name;
    });

    mobileLinks.forEach(link => {
      link.classList.add("hd-account-connected");
      const icon = link.querySelector("span");
      const text = link.querySelector("small");
      if (icon) {
        icon.classList.add("hd-mobile-avatar-wrap");
        icon.replaceChildren();
        if (avatar) {
          const img = document.createElement("img");
          img.src = avatar;
          img.alt = "";
          img.referrerPolicy = "no-referrer";
          icon.appendChild(img);
        } else {
          icon.textContent = (name || "H").slice(0, 1).toUpperCase();
        }
        const dot = document.createElement("i");
        dot.setAttribute("aria-hidden", "true");
        icon.appendChild(dot);
      }
      if (text) text.textContent = "Account";
      link.setAttribute("aria-label", label);
      link.title = email ? `${name} · ${email}` : name;
    });
  }

  if (!window.supabase?.createClient) {
    signedOut();
    return;
  }

  const client = window.supabase.createClient(supabaseUrl, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  });
  window.HuntAccountClient = client;

  client.auth.getSession()
    .then(({ data }) => signedIn(data?.session?.user || null))
    .catch(() => signedOut());

  client.auth.onAuthStateChange((_event, session) => signedIn(session?.user || null));
})();
