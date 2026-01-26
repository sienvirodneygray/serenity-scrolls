import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is Serenity Scrolls?",
    answer: "Serenity Scrolls is a collection of 96 color-coded Bible verse scrolls organized by emotion. Each scroll contains a carefully curated Scripture passage designed to speak to your current emotional state—whether you're feeling grateful, frustrated, anxious, happy, sad, or troubled.",
  },
  {
    question: "How do I use the Serenity Scrolls Tube?",
    answer: "Simply identify how you're feeling, find the corresponding color section, and draw a scroll. Read the verse, meditate on it, and let Scripture guide you through your emotions. Many people use it during morning devotions, when facing challenges, or as a family activity.",
  },
  {
    question: "What emotions are covered?",
    answer: "The scrolls are organized into 6 emotional categories: Grateful (gold), Frustrated (red), Anxious (purple), Happy (yellow), Sad (blue), and Troubled (gray). Each category contains 16 carefully selected Bible verses.",
  },
  {
    question: "What is the AI Servant feature?",
    answer: "The AI Servant is a digital companion available to product owners. It provides personalized Scripture-based guidance, helps you explore the meaning of verses, and offers prayer prompts based on your current emotional needs. Access is included with purchase of the Reflection Journal.",
  },
  {
    question: "How do I get access to the AI Servant?",
    answer: "Each Reflection Journal includes a unique access code. After signing up on our website, enter your code in the Servant Access section. If you purchased the tube on Amazon, you can request access by providing your order ID.",
  },
  {
    question: "What Bible translation do you use?",
    answer: "We primarily use the New International Version (NIV) for its balance of accuracy and readability. Some verses may include the English Standard Version (ESV) or King James Version (KJV) when they particularly resonate with the emotional context.",
  },
  {
    question: "Is this suitable for children?",
    answer: "Absolutely! Serenity Scrolls is designed for the whole family. Children love drawing scrolls, and it's a wonderful way to introduce them to Scripture while helping them understand and process their emotions in a healthy, faith-based way.",
  },
  {
    question: "Do you offer bulk or church orders?",
    answer: "Yes! We offer special pricing for churches, Bible study groups, counseling centers, and bulk orders. Please contact us directly for group pricing and customization options.",
  },
];

export const FAQ = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about Serenity Scrolls
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-lg">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
