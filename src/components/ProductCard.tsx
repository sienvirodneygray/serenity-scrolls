import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface ProductCardProps {
  title: string;
  description: string;
  features: string[];
  image: string;
  amazonUrl?: string;
  badge?: string;
  onAddToCart?: () => void;
}

export const ProductCard = ({ title, description, features, image, amazonUrl, badge, onAddToCart }: ProductCardProps) => {
  const handleAmazonClick = () => {
    // Track Amazon click using global tracking function
    if (typeof (window as any).trackAmazonClick === 'function') {
      (window as any).trackAmazonClick(title, 'product_card');
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-card)] hover:-translate-y-1">
      <div className="relative h-64 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        {badge && (
          <Badge className="absolute top-4 right-4 bg-gradient-to-r from-primary to-primary-glow text-white">
            {badge}
          </Badge>
        )}
      </div>
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start">
              <span className="mr-2 text-primary">✓</span>
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        {onAddToCart && (
          <Button
            onClick={onAddToCart}
            className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Add to Cart (Ships direct via FBA)
          </Button>
        )}
        
        {amazonUrl && (
          <Button
            variant="outline"
            onClick={handleAmazonClick}
            asChild
            className="w-full h-12 text-base group"
          >
            <a href={amazonUrl} target="_blank" rel="noopener noreferrer">
              Buy on Amazon instead
              <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
