import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add("dark-theme");
  }, []);

  const toggle = () => {
    document.documentElement.classList.toggle("dark-theme");
    document.documentElement.classList.toggle("light-theme");
    setDark(!dark);
  };

  return (
    <div className="theme-toggle" onClick={toggle}>
      <svg viewBox="0 0 24 24">
        {dark ? (
          <path d="M12 22C17.5 22 22 17.5 22 12..." />
        ) : (
          <path d="M12 18C8.6 18 6 15.3..." />
        )}
      </svg>
    </div>
  );
}
