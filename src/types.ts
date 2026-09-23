export type Version = {
  version_id: number
  local_abbreviation: string
  local_title: string
  language: Language
  repository: string
  publisher: Publisher
  copyright: Copyright
  books: Book[]
}

export type Book = {
  usfm: string
  human: string
  chapters: Chapter[]
}

export type Chapter = {
  usfm: string
  human: string
  previous: PrevNext | null
  next: PrevNext | null
  html?: string // Available in dev repos; omitted in the snapshot repo.
  items: ChapterItem[]
}

export type ChapterItem = {
  type: ChapterItemType
  verse_numbers: number[]
  lines: string[]
  rlw_lines: RedLetterWords[][]
}

// Depending on the version, some ChapterItemTypes may appear more or less.
// The essential ChapterItemTypes are: 'heading1' and 'verse'.
// I have added comments that can be used as a reference for styles. 👇👇👇
// (This is only a reference; you can apply any styles you want.)
export type ChapterItemType =
  | 'section1' // rare        - weight: 900 - h1
  | 'section2' // rare        - weight: 800 - h2
  | 'heading1' // very common - weight: 700 - h3
  | 'heading2' // common      - weight: 600 - h4
  | 'label' //    common      - weight: 500 - italic
  | 'verse' //    very common - weight: 400 - regular text

export type Publisher = {
  name: string
}

export type Copyright = {
  html: string
  text: string
}

export type Language = {
  iso_639_1: string
  iso_639_3: string
  language_tag: string
  local_name: string
  text_direction: string
}

export type PrevNext = {
  usfm: string
  human: string
}

export type RedLetterWords = {
  text: string
  rl: boolean
}
