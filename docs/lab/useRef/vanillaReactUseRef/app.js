const { useRef } = React;
const { createRoot } = ReactDOM;

function App() {
  const inputRef = useRef(null);

  const focusInput = () => {
    inputRef.current.focus();
  };

  return (
    <div>
      <input ref={inputRef} placeholder="Type something..." />
      <button onClick={focusInput}>Focus Input</button>
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);
