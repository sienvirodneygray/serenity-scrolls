import { Navbar } from "@/components/Navbar";
import { Link } from "react-router-dom";

const DataProtectionPolicy = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-4">Data Protection and Security Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: March 31, 2026</p>
          <div className="space-y-6 text-foreground/80">
            <p>Serenity Scrolls is committed to protecting customer information and limiting the collection, use, storage, and sharing of personal data to what is necessary for legitimate business operations, order fulfillment, customer support, fraud prevention, and legal compliance.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">1. Purpose</h2>
            <p>This Data Protection and Security Policy describes the measures we use to protect customer data handled through our website, ecommerce systems, fulfillment workflows, and support operations.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">2. Data Minimization</h2>
            <p>We collect and process only the personal information reasonably necessary to:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Accept and process customer orders</li>
                <li>Fulfill and deliver purchases</li>
                <li>Communicate order status and support information</li>
                <li>Process returns, refunds, or disputes</li>
                <li>Detect fraud and misuse</li>
                <li>Comply with legal and tax obligations</li>
            </ul>
            <p>We do not request or retain personal information that is not required for these purposes.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">3. Restricted Access</h2>
            <p>Access to customer data is restricted to authorized personnel who require access to perform legitimate business functions.</p>
            <p>Our access controls are based on the following principles:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Unique user accounts</li>
                <li>Least-privilege access</li>
                <li>Role-based access where possible</li>
                <li>Prompt removal of access when no longer required</li>
                <li>Review of privileged access on a regular basis</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">4. Account and Authentication Controls</h2>
            <p>To protect systems containing customer information, we use security controls such as:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Strong passwords</li>
                <li>Multi-factor authentication where supported</li>
                <li>Restricted administrative access</li>
                <li>Secure credential storage</li>
                <li>Monitoring for unauthorized access attempts</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">5. Encryption and Secure Transmission</h2>
            <p>We protect customer information using appropriate safeguards, including:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>HTTPS and encrypted transmission where supported</li>
                <li>Encrypted storage or encrypted service-provider infrastructure where applicable</li>
                <li>Secure handling of credentials and sensitive system information</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">6. Fulfillment and Shipping Data</h2>
            <p>For order fulfillment, we may share shipping-related personal information, such as:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Recipient name</li>
                <li>Shipping address</li>
                <li>Phone number</li>
                <li>Email address where required</li>
            </ul>
            <p>This information is shared only with approved service providers and fulfillment partners for the purpose of processing, packing, shipping, delivery support, fraud prevention, and legal compliance.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">7. Data Retention</h2>
            <p>We retain customer information only as long as necessary for business, fulfillment, support, tax, legal, and operational purposes.</p>
            <p>Where possible, shipping-related personal information is retained for a limited period after order completion and then deleted, anonymized, or securely archived based on operational need and legal requirements.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">8. Logging and Monitoring</h2>
            <p>We maintain reasonable monitoring and logging practices to help identify:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Unauthorized access attempts</li>
                <li>Suspicious account activity</li>
                <li>Service misuse</li>
                <li>Operational issues affecting order processing and customer data</li>
            </ul>
            <p>Logs are reviewed and retained according to our internal operational and security practices.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">9. Service Providers</h2>
            <p>We may use third-party vendors to support website hosting, ecommerce, payments, shipping, analytics, security, and customer support. These providers are expected to handle data only as necessary to provide their contracted services.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">10. Backups and Recovery</h2>
            <p>We maintain reasonable backup and recovery practices to protect business continuity and reduce the risk of accidental data loss, subject to the capabilities of our hosting and service providers.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">11. Incident Response</h2>
            <p>If we become aware of unauthorized access, misuse, or disclosure of customer information, we will investigate the matter, take reasonable steps to contain and remediate the issue, and provide notifications where required by law or contractual obligation.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">12. Policy Updates</h2>
            <p>We may revise this Policy from time to time to reflect changes in our operations, technology, legal requirements, or service providers. Any updates will be posted on this page with a revised "Last updated" date.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">13. Contact</h2>
            <p>For questions about our data protection and security practices, contact:</p>
            <p>
                <strong>Serenity Scrolls</strong><br />
                Email: <a href="mailto:info@serenityscrolls.faith" className="text-primary hover:underline">info@serenityscrolls.faith</a>
            </p>
          </div>
          
          <div className="mt-12 text-center">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataProtectionPolicy;
