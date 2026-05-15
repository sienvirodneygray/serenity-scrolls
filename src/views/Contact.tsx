import { Navbar } from "@/components/Navbar";
import { Mail, MessageCircle, Heart } from "lucide-react";
import Link from "next/link";

const Contact = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Contact Serenity Scrolls</h1>
            <p className="text-xl text-muted-foreground">
              Have a question about Serenity Scrolls, your order, the Reflection Journal, or AI Servant access? We're here to help with calm, practical support.
            </p>
          </div>

          <section className="mb-12 space-y-5 text-foreground/80 leading-relaxed">
            <p>
              Use the contact options below for customer support, product questions, church or group gifting, wholesale interest, preorder questions, or technical help unlocking your Scripture-based companion. Serenity Scrolls exists to help people meet real emotions with Scripture, so we treat support messages with the same care: clear answers, gentle tone, and next steps you can actually use.
            </p>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-xl font-semibold mb-2">Customer Support</h2>
                <p className="text-sm text-muted-foreground">
                  Send us questions about Serenity Scrolls products, Bible verse scrolls, gifting, returns, delivery, or general website help. Include your order email and order number when you have them so we can find the right record quickly.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-xl font-semibold mb-2">Order Help</h2>
                <p className="text-sm text-muted-foreground">
                  Need help with checkout, your cart, shipping details, order status, or a purchase confirmation? Email us with your name, order number, and the best reply address.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-xl font-semibold mb-2">AI Servant Access Help</h2>
                <p className="text-sm text-muted-foreground">
                  If you are unlocking AI Servant access, renewing a subscription, or verifying a qualifying purchase, tell us what step you reached and any error message you saw.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-xl font-semibold mb-2">Journal Preorder Questions</h2>
                <p className="text-sm text-muted-foreground">
                  Ask about the Christian Reflection Journal, preorder availability, journal prompts, Scripture reflection pages, or how the journal pairs with Serenity Scrolls.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-xl font-semibold mb-2">Wholesale, Church & Group Gifting</h2>
                <p className="text-sm text-muted-foreground">
                  Churches, Bible study leaders, counselors, schools, and group organizers can ask about bulk gifting, wholesale interest, and Scripture encouragement resources for groups.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-xl font-semibold mb-2">Response Time</h2>
                <p className="text-sm text-muted-foreground">
                  We usually reply within 24-48 business hours. For the fastest answer, choose the email subject that fits your request and include any order or access details in your first message.
                </p>
              </div>
            </div>
          </section>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-card rounded-xl p-6 text-center shadow-sm border border-border hover:shadow-md transition-shadow flex flex-col items-center">
              <Mail className="h-10 w-10 mb-4 text-primary" />
              <h2 className="font-semibold text-lg mb-2">Email Us</h2>
              <p className="text-sm text-muted-foreground flex-1">
                For order support, product questions, and customer service.
              </p>
              <a
                href="mailto:info@serenityscrolls.faith"
                className="text-primary hover:underline font-medium text-sm mt-4 inline-block"
              >
                info@serenityscrolls.faith
              </a>
            </div>

            <div className="bg-card rounded-xl p-6 text-center shadow-sm border border-border hover:shadow-md transition-shadow flex flex-col items-center">
              <MessageCircle className="h-10 w-10 mb-4 text-primary" />
              <h2 className="font-semibold text-lg mb-2">AI Servant Support</h2>
              <p className="text-sm text-muted-foreground flex-1">
                Need help with your AI Servant access code, verification, or subscription?
              </p>
              <a
                href="mailto:info@serenityscrolls.faith?subject=AI%20Servant%20Support"
                className="text-primary hover:underline text-sm font-medium mt-4 inline-block"
              >
                Email support
              </a>
            </div>

            <div className="bg-card rounded-xl p-6 text-center shadow-sm border border-border hover:shadow-md transition-shadow flex flex-col items-center">
              <Heart className="h-10 w-10 mb-4 text-primary" />
              <h2 className="font-semibold text-lg mb-2">Share Your Story</h2>
              <p className="text-sm text-muted-foreground flex-1">
                Tell us how Serenity Scrolls has supported your faith journey.
              </p>
              <a
                href="mailto:info@serenityscrolls.faith?subject=My%20Serenity%20Scrolls%20Story"
                className="text-primary hover:underline text-sm font-medium mt-4 inline-block"
              >
                Share now
              </a>
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-8 text-center border border-border">
            <h2 className="text-2xl font-bold mb-3">Bulk & Church Orders</h2>
            <p className="text-muted-foreground mb-4">
              Interested in ordering Serenity Scrolls for your church, Bible study group, counseling center, or encouragement ministry? Email us with your estimated quantity, timeline, and gifting context.
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
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
