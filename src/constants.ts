import type { ChapterToFind } from './dev.types'

export const CHAPTERS_TO_FIND: ChapterToFind[] = [
  {
    bookUrl:
      'https://mrk214.github.io/snapshots/en___eng___eng/NLT_vid_116.json',
    chapterUsfm: 'PSA.3',
    notice: [
      'The first line is a label, at the beginning of the chapter, before verse 1.',
      'There are "interlude" labels after verses: 2, 4 & 8.',
      'Each verse is split into multiple lines in this chapter.',
    ],
  },
  {
    bookUrl:
      'https://mrk214.github.io/snapshots/en___eng___eng/NLT_vid_116.json',
    chapterUsfm: 'SNG.1',
    notice: [
      'In this chapter, verse 1 is on a single line, while some of the other verses are split into multiple lines.',
      'Verse 4 has two titles between its lines.',
      'The verse number is shown only at the beginning of verse 4 in the text. However, in the JSON, verse 4 appears multiple times because of the titles between its lines.',
    ],
  },
  {
    bookUrl:
      'https://mrk214.github.io/snapshots/en___eng___eng/NLT_vid_116.json',
    chapterUsfm: 'REV.22',
    notice: [
      'There are red letter words (rlw_lines) in verses 7, 12, 13, 16, 20.',
      'In verse 20 there are two lines, but only part of the first line is in red letter words (rlw_lines).',
    ],
  },
  {
    bookUrl:
      'https://mrk214.github.io/snapshots/es___spa___spa/TLA_vid_176.json',
    chapterUsfm: '1CH.1',
    notice: [
      'There are several grouped verses in this chapter.',
      'The grouped verses 1-4 and 28-33 not only are grouped but also have titles in between.',
    ],
  },
]
