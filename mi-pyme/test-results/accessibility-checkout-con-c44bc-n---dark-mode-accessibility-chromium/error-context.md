# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility.test.mjs >> checkout-confirmacion - dark mode accessibility
- Location: visual-tests/accessibility.test.mjs:43:5

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
  4   | const testPages = [
  5   |   { name: "home", path: "/" },
  6   |   { name: "login", path: "/login" },
  7   |   { name: "register", path: "/auth/registro" },
  8   |   { name: "catalogo", path: "/catalogo" },
  9   |   { name: "carrito", path: "/carrito" },
  10  |   { name: "pedidos", path: "/pedidos" },
  11  |   { name: "pagos", path: "/pagos" },
  12  |   { name: "pago-detalle", path: "/pagos/sample-id" },
  13  |   { name: "negocio-pagos", path: "/negocio/pagos" },
  14  |   { name: "admin-pagos", path: "/admin/pagos" },
  15  |   { name: "facturas", path: "/facturas" },
  16  |   { name: "factura-detalle", path: "/facturas/sample-id" },
  17  |   { name: "negocio-facturas", path: "/negocio/facturas" },
  18  |   { name: "admin-facturas", path: "/admin/facturas" },
  19  |   { name: "admin-reportes-fiscal", path: "/admin/reportes/fiscal" },
  20  |   { name: "checkout", path: "/checkout" },
  21  |   { name: "checkout-confirmacion", path: "/checkout/confirmacion?pedidos=%5B%7B%22pedidosCreados%22%3A%5B%7D%2C%22totalGeneral%22%3A0%7D%5D" },
  22  |   { name: "perfil", path: "/perfil" },
  23  |   { name: "negocio-dashboard", path: "/negocio" },
  24  |   { name: "negocio-mi-negocio", path: "/negocio/mi-negocio" },
  25  |   { name: "negocio-horarios", path: "/negocio/horarios" },
  26  |   { name: "negocio-productos", path: "/negocio/productos" },
  27  |   { name: "negocio-servicios", path: "/negocio/servicios" },
  28  |   { name: "negocio-inventario", path: "/negocio/inventario" },
  29  |   { name: "negocio-disponibilidad", path: "/negocio/disponibilidad" },
  30  |   { name: "negocio-logistica", path: "/negocio/logistica" },
  31  |   { name: "negocio-pedidos", path: "/negocio/pedidos" },
  32  |   { name: "negocio-reservas", path: "/negocio/reservas" },
  33  |   { name: "negocio-ventas", path: "/negocio/ventas" },
  34  |   { name: "admin-solicitudes", path: "/admin/solicitudes" },
  35  |   { name: "solicitar-negocio", path: "/negocios/solicitar" },
  36  |   { name: "mis-solicitudes", path: "/mis-solicitudes" },
  37  | ];
  38  | 
  39  | const themes = ["light", "dark"];
  40  | 
  41  | for (const testPage of testPages) {
  42  |   for (const theme of themes) {
  43  |     test(`${testPage.name} - ${theme} mode accessibility`, async ({ page }) => {
  44  |       await page.goto(testPage.path);
  45  |       await page.waitForLoadState("networkidle");
  46  | 
  47  |       if (theme === "dark") {
  48  |         await page.evaluate(() => {
  49  |           document.documentElement.setAttribute("data-theme", "dark");
  50  |         });
  51  |       } else {
  52  |         await page.evaluate(() => {
  53  |           document.documentElement.setAttribute("data-theme", "light");
  54  |         });
  55  |       }
  56  | 
  57  |       await page.waitForTimeout(100);
  58  | 
  59  |       const accessibilityScanResults = await new AxeBuilder({ page })
  60  |         .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
  61  |         .analyze();
  62  | 
> 63  |       expect(accessibilityScanResults.violations).toEqual([]);
      |                                                   ^ Error: expect(received).toEqual(expected) // deep equality
  64  |     });
  65  |   }
  66  | }
  67  | 
  68  | test("theme toggle accessibility", async ({ page }) => {
  69  |   await page.goto("/");
  70  |   await page.waitForLoadState("networkidle");
  71  | 
  72  |   const accessibilityScanResults = await new AxeBuilder({ page })
  73  |     .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
  74  |     .include("[data-testid='theme-toggle']")
  75  |     .analyze();
  76  | 
  77  |   expect(accessibilityScanResults.violations).toEqual([]);
  78  | });
  79  | 
  80  | test("modal focus trap", async ({ page }) => {
  81  |   await page.goto("/perfil");
  82  |   await page.waitForLoadState("networkidle");
  83  | 
  84  |   const modalTrigger = page.locator('button:has-text("Eliminar mi cuenta")');
  85  |   if (await modalTrigger.count() > 0) {
  86  |     await modalTrigger.click();
  87  |     await page.waitForSelector('[role="dialog"]');
  88  | 
  89  |     const accessibilityScanResults = await new AxeBuilder({ page })
  90  |       .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
  91  |       .include('[role="dialog"]')
  92  |       .analyze();
  93  | 
  94  |     expect(accessibilityScanResults.violations).toEqual([]);
  95  |   } else {
  96  |     const modalTriggerFallback = page.locator('button:has-text("Abrir Modal")');
  97  |     if (await modalTriggerFallback.count() > 0) {
  98  |       await modalTriggerFallback.click();
  99  |       await page.waitForSelector('[role="dialog"]');
  100 | 
  101 |       const accessibilityScanResults = await new AxeBuilder({ page })
  102 |         .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
  103 |         .include('[role="dialog"]')
  104 |         .analyze();
  105 | 
  106 |       expect(accessibilityScanResults.violations).toEqual([]);
  107 |     }
  108 |   }
  109 | });
  110 | 
  111 | test("form accessibility", async ({ page }) => {
  112 |   await page.goto("/auth/registro");
  113 |   await page.waitForLoadState("networkidle");
  114 | 
  115 |   const accessibilityScanResults = await new AxeBuilder({ page })
  116 |     .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
  117 |     .include("form")
  118 |     .analyze();
  119 | 
  120 |   expect(accessibilityScanResults.violations).toEqual([]);
  121 | });
  122 | 
  123 | test("table accessibility", async ({ page }) => {
  124 |   await page.goto("/catalogo");
  125 |   await page.waitForLoadState("networkidle");
  126 | 
  127 |   const accessibilityScanResults = await new AxeBuilder({ page })
  128 |     .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
  129 |     .analyze();
  130 | 
  131 |   expect(accessibilityScanResults.violations).toEqual([]);
  132 | });
  133 | 
  134 | test("catalogo availability badges - accessibility", async ({ page }) => {
  135 |   await page.goto("/catalogo");
  136 |   await page.waitForLoadState("networkidle");
  137 |   await page.waitForTimeout(500);
  138 | 
  139 |   const availabilityElements = page.locator('[data-testid="disponibilidad-badge"]');
  140 |   if (await availabilityElements.count() > 0) {
  141 |     const accessibilityScanResults = await new AxeBuilder({ page })
  142 |       .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
  143 |       .include('[data-testid="disponibilidad-badge"]')
  144 |       .analyze();
  145 | 
  146 |     expect(accessibilityScanResults.violations).toEqual([]);
  147 |   }
  148 | });
  149 | 
  150 | test("catalogo product cards - keyboard navigation", async ({ page }) => {
  151 |   await page.goto("/catalogo");
  152 |   await page.waitForLoadState("networkidle");
  153 | 
  154 |   const addButtons = page.locator('button:has-text("Ver detalles"), a:has-text("Ver detalles")');
  155 |   const count = await addButtons.count();
  156 |   if (count > 0) {
  157 |     await addButtons.first().focus();
  158 |     await page.keyboard.press("Enter");
  159 |     await page.waitForLoadState("networkidle");
  160 |     const currentUrl = page.url();
  161 |     expect(currentUrl).toMatch(/\/catalogo\//);
  162 |   }
  163 | });
```