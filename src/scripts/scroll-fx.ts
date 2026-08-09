const reduceMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setScrollVars() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? window.scrollY / max : 0;
  document.documentElement.style.setProperty("--scroll", String(progress));
  document.documentElement.style.setProperty("--scroll-y", String(window.scrollY));
  window.dispatchEvent(
    new CustomEvent("hub:scroll", { detail: { progress, y: window.scrollY } }),
  );
}

function initReveals() {
  const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
  if (!nodes.length) return;

  if (reduceMotion() || !("IntersectionObserver" in window)) {
    nodes.forEach((n) => n.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
  );

  nodes.forEach((n) => io.observe(n));
}

function initParallax() {
  const layers = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
  if (!layers.length || reduceMotion()) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    layers.forEach((el) => {
      const speed = Number(el.dataset.parallax ?? 0.15);
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - vh / 2;
      el.style.transform = `translate3d(0, ${center * -speed}px, 0)`;
    });
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  update();
}

function initMagneticTiles() {
  const tiles = Array.from(document.querySelectorAll<HTMLElement>(".media-tile"));
  if (!tiles.length || reduceMotion()) return;
  if (window.matchMedia("(pointer: coarse)").matches) return;

  tiles.forEach((tile) => {
    const media = tile.querySelector<HTMLElement>(".media-tile-media");
    tile.addEventListener("pointermove", (event) => {
      const rect = tile.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      tile.style.setProperty("--tilt-x", `${(-y * 8).toFixed(2)}deg`);
      tile.style.setProperty("--tilt-y", `${(x * 10).toFixed(2)}deg`);
      if (media) {
        media.style.transform = `translate3d(${x * 10}px, ${y * 10}px, 0) scale(1.04)`;
      }
    });
    tile.addEventListener("pointerleave", () => {
      tile.style.setProperty("--tilt-x", "0deg");
      tile.style.setProperty("--tilt-y", "0deg");
      if (media) media.style.transform = "";
    });
  });
}

function initHorizontalDrag() {
  const tracks = Array.from(document.querySelectorAll<HTMLElement>("[data-hscroll]"));
  tracks.forEach((track) => {
    let down = false;
    let startX = 0;
    let startScroll = 0;

    track.addEventListener("pointerdown", (e) => {
      down = true;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.setPointerCapture(e.pointerId);
      track.classList.add("is-dragging");
    });
    track.addEventListener("pointermove", (e) => {
      if (!down) return;
      track.scrollLeft = startScroll - (e.clientX - startX);
    });
    const end = () => {
      down = false;
      track.classList.remove("is-dragging");
    };
    track.addEventListener("pointerup", end);
    track.addEventListener("pointercancel", end);
  });
}

export function initScrollFx() {
  setScrollVars();
  window.addEventListener("scroll", setScrollVars, { passive: true });
  window.addEventListener("resize", setScrollVars);
  initReveals();
  initParallax();
  initMagneticTiles();
  initHorizontalDrag();
}

initScrollFx();
document.addEventListener("astro:page-load", initScrollFx);
