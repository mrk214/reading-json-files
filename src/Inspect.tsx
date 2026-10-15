import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'

import type { Version } from './types'
import type { ItemToPrint } from './dev.types'
import { BASE_URL } from './constants'
import { DEV_VERSIONS } from './devVersions'
import { ChapterCard, Loader } from './App'

// ─── In-memory Cache ──────────────────────────────────────────────────────────
// Caches fetched versions in memory so each version JSON is downloaded only once per session.
const versionCache = new Map<string, Promise<Version>>()

function fetchVersionWithCache(versionUrl: string): Promise<Version> {
  const fullUrl = `${BASE_URL}${versionUrl}`
  const cached = versionCache.get(fullUrl)
  if (cached) {
    return cached
  }

  const promise = fetch(fullUrl)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Failed to load version (${response.status} ${response.statusText})`,
        )
      }
      return (await response.json()) as Version
    })
    .catch((error) => {
      // Remove from cache on failure so the user can retry
      versionCache.delete(fullUrl)
      throw error
    })

  versionCache.set(fullUrl, promise)
  return promise
}

function Inspect() {
  const [selectedVersionUrl, setSelectedVersionUrl] = useState<string>(
    DEV_VERSIONS[0].versionUrl,
  )
  const [selectedBookUsfm, setSelectedBookUsfm] = useState<string>(
    DEV_VERSIONS[0].books[0].usfm,
  )
  const [selectedChapterUsfm, setSelectedChapterUsfm] = useState<string>(
    DEV_VERSIONS[0].books[0].chapters[0].usfm,
  )

  const [loadedVersion, setLoadedVersion] = useState<{
    url: string
    data: Version
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Current dev version & book metadata for the select dropdowns
  const currentVersionMeta = useMemo(
    () =>
      DEV_VERSIONS.find((v) => v.versionUrl === selectedVersionUrl) ??
      DEV_VERSIONS[0],
    [selectedVersionUrl],
  )

  const currentBookMeta = useMemo(
    () =>
      currentVersionMeta.books.find((b) => b.usfm === selectedBookUsfm) ??
      currentVersionMeta.books[0],
    [currentVersionMeta, selectedBookUsfm],
  )

  // Fetch version JSON when selectedVersionUrl or retryCount changes (cached in-memory)
  useEffect(() => {
    let isMounted = true

    fetchVersionWithCache(selectedVersionUrl)
      .then((data) => {
        if (isMounted) {
          setLoadedVersion({ url: selectedVersionUrl, data })
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to fetch version JSON',
          )
        }
      })

    return () => {
      isMounted = false
    }
  }, [selectedVersionUrl, retryCount])

  const versionData =
    loadedVersion?.url === selectedVersionUrl ? loadedVersion.data : null
  const loading = !error && versionData === null

  // Select handlers with cascading updates
  const handleVersionChange = (newVersionUrl: string) => {
    const versionMeta =
      DEV_VERSIONS.find((v) => v.versionUrl === newVersionUrl) ??
      DEV_VERSIONS[0]
    setSelectedVersionUrl(newVersionUrl)

    // Preserve book if available in the new version
    const matchedBook =
      versionMeta.books.find((b) => b.usfm === selectedBookUsfm) ??
      versionMeta.books[0]
    setSelectedBookUsfm(matchedBook.usfm)

    // Preserve chapter if available in the matched book
    const matchedChapter =
      matchedBook.chapters.find((c) => c.usfm === selectedChapterUsfm) ??
      matchedBook.chapters[0]
    setSelectedChapterUsfm(matchedChapter.usfm)
  }

  const handleBookChange = (newBookUsfm: string) => {
    setSelectedBookUsfm(newBookUsfm)

    const bookMeta =
      currentVersionMeta.books.find((b) => b.usfm === newBookUsfm) ??
      currentVersionMeta.books[0]

    setSelectedChapterUsfm(bookMeta.chapters[0]?.usfm ?? '')
  }

  const handleChapterChange = (newChapterUsfm: string) => {
    setSelectedChapterUsfm(newChapterUsfm)
  }

  // Find the selected chapter inside the fetched version data
  const currentChapter = useMemo(() => {
    if (!versionData) return null

    const bookUsfm = selectedChapterUsfm.split('.')[0] || selectedBookUsfm
    const book = versionData.books.find((b) => b.usfm === bookUsfm)
    return book?.chapters.find((c) => c.usfm === selectedChapterUsfm) ?? null
  }, [versionData, selectedBookUsfm, selectedChapterUsfm])

  const itemToPrint: ItemToPrint | null = useMemo(() => {
    if (!versionData || !currentChapter) return null

    return {
      version: versionData,
      chapter: currentChapter,
      notice: [], // No amber notices on inspect page
    }
  }, [versionData, currentChapter])

  return (
    <div className='min-h-screen bg-stone-100'>
      {/* ── Page header ── */}
      <header className='border-b border-stone-200 bg-white px-4 py-5 sm:px-6'>
        <div className='mx-auto max-w-2xl'>
          <div className='flex items-start justify-between gap-4'>
            <h1 className='text-lg font-bold text-stone-800'>
              Reading JSON files
            </h1>
            <div className='flex items-center gap-2'>
              <Link
                to='/'
                className='shrink-0 rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-700'
              >
                Home
              </Link>
              <a
                href='https://github.com/mrk214/reading-json-files'
                target='_blank'
                rel='noreferrer'
                className='shrink-0 rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-700'
              >
                GitHub ↗
              </a>
            </div>
          </div>
          <p className='mt-1.5 text-xs text-stone-500'>
            This website is an example implementation, and its code was written
            by an AI.
          </p>

          <p className='mt-1.5 text-xs text-stone-500'>
            Select any version, book, and chapter to inspect its contents.
          </p>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className='mx-auto max-w-7xl px-4 py-6 sm:px-6'>
        {/* ── Selection controls ── */}
        <section className='mb-6 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            {/* Version Select */}
            <div className='flex flex-col gap-1.5'>
              <label
                htmlFor='version-select'
                className='text-xs font-semibold text-stone-600'
              >
                Version
              </label>
              <select
                id='version-select'
                value={selectedVersionUrl}
                onChange={(e) => handleVersionChange(e.target.value)}
                className='w-full cursor-pointer rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-800 shadow-xs transition-colors hover:border-stone-300 focus:border-stone-400 focus:bg-white focus:outline-none'
              >
                {DEV_VERSIONS.map((v) => (
                  <option key={v.versionUrl} value={v.versionUrl}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Book Select */}
            <div className='flex flex-col gap-1.5'>
              <label
                htmlFor='book-select'
                className='text-xs font-semibold text-stone-600'
              >
                Book
              </label>
              <select
                id='book-select'
                value={selectedBookUsfm}
                onChange={(e) => handleBookChange(e.target.value)}
                className='w-full cursor-pointer rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-800 shadow-xs transition-colors hover:border-stone-300 focus:border-stone-400 focus:bg-white focus:outline-none'
              >
                {currentVersionMeta.books.map((b) => (
                  <option key={b.usfm} value={b.usfm}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter Select */}
            <div className='flex flex-col gap-1.5'>
              <label
                htmlFor='chapter-select'
                className='text-xs font-semibold text-stone-600'
              >
                Chapter
              </label>
              <select
                id='chapter-select'
                value={selectedChapterUsfm}
                onChange={(e) => handleChapterChange(e.target.value)}
                className='w-full cursor-pointer rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-800 shadow-xs transition-colors hover:border-stone-300 focus:border-stone-400 focus:bg-white focus:outline-none'
              >
                {currentBookMeta.chapters.map((c) => (
                  <option key={c.usfm} value={c.usfm}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ── Chapter Card / States ── */}
        {loading ? (
          <Loader />
        ) : error ? (
          <div className='rounded-xl border border-red-200 bg-red-50 p-6 text-center text-xs text-red-700'>
            <p className='font-semibold'>Failed to load chapter data</p>
            <p className='mt-1 text-red-600'>{error}</p>
            <button
              onClick={() => {
                setError(null)
                setRetryCount((c) => c + 1)
              }}
              className='mt-3 inline-flex cursor-pointer items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-xs hover:bg-red-50'
            >
              Retry
            </button>
          </div>
        ) : itemToPrint ? (
          <ChapterCard item={itemToPrint} />
        ) : (
          <div className='rounded-xl border border-stone-200 bg-white p-8 text-center text-xs text-stone-500'>
            Chapter not found in this version.
          </div>
        )}
      </main>
    </div>
  )
}

export default Inspect
