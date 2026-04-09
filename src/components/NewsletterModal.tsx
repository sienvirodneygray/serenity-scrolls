import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";

export const NewsletterModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const hasSeenModal = (typeof window !== 'undefined' ? window.sessionStorage.getItem.bind(window.sessionStorage) : () => null)("newsletter_modal_seen");
    if (!hasSeenModal) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        (typeof window !== 'undefined' ? window.sessionStorage.setItem.bind(window.sessionStorage) : () => null)("newsletter_modal_seen", "true");
      }, 30000); // 30 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("subscribers")
        .insert({ email, source: "newsletter_modal" });

      if (error) throw error;

      // Track analytics
      await supabase.from("analytics_events").insert({
        event_name: "newsletter_signup",
        properties: { source: "modal", email },
      });

      toast({
        title: "Welcome to our Serenity Circle! ✨",
        description: "Check your email for your free daily verse.",
      });

      setIsOpen(false);
      setEmail("");
    } catch (error: any) {
      toast({
        title: "Something went wrong",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-background via-secondary/30 to-background">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">Stay Inspired</DialogTitle>
          <DialogDescription className="text-center text-base">
            Join our Serenity Circle and receive a free daily verse perfectly matched to your day.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12"
          />
          <Button type="submit" disabled={isLoading} className="w-full h-12 text-lg">
            {isLoading ? "Joining..." : "Get Your Free Daily Verse"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};
