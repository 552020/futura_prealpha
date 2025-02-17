const { useState } = React;

function App() {
  const [inputValue, setInputValue] = useState("");
  const [message, setMessage] = useState(""); // Holds the message

  return (
    <div>
      <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Type something..." />
      <button
        onClick={() => {
          setMessage("❌ There’s NO way to focus the input directly here without useRef!");
        }}
      >
        Click Me!
      </button>

      {/* Display the message only if it's not empty */}
      {message && <p>{message}</p>}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
