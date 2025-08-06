import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Calculator as CalculatorIcon, X, Copy } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

// Core calculator UI and logic
function CalculatorCore({ onClose, isMobile }: { onClose?: () => void; isMobile?: boolean }) {
  const [display, setDisplay] = useState<string>("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<"+" | "-" | "*" | "/" | null>(null);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const safeNumber = (val: string) => {
    if (val === "" || val === ".") return 0;
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
  };

  const handleDigit = (d: string) => {
    setDisplay((curr) => {
      if (curr === "Error") return d === "." ? "0." : d;
      if (justEvaluated) {
        setJustEvaluated(false);
        return d === "." ? "0." : d;
      }
      if (d === ".") {
        if (curr.includes(".")) return curr;
        return curr + ".";
      }
      if (curr === "0") return d;
      return curr + d;
    });
  };

  const applyOp = (a: number, b: number, operator: NonNullable<typeof op>) => {
    switch (operator) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        if (b === 0) return NaN;
        return a / b;
    }
  };

  const handleOperator = (nextOp: NonNullable<typeof op>) => {
    setDisplay((curr) => {
      const currentVal = safeNumber(curr);
      if (prev === null) {
        setPrev(currentVal);
        setOp(nextOp);
      } else if (op !== null && !justEvaluated) {
        const result = applyOp(prev, currentVal, op);
        if (!Number.isFinite(result)) {
          setPrev(null);
          setOp(null);
          setJustEvaluated(true);
          return "Error";
        }
        setPrev(result);
        setOp(nextOp);
      } else {
        setOp(nextOp);
      }
      setJustEvaluated(false);
      return "0";
    });
  };

  const handleEquals = () => {
    if (prev === null || op === null) return;
    setDisplay((curr) => {
      const currentVal = safeNumber(curr);
      const result = applyOp(prev, currentVal, op);
      if (!Number.isFinite(result)) {
        setPrev(null);
        setOp(null);
        setJustEvaluated(true);
        return "Error";
      }
      setPrev(null);
      setOp(null);
      setJustEvaluated(true);
      return String(result);
    });
  };

  const handleClearAll = () => {
    setDisplay("0");
    setPrev(null);
    setOp(null);
    setJustEvaluated(false);
  };

  const handleClearEntry = () => {
    setDisplay("0");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(display);
      toast("Copied result to clipboard");
    } catch {
      toast("Unable to copy. Please select the text and copy manually.");
    }
  };

  const onDisplayFocus = () => {
    if (!isMobile) {
      inputRef.current?.select();
    }
  };

  const Key = ({ children, onClick, variant }: { children: React.ReactNode; onClick: () => void; variant?: "op" | "danger" | "equal" | "num" }) => (
    <Button
      type="button"
      variant={variant === "danger" ? "destructive" : variant === "op" ? "outline" : variant === "equal" ? "default" : "secondary"}
      className="h-10"
      onClick={onClick}
    >
      {children}
    </Button>
  );

  return (
    <div className="w-[320px] select-none">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          readOnly
          value={display}
          onFocus={onDisplayFocus}
          className="text-right text-lg font-mono select-text"
          aria-label="Calculator display"
        />
        <Button type="button" variant="outline" size="icon" onClick={handleCopy} aria-label="Copy result">
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <Key variant="danger" onClick={handleClearEntry}>CE</Key>
        <Key variant="danger" onClick={handleClearAll}>C</Key>
        <Key variant="op" onClick={() => handleOperator("/")}>÷</Key>
        <Key variant="op" onClick={() => handleOperator("*")}>×</Key>

        <Key variant="num" onClick={() => handleDigit("7")}>7</Key>
        <Key variant="num" onClick={() => handleDigit("8")}>8</Key>
        <Key variant="num" onClick={() => handleDigit("9")}>9</Key>
        <Key variant="op" onClick={() => handleOperator("-")}>−</Key>

        <Key variant="num" onClick={() => handleDigit("4")}>4</Key>
        <Key variant="num" onClick={() => handleDigit("5")}>5</Key>
        <Key variant="num" onClick={() => handleDigit("6")}>6</Key>
        <Key variant="op" onClick={() => handleOperator("+")}>+</Key>

        <Key variant="num" onClick={() => handleDigit("1")}>1</Key>
        <Key variant="num" onClick={() => handleDigit("2")}>2</Key>
        <Key variant="num" onClick={() => handleDigit("3")}>3</Key>
        <Key variant="equal" onClick={handleEquals}>=</Key>

        <Key variant="num" onClick={() => handleDigit("0")}>
          0
        </Key>
        <Key variant="num" onClick={() => handleDigit(".")}>.</Key>
        {/* Fillers to keep grid balanced */}
        <div />
        <div />
      </div>

      {onClose && (
        <div className="mt-3 flex justify-end">
          <Button type="button" variant="ghost" onClick={onClose} aria-label="Close calculator">
            Close
          </Button>
        </div>
      )}
    </div>
  );
}

