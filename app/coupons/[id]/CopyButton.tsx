'use client'

import { useState } from 'react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`shrink-0 px-4 py-3 rounded-md text-sm font-bold transition-all duration-150 ${
        copied
          ? 'bg-emerald-600 text-white'
          : 'bg-slate-900 hover:bg-slate-700 active:bg-slate-800 text-white'
      }`}
    >
      {copied ? '✓ تم النسخ' : 'نسخ'}
    </button>
  )
}
