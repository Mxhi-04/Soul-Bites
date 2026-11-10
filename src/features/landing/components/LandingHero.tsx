import { useEffect, useRef } from "react";
import type { MenuItem } from "../../menu/types/menuTypes";
import { formatCurrency } from "../../../utils/formatters";
import type { createBurgerScene } from "../services/burgerScene";
import { HeroSides } from "./HeroSides";
import styles from "./LandingHero.module.css";

const STICKY_QUERY = "(min-width: 640px) and (min-height: 600px)";
const ARTWORK_SIZES =
  "(max-width: 639px) calc(53vw - 26px), (max-width: 899px) 24vw, min(27vw, 41svh, 409px)";
const ARTWORK_SET =
  "/images/landing/aloo-burger-500.webp 500w, /images/landing/aloo-burger-720.webp 720w, /images/landing/aloo-burger.webp 1000w";

export function LandingHero({
  item,
  onAdd,
}: {
  item: MenuItem;
  onAdd: () => void;
}) {
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const artworkRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const artwork = artworkRef.current;
    if (!track || !stage || !canvas || !artwork) return;

    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const sticky = window.matchMedia(STICKY_QUERY);
    let revision = 0;
    let scene: ReturnType<typeof createBurgerScene> = null;
    let frame = 0;
    let lastProgress = -1;

    // Keep a deep-linked section aligned when the sticky track changes height.
    function setLayout(layout?: "sticky" | "compact") {
      if (!track) return;
      const anchor = document.getElementById(window.location.hash.slice(1));
      const pinnedToAnchor =
        anchor &&
        !track.contains(anchor) &&
        Math.abs(
          anchor.getBoundingClientRect().top -
            (parseFloat(getComputedStyle(anchor).scrollMarginTop) || 0),
        ) < 3;
      if (layout) track.dataset.layout = layout;
      else delete track.dataset.layout;
      if (pinnedToAnchor) anchor.scrollIntoView({ behavior: "instant" });
    }

    const draw = () => {
      frame = 0;
      if (!motion.matches || document.hidden) return;

      const rect = track.getBoundingClientRect();
      const navHeight = parseFloat(
        getComputedStyle(track).getPropertyValue("--nav-height"),
      );
      const pinned = track.dataset.layout === "sticky";
      const range = pinned
        ? track.offsetHeight - stage.offsetHeight
        : Math.min(track.offsetHeight * 0.42, window.innerHeight * 0.38);
      if (
        rect.bottom <= navHeight ||
        rect.top >= window.innerHeight ||
        range <= 0
      )
        return;

      const progress = Math.max(0, Math.min(1, (navHeight - rect.top) / range));
      if (Math.abs(lastProgress - progress) < 0.0001) return;
      lastProgress = progress;

      stage.style.setProperty("--scene-progress", progress.toFixed(4));
      if (pinned)
        stage.dataset.chapter = progress < 0.38 ? "1" : progress < 0.72 ? "2" : "3";

      if (!scene || !canvas.clientWidth || !canvas.clientHeight) return;
      scene.draw(
        progress,
        canvas.clientWidth,
        canvas.clientHeight,
        artwork.clientWidth,
      );
      track.dataset.motion = "webgl";
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(draw);
    };
    const redraw = () => {
      lastProgress = -1;
      schedule();
    };
    const clearScene = () => {
      scene?.dispose();
      scene = null;
      delete track.dataset.motion;
      delete stage.dataset.chapter;
      setLayout();
    };
    const showStill = () => {
      clearScene();
      track.dataset.motion = "still";
      redraw();
    };

    const setup = async () => {
      const current = ++revision;
      if (!motion.matches) return;

      try {
        const ingredients = new Image();
        ingredients.src = "/images/landing/aloo-ingredients.webp";
        const [{ createBurgerScene }] = await Promise.all([
          import("../services/burgerScene"),
          ingredients.decode(),
        ]);
        if (current !== revision) return;
        scene = createBurgerScene(canvas, ingredients);
        if (!scene) {
          showStill();
          return;
        }

        // Pin the hero only when its WebGL texture is ready.
        setLayout(sticky.matches ? "sticky" : "compact");
        redraw();
      } catch {
        showStill();
      }
    };

    const startCompactScene = () => {
      const bounds = track.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
      window.removeEventListener("scroll", startCompactScene);
      void setup();
    };

    const applyPreferences = () => {
      revision++;
      clearScene();
      window.removeEventListener("scroll", startCompactScene);
      stage.style.removeProperty("--scene-progress");
      if (!motion.matches) return;

      if (sticky.matches) void setup();
      else window.addEventListener("scroll", startCompactScene, { passive: true });
      redraw();
    };

    const observer = new ResizeObserver(redraw);
    observer.observe(canvas);
    window.addEventListener("scroll", schedule, { passive: true });
    document.addEventListener("visibilitychange", schedule);
    canvas.addEventListener("webglcontextlost", showStill);
    motion.addEventListener("change", applyPreferences);
    sticky.addEventListener("change", applyPreferences);
    applyPreferences();

    return () => {
      revision++;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      clearScene();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("scroll", startCompactScene);
      document.removeEventListener("visibilitychange", schedule);
      canvas.removeEventListener("webglcontextlost", showStill);
      motion.removeEventListener("change", applyPreferences);
      sticky.removeEventListener("change", applyPreferences);
    };
  }, []);

  return (
    <section
      ref={trackRef}
      className={styles.track}
      id="top"
      aria-labelledby="landing-title"
    >
      <div ref={stageRef} className={styles.stage}>
        <div className={styles.layout}>
          <div className={styles.copyArea}>
            <div className={styles.intro}>
              <p className={styles.eyebrow}>
                <span /> The Soul Bites kitchen
              </p>
              <h1 id="landing-title" className={styles.title}>
                Big bites. <em>Big soul.</em>
              </h1>
              <p className={styles.description}>
                Aloo tikki burgers, loaded fries, and vibrant bowls from our
                vegetarian kitchen.
              </p>
              <div className={styles.actions}>
                <a className={styles.primary} href="#menu">
                  Explore the menu <span aria-hidden="true">↗</span>
                </a>
                <button
                  className={styles.secondary}
                  type="button"
                  onClick={onAdd}
                  aria-label={`Add to cart: ${item.name}, ${formatCurrency(item.price)}`}
                >
                  Add to cart <span aria-hidden="true">+</span>
                </button>
              </div>
            </div>
            <div className={styles.chapter} aria-hidden="true">
              <div className={styles.second}>
                <p className={styles.eyebrow}>02 / From the griddle</p>
                <p className={styles.chapterTitle}>THE CRUNCH.</p>
                <p className={styles.description}>
                  Golden potato and pea tikki, crisp lettuce, and vegetarian cheddar.
                </p>
              </div>
              <div className={styles.third}>
                <p className={styles.eyebrow}>03 / The finishing touch</p>
                <p className={styles.chapterTitle}>THE STACK.</p>
                <p className={styles.description}>
                  Fresh tomato and red onion under a toasted sesame bun.
                </p>
              </div>
            </div>
          </div>

          <figure className={styles.figure}>
            <div className={styles.art}>
              <div className={styles.halo} aria-hidden="true" />
              <div className={styles.wordmark} aria-hidden="true">
                TIKKI
              </div>
              <div className={styles.platter}>
                <HeroSides />
                <img
                  className={styles.heel}
                  src="/images/landing/aloo-bun.webp"
                  width={500}
                  height={500}
                  alt=""
                  aria-hidden="true"
                />
                <img
                  ref={artworkRef}
                  className={styles.poster}
                  src="/images/landing/aloo-burger.webp"
                  srcSet={ARTWORK_SET}
                  sizes={ARTWORK_SIZES}
                  width={1000}
                  height={1000}
                  alt="Aloo tikki burger with lettuce, tomato, red onion, and vegetarian cheddar"
                  {...{ fetchpriority: "high" }}
                />
                <canvas
                  ref={canvasRef}
                  className={styles.canvas}
                  aria-hidden="true"
                />
              </div>
              <div className={styles.stamp} aria-hidden="true">
                <svg viewBox="0 0 120 120">
                  <defs>
                    <path
                      id="soul-stamp-ring"
                      d="M 60,60 m -41,0 a 41,41 0 1,1 82,0 a 41,41 0 1,1 -82,0"
                    />
                  </defs>
                  <circle cx="60" cy="60" r="57" />
                  <circle cx="60" cy="60" r="33" />
                  <text>
                    <textPath href="#soul-stamp-ring" textLength="255">
                      SOUL BITES · THE TIKKI EDIT ·{" "}
                    </textPath>
                  </text>
                  <path
                    className={styles.stampStar}
                    d="M60 38 65 55 82 60 65 65 60 82 55 65 38 60 55 55Z"
                  />
                </svg>
              </div>
            </div>
            <figcaption className={styles.caption}>
              <span>{item.name}</span>
              <span>{formatCurrency(item.price)}</span>
            </figcaption>
          </figure>
        </div>
        <div className={styles.bottom}>
          <a href="#featured" className={styles.skip}>
            <span aria-hidden="true">↓</span>
            <span>Discover featured dishes</span>
          </a>
          <div className={styles.progress} aria-hidden="true">
            <span className={styles.progressHint}>Scroll to build</span>
            <span className={styles.firstNumber}>01</span>
            <span className={styles.second}>02</span>
            <span className={styles.third}>03</span>
            <span className={styles.progressRail} />
            <span>03</span>
          </div>
          <span className={styles.preview}>Vegetarian kitchen</span>
        </div>
      </div>
    </section>
  );
}
