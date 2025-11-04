import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah M.",
    role: "Teacher",
    content: "These scrolls have become my daily companion. When I'm feeling overwhelmed, I pull out an 'anxious' scroll and find instant peace. The color-coding is genius!",
    rating: 5,
  },
  {
    name: "Michael T.",
    role: "Pastor",
    content: "I recommend Serenity Scrolls to everyone in my congregation. The reflection journal has transformed how we approach Scripture in times of need.",
    rating: 5,
  },
  {
    name: "Jennifer L.",
    role: "Nurse",
    content: "After stressful shifts, I use these scrolls to center myself. The 'grateful' verses remind me of life's blessings. Perfect gift for anyone seeking peace.",
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
              "reviewCount": "127"
            }
          })}
        </script>
      </div>
    </section>
  );
};