function DesktopFloatingCalculator() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>(() => ({ x: 0, y: 0 }));
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (open) {
      const width = 320;
      const height = 360;
      setPos({ x: window.innerWidth - width - 24, y: window.innerHeight - height - 24 });
    }
  }, [open]);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging || !panelRef.current) return;
      const isTouch = (e as TouchEvent).touches !== undefined;
      const clientX = isTouch ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = isTouch ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      const rect = panelRef.current.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const minX = 8;
      const minY = 8;
      const maxX = window.innerWidth - w - 8;
      const maxY = window.innerHeight - h - 8;
      const newX = Math.min(Math.max(clientX - dragOffset.current.x, minX), maxX);
      const newY = Math.min(Math.max(clientY - dragOffset.current.y, minY), maxY);
      setPos({ x: newX, y: newY });
    };
    const onUp = () => setDragging(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove as any);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging]);

  const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!panelRef.current) return;
    setDragging(true);
    const rect = panelRef.current.getBoundingClientRect();
    const isTouch = (e as React.TouchEvent).touches !== undefined;
    const clientX = isTouch ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = isTouch ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    dragOffset.current = { x: clientX - rect.left, y: clientY - rect.top };
  };

  const close = () => {
    setOpen(false);
    // state resets by unmounting CalculatorCore
  };

  return (
    <>
      {!open && (
        <Button
          type="button"
          size="icon"
          className="hidden md:flex h-12 w-12 rounded-full shadow-lg fixed bottom-4 right-4 z-50"
          aria-label="Open calculator"
          onClick={() => setOpen(true)}
        >
          <CalculatorIcon className="h-6 w-6" />
        </Button>
      )}

      {open && (
        <div
          ref={panelRef}
          className="hidden md:block fixed z-50 w-[340px] rounded-lg border bg-background shadow-lg"
          style={{ left: pos.x, top: pos.y }}
          role="dialog"
          aria-modal="false"
          aria-label="Calculator"
        >
          <div
            className="flex items-center justify-between border-b px-3 py-2 cursor-move select-none"
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
          >
            <div className="font-medium">Calculator</div>
            <Button type="button" size="icon" variant="ghost" onClick={close} aria-label="Close calculator">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-3">
            <CalculatorCore onClose={close} />
          </div>
        </div>
      )}
    </>
  );
}

function MobileBottomCalculator() {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      {/* Bottom bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex h-14 max-w-screen-sm items-center justify-end px-4">
          <Button type="button" size="icon" className="rounded-full" aria-label="Open calculator" onClick={() => setOpen(true)}>
            <CalculatorIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[70vh]">
          <DrawerHeader className="flex items-center justify-between">
            <DrawerTitle>Calculator</DrawerTitle>
            <DrawerClose asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Close calculator">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="p-4 pt-0">
            <CalculatorCore onClose={close} isMobile />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export function CalculatorWidget() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileBottomCalculator /> : <DesktopFloatingCalculator />;
}
