import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Melinda G.",
    role: "Verified Purchase",
    content: "Beyond my expectations! I got so engrossed I sat down and read through every one of that color. It's like your own personal Devo in a can! I can see using this for a study group or Bible class or as a great gift for someone who needs a pick me up.",
    rating: 5,
  },
  {
    name: "Pam Ward",
    role: "Verified Purchase",
    content: "I recently lost my husband of 34 years and have been on an emotional roller coaster. The serenity scrolls help me fill up my heart with scripture. They make it so easy for me to reach out and touch God's word and to receive God's blessings!",
    rating: 5,
  },
  {
    name: "Amazon Customer",
    role: "Verified Purchase",
    content: "Serenity Scrolls are the perfect item I didn't know I was missing. I keep some in my purse, some by the TV, and some next to the bed. They are so comforting to have within reach. I only wish I had them sooner.",
    rating: 5,
  },
];

export const Testimonials = () => {
  return (
    <section className="py-20 bg-[var(--gradient-peaceful)]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Voices of Serenity</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover how Serenity Scrolls is bringing peace to people's lives
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, idx) => (
            <Card key={idx} className="bg-card/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-[hsl(var(--happy))] text-[hsl(var(--happy))]" />
                  ))}
                </div>
                <p className="text-foreground mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Aggregate Rating Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Serenity Scrolls",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "5",
              "reviewCount": "7"
            }
          })}
        </script>
      </div>
    </section>
  );
};
