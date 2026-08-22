---
name: omega-packages
description: Discover, install, and use OmegaAI packages via the query-omega MCP.
---

# Omega Packages

## When to use

Whenever you need to find an OmegaAI package, associate it with a workspace, or actually put a package's component to work on a page — including turning a component method's tabular result into a downloadable CSV.

## The package journey

1. **Discover.** Call `list_packages` to see everything available, or `search_packages` to search by name. Once you've found a candidate, read its README with `get_package_docs` — a package's docs may themselves point onward to a docs page.

2. **Install = associate.** `install_package` associates the package with your workspace. This is bookkeeping only — it does **not** copy code or scaffold any component onto a page. `list_installed_packages` shows what's currently associated with the workspace.

3. **Use it on a page — a separate, existing mechanism.** Association alone doesn't put anything on a page. To do that:
   - `set-component` sets a page's component to the package's component-id. This carries the owning app's app-id, so it works across workspaces even when the package's component lives elsewhere.
   - `describe` that page. It reports the component's protocols and methods, each with its docs — this is how you learn what you can actually call, not by guessing from the package name.
   - `run` the method `describe` showed you, with the `page_path`, `protocol`, and `method` it names.

   A method named `install` that shows up in `describe`'s output is just a conventional starting protocol method some components define — it is not a special verb the platform recognizes, and it has nothing to do with `install_package` above.

4. **Tabular results → CSV.** If a component method returns a result shaped `{header, rows}`, `export_csv` serializes it to a downloadable CSV. Which protocol/method it targets is overridable — don't assume a single fixed method name; check `describe` if unsure what the component exposes.

## Conventions

- `describe` is the single way to learn what a page or component can do — protocol and implementation docs surface there. Don't reverse-engineer behavior from a package or component name.
- `get_package_docs` is for the package's own README/docs, which is a different surface from `describe`'s per-page protocol/method docs.
- Installing a package and using it on a page are two independent steps. A package can be installed and never used on any page; a component can be set on a page via `set-component` from a package that was never formally "installed."

## Hard rules

- **Never fabricate a protocol, method, or component-id.** Get them from `describe` or the package's own docs, not from guessing.
- **`install_package` does not scaffold anything.** Don't assume a page or component exists after installing — `set-component` is the step that puts a component on a page.
- **Check `describe` before calling `run`.** Match `protocol`, `method`, and args exactly to what it reports.
