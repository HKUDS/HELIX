export function claudeTapCaptureArgs(args: string[], rawDir: string): string[] {
  const harnessArgs: string[] = []
  const toolOptionArgs = args.slice(0, clientArgDelimiterIndex(args))
  if (claudeTapOutputDirOverride(toolOptionArgs) === undefined) harnessArgs.push("--tap-output-dir", rawDir)
  if (!toolOptionArgs.includes("--tap-no-open")) harnessArgs.push("--tap-no-open")
  if (!toolOptionArgs.includes("--tap-no-live")) harnessArgs.push("--tap-no-live")
  if (!toolOptionArgs.includes("--tap-no-update-check")) harnessArgs.push("--tap-no-update-check")
  if (!toolOptionArgs.includes("--tap-store-stream-events")) harnessArgs.push("--tap-store-stream-events")
  return [...harnessArgs, ...args]
}

export function claudeTapOutputDirOverride(args: string[]): string | undefined {
  const toolOptionArgs = args.slice(0, clientArgDelimiterIndex(args))
  for (let index = 0; index < toolOptionArgs.length; index += 1) {
    const arg = toolOptionArgs[index] ?? ""
    if (arg === "--tap-output-dir") return toolOptionArgs[index + 1] ?? ""
    if (arg.startsWith("--tap-output-dir=")) return arg.slice("--tap-output-dir=".length)
  }
  return undefined
}

function clientArgDelimiterIndex(args: string[]): number {
  const delimiter = args.indexOf("--")
  return delimiter >= 0 ? delimiter : args.length
}
