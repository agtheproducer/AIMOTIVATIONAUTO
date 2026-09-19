// Optional override for Remotion's headless Chrome. Needed in sandboxed
// environments that block downloading Remotion's own Chrome Headless Shell
// (network egress restricted to an allowlist) -- point this at a
// pre-installed one instead. Leave unset in normal environments (CI, a
// regular dev machine) and Remotion downloads/manages its own.
export function browserExecutable(): string | undefined {
  return process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
}

// Some sandboxed environments route outbound HTTPS through a proxy with a
// custom CA that the headless browser doesn't trust, breaking Google Fonts
// loading with ERR_CERT_AUTHORITY_INVALID. Only set REMOTION_IGNORE_CERT_ERRORS
// in a trusted local/sandbox setting -- never in production.
export function chromiumOptions(): { ignoreCertificateErrors: boolean } | undefined {
  return process.env.REMOTION_IGNORE_CERT_ERRORS === "true"
    ? { ignoreCertificateErrors: true }
    : undefined;
}
