import type { ExternalToolCheck, ExternalToolProfile, ExternalToolVerificationReport } from "./types"

export function validateExternalToolProfile(profile: ExternalToolProfile): ExternalToolVerificationReport {
  const checks: ExternalToolCheck[] = [
    check("profile.id", profile.id.length > 0, "profile id is present"),
    check("profile.label", profile.label.length > 0, "profile label is present"),
    check("profile.repository", /^https:\/\/github\.com\//.test(profile.repository), "profile repository is a GitHub URL"),
    check("profile.homepage", /^https?:\/\//.test(profile.homepage), "profile homepage is a URL"),
    check("profile.license", profile.license.length > 0, "profile license is present"),
    check("profile.license-url", !profile.licenseURL || /^https?:\/\//.test(profile.licenseURL), "profile license URL is valid"),
    check("profile.package-url", !profile.packageURL || /^https?:\/\//.test(profile.packageURL), "profile package URL is valid"),
    check("profile.copyright", !profile.copyrightNotice || profile.copyrightNotice.length > 0, "profile copyright notice is valid"),
    check("profile.vendored-source", profile.vendoredSource === false, "profile records that external source is not vendored"),
    check("profile.notice", !profile.noticePath || profile.noticePath.endsWith(".md"), "profile notice path is valid"),
    check("profile.products", profile.supportedProducts.length > 0, "profile has supported products"),
    check("profile.formats", profile.supportedArtifactFormats.length > 0, "profile has artifact formats"),
    check("profile.capture-modes", profile.supportedCaptureModes.length > 0, "profile has capture modes"),
    check("profile.default-invocation", profile.defaultInvocation.command.length > 0, "profile has a default command"),
    check("profile.version-command", profile.versionCommand.command.length > 0, "profile has a version command"),
    check("profile.redaction", profile.redactionPolicyRef.length > 0, "profile has a redaction policy ref"),
  ]
  return report(checks)
}

export function report(checks: ExternalToolCheck[]): ExternalToolVerificationReport {
  const issues = checks.filter((item) => !item.ok)
  return { ok: issues.length === 0, checks, issues }
}

export function check(id: string, ok: boolean, message: string): ExternalToolCheck {
  return { id, ok, message }
}
