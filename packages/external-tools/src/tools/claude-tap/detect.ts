import { claudeTapProfile } from "./profile"

export function claudeTapVersionCommand(): { command: string; args: string[] } {
  return {
    command: claudeTapProfile.versionCommand.command,
    args: [...claudeTapProfile.versionCommand.args],
  }
}

export function claudeTapInstallHints(): string[] {
  return [...(claudeTapProfile.installHints ?? [])]
}
