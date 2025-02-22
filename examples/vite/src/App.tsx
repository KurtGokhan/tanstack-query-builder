import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import './App.css';

function Memoed({ children }: PropsWithChildren) {
  const a = useRef(0);

  return (
    <p>
      <span>{children}</span>
      <span>Render count: {++a.current}</span>
    </p>
  );
}

function App({ children }: PropsWithChildren) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((count) => count + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <h1>JSX Middlewares with Vite</h1>
      <p className="read-the-docs" $tooltip="Hello there">
        Hover here to see the tooltip
      </p>

      <p>Timer: {count}</p>

      <Memoed>This is not memoed.</Memoed>
      <Memoed $memo>This is memoed.</Memoed>

      {children}
    </>
  );
}

export default App;
