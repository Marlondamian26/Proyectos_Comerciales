(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/mi-pyme/src/components/ui/Button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/mi-pyme/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/mi-pyme/src/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/mi-pyme/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/mi-pyme/node_modules/lucide-react/dist/esm/icons/loader-circle.mjs [app-client] (ecmascript) <export default as Loader2>");
;
;
;
;
const Slot = ({ children, ...props })=>{
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cloneElement"](__TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Children"].only(children), props);
};
_c = Slot;
const variantClasses = {
    primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover hover:shadow-md active:scale-[0.98]",
    secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary-hover hover:shadow-md active:scale-[0.98]",
    accent: "bg-accent text-accent-foreground shadow-sm hover:bg-accent-hover hover:shadow-md active:scale-[0.98]",
    gradient: "bg-gradient-to-r from-primary to-violet text-white shadow-lg hover:shadow-glow active:scale-[0.98]",
    gradientSecondary: "bg-gradient-to-r from-secondary to-emerald-600 text-white shadow-lg hover:shadow-glow active:scale-[0.98]",
    gradientAccent: "bg-gradient-to-r from-accent to-orange-600 text-white shadow-lg hover:shadow-glow-violet active:scale-[0.98]",
    outline: "border border-input bg-background hover:bg-accent/10 hover:text-accent hover:border-accent/30 hover:shadow-md active:scale-[0.98]",
    ghost: "hover:bg-accent/10 hover:text-accent-foreground active:scale-[0.98]",
    destructive: "bg-error text-destructive-foreground shadow-sm hover:bg-error-hover hover:shadow-md active:scale-[0.98]"
};
const sizeClasses = {
    sm: "h-9 px-3 text-sm gap-1.5",
    md: "h-11 px-5 text-sm gap-2",
    lg: "h-12 px-6 text-base gap-2.5",
    icon: "h-10 w-10 p-0"
};
function Button({ className, variant = "primary", size = "md", loading = false, icon, iconPosition = "left", asChild = false, children, disabled, ...props }) {
    const classes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2", "disabled:pointer-events-none disabled:opacity-60", variantClasses[variant], sizeClasses[size], className);
    const renderIcon = ()=>{
        if (loading) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                className: "h-4 w-4 animate-spin",
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/mi-pyme/src/components/ui/Button.tsx",
                lineNumber: 74,
                columnNumber: 14
            }, this);
        }
        if (icon) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "flex-shrink-0",
                children: icon
            }, void 0, false, {
                fileName: "[project]/mi-pyme/src/components/ui/Button.tsx",
                lineNumber: 77,
                columnNumber: 14
            }, this);
        }
        return null;
    };
    if (asChild) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Slot, {
            className: classes,
            ...props,
            children: children
        }, void 0, false, {
            fileName: "[project]/mi-pyme/src/components/ui/Button.tsx",
            lineNumber: 84,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        className: classes,
        disabled: disabled || loading,
        "aria-busy": loading || undefined,
        ...props,
        children: [
            iconPosition === "left" && renderIcon(),
            children,
            iconPosition === "right" && renderIcon()
        ]
    }, void 0, true, {
        fileName: "[project]/mi-pyme/src/components/ui/Button.tsx",
        lineNumber: 91,
        columnNumber: 5
    }, this);
}
_c1 = Button;
Button.displayName = "Button";
var _c, _c1;
__turbopack_context__.k.register(_c, "Slot");
__turbopack_context__.k.register(_c1, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/mi-pyme/src/components/ui/EmptyState.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EmptyState",
    ()=>EmptyState,
    "EmptyStatePreset",
    ()=>EmptyStatePreset
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/mi-pyme/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/mi-pyme/src/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$src$2f$components$2f$ui$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/mi-pyme/src/components/ui/Button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/mi-pyme/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__ = __turbopack_context__.i("[project]/mi-pyme/node_modules/lucide-react/dist/esm/icons/shopping-cart.mjs [app-client] (ecmascript) <export default as ShoppingCart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/mi-pyme/node_modules/lucide-react/dist/esm/icons/calendar.mjs [app-client] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__ = __turbopack_context__.i("[project]/mi-pyme/node_modules/lucide-react/dist/esm/icons/package.mjs [app-client] (ecmascript) <export default as Package>");
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$receipt$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Receipt$3e$__ = __turbopack_context__.i("[project]/mi-pyme/node_modules/lucide-react/dist/esm/icons/receipt.mjs [app-client] (ecmascript) <export default as Receipt>");
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/mi-pyme/node_modules/lucide-react/dist/esm/icons/search.mjs [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/mi-pyme/node_modules/lucide-react/dist/esm/icons/plus.mjs [app-client] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__ = __turbopack_context__.i("[project]/mi-pyme/node_modules/lucide-react/dist/esm/icons/truck.mjs [app-client] (ecmascript) <export default as Truck>");
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/mi-pyme/node_modules/lucide-react/dist/esm/icons/users.mjs [app-client] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__ = __turbopack_context__.i("[project]/mi-pyme/node_modules/lucide-react/dist/esm/icons/building-2.mjs [app-client] (ecmascript) <export default as Building2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$cog$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Cog$3e$__ = __turbopack_context__.i("[project]/mi-pyme/node_modules/lucide-react/dist/esm/icons/cog.mjs [app-client] (ecmascript) <export default as Cog>");
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__ = __turbopack_context__.i("[project]/mi-pyme/node_modules/lucide-react/dist/esm/icons/star.mjs [app-client] (ecmascript) <export default as Star>");
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__ = __turbopack_context__.i("[project]/mi-pyme/node_modules/lucide-react/dist/esm/icons/heart.mjs [app-client] (ecmascript) <export default as Heart>");
"use client";
;
;
;
;
;
const defaultIcons = {
    cart: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__["ShoppingCart"], {
        className: "h-12 w-12 text-muted-foreground"
    }, void 0, false, {
        fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
        lineNumber: 34,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0)),
    reservations: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"], {
        className: "h-12 w-12 text-muted-foreground"
    }, void 0, false, {
        fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
        lineNumber: 35,
        columnNumber: 17
    }, ("TURBOPACK compile-time value", void 0)),
    products: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__["Package"], {
        className: "h-12 w-12 text-muted-foreground"
    }, void 0, false, {
        fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
        lineNumber: 36,
        columnNumber: 13
    }, ("TURBOPACK compile-time value", void 0)),
    orders: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$receipt$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Receipt$3e$__["Receipt"], {
        className: "h-12 w-12 text-muted-foreground"
    }, void 0, false, {
        fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
        lineNumber: 37,
        columnNumber: 11
    }, ("TURBOPACK compile-time value", void 0)),
    search: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
        className: "h-12 w-12 text-muted-foreground"
    }, void 0, false, {
        fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
        lineNumber: 38,
        columnNumber: 11
    }, ("TURBOPACK compile-time value", void 0)),
    logistics: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$truck$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Truck$3e$__["Truck"], {
        className: "h-12 w-12 text-muted-foreground"
    }, void 0, false, {
        fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
        lineNumber: 39,
        columnNumber: 14
    }, ("TURBOPACK compile-time value", void 0)),
    users: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"], {
        className: "h-12 w-12 text-muted-foreground"
    }, void 0, false, {
        fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
        lineNumber: 40,
        columnNumber: 10
    }, ("TURBOPACK compile-time value", void 0)),
    areas: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$building$2d$2$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Building2$3e$__["Building2"], {
        className: "h-12 w-12 text-muted-foreground"
    }, void 0, false, {
        fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
        lineNumber: 41,
        columnNumber: 10
    }, ("TURBOPACK compile-time value", void 0)),
    settings: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$cog$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Cog$3e$__["Cog"], {
        className: "h-12 w-12 text-muted-foreground"
    }, void 0, false, {
        fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
        lineNumber: 42,
        columnNumber: 13
    }, ("TURBOPACK compile-time value", void 0)),
    favorites: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__["Heart"], {
        className: "h-12 w-12 text-muted-foreground"
    }, void 0, false, {
        fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
        lineNumber: 43,
        columnNumber: 14
    }, ("TURBOPACK compile-time value", void 0)),
    reviews: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"], {
        className: "h-12 w-12 text-muted-foreground"
    }, void 0, false, {
        fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
        lineNumber: 44,
        columnNumber: 12
    }, ("TURBOPACK compile-time value", void 0))
};
function EmptyState({ title, message, icon, action, className }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col items-center justify-center gap-5 p-10 text-center rounded-2xl border border-dashed bg-muted/30", className),
        "aria-live": "polite",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-center w-20 h-20 rounded-2xl bg-muted/80",
                children: icon ?? defaultIcons.search
            }, void 0, false, {
                fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
                lineNumber: 62,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-sm",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-lg font-semibold",
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
                        lineNumber: 66,
                        columnNumber: 9
                    }, this),
                    message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-muted-foreground mt-1",
                        children: message
                    }, void 0, false, {
                        fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
                        lineNumber: 68,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
                lineNumber: 65,
                columnNumber: 7
            }, this),
            action && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$src$2f$components$2f$ui$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                variant: action.variant ?? "primary",
                className: "mt-2",
                asChild: !!action.href,
                children: action.href ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    href: action.href,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                            className: "h-4 w-4 mr-2",
                            "aria-hidden": "true"
                        }, void 0, false, {
                            fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
                            lineNumber: 75,
                            columnNumber: 15
                        }, this),
                        action.label
                    ]
                }, void 0, true, {
                    fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
                    lineNumber: 74,
                    columnNumber: 13
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                            className: "h-4 w-4 mr-2",
                            "aria-hidden": "true"
                        }, void 0, false, {
                            fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
                            lineNumber: 80,
                            columnNumber: 15
                        }, this),
                        action.label
                    ]
                }, void 0, true, {
                    fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
                    lineNumber: 79,
                    columnNumber: 13
                }, this)
            }, void 0, false, {
                fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
                lineNumber: 72,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
        lineNumber: 55,
        columnNumber: 5
    }, this);
}
_c = EmptyState;
EmptyState.displayName = "EmptyState";
const presets = {
    cart: {
        title: "Tu carrito está vacío",
        message: "Agrega productos o servicios para comenzar tu pedido"
    },
    reservations: {
        title: "No tienes reservas",
        message: "Cuando reserves un servicio, aparecerá aquí"
    },
    products: {
        title: "No hay productos disponibles",
        message: "Agrega tu primer producto para empezar a vender"
    },
    orders: {
        title: "No tienes pedidos",
        message: "Tus pedidos aparecerán aquí una vez confirmados"
    },
    search: {
        title: "No se encontraron resultados",
        message: "Intenta con otros términos de búsqueda o filtros"
    },
    logistics: {
        title: "No hay pedidos asignados",
        message: "Los pedidos asignados a tu proveedor aparecerán aquí"
    },
    users: {
        title: "No hay usuarios registrados",
        message: "Los usuarios aparecerán aquí cuando se registren"
    },
    areas: {
        title: "No hay áreas creadas",
        message: "Crea tu primera área para organizar los negocios"
    },
    settings: {
        title: "Sin configuración",
        message: "Configura las opciones de tu panel"
    },
    favorites: {
        title: "No tienes favoritos",
        message: "Guarda tus productos favoritos para acceder rápidamente"
    },
    reviews: {
        title: "Sin reseñas",
        message: "Las reseñas de tus productos aparecerán aquí"
    }
};
function EmptyStatePreset({ preset, action, className }) {
    const { title, message } = presets[preset];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyState, {
        title: title,
        message: message,
        icon: defaultIcons[preset],
        action: action,
        className: className
    }, void 0, false, {
        fileName: "[project]/mi-pyme/src/components/ui/EmptyState.tsx",
        lineNumber: 124,
        columnNumber: 5
    }, this);
}
_c1 = EmptyStatePreset;
EmptyStatePreset.displayName = "EmptyStatePreset";
var _c, _c1;
__turbopack_context__.k.register(_c, "EmptyState");
__turbopack_context__.k.register(_c1, "EmptyStatePreset");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/mi-pyme/src/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/mi-pyme/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/mi-pyme/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$mi$2d$pyme$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=mi-pyme_src_0kfsdrr._.js.map