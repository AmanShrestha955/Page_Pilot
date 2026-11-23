import { usePageContext } from "./hooks/usePageContext";

export default function App() {
  const { context, error, loading, refresh } = usePageContext();

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-lg font-semibold">PagePilot</h1>
      <button onClick={refresh} className="rounded bg-black px-3 py-1 text-white">
        {loading ? "Reading..." : "Read this page"}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {context && (
        <div className="text-sm space-y-2">
          <p><b>Title:</b> {context.title}</p>
          <p><b>Headings:</b> {context.headings.length}</p>
          <p><b>Characters:</b> {context.content.length}</p>
          <p><b>Selected:</b> {context.selectedText ?? "none"}</p>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap">{context.content.slice(0, 500)}</pre>
        </div>
      )}
    </div>
  );
}