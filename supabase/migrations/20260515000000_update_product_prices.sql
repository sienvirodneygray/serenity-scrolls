-- Update Serenity Scrolls product prices
-- Journal: $39.99 | Tube: $24.99

UPDATE products
SET price = 39.99
WHERE amazon_sku = '78-SH1V-JG7I';  -- Serenity Scrolls Reflection Journal

UPDATE products
SET price = 24.99
WHERE amazon_sku = 'PI-8N6M-AB86';  -- Serenity Scrolls Tube
