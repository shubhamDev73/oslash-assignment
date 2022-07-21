export interface NewShortcut {
    url: string,
    shortlink: string,
    description: string,
    tags?: string[]
}

export interface Shortcut extends NewShortcut {
    id: number
}