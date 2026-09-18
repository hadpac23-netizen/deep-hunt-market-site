(() => {
  "use strict";

  const hero = document.querySelector(".hd-hero");
  if (!hero || hero.querySelector(".hunt-city-reel")) return;

  const cities = [
    {
      name: "Tokyo · Japan",
      image: "https://images.pexels.com/photos/31558042/pexels-photo-31558042.jpeg?auto=compress&cs=tinysrgb&w=2400"
    },
    {
      name: "Paris · France",
      image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=2400&q=86"
    },
    {
      name: "Shenzhen · China",
      image: "https://images.unsplash.com/photo-1558008258-3256797b43f3?auto=format&fit=crop&w=2400&q=86"
    },
    {
      name: "Dubai · UAE",
      image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2400&q=86"
    },
    {
      name: "Singapore · Marina Bay",
      image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=2400&q=86"
    },
    {
      name: "Seoul · South Korea",
      image: "https://images.unsplash.com/photo-1538485399081-7c897e24c3e2?auto=format&fit=crop&w=2400&q=86"
    },
    {
      name: "New York · USA",
      image: "https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=2400&q=86"
    }
  ];

  const reel = document.createElement("div");
  reel.className = "hunt-city-reel";
  reel.setAttribute("aria-hidden", "true");
  reel.innerHTML = '<div class="hunt-city-frame is-active"></div><div class="hunt-city-frame"></div><div class="hunt-city-shade"></div>';
  hero.prepend(reel);

  const label = document.createElement("div");
  label.className = "hunt-city-label";
  label.setAttribute("aria-hidden", "true");
  hero.append(label);

  const frames = [...reel.querySelectorAll(".hunt-city-frame")];
  let cityIndex = 0;
  let activeFrame = 0;
  let timer = null;

  function preload(index) {
    const image = new Image();
    image.decoding = "async";
    image.src = cities[index % cities.length].image;
  }

  function paint(frame, city) {
    frame.style.backgroundImage = 'url("' + city.image + '")';
  }

  function show(index, immediate = false) {
    const city = cities[index % cities.length];
    const nextFrame = immediate ? activeFrame : 1 - activeFrame;
    paint(frames[nextFrame], city);
    label.textContent = "HUNT NIGHT · " + city.name;

    requestAnimationFrame(() => {
      frames[nextFrame].classList.add("is-active");
      frames[activeFrame].classList.toggle("is-active", immediate);
      if (!immediate) activeFrame = nextFrame;
    });

    preload(index + 1);
  }

  show(0, true);

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => {
        cityIndex = (cityIndex + 1) % cities.length;
        show(cityIndex);
      }, 7800);
    };

    start();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) window.clearInterval(timer);
      else start();
    });
  }
})();
