import { useEffect, useState } from 'react'

import type { ChapterItem, RedLetterWordsSection } from './types'
import type { ItemToPrint } from './dev.types'
import { CHAPTERS_TO_FIND } from './constants'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getVerseLabel(verseNumbers: number[]): string {
  if (verseNumbers.length === 1) {
    return String(verseNumbers[0])
  }

  const first = verseNumbers[0]
  const last = verseNumbers[verseNumbers.length - 1]
  return `${first}-${last}`
}

function hasRedLetterWords(rlwLines: RedLetterWordsSection[][]): boolean {
  return rlwLines.length > 0
}

function buildShowVerseNumberMap(items: ChapterItem[]): boolean[] {
  let lastVerseNumber = -1

  return items.map((item) => {
    if (item.type !== 'verse') {
      return false
    }

    const first = item.verse_numbers[0]
    const show = first !== lastVerseNumber

    if (show) {
      lastVerseNumber = first
    }

    return show
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Loader() {
  return (
    <div className='flex flex-col items-center justify-center gap-3 py-24 text-stone-400'>
      <div className='h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-500' />
      <span className='text-sm tracking-wide'>Loading chapters…</span>
    </div>
  )
}

function VerseNumber({ label }: { label: string }) {
  return (
    <sup className='mr-1 font-mono text-[0.6rem] font-semibold text-stone-400 select-none'>
      {label}
    </sup>
  )
}

function RedLetterLine({ sections }: { sections: RedLetterWordsSection[] }) {
  return (
    <>
      {sections.map((section, i) =>
        section.rl ? (
          <span key={i} className='text-red-600'>
            {section.text}{' '}
          </span>
        ) : (
          <span key={i}>{section.text} </span>
        ),
      )}
    </>
  )
}

function ChapterItemRow({
  item,
  isFirst,
  showVerseNumber,
}: {
  item: ChapterItem
  isFirst: boolean
  showVerseNumber: boolean
}) {
  const mt = isFirst ? '' : 'mt-2'

  if (item.type === 'verse') {
    const verseLabel = getVerseLabel(item.verse_numbers)
    const useRlw = hasRedLetterWords(item.rlw_lines)
    const lines = useRlw ? item.rlw_lines : item.lines

    return (
      <p className={`${mt} text-xs leading-relaxed text-stone-700`}>
        {showVerseNumber && <VerseNumber label={verseLabel} />}
        {useRlw
          ? (lines as RedLetterWordsSection[][]).map((rlwLine, i) => (
              <span key={i}>
                {i > 0 && <br />}
                <RedLetterLine sections={rlwLine} />
              </span>
            ))
          : (lines as string[]).join(' ')}
      </p>
    )
  }

  if (item.type === 'section1') {
    return (
      <h2
        className={`${mt} text-sm font-black uppercase tracking-widest text-stone-800`}
      >
        {item.lines[0]}
      </h2>
    )
  }

  if (item.type === 'section2') {
    return (
      <h3
        className={`${mt} text-sm font-extrabold uppercase tracking-wide text-stone-800`}
      >
        {item.lines[0]}
      </h3>
    )
  }

  if (item.type === 'heading1') {
    return (
      <h4 className={`${mt} text-xs font-bold text-stone-600`}>
        {item.lines[0]}
      </h4>
    )
  }

  if (item.type === 'heading2') {
    return (
      <h5 className={`${mt} text-xs font-semibold text-stone-500`}>
        {item.lines[0]}
      </h5>
    )
  }

  if (item.type === 'label') {
    return (
      <p className={`${mt} text-xs italic text-stone-400`}>{item.lines[0]}</p>
    )
  }

  return null
}

function NoticePanel({ notices }: { notices: string[] }) {
  return (
    <div className='rounded-lg border border-amber-200 bg-amber-50 px-4 py-3'>
      <p className='mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-amber-700'>
        <span>⚠</span>
        <span>Dev notice — check the JSON</span>
      </p>
      <ul className='space-y-1'>
        {notices.map((notice, i) => (
          <li key={i} className='flex gap-2 text-xs text-amber-800'>
            <span className='mt-px shrink-0 text-amber-500'>›</span>
            <span>{notice}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ChapterCard({ item }: { item: ItemToPrint }) {
  const { version, chapter, notice } = item
  const showVerseNumberMap = buildShowVerseNumberMap(chapter.items)

  return (
    <article className='overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm'>
      {/* ── Card header: developer metadata ── */}
      <header className='border-b border-stone-100 bg-stone-50 px-4 py-3 sm:px-5'>
        <div className='flex flex-wrap items-start justify-between gap-2'>
          <div>
            <h2 className='text-sm font-bold text-stone-800'>
              {chapter.current.human}
            </h2>
            <p className='mt-0.5 text-xs text-stone-500'>
              <span className='font-mono text-stone-400'>
                {chapter.chapter_usfm}
              </span>
              {' · '}
              {version.local_title}{' '}
              <span className='font-mono text-stone-400'>
                ({version.local_abbreviation})
              </span>
              {' · '}
              {version.language.local_name}
            </p>
          </div>
          <span className='rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[10px] font-mono text-stone-400'>
            {version.language.language_tag}
          </span>
        </div>
      </header>

      <div className='px-4 py-4 sm:px-5'>
        {/* ── Dev notices ── */}
        {notice.length > 0 && (
          <div className='mb-4'>
            <NoticePanel notices={notice} />
          </div>
        )}

        {/* ── Biblical text ── */}
        <div className='rounded-lg border border-stone-100 bg-stone-50/60 px-4 py-4'>
          {chapter.items.map((chapterItem, i) => (
            <ChapterItemRow
              key={i}
              item={chapterItem}
              isFirst={i === 0}
              showVerseNumber={showVerseNumberMap[i]}
            />
          ))}
        </div>
      </div>
    </article>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

function App() {
  const [loading, setLoading] = useState(true)

  const [itemsToPrint, setItemsToPrint] = useState<ItemToPrint[]>([])

  useEffect(() => {
    const getData = async () => {
      const newItemsToPrint: ItemToPrint[] = []

      for (const chapterToFind of CHAPTERS_TO_FIND) {
        const response = await fetch(chapterToFind.bookUrl)
        const version = await response.json()

        const bookUsfm: string = chapterToFind.chapterUsfm.split('.')[0]
        const book = version.books.find(
          (b: { book_usfm: string }) => b.book_usfm === bookUsfm,
        )

        const foundChapter = book!.chapters.find(
          (c: { chapter_usfm: string }) =>
            c.chapter_usfm === chapterToFind.chapterUsfm,
        )

        if (foundChapter) {
          newItemsToPrint.push({
            version,
            chapter: foundChapter,
            notice: chapterToFind.notice,
          })
        }
      }

      setItemsToPrint(newItemsToPrint)
      setLoading(false)
    }

    getData()
  }, [])

  return (
    <div className='min-h-screen bg-stone-100'>
      {/* ── Page header ── */}
      <header className='border-b border-stone-200 bg-white px-4 py-5 sm:px-6'>
        <div className='mx-auto max-w-2xl'>
          <div className='flex items-start justify-between gap-4'>
            <h1 className='text-lg font-bold text-stone-800'>
              Reading JSON files
            </h1>
            <a
              href='https://github.com/mrk214/reading-json-files'
              target='_blank'
              rel='noreferrer'
              className='shrink-0 rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-700'
            >
              GitHub ↗
            </a>
          </div>
          <p className='mt-1.5 text-xs text-stone-500'>
            This page is generated from static JSON files and its code was
            written by an AI.
          </p>

          <p className='mt-1.5 text-xs text-stone-500'>
            Each card below renders a Bible chapter fetched from the data.
          </p>

          <p className='mt-1.5 text-xs text-stone-500'>
            The chapters shown were deliberately chosen — each one illustrates a
            specific structural difference in the JSON that is worth paying
            attention to. The amber panels point out exactly what to look for
            directly in the JSON source.
          </p>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className='mx-auto max-w-2xl px-4 py-6 sm:px-6'>
        {loading ? (
          <Loader />
        ) : (
          <div className='flex flex-col gap-6'>
            {itemsToPrint.map((item, i) => (
              <ChapterCard key={i} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
