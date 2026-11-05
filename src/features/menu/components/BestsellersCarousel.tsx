import React, { useRef, useState, useEffect, useCallback } from "react";
import { MenuItem } from "../types/menuTypes";
import { Badge } from "../../../components/ui/Badge/Badge";
import { Button } from "../../../components/ui/Button/Button";
import { formatCurrency } from "../../../utils/formatters";
import styles from "./BestsellersCarousel.module.css";

export interface BestsellersCarouselProps {
  items: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
}

export const BestsellersCarousel: React.FC<BestsellersCarouselProps> = ({
  items,
  onAddToCart,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Filter bestseller items, ensuring the new Paneer Tikka Pizza is featured at the front
  const bestsellerItems = items.filter((item) => item.isPopular);

  const scroll = (direction: "left" | "right") => {
    if (!trackRef.current) return;
    const cardWidth = 350;
    const offset = direction === "left" ? -cardWidth : cardWidth;
    trackRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  const handleScroll = useCallback(() => {
    if (!trackRef.current) return;
    const scrollLeft = trackRef.current.scrollLeft;
    const cardWidth = 340;
    const newIndex = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.max(0, Math.min(newIndex, bestsellerItems.length - 1)));
  }, [bestsellerItems.length]);

  const scrollToIndex = (index: number) => {
    if (!trackRef.current) return;
    const cardWidth = 340;
    trackRef.current.scrollTo({ left: index * cardWidth, behavior: "smooth" });
    setActiveIndex(index);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll, { passive: true });
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  if (bestsellerItems.length === 0) return null;

  return (
    <section
      className={styles.section}
      aria-label="Bestselling Cloud Kitchen Creations"
    >
      <div className="container">
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <span className={styles.sectionPill}>🔥 Most Loved Creations</span>
            <h2 className={styles.title}>
              Our <span className={styles.titleHighlight}>Best Selling</span>{" "}
              Bites
            </h2>
            <p className={styles.subtitle}>
              Swipe through our crowd favorites, oven-fresh and delivered piping
              hot in insulated packaging.
            </p>
          </div>

          <div className={styles.navButtons}>
            <button
              className={styles.navButton}
              onClick={() => scroll("left")}
              aria-label="Previous bestselling item"
            >
              ‹
            </button>
            <button
              className={styles.navButton}
              onClick={() => scroll("right")}
              aria-label="Next bestselling item"
            >
              ›
            </button>
          </div>
        </div>

        <div className={styles.trackWrapper}>
          <div className={styles.track} ref={trackRef}>
            {bestsellerItems.map((item, index) => {
              const isSpecial = item.id === "sb-pizza-01";

              return (
                <div
                  key={item.id}
                  className={`${styles.card} ${isSpecial ? styles.featuredCard : ""}`}
                  onClick={() => onAddToCart(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onAddToCart(item);
                    }
                  }}
                  aria-label={`Add ${item.name} for ${formatCurrency(item.price)} to order`}
                >
                  <div className={styles.imageContainer}>
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className={styles.image}
                      loading="lazy"
                    />

                    <div className={styles.crownBadge}>
                      <span>★</span>
                      <span>
                        {index === 0 ? "#1 Bestseller" : "Chef's Choice"}
                      </span>
                    </div>

                    <div className={styles.prepBadge}>
                      <span>⏱ {item.preparationTimeMinutes}m</span>
                    </div>
                  </div>

                  <div className={styles.body}>
                    <div className={styles.tags}>
                      {item.dietaryTags.map((tag) => (
                        <Badge key={tag} variant={tag} />
                      ))}
                    </div>

                    <h3 className={styles.name}>{item.name}</h3>
                    <p className={styles.description}>{item.description}</p>

                    <div className={styles.footer}>
                      <div className={styles.priceTag}>
                        <span className={styles.priceLabel}>Price</span>
                        <span className={styles.priceValue}>
                          {formatCurrency(item.price)}
                        </span>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(item);
                        }}
                      >
                        + Add To Cart
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Swipe dots */}
        <div className={styles.dotsWrapper}>
          {bestsellerItems.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === activeIndex ? styles.activeDot : ""}`}
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
