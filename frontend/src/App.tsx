import { BrowserRouter, Route, Routes } from 'react-router-dom'

function FrontendEntry() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-xl rounded-3xl border border-white/80 bg-white/75 p-10 text-center shadow-2xl shadow-indigo-200/40 backdrop-blur-xl">
        <p className="text-xs font-semibold tracking-[0.2em] text-indigo-500 uppercase">
          LINGO AI
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">前端工程已初始化</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          React、TypeScript、Vite、Tailwind CSS 与基础路由已经可以正常运行。
        </p>
      </section>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="*" element={<FrontendEntry />} />
      </Routes>
    </BrowserRouter>
  )
}
