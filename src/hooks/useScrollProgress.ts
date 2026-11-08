import { useEffect, type RefObject } from "react";

export function useScrollProgress(
  trackRef: RefObject<HTMLElement>,
  stageRef: RefObject<HTMLElement>,
  onProgress: (progress: number) => void,
) {
  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;

    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let frame = 0;
    let previous = -1;

    const update = () => {
      frame = 0;
      if (!motion.matches) return;

      const nav = parseFloat(
        getComputedStyle(track).getPropertyValue("--nav-height"),
      );
      const { top, height } = track.getBoundingClientRect();
      const travel = height - stage.offsetHeight;
      const start = travel > 1 ? nav : window.innerHeight * 0.78;
      const range = travel > 1 ? travel : Math.min(height, start - nav);
      const progress = Math.max(
        0,
        Math.min(1, (start - top) / Math.max(1, range)),
      );

      if (progress !== previous) {
        previous = progress;
        onProgress(progress);
      }
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const motionChanged = () => {
      previous = -1;
      schedule();
    };

    const resize = new ResizeObserver(schedule);
    resize.observe(track);
    resize.observe(stage);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", motionChanged);
    schedule();
    return () => {
      resize.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", motionChanged);
    };
  }, [trackRef, stageRef, onProgress]);
}
