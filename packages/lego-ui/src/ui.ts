import {
  createUIRendererAtom,
  isEditorResult,
  normalizeAutocompleteOption,
  type LegoRendererRegistry,
  type NotificationRecord,
  type UIAdapterEvent,
  type UIAutocompleteInput,
  type UIAutocompleteOption,
  type UIChrome,
  type UIEditorInput,
  type UIEditorResult,
  type UIOverlay,
  type UITransportAdapter,
  type UIWidget,
} from "./ui-atoms"

export type {
  LegoRendererRegistry,
  MessagePartRendererRegistration,
  NotificationRecord,
  RenderContext,
  RenderedBlock,
  ToolResultRendererRegistration,
  UIAdapterEvent,
  UIAdapterKind,
  UIAutocompleteInput,
  UIAutocompleteOption,
  UIChrome,
  UIEditorInput,
  UIEditorResult,
  UIOverlay,
  UIRendererPort,
  UITransportAdapter,
  UIWidget,
} from "./ui-atoms"

export interface LegoUI {
  readonly renderers: LegoRendererRegistry
  select(title: string, options: string[]): Promise<string | undefined>
  confirm(title: string, message: string): Promise<boolean>
  input(title: string, placeholder?: string): Promise<string | undefined>
  notify(message: string, type?: "info" | "warning" | "error"): void
  setStatus(key: string, text: string | undefined): void
  getStatus(key: string): string | undefined
  setChrome(chrome: UIChrome): void
  getChrome(): UIChrome
  showWidget(widget: UIWidget): void
  hideWidget(id: string): void
  getWidget(id: string): UIWidget | undefined
  showOverlay(overlay: UIOverlay): void
  closeOverlay(id: string): void
  getOverlay(id: string): UIOverlay | undefined
  openEditor(input: UIEditorInput): Promise<UIEditorResult>
  autocomplete(input: UIAutocompleteInput): Promise<UIAutocompleteOption[]>
}

export class NoopUI implements LegoUI {
  readonly renderers = createUIRendererAtom()
  readonly notifications: NotificationRecord[] = []
  private readonly statuses = new Map<string, string>()
  private readonly widgets = new Map<string, UIWidget>()
  private readonly overlays = new Map<string, UIOverlay>()
  private chrome: UIChrome = {}

  async select(_title: string, options: string[]): Promise<string | undefined> {
    return options[0]
  }

  async confirm(_title?: string, _message?: string): Promise<boolean> {
    return true
  }

  async input(_title?: string, _placeholder?: string): Promise<string | undefined> {
    return undefined
  }

  notify(message: string, type: "info" | "warning" | "error" = "info"): void {
    this.notifications.push({ message, type, timestamp: Date.now() })
  }

  setStatus(key: string, text: string | undefined): void {
    if (text === undefined) this.statuses.delete(key)
    else this.statuses.set(key, text)
  }

  getStatus(key: string): string | undefined {
    return this.statuses.get(key)
  }

  setChrome(chrome: UIChrome): void {
    this.chrome = { ...chrome }
  }

  getChrome(): UIChrome {
    return { ...this.chrome }
  }

  showWidget(widget: UIWidget): void {
    this.widgets.set(widget.id, structuredClone(widget))
  }

  hideWidget(id: string): void {
    this.widgets.delete(id)
  }

  getWidget(id: string): UIWidget | undefined {
    const widget = this.widgets.get(id)
    return widget ? structuredClone(widget) : undefined
  }

  showOverlay(overlay: UIOverlay): void {
    this.overlays.set(overlay.id, structuredClone(overlay))
  }

  closeOverlay(id: string): void {
    this.overlays.delete(id)
  }

  getOverlay(id: string): UIOverlay | undefined {
    const overlay = this.overlays.get(id)
    return overlay ? structuredClone(overlay) : undefined
  }

