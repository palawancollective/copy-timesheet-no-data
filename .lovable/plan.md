

## Logo Onboarding Plan

### What We're Building
A logo system that works in both light and dark mode, is clickable to navigate home, and includes an admin setting to manage the logo.

### Steps

1. **Add the transparent logo to the project**
   - Copy the transparent PNG you upload into `src/assets/`
   - Since the logo artwork is light/beige colored (designed for dark backgrounds), it will look great in dark mode but be invisible or hard to see on light backgrounds
   - We'll apply a CSS `filter: invert()` or use a `dark:` Tailwind class to swap the logo appearance per theme, OR use two separate logo variants if you provide both

2. **Add logo to the header in TimeTrackingApp.tsx**
   - Place the logo centered between an empty spacer and the ThemeToggle (same layout pattern that was previously there)
   - Wrap in a clickable button/link that resets all modes (admin, invoice, schedule) and navigates to `/`
   - Responsive sizing: `h-8` on mobile, scaling up to `h-14` on desktop
   - Add `hover:opacity-80 transition-opacity` for click feedback

3. **Dark/Light Mode Handling**
   - **Dark mode**: Show the logo as-is (light beige on dark background works naturally)
   - **Light mode**: Apply `dark:invert-0 invert` CSS filter to make the light-colored logo visible on white backgrounds, OR use a `brightness` filter
   - Alternative: If you provide a dark version of the logo for light mode, we'll swap between two images using `hidden dark:block` / `block dark:hidden` classes

4. **Admin Logo Management Setting**
   - Add a new section in the AdminPanel called "App Settings" or "Branding"
   - Include a logo upload/change feature using file storage
   - Create a `app_settings` database table to store the logo URL
   - The header will fetch the logo URL from the database, falling back to the default bundled logo if none is set
   - This allows the admin to update the logo without code changes

### Technical Details

**Database migration:**
- Create `app_settings` table with columns: `id`, `setting_key` (text, unique), `setting_value` (text), `created_at`, `updated_at`
- Insert a default row for `logo_url` setting
- RLS: public read access (anon), admin-only write (or passkey-gated in the UI)

**Storage:**
- Create a `branding` storage bucket (public) for logo uploads
- Admin uploads go to this bucket, URL saved to `app_settings`

**Components to modify:**
- `TimeTrackingApp.tsx` - Add logo to header with click-to-home and theme-aware rendering
- `AdminPanel.tsx` - Add "Branding" settings card with logo upload
- New: `src/components/admin/BrandingSettings.tsx` - Logo upload component
- New: `src/hooks/useAppSettings.ts` - Hook to fetch/update app settings

**Logo rendering logic in header:**
```
1. Check app_settings for custom logo_url
2. If found, use that URL
3. If not, use the bundled default logo from src/assets/
4. Apply theme-aware CSS filters for visibility
5. On click -> reset all modes, navigate to "/"
```

