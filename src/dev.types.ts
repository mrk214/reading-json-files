import type { Version, Chapter } from './types'

export type ChapterToFind = {
  versionUrl: string
  chapterUsfm: string
  notice: string[]
}

export type ItemToPrint = {
  version: Version
  chapter: Chapter
  notice: string[]
}
