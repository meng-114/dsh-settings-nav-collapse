/**
 * Host half of @mengli114/dsh-settings-nav-collapse.
 *
 * Intentionally empty: the plugin has no host-side behaviour — no tools, no
 * services, no routes. Its only job is to put one client module on the web
 * roster (declared by the `dsh.client` field in package.json, served from
 * ./client.js) and to occupy a settings slot from there.
 *
 * The entry still has to exist, because `cordis.patch.yml` inserts this
 * package as a plugin row in the profile roster.
 */
export function apply() {}
