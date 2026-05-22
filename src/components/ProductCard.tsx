import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
interface ProductCardProps {
  title: string;
  description: string;
  features: string[];
  image: string;
  price?: number;
  badge?: string;
  onAddToCart?: () => void;
}

export const ProductCard = ({ title, description, features, image, price, badge, onAddToCart }: ProductCardProps) => {

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-card)] hover:-translate-y-1">
      <div className="relative h-64 overflow-hidden">
        <img
          src={image}
          alt={title}
          width={800}
          height={512}
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
      <CardFooter className="flex-col gap-3">
        {price !== undefined && (
          <div className="w-full flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-foreground">${price.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground font-semibold">USD</span>
          </div>
        )}
        <div className="w-full">
          <Button
            onClick={onAddToCart}
            className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            Add to Cart
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