  async openEditor(input: UIEditorInput): Promise<UIEditorResult> {
    return { content: input.content, saved: false }
  }

  async autocomplete(input: UIAutocompleteInput): Promise<UIAutocompleteOption[]> {
    const query = input.query.toLowerCase()
    const options = input.options.map(normalizeAutocompleteOption)
    const matches = query
      ? options.filter((option) => option.value.toLowerCase().includes(query) || option.label?.toLowerCase().includes(query))
      : options
    return matches.slice(0, input.limit ?? matches.length).map((option) => structuredClone(option))
  }
}

export class TransportUI extends NoopUI {
  constructor(readonly adapter: UITransportAdapter) {
    super()
  }

  override async select(title: string, options: string[]): Promise<string | undefined> {
    const response = await this.request("select", { title, options })
    return typeof response === "string" && options.includes(response) ? response : super.select(title, options)
  }

  override async confirm(title: string, message: string): Promise<boolean> {
    const response = await this.request("confirm", { title, message })
    return typeof response === "boolean" ? response : super.confirm(title, message)
  }

  override async input(title: string, placeholder?: string): Promise<string | undefined> {
    const response = await this.request("input", { title, placeholder })
    return typeof response === "string" || response === undefined ? response : super.input(title, placeholder)
  }

  override notify(message: string, type: "info" | "warning" | "error" = "info"): void {
    super.notify(message, type)
    this.emit("notify", { message, type })
  }

  override setStatus(key: string, text: string | undefined): void {
    super.setStatus(key, text)
    this.emit("status", { key, text })
  }

  override setChrome(chrome: UIChrome): void {
    super.setChrome(chrome)
    this.emit("chrome", chrome)
  }

  override showWidget(widget: UIWidget): void {
    super.showWidget(widget)
    this.emit("widget.show", widget)
  }

  override hideWidget(id: string): void {
    super.hideWidget(id)
    this.emit("widget.hide", { id })
  }

  override showOverlay(overlay: UIOverlay): void {
    super.showOverlay(overlay)
    this.emit("overlay.show", overlay)
  }

  override closeOverlay(id: string): void {
    super.closeOverlay(id)
    this.emit("overlay.close", { id })
  }

  override async openEditor(input: UIEditorInput): Promise<UIEditorResult> {
    const response = await this.request("editor.open", input)
    return isEditorResult(response) ? response : super.openEditor(input)
  }

  override async autocomplete(input: UIAutocompleteInput): Promise<UIAutocompleteOption[]> {
    const response = await this.request("autocomplete", input)
    return Array.isArray(response) ? response.map(normalizeAutocompleteOption) : super.autocomplete(input)
  }

  private emit(type: UIAdapterEvent["type"], payload: unknown): void {
    void this.adapter.emit({ type, payload, timestamp: Date.now() })
  }

  private async request(type: UIAdapterEvent["type"], payload: unknown): Promise<unknown> {
    const event = { type, payload, timestamp: Date.now() }
    if (this.adapter.request) return this.adapter.request(event)
    await this.adapter.emit(event)
    return undefined
  }
}

export function createTUIAdapter(emit: (event: UIAdapterEvent) => void | Promise<void> = () => {}): UITransportAdapter {
  return { kind: "tui", emit }
}

export function createRPCUIAdapter(input: {
  send: (event: UIAdapterEvent) => void | Promise<void>
  request?: (event: UIAdapterEvent) => Promise<unknown>
}): UITransportAdapter {
  return { kind: "rpc", emit: input.send, ...(input.request ? { request: input.request } : {}) }
}

export function createWebDesktopUIAdapter(
  kind: "web" | "desktop",
  bridge: {
    send: (event: UIAdapterEvent) => void | Promise<void>
    request?: (event: UIAdapterEvent) => Promise<unknown>
  },
): UITransportAdapter {
  return { kind, emit: bridge.send, ...(bridge.request ? { request: bridge.request } : {}) }
}
