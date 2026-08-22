import type { ChapterToFind } from './dev.types'

export const CHAPTERS_TO_FIND: ChapterToFind[] = [
  {
    bookUrl:
      'https://mrk214.github.io/snapshots/en___eng___eng/NLT_vid_116.json',
    chapterUsfm: 'PSA.3',
    notice: [
      'The first line (label) at the beginning of the chapter, before verse 1.',
      'The "Interlude" labels after verses: 2, 4 & 8.',
      'Each verse is separated into multiple lines.',
    ],
  },
  {
    bookUrl:
      'https://mrk214.github.io/snapshots/en___eng___eng/NLT_vid_116.json',
    chapterUsfm: 'SNG.1',
    notice: [
      'Verse 4 has two titles within its lines.',
      'The number of verse 4 is shown only at the beginning of the verse.',
      'Each verse is separated into multiple lines.',
    ],
  },
  {
    bookUrl:
      'https://mrk214.github.io/snapshots/en___eng___eng/NLT_vid_116.json',
    chapterUsfm: 'REV.22',
    notice: [
      'In this chapter, all verses are in a single line, except for verse 20, which is split into two lines.',
      'There are red letter words in verses: 7, 12, 13, 16, 20.',
      'In verse 20, there are only two lines, but only part of the first line is in red letter words.',
    ],
  },
  {
    bookUrl:
      'https://mrk214.github.io/snapshots/es___spa___spa/TLA_vid_176.json',
    chapterUsfm: '1CH.1',
    notice: [
      'There are several grouped verses.',
      'The grouped verses 1-4 and 28-33 not only are grouped but also have titles in between.',
    ],
  },
]
