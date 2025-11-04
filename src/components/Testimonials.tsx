import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Star } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";

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
    name: "Kevin Sutton",
    role: "Verified Purchase",
    content: "Very high quality and very convenient to use when I need words of wisdom to get me and my mind where it needs to be. Excellent gift for family and close friends to assist them in getting through the daily troubles of the world that we all live in.",
    rating: 5,
  },
  {
    name: "Amazon Customer",
    role: "Verified Purchase",
    content: "Serenity Scrolls are the perfect item I didn't know I was missing. I keep some in my purse, some by the TV, and some next to the bed. They are so comforting to have within reach. I only wish I had them sooner.",
    rating: 5,
  },
  {
    name: "C&S",
    role: "Verified Purchase",
    content: "Great for the entire family!",
    rating: 5,
  },
  {
    name: "Chris Linder",
    role: "Verified Purchase",
    content: "I ordered this so my wife and I could have it around for a pick-me-up and so we could stay grounded in the Word. When it arrived we were both surprised at how well-designed it was, and the little scrolls were cute. So far we are extremely pleased and may order one or two more for family members.",
    rating: 5,
  },
  {
    name: "AMODELQUEEN",
    role: "Verified Purchase",
    content: "This is the perfect spiritual gift. The size was amazing- very large and held lots of scrolls. Very easy to use and read. Amazing bible verses and also a fun way to study. This is a great spiritual gift or even to display. Excellent value!",
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

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 60000, // 1 minute
            }),
          ]}
          className="max-w-6xl mx-auto"
        >
          <CarouselContent>
            {testimonials.map((testimonial, idx) => (
              <CarouselItem key={idx} className="md:basis-1/2 lg:basis-1/3">
                <Card className="bg-card/80 backdrop-blur-sm h-full">
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
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

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
