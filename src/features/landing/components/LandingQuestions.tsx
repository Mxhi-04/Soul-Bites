import styles from "./LandingQuestions.module.css";

const QUESTIONS = [
  {
    question: "Can I place an order yet?",
    answer:
      "You can build a cart and save a sample order. Live ordering and payments are coming later.",
  },
  {
    question: "How do I find a dish that fits my diet?",
    answer:
      "The menu is vegetarian. Use the dietary filter to find vegan or gluten-free options, and open Dish details for ingredients. Check allergens with the kitchen before placing a live order.",
  },
  {
    question: "Where will Soul Bites deliver?",
    answer:
      "Delivery areas and kitchen hours will be published when live ordering opens.",
  },
];

export function LandingQuestions() {
  return (
    <section
      className={styles.section}
      id="questions"
      aria-labelledby="questions-title"
    >
      <div className={styles.inner}>
        <div>
          <p className={styles.label}>03 / Before you dig in</p>
          <h2 id="questions-title">
            Good to
            <br />
            <em>know.</em>
          </h2>
          <a href="#menu" className={styles.link}>
            Back to the menu <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className={styles.list}>
          {QUESTIONS.map(({ question, answer }) => (
            <details key={question}>
              <summary>
                {question}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
