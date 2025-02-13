export type Book = {
  book_usfm: string
  name: string
  local_title: string
  local_abbreviation: string
  version_id: number
  publisher: Publisher
  copyright: Copyright
  language: Language
  repository: string
  chapters: Chapter[]
}

export type Chapter = {
  chapter_usfm: string
  is_chapter: boolean
  current: Current
  next: NextPrev | null
  previous: NextPrev | null
  chapter_text: string
  chapter_html: string
  items: ChapterItem[]
}

export type ChapterItem = {
  type: ChapterItemType
  verse_numbers: number[]
  lines: string[]
  rlw_lines: RedLetterWordsSection[][]
}

export type ChapterItemType =
  | 'section1'
  | 'section2'
  | 'heading1'
  | 'heading2'
  | 'label'
  | 'verse'

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

export type Current = {
  usfm: string[]
  human: string
}

export type NextPrev = Current & {
  canonical: boolean
  toc: boolean
}

export type RedLetterWordsSection = {
  text: string
  rl: boolean
}
