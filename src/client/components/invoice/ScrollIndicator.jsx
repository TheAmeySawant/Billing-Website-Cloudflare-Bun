import { useEffect } from "react";

export default function ScrollIndicator() {
  useEffect(() => {
    const handler = () => {
      const scrollTop = window.scrollY;
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const percent = (scrollTop / scrollHeight) * 100;
      document.getElementById("scrollIndicator").style.width = `${percent}%`;
    };

    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return <div className="scroll-indicator" id="scrollIndicator" />;
}
