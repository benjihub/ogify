# Ogify discoverability patch

This patch is intended for the root of the Ogify repository.

## Apply safely

1. Back up or commit any local edits first.
2. Copy `ogify-discoverability.patch` into the repository root.
3. From the repository root, check the patch:

   ```bash
   git apply --check ogify-discoverability.patch
   ```

4. If the check passes, apply it:

   ```bash
   git apply ogify-discoverability.patch
   ```

5. Review the changes and run frontend checks:

   ```bash
   cd apps/web
   npm run type-check
   npm run build
   ```

6. Return to the repository root, inspect `git diff`, then commit and push the intended changes. Vercel should deploy the frontend if the repository is connected to the production project.

This is a frontend-only SEO/discoverability patch. It does not require deploying the Cloudflare API Worker or changing any secrets.
