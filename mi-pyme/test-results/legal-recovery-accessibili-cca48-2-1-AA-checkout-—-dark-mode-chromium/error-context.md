# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: legal-recovery-accessibility.test.mjs >> Nuevas páginas — Accesibilidad WCAG 2.1 AA >> checkout — dark mode
- Location: visual-tests/legal-recovery-accessibility.test.mjs:49:7

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 665

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0f1724",
+               "contrastRatio": 1.16,
+               "expectedContrastRatio": "3:1",
+               "fgColor": "#000000",
+               "fontSize": "18.0pt (24px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 1.16 (foreground color: #000000, background color: #0f1724, font size: 18.0pt (24px), font weight: normal). Expected contrast ratio of 3:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"bg-card rounded-2xl border border-border p-8 shadow-sm\">",
+                 "target": Array [
+                   ".bg-card",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.16 (foreground color: #000000, background color: #0f1724, font size: 18.0pt (24px), font weight: normal). Expected contrast ratio of 3:1",
+         "html": "<h2 class=\"text-2xl font-bold text-foreground\">Crea tu cuenta</h2>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "h2",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0f1724",
+               "contrastRatio": 1.16,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#000000",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 1.16 (foreground color: #000000, background color: #0f1724, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"bg-card rounded-2xl border border-border p-8 shadow-sm\">",
+                 "target": Array [
+                   ".bg-card",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.16 (foreground color: #000000, background color: #0f1724, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<label for=\"nombre\" class=\"text-sm font-medium text-foreground\">Nombre completo</label>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "label[for=\"nombre\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0b1220",
+               "contrastRatio": 1.12,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#000000",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 1.12 (foreground color: #000000, background color: #0b1220, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<input id=\"nombre\" type=\"text\" placeholder=\"Juan Perez\" class=\"flex h-11 w-full rou...\" value=\"\">",
+                 "target": Array [
+                   "#nombre",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.12 (foreground color: #000000, background color: #0b1220, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<input id=\"nombre\" type=\"text\" placeholder=\"Juan Perez\" class=\"flex h-11 w-full rou...\" value=\"\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "#nombre",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0f1724",
+               "contrastRatio": 1.16,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#000000",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 1.16 (foreground color: #000000, background color: #0f1724, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"bg-card rounded-2xl border border-border p-8 shadow-sm\">",
+                 "target": Array [
+                   ".bg-card",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.16 (foreground color: #000000, background color: #0f1724, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<label for=\"username\" class=\"text-sm font-medium text-foreground\">Nombre de usuario</label>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "label[for=\"username\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0b1220",
+               "contrastRatio": 1.12,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#000000",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 1.12 (foreground color: #000000, background color: #0b1220, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<input id=\"username\" type=\"text\" placeholder=\"juanperez123\" class=\"flex h-11 w-full rou...\" value=\"\">",
+                 "target": Array [
+                   "#username",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.12 (foreground color: #000000, background color: #0b1220, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<input id=\"username\" type=\"text\" placeholder=\"juanperez123\" class=\"flex h-11 w-full rou...\" value=\"\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "#username",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0f1724",
+               "contrastRatio": 1.16,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#000000",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 1.16 (foreground color: #000000, background color: #0f1724, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"bg-card rounded-2xl border border-border p-8 shadow-sm\">",
+                 "target": Array [
+                   ".bg-card",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.16 (foreground color: #000000, background color: #0f1724, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<label for=\"email\" class=\"text-sm font-medium text-foreground\">Email</label>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "label[for=\"email\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0b1220",
+               "contrastRatio": 1.12,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#000000",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 1.12 (foreground color: #000000, background color: #0b1220, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<input id=\"email\" type=\"email\" placeholder=\"tu@ejemplo.com\" class=\"flex h-11 w-full rou...\" value=\"\">",
+                 "target": Array [
+                   "#email",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.12 (foreground color: #000000, background color: #0b1220, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<input id=\"email\" type=\"email\" placeholder=\"tu@ejemplo.com\" class=\"flex h-11 w-full rou...\" value=\"\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "#email",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0f1724",
+               "contrastRatio": 1.16,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#000000",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 1.16 (foreground color: #000000, background color: #0f1724, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"bg-card rounded-2xl border border-border p-8 shadow-sm\">",
+                 "target": Array [
+                   ".bg-card",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.16 (foreground color: #000000, background color: #0f1724, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<label for=\"password\" class=\"text-sm font-medium text-foreground\">Contrasena</label>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "label[for=\"password\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0b1220",
+               "contrastRatio": 1.12,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#000000",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 1.12 (foreground color: #000000, background color: #0b1220, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<input id=\"password\" type=\"password\" placeholder=\"Minimo 10 caracteres\" aria-describedby=\"password-requirement...\" class=\"flex h-11 w-full rou...\" value=\"\">",
+                 "target": Array [
+                   "#password",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.12 (foreground color: #000000, background color: #0b1220, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<input id=\"password\" type=\"password\" placeholder=\"Minimo 10 caracteres\" aria-describedby=\"password-requirement...\" class=\"flex h-11 w-full rou...\" value=\"\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "#password",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0f1724",
+               "contrastRatio": 1.16,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#000000",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 1.16 (foreground color: #000000, background color: #0f1724, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"bg-card rounded-2xl border border-border p-8 shadow-sm\">",
+                 "target": Array [
+                   ".bg-card",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.16 (foreground color: #000000, background color: #0f1724, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<label for=\"confirmPassword\" class=\"text-sm font-medium text-foreground\">Confirmar contrasena</label>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "label[for=\"confirmPassword\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0b1220",
+               "contrastRatio": 1.12,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#000000",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 1.12 (foreground color: #000000, background color: #0b1220, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<input id=\"confirmPassword\" type=\"password\" placeholder=\"Repite la contrasena\" class=\"flex h-11 w-full rou...\" value=\"\">",
+                 "target": Array [
+                   "#confirmPassword",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.12 (foreground color: #000000, background color: #0b1220, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<input id=\"confirmPassword\" type=\"password\" placeholder=\"Repite la contrasena\" class=\"flex h-11 w-full rou...\" value=\"\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "#confirmPassword",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0f1724",
+               "contrastRatio": 1.16,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#000000",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 1.16 (foreground color: #000000, background color: #0f1724, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"bg-card rounded-2xl border border-border p-8 shadow-sm\">",
+                 "target": Array [
+                   ".bg-card",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.16 (foreground color: #000000, background color: #0f1724, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<label for=\"provincia\" class=\"text-sm font-medium text-foreground\">Provincia</label>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "label[for=\"provincia\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0b1220",
+               "contrastRatio": 1.12,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#000000",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 1.12 (foreground color: #000000, background color: #0b1220, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<input id=\"provincia\" type=\"text\" placeholder=\"La Habana\" class=\"flex h-11 w-full rou...\" value=\"\">",
+                 "target": Array [
+                   "#provincia",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.12 (foreground color: #000000, background color: #0b1220, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<input id=\"provincia\" type=\"text\" placeholder=\"La Habana\" class=\"flex h-11 w-full rou...\" value=\"\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "#provincia",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0f1724",
+               "contrastRatio": 1.16,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#000000",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 1.16 (foreground color: #000000, background color: #0f1724, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"bg-card rounded-2xl border border-border p-8 shadow-sm\">",
+                 "target": Array [
+                   ".bg-card",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.16 (foreground color: #000000, background color: #0f1724, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<label for=\"municipio\" class=\"text-sm font-medium text-foreground\">Municipio</label>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "label[for=\"municipio\"]",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0b1220",
+               "contrastRatio": 1.12,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#000000",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 1.12 (foreground color: #000000, background color: #0b1220, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<input id=\"municipio\" type=\"text\" placeholder=\"Playa\" class=\"flex h-11 w-full rou...\" value=\"\">",
+                 "target": Array [
+                   "#municipio",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.12 (foreground color: #000000, background color: #0b1220, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<input id=\"municipio\" type=\"text\" placeholder=\"Playa\" class=\"flex h-11 w-full rou...\" value=\"\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "#municipio",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#3c434f",
+               "contrastRatio": 2.73,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7b8799",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.73 (foreground color: #7b8799, background color: #3c434f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"flex items-start gap-3 rounded-lg border border-border p-3 bg-muted/20\">",
+                 "target": Array [
+                   ".p-3",
+                 ],
+               },
+               Object {
+                 "html": "<div class=\"bg-card rounded-2xl border border-border p-8 shadow-sm\">",
+                 "target": Array [
+                   ".bg-card",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.73 (foreground color: #7b8799, background color: #3c434f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span class=\"font-medium text-foreground\">¿Tienes un negocio?</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "label[for=\"quiero-vender\"] > span:nth-child(1)",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#3c434f",
+               "contrastRatio": 2.73,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#7b8799",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.73 (foreground color: #7b8799, background color: #3c434f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"flex items-start gap-3 rounded-lg border border-border p-3 bg-muted/20\">",
+                 "target": Array [
+                   ".p-3",
+                 ],
+               },
+               Object {
+                 "html": "<div class=\"bg-card rounded-2xl border border-border p-8 shadow-sm\">",
+                 "target": Array [
+                   ".bg-card",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.73 (foreground color: #7b8799, background color: #3c434f, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span class=\"block mt-0.5\">Marca esta opción y, tras registrarte, podrás solicitar unirte a Mi-Pyme como negocio o logística.</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".block",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#0f1724",
+               "contrastRatio": 1.16,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#000000",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 1.16 (foreground color: #000000, background color: #0f1724, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"bg-card rounded-2xl border border-border p-8 shadow-sm\">",
+                 "target": Array [
+                   ".bg-card",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 1.16 (foreground color: #000000, background color: #0f1724, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<a class=\"text-sm font-medium text-primary hover:text-primary-hover transition-colors\" href=\"/negocios/solicitar\">Solicita unirte a Mi-Pyme</a>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "a[href$=\"solicitar\"]",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - navigation "Navegación principal" [ref=e3]:
      - link "Mi-Pyme - Ir al inicio" [ref=e4] [cursor=pointer]:
        - /url: /
        - img "Mi-Pyme" [ref=e5]
      - generic [ref=e6]:
        - link "Iniciar sesión" [ref=e7] [cursor=pointer]:
          - /url: /auth/login
        - link "Registrarse" [ref=e8] [cursor=pointer]:
          - /url: /auth/registro
  - generic [ref=e9]:
    - generic [ref=e15]:
      - heading "Unete" [level=1] [ref=e20]
      - paragraph [ref=e21]: Crea tu cuenta y comienza a disfrutar de todos los beneficios de Mi-Pyme.
    - generic [ref=e24]:
      - generic [ref=e25]:
        - generic [ref=e26]:
          - heading "Crea tu cuenta" [level=2] [ref=e27]
          - paragraph [ref=e28]: Completa el formulario para registrarte
        - generic [ref=e29]:
          - button "Cambiar a modo oscuro" [ref=e30]:
            - generic [ref=e33]: Sistema
          - generic [ref=e34]: Modo claro activado
          - button "Opciones de tema" [ref=e35]
      - link "Volver a inicio" [ref=e39] [cursor=pointer]:
        - /url: /
      - generic [ref=e43]:
        - generic [ref=e44]:
          - text: Nombre completo
          - textbox "Nombre completo" [ref=e50]:
            - /placeholder: Juan Perez
        - generic [ref=e51]:
          - text: Nombre de usuario
          - textbox "Nombre de usuario" [ref=e57]:
            - /placeholder: juanperez123
        - generic [ref=e58]:
          - text: Email
          - textbox "Email" [ref=e64]:
            - /placeholder: tu@ejemplo.com
        - generic [ref=e65]:
          - text: Contrasena
          - generic [ref=e66]:
            - textbox "Contrasena" [ref=e71]:
              - /placeholder: Minimo 10 caracteres
            - button "Mostrar contrasena" [ref=e72]
        - generic [ref=e76]:
          - text: Confirmar contrasena
          - generic [ref=e77]:
            - textbox "Confirmar contrasena" [ref=e82]:
              - /placeholder: Repite la contrasena
            - button "Mostrar contrasena" [ref=e83]
        - generic [ref=e87]:
          - generic [ref=e88]:
            - text: Provincia
            - textbox "Provincia" [ref=e94]:
              - /placeholder: La Habana
          - generic [ref=e95]:
            - text: Municipio
            - textbox "Municipio" [ref=e101]:
              - /placeholder: Playa
        - generic [ref=e102]:
          - checkbox "¿Tienes un negocio? Marca esta opción y, tras registrarte, podrás solicitar unirte a Mi-Pyme como negocio o logística." [ref=e104]
          - generic [ref=e105]:
            - text: ¿Tienes un negocio?
            - generic [ref=e106]: Marca esta opción y, tras registrarte, podrás solicitar unirte a Mi-Pyme como negocio o logística.
        - generic [ref=e107]:
          - checkbox "He leído y acepto los Términos y Condiciones y la Política de Privacidadde Mi-Pyme." [ref=e109]
          - generic [ref=e110]:
            - text: He leído y acepto los
            - link "Términos y Condiciones" [ref=e111] [cursor=pointer]:
              - /url: /terminos
            - text: y la
            - link "Política de Privacidad" [ref=e112] [cursor=pointer]:
              - /url: /privacidad
            - text: de Mi-Pyme.
        - button "Registrar" [disabled]
      - paragraph [ref=e113]:
        - text: Ya tienes cuenta?
        - link "Inicia sesion" [ref=e114] [cursor=pointer]:
          - /url: /auth/login
      - generic [ref=e115]:
        - paragraph [ref=e116]: ¿Tienes un negocio?
        - link "Solicita unirte a Mi-Pyme" [ref=e117] [cursor=pointer]:
          - /url: /negocios/solicitar
  - button "Open Next.js Dev Tools" [ref=e123] [cursor=pointer]
  - alert [ref=e127]
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import AxeBuilder from "@axe-core/playwright";
  3   | 
  4   | const legalPages = [
  5   |   { name: "privacidad", path: "/privacidad" },
  6   |   { name: "terminos", path: "/terminos" },
  7   |   { name: "devoluciones", path: "/devoluciones" },
  8   | ];
  9   | 
  10  | const recoveryPages = [
  11  |   { name: "recuperar", path: "/auth/recuperar" },
  12  |   { name: "resetear", path: "/auth/resetear/token-invalido" },
  13  |   { name: "login", path: "/auth/login" },
  14  |   { name: "registro", path: "/auth/registro" },
  15  |   { name: "checkout", path: "/checkout" },
  16  | ];
  17  | 
  18  | const themes = ["light", "dark"];
  19  | 
  20  | test.describe("Nuevas páginas — Accesibilidad WCAG 2.1 AA", () => {
  21  |   for (const page of legalPages) {
  22  |     for (const theme of themes) {
  23  |       test(`${page.name} — ${theme} mode`, async ({ page: p }) => {
  24  |         await p.goto(`http://localhost:3000${page.path}`);
  25  |         await p.waitForLoadState("networkidle");
  26  | 
  27  |         if (theme === "dark") {
  28  |           await p.evaluate(() =>
  29  |             document.documentElement.setAttribute("data-theme", "dark")
  30  |           );
  31  |         } else {
  32  |           await p.evaluate(() =>
  33  |             document.documentElement.setAttribute("data-theme", "light")
  34  |           );
  35  |         }
  36  |         await p.waitForTimeout(100);
  37  | 
  38  |         const results = await new AxeBuilder({ page: p })
  39  |           .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
  40  |           .analyze();
  41  | 
  42  |         expect(results.violations).toEqual([]);
  43  |       });
  44  |     }
  45  |   }
  46  | 
  47  |   for (const page of recoveryPages) {
  48  |     for (const theme of themes) {
  49  |       test(`${page.name} — ${theme} mode`, async ({ page: p }) => {
  50  |         await p.goto(`http://localhost:3000${page.path}`);
  51  |         await p.waitForLoadState("networkidle");
  52  | 
  53  |         if (theme === "dark") {
  54  |           await p.evaluate(() =>
  55  |             document.documentElement.setAttribute("data-theme", "dark")
  56  |           );
  57  |         } else {
  58  |           await p.evaluate(() =>
  59  |             document.documentElement.setAttribute("data-theme", "light")
  60  |           );
  61  |         }
  62  |         await p.waitForTimeout(100);
  63  | 
  64  |         const results = await new AxeBuilder({ page: p })
  65  |           .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
  66  |           .analyze();
  67  | 
> 68  |         expect(results.violations).toEqual([]);
      |                                    ^ Error: expect(received).toEqual(expected) // deep equality
  69  |       });
  70  |     }
  71  |   }
  72  | 
  73  |   test("todos los textos de la página legal tienen contraste válido en light", async ({
  74  |     page,
  75  |   }) => {
  76  |     await page.goto("http://localhost:3000/privacidad");
  77  |     await page.waitForLoadState("networkidle");
  78  | 
  79  |     const results = await new AxeBuilder({ page })
  80  |       .withTags(["cat.color"])
  81  |       .analyze();
  82  | 
  83  |     const contrastViolations = results.violations.filter(
  84  |       (v) => v.id === "color-contrast"
  85  |     );
  86  |     expect(contrastViolations).toEqual([]);
  87  |   });
  88  | 
  89  |   test("todos los textos de la página legal tienen contraste válido en dark", async ({
  90  |     page,
  91  |   }) => {
  92  |     await page.goto("http://localhost:3000/privacidad");
  93  |     await page.waitForLoadState("networkidle");
  94  | 
  95  |     await page.evaluate(() =>
  96  |       document.documentElement.setAttribute("data-theme", "dark")
  97  |     );
  98  |     await page.waitForTimeout(100);
  99  | 
  100 |     const results = await new AxeBuilder({ page })
  101 |       .withTags(["cat.color"])
  102 |       .analyze();
  103 | 
  104 |     const contrastViolations = results.violations.filter(
  105 |       (v) => v.id === "color-contrast"
  106 |     );
  107 |     expect(contrastViolations).toEqual([]);
  108 |   });
  109 | 
  110 |   test("checkbox de términos en registro es accesible", async ({ page }) => {
  111 |     await page.goto("http://localhost:3000/auth/registro");
  112 |     await page.waitForLoadState("networkidle");
  113 | 
  114 |     const results = await new AxeBuilder({ page })
  115 |       .withTags(["wcag2a", "wcag2aa"])
  116 |       .include("form")
  117 |       .analyze();
  118 | 
  119 |     expect(results.violations).toEqual([]);
  120 |   });
  121 | });
  122 | 
```