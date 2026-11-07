import { useEffect, useRef } from "react";
import type { MenuItem } from "../../menu/types/menuTypes";
import { formatCurrency } from "../../../utils/formatters";
import styles from "./LandingHero.module.css";

const STICKY_QUERY = "(min-width: 900px) and (min-height: 600px)";
const ARTWORK_SIZES =
  "(max-width: 639px) min(calc(78vw - 38px), 320px), (max-width: 899px) 44vw, min(46vw, 58svh, 650px)";
const ARTWORK_SET =
  "/images/landing/smash-stack-500.webp 500w, /images/landing/smash-stack-620.webp 620w, /images/landing/smash-stack.webp 1040w";

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
    let stop = () => {};

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

    async function setup() {
      const current = ++revision;
      if (!motion.matches || !track || !stage || !canvas || !artwork) return;

      try {
        await artwork.decode();
        if (current !== revision) return;
        const { createBurgerScene } = await import("../services/burgerScene");
        if (current !== revision) return;
        const scene = createBurgerScene(canvas, artwork);
        if (!scene) return;

        const pinned = sticky.matches;
        let frame = 0;
        let lastProgress = -1;
        const draw = () => {
          frame = 0;
          if (document.hidden) return;
          const rect = track.getBoundingClientRect();
          const navHeight = parseFloat(
            getComputedStyle(track).getPropertyValue("--nav-height"),
          );
          const range = pinned
            ? track.offsetHeight - stage.offsetHeight
            : Math.min(track.offsetHeight * 0.7, window.innerHeight * 0.65);
          if (
            rect.bottom <= navHeight ||
            rect.top >= window.innerHeight ||
            range <= 0
          )
            return;
          const progress = Math.max(
            0,
            Math.min(1, (navHeight - rect.top) / range),
          );
          if (Math.abs(lastProgress - progress) < 0.0001) return;
          lastProgress = progress;

          const width = canvas.clientWidth;
          const height = canvas.clientHeight;
          if (!width || !height) return;
          scene.draw(progress, width, height, artwork.clientWidth);
          stage.style.setProperty("--scene-progress", progress.toFixed(4));
          if (pinned)
            stage.dataset.chapter =
              progress < 0.38 ? "1" : progress < 0.72 ? "2" : "3";
          track.dataset.motion = "webgl";
        };
        const schedule = () => {
          if (!frame) frame = window.requestAnimationFrame(draw);
        };
        const observer = new ResizeObserver(() => {
          lastProgress = -1;
          schedule();
        });
        const contextLost = () => stop();

        stop = () => {
          window.cancelAnimationFrame(frame);
          observer.disconnect();
          window.removeEventListener("scroll", schedule);
          document.removeEventListener("visibilitychange", schedule);
          canvas.removeEventListener("webglcontextlost", contextLost);
          scene.dispose();
          delete track.dataset.motion;
          setLayout();
          delete stage.dataset.chapter;
          stage.style.removeProperty("--scene-progress");
        };

        // Lay out the scroll track only after texture upload succeeds.
        setLayout(pinned ? "sticky" : "compact");
        observer.observe(canvas);
        window.addEventListener("scroll", schedule, { passive: true });
        document.addEventListener("visibilitychange", schedule);
        canvas.addEventListener("webglcontextlost", contextLost);
        draw();
      } catch {
        stop();
      }
    }

    const startCompactScene = () => {
      const bounds = track.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
      window.removeEventListener("scroll", startCompactScene);
      void setup();
    };

    const applyPreferences = () => {
      revision++;
      stop();
      stop = () => {};
      window.removeEventListener("scroll", startCompactScene);
      if (!motion.matches) return;
      if (sticky.matches) void setup();
      else window.addEventListener("scroll", startCompactScene, { passive: true });
    };

    applyPreferences();
    motion.addEventListener("change", applyPreferences);
    sticky.addEventListener("change", applyPreferences);
    return () => {
      revision++;
      stop();
      window.removeEventListener("scroll", startCompactScene);
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
                Smash burgers, loaded fries, and vibrant bowls. Find your kind
                of comfort food.
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
                <p className={styles.chapterTitle}>THE SEAR.</p>
                <p className={styles.description}>
                  Two smashed patties. Crisp edges. Melted cheddar.
                </p>
              </div>
              <div className={styles.third}>
                <p className={styles.eyebrow}>03 / The finishing touch</p>
                <p className={styles.chapterTitle}>THE STACK.</p>
                <p className={styles.description}>
                  Caramelized onions and house aioli under a toasted brioche
                  bun.
                </p>
              </div>
            </div>
          </div>

          <figure className={styles.figure}>
            <div className={styles.art}>
              <div className={styles.halo} aria-hidden="true" />
              <div className={styles.wordmark} aria-hidden="true">
                SMASH
              </div>
              <img
                ref={artworkRef}
                className={styles.poster}
                src="/images/landing/smash-stack.webp"
                srcSet={ARTWORK_SET}
                sizes={ARTWORK_SIZES}
                width={1040}
                height={1040}
                alt="Double smash burger with melted cheese and a toasted sesame bun"
                {...{ fetchpriority: "high" }}
              />
              <canvas
                ref={canvasRef}
                className={styles.canvas}
                aria-hidden="true"
              />
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
                      SOUL BITES · THE SMASH EDIT ·{" "}
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
            <span className={styles.staticLabel}>Discover featured dishes</span>
            <span className={styles.motionLabel}>Skip to featured dishes</span>
          </a>
          <div className={styles.progress} aria-hidden="true">
            <span className={styles.progressHint}>Scroll to build</span>
            <span className={styles.firstNumber}>01</span>
            <span className={styles.second}>02</span>
            <span className={styles.third}>03</span>
            <span className={styles.progressRail} />
            <span>03</span>
          </div>
          <span className={styles.preview}>Menu preview</span>
        </div>
      </div>
    </section>
  );
}
