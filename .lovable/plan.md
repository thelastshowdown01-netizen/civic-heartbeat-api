

# Update Authority Navigation Links

The issue is in `src/components/layouts/PublicLayout.tsx` — the `authorityLinks` array (lines 36-39) currently shows "Authority Dashboard" and "Explore Issues". These need to be replaced with the 3 actual pages: Reports, Live Feed, and Merged Issues.

Similarly, `src/components/landing/Navbar.tsx` (line 40) shows a "Dashboard" link for authority users that should be removed since the PublicLayout already handles navigation.

## Changes

### `src/components/layouts/PublicLayout.tsx`
Update `authorityLinks` (lines 36-39):
```js
const authorityLinks = [
  { to: "/authority", label: "Reports" },
  { to: "/authority/feed", label: "Live Feed" },
  { to: "/authority/merged", label: "Merged Issues" },
];
```

### `src/components/landing/Navbar.tsx`
Replace the authority "Dashboard" link (lines 39-43) and "Explore Issues" anchor (lines 18-20) with the same 3 authority-specific links when the user is authority. For non-authority/public users, keep existing behavior.

