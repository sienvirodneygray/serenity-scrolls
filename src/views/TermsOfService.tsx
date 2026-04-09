import { Navbar } from "@/components/Navbar";
import Link from "next/link";

const TermsOfService = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: March 31, 2026</p>
          <div className="space-y-6 text-foreground/80">
            <p>Serenity Scrolls ("Company," "we," "us," or "our") provides the content and services available on serenityscrolls.faith (the "Site"). These Terms of Service ("Terms") govern your access to the Site and any purchases made therein. By engaging with our Site, you acknowledge and agree to be bound by these Terms. If you do not consent to these Terms, please refrain from using the Site.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">1. Entity Information</h2>
            <p>Serenity Scrolls operates this Site and offers products and services through it.</p>
            <p>
                Business name: Serenity Scrolls<br />
                Email: [INSERT SUPPORT EMAIL]
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">2. Eligibility</h2>
            <p>By using this Site, you confirm that you have reached the age of majority in your jurisdiction or that you are accessing the Site with the explicit consent of a parent or legal guardian.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">3. Products and Services</h2>
            <p>While we make reasonable efforts to maintain accurate product descriptions, images, and pricing, we do not guarantee that all Site content is complete, current, or free of errors.</p>
            <p>We reserve the right, at our discretion, to:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Modify or discontinue products at any time</li>
                <li>Limit quantities available for purchase</li>
                <li>Refuse or cancel any order</li>
                <li>Correct errors in pricing, availability, or product details</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">4. Orders</h2>
            <p>When placing an order, you agree to the following:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>All provided information is accurate and complete</li>
                <li>You are authorized to use the chosen payment method</li>
                <li>Orders may be reviewed for security and fraud prevention</li>
            </ul>
            <p>Orders are not considered final until accepted and confirmed by our systems. We may decline any order due to suspected fraud, unavailability, or fulfillment constraints.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">5. Pricing and Payments</h2>
            <p>All prices are listed in [INSERT CURRENCY] and remain subject to change without notice.</p>
            <p>Payments are handled by third-party processors. By completing a purchase, you agree to their respective terms. We do not store full payment card details on our servers unless required by our checkout systems.</p>
            <p>You are responsible for any applicable taxes or duties associated with your order.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">6. Shipping and Fulfillment</h2>
            <p>We utilize third-party partners to support order delivery.</p>
            <p>By placing an order, you acknowledge that:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Shipping times are estimates only</li>
                <li>Delays may occur due to factors outside our control</li>
                <li>Risk of loss passes according to the terms provided at checkout</li>
            </ul>
            <p>Additional information is available in our Shipping Policy.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">7. Returns, Refunds, and Cancellations</h2>
            <p>Requests for returns or refunds are subject to our established policies. We reserve the right to deny requests that do not adhere to these conditions. Posted Return and Refund terms are incorporated herein by reference.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">8. Customer Accounts</h2>
            <p>You are responsible for maintaining the security of your account credentials. Please notify us immediately of any unauthorized access. We reserve the right to suspend or terminate accounts at our discretion.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">9. Acceptable Use</h2>
            <p>You agree to refrain from the following activities:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Using the Site for unlawful purposes</li>
                <li>Interfering with Site operation or security</li>
                <li>Attempting unauthorized access to data</li>
                <li>Exploiting or scraping Site content without permission</li>
                <li>Submitting fraudulent or misleading information</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">10. Intellectual Property</h2>
            <p>All text, graphics, and software on this Site are owned by or licensed to Serenity Scrolls and are protected by intellectual property laws. Unauthorized reproduction or use is strictly prohibited.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">11. User Content</h2>
            <p>By submitting content to us, you grant the Company a worldwide, royalty-free license to use and display that content for business purposes. You agree not to submit abusive or infringing material.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">12. Privacy</h2>
            <p>Your engagement with the Site is governed by our Privacy Policy and Data Protection Policy, which describe how personal information is handled.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">13. Third-Party Services and Links</h2>
            <p>Our Site may include links to third-party services. We are not responsible for the security practices or content of these third parties.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">14. Disclaimer of Warranties</h2>
            <p>The Site and its products are provided on an "as is" basis. We do not guarantee that:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>The Site will be uninterrupted or error-free</li>
                <li>Defects will be corrected immediately</li>
                <li>Products will meet specific requirements</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">15. Limitation of Liability</h2>
            <p>To the extent permitted by law, Serenity Scrolls shall not be liable for indirect or consequential damages resulting from:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Site use or inability to use</li>
                <li>Delays in shipping or fulfillment</li>
                <li>Third-party conduct</li>
            </ul>
            <p>Our total liability will not exceed the amount paid for the specific order in question.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">16. Indemnification</h2>
            <p>You agree to indemnify and hold harmless Serenity Scrolls from claims arising out of:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Your breach of these Terms</li>
                <li>Your misuse of the Site</li>
                <li>Your violation of law</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">17. Termination</h2>
            <p>We may suspend your access to the Site at any time if we believe you have violated these Terms or created a risk for our business operations.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">18. Governing Law</h2>
            <p>These Terms are governed by the laws of [INSERT STATE/PROVINCE/COUNTRY]. Any disputes will be resolved in the courts of [INSERT JURISDICTION].</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">19. Changes to These Terms</h2>
            <p>We may revise these Terms periodically. Updates will be posted on this page with a revised "Last updated" date. Continued use of the Site signifies acceptance of the updated Terms.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">20. Contact Us</h2>
            <p>For questions regarding these Terms, contact us at:</p>
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

export default TermsOfService;
