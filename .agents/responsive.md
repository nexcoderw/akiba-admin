# Responsive behavior

## Layout requirements

Design for narrow screens starting around 320 CSS pixels, tablets, wide screens and zoomed desktop layouts. Use content-driven breakpoints and flexible sizing rather than device-name assumptions. Avoid fixed widths that clip forms, dialogs or navigation.

Long organization names, emails, translations, large numbers and validation messages must wrap or truncate with an accessible way to obtain the full value. Do not solve overflow by hiding necessary content globally.

## Administrative screens

Keep primary tasks usable on touch screens. A responsive navigation drawer must support keyboard focus, close behavior, scroll handling and a clear current location. Avoid hover-only menus or actions.

Tables may use a labeled horizontal scrolling region or an appropriate responsive representation. Preserve headers, relationships, important actions and equivalent information. Do not silently drop security-relevant status columns.

Dialogs and forms must remain usable with a virtual keyboard. Keep error messages and submission controls reachable. Sticky actions must not obscure focused content.

## Verification

Review narrow/wide layouts, portrait/landscape, zoom, touch and keyboard input. Hidden responsive elements remain in the DOM: never render unauthorized data and rely on CSS to conceal it.

Keep interaction behavior consistent across breakpoints. Responsive work must preserve performance and accessibility rather than shipping separate duplicated component trees unnecessarily.

