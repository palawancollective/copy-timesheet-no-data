

## Remove All Logo-Related Code

### Changes

1. **`src/components/TimeTrackingApp.tsx`**
   - Remove imports: `useAppSettings`, `logoDark`, `logoLight`
   - Remove `settings`/`customLogo` variables and `handleLogoClick` function
   - Replace the logo button + spacer block (lines 115-127) with just `<ThemeToggle />` aligned to the right

2. **`src/components/AdminPanel.tsx`**
   - Remove `BrandingSettings` import (line 17)
   - Remove `<BrandingSettings />` usage (line 113)

3. **Delete files**
   - `src/components/admin/BrandingSettings.tsx`
   - `src/hooks/useAppSettings.ts`
   - `src/assets/logo-dark.png`
   - `src/assets/logo-light.png`

No database changes needed -- the `app_settings` table and `branding` storage bucket can remain as they are (harmless, and may be useful later).
