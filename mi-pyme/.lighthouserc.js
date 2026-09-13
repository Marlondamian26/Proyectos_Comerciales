module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/auth/login",
        "http://localhost:3000/auth/registro",
        "http://localhost:3000/catalogo",
        "http://localhost:3000/carrito",
        "http://localhost:3000/reservas",
        "http://localhost:3000/pedidos",
        "http://localhost:3000/negocio",
        "http://localhost:3000/cliente",
        "http://localhost:3000/logistica",
        "http://localhost:3000/admin",
        "http://localhost:3000/contacto",
        "http://localhost:3000/servicios",
      ],
      startServerCommand: "npm run start",
      numberOfRuns: 1,
      settings: {
        headless: true,
        preset: "desktop",
        staticDistDir: "./.next/server",
      },
    },
    assert: {
      assertions: {
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:performance": ["warn", { minScore: 0.5 }],
        "categories:best-practices": ["warn", { minScore: 0.8 }],
        "categories:seo": ["warn", { minScore: 0.8 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 3000 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 4000 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
    server: {
      command: "npm run start",
      port: 3000,
    },
  },
};