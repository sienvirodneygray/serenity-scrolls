import { Navbar } from "@/components/Navbar";
import Link from "next/link";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: March 31, 2026</p>
          <div className="space-y-6 text-foreground/80">
            <p>Serenity Scrolls ("Company," "we," "us," or "our") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains what information we collect, how we use it, how we share it, and the choices available to you when you visit or make a purchase from serenityscrolls.faith (the "Site").</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">1. Information We Collect</h2>
            <p>We may collect the following categories of information:</p>
            
            <h3 className="text-xl font-medium mt-6 mb-3 text-foreground">A. Information You Provide to Us</h3>
            <ul className="list-disc pl-6 space-y-1">
                <li>Name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Billing address</li>
                <li>Shipping address</li>
                <li>Order details</li>
                <li>Customer support messages</li>
                <li>Any other information you voluntarily provide</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3 text-foreground">B. Information Collected Automatically</h3>
            <p>When you use our Site, we may automatically collect:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>IP address</li>
                <li>Browser type</li>
                <li>Device information</li>
                <li>Pages visited</li>
                <li>Referral URLs</li>
                <li>Usage and interaction data</li>
                <li>Cookies and similar technologies</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3 text-foreground">C. Payment Information</h3>
            <p>Payments may be processed by third-party payment processors. We do not store full payment card numbers on our servers unless explicitly stated otherwise by our payment provider and checkout systems.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">2. How We Use Your Information</h2>
            <p>We may use your information to:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Process and fulfill orders</li>
                <li>Ship products and provide delivery updates</li>
                <li>Communicate with you about your order</li>
                <li>Provide customer support</li>
                <li>Improve our products, website, and customer experience</li>
                <li>Prevent fraud, abuse, and unauthorized activity</li>
                <li>Comply with legal, tax, accounting, and regulatory obligations</li>
                <li>Maintain website security and operational integrity</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">3. How We Share Information</h2>
            <p>We do not sell your personal information.</p>
            <p>We may share your information only as needed with:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Payment processors</li>
                <li>Shipping and fulfillment providers</li>
                <li>Ecommerce and website service providers</li>
                <li>Customer support platforms</li>
                <li>Analytics and security service providers</li>
                <li>Legal, regulatory, or law enforcement authorities where required</li>
            </ul>
            <p>These parties receive only the information necessary to perform their functions.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">4. Order Fulfillment and Shipping Data</h2>
            <p>If you place an order with us, we may share your shipping-related information, including recipient name, address, phone number, and email address where required, with fulfillment and shipping partners in order to process, pack, ship, and support delivery of your order.</p>
            <p>This information is used only for legitimate order fulfillment, customer support, fraud prevention, and legal compliance purposes.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">5. Data Retention</h2>
            <p>We retain personal information only for as long as reasonably necessary to:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Fulfill orders</li>
                <li>Provide customer support</li>
                <li>Process returns or disputes</li>
                <li>Maintain required business records</li>
                <li>Comply with legal obligations</li>
            </ul>
            <p>Where feasible, shipping-related personal information is retained for a limited period and then deleted, anonymized, or securely archived in accordance with operational and legal requirements.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">6. Security</h2>
            <p>We use reasonable administrative, technical, and organizational safeguards to protect personal information, including:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Encryption in transit where supported</li>
                <li>Access controls</li>
                <li>Least-privilege access practices</li>
                <li>Monitoring for unauthorized access</li>
                <li>Secure storage and backup practices where applicable</li>
            </ul>
            <p>No method of transmission over the internet or electronic storage is completely secure, so we cannot guarantee absolute security.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">7. Cookies and Similar Technologies</h2>
            <p>We may use cookies, pixels, and similar technologies to:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Keep the Site functioning properly</li>
                <li>Remember user preferences</li>
                <li>Understand website traffic and usage</li>
                <li>Improve site performance and marketing effectiveness</li>
            </ul>
            <p>You may manage cookie settings through your browser controls.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">8. Your Rights and Choices</h2>
            <p>Depending on your location, you may have rights to:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Access personal information we hold about you</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of certain information</li>
                <li>Object to or limit certain processing</li>
                <li>Withdraw consent where processing is based on consent</li>
            </ul>
            <p>To make a request, contact us using the details below.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">9. Third-Party Links</h2>
            <p>Our Site may contain links to third-party websites or services. We are not responsible for the privacy or security practices of third parties.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">10. Children's Privacy</h2>
            <p>Our Site is not intended for children under 13, and we do not knowingly collect personal information from children under 13.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">11. International Users</h2>
            <p>If you access the Site from outside the country where our business operates, your information may be transferred to and processed in other jurisdictions where our service providers operate.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">12. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Updates will be posted on this page with a revised "Last updated" date.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">13. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or our data practices, contact us at:</p>
            <p>
                <strong>Serenity Scrolls</strong><br />
                Email: <a href="mailto:info@serenityscrolls.faith" className="text-primary hover:underline">info@serenityscrolls.faith</a>
            </p>
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
