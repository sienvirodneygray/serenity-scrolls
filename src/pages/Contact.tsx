import { Navbar } from "@/components/Navbar";
import { Mail, MessageCircle, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Contact = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
            <p className="text-xl text-muted-foreground">
              We'd love to hear from you. Whether you have a question, need help, or just want to share your story — reach out anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-card rounded-xl p-6 text-center shadow-sm border border-border hover:shadow-md transition-shadow">
              <Mail className="h-10 w-10 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">Email Us</h3>
              <a
                href="mailto:info@serenityscrolls.faith"
                className="text-primary hover:underline font-medium"
              >
                info@serenityscrolls.faith
              </a>
              <p className="text-sm text-muted-foreground mt-2">
                We typically respond within 24 hours.
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 text-center shadow-sm border border-border hover:shadow-md transition-shadow">
              <MessageCircle className="h-10 w-10 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">AI Servant Support</h3>
              <p className="text-sm text-muted-foreground">
                Need help with your AI Servant access code or subscription?
              </p>
              <a
                href="mailto:info@serenityscrolls.faith?subject=AI%20Servant%20Support"
                className="text-primary hover:underline text-sm font-medium mt-2 inline-block"
              >
                Email support →
              </a>
            </div>

            <div className="bg-card rounded-xl p-6 text-center shadow-sm border border-border hover:shadow-md transition-shadow">
              <Heart className="h-10 w-10 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">Share Your Story</h3>
              <p className="text-sm text-muted-foreground">
                Tell us how Serenity Scrolls has impacted your faith journey.
              </p>
              <a
                href="mailto:info@serenityscrolls.faith?subject=My%20Serenity%20Scrolls%20Story"
                className="text-primary hover:underline text-sm font-medium mt-2 inline-block"
              >
                Share now →
              </a>
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-8 text-center border border-border">
            <h2 className="text-2xl font-bold mb-3">Bulk & Church Orders</h2>
            <p className="text-muted-foreground mb-4">
              Interested in ordering Serenity Scrolls for your church, Bible study group, or counseling center? We offer special group pricing and customization options.
            </p>
            <a
              href="mailto:info@serenityscrolls.faith?subject=Bulk%20%2F%20Church%20Order%20Inquiry"
              className="inline-block bg-primary text-primary-foreground font-semibold py-3 px-8 rounded-lg hover:opacity-90 transition-opacity"
            >
              Request Group Pricing
            </a>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
