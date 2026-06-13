-- Insert Reflection Journal + Courage Covenant™ Course Bundle product
INSERT INTO public.products (
  id,
  name,
  description,
  price,
  image_url,
  amazon_sku,
  stock_quantity,
  is_available,
  mcf_enabled
) VALUES (
  'e659e7f9-ec66-4c3f-88a6-94779934ed79',
  'Courage Covenant™ Course + Reflection Journal Bundle',
  'Get the complete 8-module Courage Covenant™ digital course (enrollment code sent instantly) plus the physical Serenity Scrolls Guided Reflection Journal shipped directly to your door (includes 90-day AI Servant access).',
  147.00,
  '/journal-product.jpg',
  '78-SH1V-JG7I-BUNDLE',
  887,
  true,
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  amazon_sku = EXCLUDED.amazon_sku,
  stock_quantity = EXCLUDED.stock_quantity,
  is_available = EXCLUDED.is_available,
  mcf_enabled = EXCLUDED.mcf_enabled;
