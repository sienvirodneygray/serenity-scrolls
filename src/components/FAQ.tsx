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
    question: "What is a journal with prompts and how does Serenity Scrolls include them?",
    answer: "A journal with prompts is a guided journaling tool that provides thought-provoking questions or statements to inspire deeper reflection. Our Serenity Scrolls Reflection Journal includes Scripture-based journal prompts for each emotion category, helping you process feelings through faith-centered writing exercises.",
  },
  {
    question: "How do I use the Serenity Scrolls Tube?",
    answer: "Simply identify how you're feeling, find the corresponding color section, and draw a scroll. Read the verse, meditate on it, and let Scripture guide you through your emotions. Many people use it during morning devotions, when facing challenges, or as a family activity.",
  },
  {
    question: "What are good journal prompts for beginners?",
    answer: "Great journal prompts for beginners include questions like 'What am I grateful for today?', 'What emotion am I feeling right now?', and 'What Scripture speaks to my current situation?' Our Reflection Journal provides 96 emotion-based prompts that guide you through meaningful self-reflection rooted in faith.",
  },
  {
    question: "What emotions are covered?",
    answer: "The scrolls are organized into 6 emotional categories: Grateful (gold), Frustrated (red), Anxious (purple), Happy (yellow), Sad (blue), and Troubled (gray). Each category contains 16 carefully selected Bible verses with corresponding journal entry prompts.",
  },
  {
    question: "How do I start journaling with prompts?",
    answer: "Start by choosing how you feel in the moment, then draw a scroll from that color category. Read the Scripture verse, reflect on its meaning in your life, and use the accompanying journal prompt to write your thoughts. Even 5-10 minutes of prompted journaling can provide clarity and peace.",
  },
  {
    question: "What is the AI Servant feature?",
    answer: "The AI Servant is a digital companion available to product owners. It provides personalized Scripture-based guidance, helps you explore the meaning of verses, and offers prayer prompts based on your current emotional needs. Access is included with purchase of the Reflection Journal.",
  },
  {
    question: "What are the benefits of a gratitude journal with prompts?",
    answer: "A gratitude journal with prompts helps you develop a consistent thankfulness practice, reduces anxiety, and shifts focus toward blessings. Our Serenity Scrolls includes gold-colored gratitude scrolls with 16 prompts specifically designed to cultivate appreciation through Scripture.",
  },
  {
    question: "How do I get access to the AI Servant?",
    answer: "Each Reflection Journal includes a unique access code. After signing up on our website, enter your code in the Servant Access section. If you purchased the tube on Amazon, you can request access by providing your order ID.",
  },
  {
    question: "What should I include in a journal entry?",
    answer: "A meaningful journal entry can include your current emotions, a Scripture reflection, prayers, gratitude lists, and responses to prompts. Our journal provides structure with dedicated spaces for each element, making it easy to create consistent, spiritually enriching entries.",
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
    question: "What types of journals are best for personal growth?",
    answer: "The best journals for personal growth combine guided prompts with flexibility. Faith-based journals like our Serenity Scrolls Reflection Journal offer structure through Scripture-based prompts while allowing space for personal expression, mood tracking, and spiritual reflection.",
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
