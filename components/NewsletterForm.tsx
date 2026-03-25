'use client'

export function NewsletterForm() {
  return (
    <form
      className="flex max-w-[400px] mx-auto border border-ivory-3 rounded-md overflow-hidden"
      onSubmit={e => e.preventDefault()}
    >
      <input
        type="email"
        placeholder="your@email.com"
        className="flex-1 px-4 py-3.5 bg-white border-none outline-none font-sans text-[.84rem] text-ink placeholder:text-ink-4"
      />
      <button
        type="submit"
        className="bg-green text-ivory border-none px-5 font-sans text-[.7rem] font-medium tracking-wide uppercase cursor-pointer hover:bg-green-2 transition-colors whitespace-nowrap"
      >
        Subscribe
      </button>
    </form>
  )
}
