# RepoDock E2B Template

This folder defines the E2B sandbox template used to provide runtime tools that
the app expects inside issue workspaces.

The first custom template adds `ripgrep`, which provides the `rg` binary used by
the app's `search_code` tool.

## Template

The template is based on E2B's standard base image and installs one additional
package:

```ts
Template()
  .fromBaseImage()
  .aptInstall(["ripgrep"]);
```

## Build

Install dependencies from this folder:

```bash
pnpm install
```

Build and publish the template:

```bash
E2B_API_KEY=e2b_your_key pnpm build
```

The build publishes this template name:

```txt
gabatools/devin-sandbox
```

## Later App Usage

After the template is built and verified, the app can be updated in a later
phase to create sandboxes with:

```env
E2B_SANDBOX_TEMPLATE="gabatools/devin-sandbox"
```

Do not install `ripgrep` during every sandbox startup. It should stay baked into
the E2B template so sandbox startup remains fast and reliable.

## OpenCode Feasibility Template

Phase 1 of the external coding-agent evaluation uses a separate template so the
active RepoDock sandbox image remains unchanged:

```bash
E2B_API_KEY=e2b_your_key pnpm build:opencode-spike
```

This publishes:

```txt
gabatools/repodock-opencode-spike
```

The spike template adds the pinned `opencode-ai@1.18.4` runtime. Keep this
version pinned so a template rebuild cannot silently change the OpenCode server
contract. Provider credentials are injected only when a sandbox starts; they
must never be baked into the template.

Run the disposable end-to-end verification with:

```bash
E2B_API_KEY=e2b_your_key \
OPENROUTER_API_KEY=your_openrouter_key \
OPENROUTER_MODEL=your_model \
pnpm verify:opencode-spike
```

The verification starts a password-protected OpenCode server, creates an
isolated Git repository, asks the configured model to write one probe file,
checks the exact content and Git status, and kills the sandbox in a `finally`
block. Its OpenCode permission policy denies shell access and allows only the
repository file operations required by the probe.
