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
    question: "What is the Serenity Journal?",
    answer: "The Serenity Journal is a guided reflection journal with prompts designed to deepen your Scripture experience. It includes 96 emotion-based journal prompts that help you process feelings through faith-centered writing exercises, making it the perfect companion to your scrolls.",
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
    question: "How do I start journaling?",
    answer: "Start by choosing how you feel in the moment, then draw a scroll from that color category. Read the Scripture verse, reflect on its meaning in your life, and use the accompanying journal prompt to write your thoughts. Even 5-10 minutes of prompted journaling can provide clarity and peace.",
  },
  {
    question: "What is the AI Servant feature?",
    answer: "The AI Servant is a digital companion available to product owners. It provides personalized Scripture-based guidance, helps you explore the meaning of verses, and offers prayer prompts based on your current emotional needs. Access is included with purchase of the Reflection Journal.",
  },
  {
    question: "What are the benefits of a gratitude journal?",
    answer: "A gratitude journal helps you develop a consistent thankfulness practice, reduces anxiety, and shifts focus toward blessings. Our Serenity Scrolls includes gold-colored gratitude scrolls with 16 prompts specifically designed to cultivate appreciation through Scripture.",
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
  {
    question: "What does the Bible say about artificial intelligence?",
    answer: "The Bible does not mention artificial intelligence directly, but Scripture speaks clearly about wisdom, knowledge, human responsibility, and how we use what we create. Humans are creators made in God's image (Genesis 1:27), but we are not the Creator. Proverbs teaches that wisdom matters more than raw knowledge. Technology itself is neutral; the heart behind it matters. Genesis 2:15 calls us to steward creation with care and accountability, and Proverbs 4:23 reminds us to guard our hearts. The Bible encourages us to ask: Is this aligned with love? Is it truthful? Does it honor human dignity?",
  },
  {
    question: "Is it okay for Christians to use AI?",
    answer: "The Bible does not mention AI directly, so the answer comes down to wisdom and heart posture. Most Christian thinkers would say yes, it is okay for Christians to use AI, but how it is used matters deeply. Key principles include: Does it reflect love? Does it support truth? Does it replace healthy dependence on prayer and real relationships? Is it used with humility? AI is a tool that can be used for learning, creativity, work, and serving others. For Christians, the deeper question is: Does my use of this tool reflect Christ's character?",
  },
  {
    question: "Is AI mentioned in the book of Revelation?",
    answer: "No, artificial intelligence is not mentioned in the book of Revelation. Revelation was written in the first century and uses symbolic language to describe spiritual realities, persecution, judgment, and hope. Some readers point to symbolic passages like the 'image of the beast' in Revelation 13 and speculate about modern technology, but most biblical scholars understand Revelation as highly symbolic and focused on spiritual allegiance and faithfulness, not technical predictions of modern inventions.",
  },
  {
    question: "Where is AI mentioned in the Bible?",
    answer: "AI is not mentioned anywhere in the Bible. The word 'artificial intelligence' does not appear, and there are no direct references to computers, software, or modern technology. However, the Bible does talk about themes that relate to how we think about AI: wisdom and knowledge, human creativity, power and responsibility, truth and deception, and stewardship over what we build. Biblical principles can guide how people think about using and developing technology.",
  },
  {
    question: "Why is Matthew 17:21 missing from some Bibles?",
    answer: "Matthew 17:21 is missing in some modern Bible versions because the earliest and most reliable Greek manuscripts of the Gospel of Matthew do not contain that verse. Scholars believe the verse was likely added later by a copyist, possibly harmonized from a similar passage in Mark 9:29. Modern translations aim to reflect the earliest available manuscripts. When a verse appears in later manuscripts but not the earliest, translators usually omit it from the main text and add it as a footnote. Nothing doctrinal is changed by this verse.",
  },
  {
    question: "What does 444 mean in the Bible?",
    answer: "The number 444 does not have a specific meaning connected to Jesus or a symbolic meaning in Scripture. In modern culture, some people associate repeating numbers like 444 with 'angel numbers' or spiritual signs, but these ideas do not come from the Bible. Jesus did not teach that repeating numbers carry hidden messages. If someone keeps noticing 444, it is usually pattern recognition, as the human brain is wired to notice repetition. The Bible does have numbers with symbolic meaning, but 444 is not one of them.",
  },
  {
    question: "What is the difference between Servant 1.0 and Servant 2.0?",
    answer: "Servant 1.0 is the standard customer companion that provides Scripture Snapshots, gentle reflections, journal prompts, and small actionable steps based on your mood or moment. Servant 2.0 (Servant+) is the advanced version that adds emotional intelligence (EQ) mapping, virtue-based reflections, and insights from the Serenity Leadership Framework. It connects each mood to an EQ dimension and related virtue for deeper self-awareness and growth.",
  },
  {
    question: "What Bible translation do the Scrolls use?",
    answer: "We primarily use the New International Version (NIV) for its balance of accuracy and readability. Some verses may include the English Standard Version (ESV) or King James Version (KJV) when they particularly resonate with the emotional context of the scroll.",
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
