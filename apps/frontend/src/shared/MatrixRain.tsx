import { useEffect, useRef } from "react";

const glyphs = "01<>[]{}#$%^&*+-/\\ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    let animationFrame = 0;
    let columns: number[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const columnCount = Math.max(Math.floor(canvas.width / 18), 1);
      columns = Array.from({ length: columnCount }, () =>
        Math.floor((Math.random() * canvas.height) / 18),
      );
    };

    const render = () => {
      context.fillStyle = "rgba(2, 8, 5, 0.12)";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#53f58f";
      context.font = "15px 'JetBrains Mono', 'Fira Code', monospace";

      columns.forEach((value, index) => {
        const text = glyphs[Math.floor(Math.random() * glyphs.length)];
        const x = index * 18;
        const y = value * 18;

        context.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          columns[index] = 0;
        } else {
          columns[index] = value + 1;
        }
      });

      animationFrame = window.requestAnimationFrame(render);
    };

    resize();
    render();
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas aria-hidden="true" className="matrix-canvas" ref={canvasRef} />;
}
