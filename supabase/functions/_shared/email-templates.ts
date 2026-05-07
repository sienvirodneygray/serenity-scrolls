export const EMAIL_STYLES = `
  /* Sky Gradient Background */
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    margin: 0;
    padding: 40px 20px;
    background: linear-gradient(135deg, #e0f2fe 0%, #fafaf8 100%);
  }
  
  /* Scroll Container */
  .scroll-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 10px 0;
  }

  /* Scroll Rod (Top and Bottom) */
  .scroll-rod {
    height: 14px;
    background: linear-gradient(to bottom, #ebd59b, #d4af37, #997300);
    border-radius: 7px;
    position: relative;
    z-index: 2;
    width: 104%;
    left: -2%;
    box-shadow: 0 4px 6px rgba(0,0,0,0.15);
  }
  
  /* Knobs (Finials) on the Rod */
  .scroll-rod::before, .scroll-rod::after {
    content: '';
    position: absolute;
    top: -3px;
    width: 10px;
    height: 20px;
    background: radial-gradient(circle at center, #ebd59b, #b38600);
    border-radius: 5px;
    border: 1px solid #806000;
  }
  .scroll-rod::before { left: -5px; }
  .scroll-rod::after { right: -5px; }

  /* The Paper Area */
  .scroll-paper {
    background: #FFFEF7; /* Warm parchment tone */
    margin: 0 2%;
    /* Simulate paper curling slightly at the top and bottom with inner shadows */
    box-shadow: inset 0 15px 15px -15px rgba(0,0,0,0.2), inset 0 -15px 15px -15px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.05);
    border-left: 1px solid #e8e0d0;
    border-right: 1px solid #e8e0d0;
    padding: 0;
    position: relative;
    z-index: 1;
  }

  /* The Colorful Scrolls Theme (6 colors from branding) */
  .colorful-divider {
    text-align: center;
    padding: 20px 0 10px;
  }
  .color-dot {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin: 0 5px;
  }
  .c1 { background-color: #85B5D3; }
  .c2 { background-color: #E9BC48; }
  .c3 { background-color: #DE8A48; }
  .c4 { background-color: #D278AA; }
  .c5 { background-color: #7EB057; }
  .c6 { background-color: #CDE5F1; }

  .header {
    text-align: center;
    padding: 10px 20px 20px;
  }
  
  .header img {
    max-width: 220px;
    height: auto;
  }

  .header h1 {
    font-family: Georgia, 'Playfair Display', serif;
    color: #1a0f00;
    font-size: 24px;
    margin: 0 0 8px 0;
  }

  .header p {
    color: #85B5D3;
    font-size: 12px;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: 12px;
    font-family: Georgia, serif;
  }

  .content {
    padding: 10px 50px 30px;
  }

  .content p {
    margin: 0 0 16px;
    font-size: 16px;
    color: #4a5568;
  }

  /* Simple, clean button sticking to branding */
  .btn {
    display: inline-block;
    background-color: #2E6B9E; /* Deep brand blue — readable on parchment */
    color: #ffffff !important;
    padding: 14px 36px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 700;
    font-size: 16px;
    margin: 20px 0;
    border: none;
    letter-spacing: 0.3px;
  }
  
  .btn-outline {
    display: inline-block;
    background-color: transparent;
    color: #2E6B9E !important;
    padding: 13px 34px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 700;
    font-size: 16px;
    margin: 20px 0;
    border: 2px solid #2E6B9E;
    letter-spacing: 0.3px;
  }

  .scripture {
    font-family: Georgia, serif;
    font-style: italic;
    color: #718096;
    font-size: 16px;
    text-align: center;
    padding: 24px;
    background: #f7fafc;
    border-left: 3px solid #E9BC48; 
    margin: 30px 0;
  }

  .offer-box {
    background: linear-gradient(135deg, #fff8e7 0%, #fef3c7 100%);
    border: 2px solid #E9BC48;
    border-radius: 12px;
    padding: 28px 30px;
    margin: 28px 0;
    text-align: center;
  }
  .offer-box h2 {
    color: #92400e;
    margin: 0 0 8px;
    font-size: 20px;
  }
  .price-old { color: #9ca3af; text-decoration: line-through; font-size: 15px; margin: 0; }
  .price-new { color: #1a0f00; font-size: 28px; font-weight: bold; margin: 6px 0; }
  .price-sub { color: #78716c; font-size: 14px; margin: 0; }
  .divider { border: none; border-top: 1px solid #e8e0d0; margin: 8px 0 24px; }

  .footer {
    text-align: center;
    padding: 30px 24px 40px;
    color: #a0aec0;
    font-size: 13px;
  }

  .footer a {
    color: #85B5D3;
    text-decoration: none;
  }

  /* Specific elements from existing emails to maintain compatibility */
  .badge {
    display: inline-block;
    background: #E9BC48;
    color: #fff;
    padding: 6px 16px;
    border-radius: 20px;
    font-weight: bold;
    font-size: 13px;
    margin-top: 10px;
  }
  .order-box {
    background: #fff;
    border: 1px solid #e8e0cc;
    border-radius: 8px;
    padding: 20px;
    margin: 16px 0;
  }
  .order-box dt { font-weight: bold; color: #8b7355; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 10px; }
  .order-box dd { margin: 4px 0 14px 0; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; }
  .total-row { font-size: 18px; font-weight: bold; color: #1a1a1a; }
  .shipping-free { color: #2e7d32; font-size: 13px; }
  .urgency { background: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0; }
  .urgency p { color: #991b1b; margin: 0; font-size: 15px; font-weight: bold; }
  .cta-box { background: linear-gradient(135deg, #f8f4e8, #fff8e7); border: 2px solid #E9BC48; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: center; }
`;

export function buildBaseEmail(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${EMAIL_STYLES}
  </style>
</head>
<body>
  <div class="scroll-container">
    
    <!-- Top Rod of Scroll -->
    <div class="scroll-rod"></div>
    
    <div class="scroll-paper">
      
      <!-- Colorful scrolls dots motif — using spans for email client compatibility -->
      <div class="colorful-divider">
        <span class="color-dot c1"></span>
        <span class="color-dot c2"></span>
        <span class="color-dot c3"></span>
        <span class="color-dot c4"></span>
        <span class="color-dot c5"></span>
        <span class="color-dot c6"></span>
      </div>

      <div class="header">
        <img src="https://serenityscrolls.faith/logo.png" alt="Serenity Scrolls" />
      </div>

      <div class="content">
        ${contentHtml}
      </div>

    </div>
    
    <!-- Bottom Rod of Scroll -->
    <div class="scroll-rod"></div>

  </div>
</body>
</html>`;
}
