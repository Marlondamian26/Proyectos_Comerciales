-- Corrige las portadas de los negocios existentes sin crear nuevos registros.
-- Usa slug para evitar depender del sufijo "(Ejemplo visual - no real)".

UPDATE "Negocio" SET "imagenUrl" = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80'
WHERE slug = 'pizzeria-bella-napoli';

UPDATE "Negocio" SET "imagenUrl" = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80'
WHERE slug = 'salon-belleza-estrella';

UPDATE "Negocio" SET "imagenUrl" = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80'
WHERE slug = 'ferreteria-el-tornillo';

UPDATE "Negocio" SET "imagenUrl" = 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1200&q=80'
WHERE slug = 'tecnocell-cuba';

UPDATE "Negocio" SET "imagenUrl" = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80'
WHERE slug = 'carga-rapida-la-habana';

UPDATE "Negocio" SET "imagenUrl" = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80'
WHERE slug = 'mudanzas-centro-habana';

UPDATE "Negocio" SET "imagenUrl" = 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=80'
WHERE slug = 'transpersona-express';

UPDATE "Negocio" SET "imagenUrl" = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80'
WHERE nombre LIKE 'Cafetería El Cafetal%';

UPDATE "Negocio" SET "imagenUrl" = 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&q=80'
WHERE nombre LIKE 'Farmacia San Rafael%';

UPDATE "Negocio" SET "imagenUrl" = 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&q=80'
WHERE nombre LIKE 'Boutique María%';

UPDATE "Negocio" SET "imagenUrl" = 'https://images.unsplash.com/photo-1632823471565-1ecdf5c6d7e3?w=1200&q=80'
WHERE nombre LIKE 'Taller El Mecánico%';

UPDATE "Negocio" SET "imagenUrl" = 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=1200&q=80'
WHERE nombre LIKE 'Electrodomésticos El Rayo%';

UPDATE "Negocio" SET "imagenUrl" = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&q=80'
WHERE nombre LIKE 'Bodega La Esquina%';

UPDATE "Negocio" SET "imagenUrl" = 'https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=1200&q=80'
WHERE nombre LIKE 'Panadería La Espiga%';

UPDATE "Negocio" SET "imagenUrl" = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80'
WHERE nombre LIKE 'Mueblería El Roble%';

SELECT 'DESPUÉS' AS momento, COUNT(*) AS total,
       COUNT(DISTINCT "imagenUrl") AS unicas
FROM "Negocio";

SELECT COUNT(*) AS sin_imagen
FROM "Negocio"
WHERE "imagenUrl" IS NULL OR "imagenUrl" = '';

SELECT nombre, "imagenUrl"
FROM "Negocio"
WHERE "imagenUrl" IN (SELECT url FROM "HeroImage");
