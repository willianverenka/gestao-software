import React, { useRef } from "react";
import { endOfToday, format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Evita deslocamento de dia com parseISO em fusos UTC−. */
function parseISODateLocal(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Substitui input[type=date]: calendário com selects de mês/ano (react-day-picker v9).
 */
export function DateOfBirthPicker({
  id,
  value,
  onChange,
  "aria-invalid": ariaInvalid,
  className,
}) {
  const dialogRef = useRef(null);

  const selected = value ? parseISODateLocal(value) : undefined;
  const valid = selected && isValid(selected);

  const display = valid
    ? format(selected, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        id={id}
        aria-invalid={ariaInvalid}
        className={cn(
          "h-10 w-full justify-start rounded-md border border-input bg-transparent px-3 py-2 text-sm font-normal shadow-sm hover:bg-accent/50",
          !display && "text-muted-foreground",
          className
        )}
        onClick={() => dialogRef.current?.showModal()}
      >
        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
        {display ?? "Selecione a data"}
      </Button>

      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 z-50 w-[min(100vw-1.5rem,22rem)] max-h-[min(90vh,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-0 text-foreground shadow-xl backdrop:bg-slate-900/40 open:backdrop:backdrop-blur-[1px]"
      >
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
          Data de nascimento
        </div>
        <div className="max-h-[min(70vh,24rem)] overflow-y-auto overflow-x-auto p-2">
          <Calendar
            mode="single"
            selected={valid ? selected : undefined}
            defaultMonth={valid ? selected : new Date(1990, 0, 1)}
            onSelect={(d) => {
              if (d) {
                onChange(toISODate(d));
                dialogRef.current?.close();
              }
            }}
            locale={ptBR}
            captionLayout="dropdown"
            startMonth={new Date(1920, 0)}
            endMonth={new Date()}
            disabled={{ after: endOfToday() }}
            className="w-full min-w-[260px] rounded-md border-0 p-1"
          />
        </div>
        <div className="flex justify-end border-t border-slate-100 p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => dialogRef.current?.close()}
          >
            Fechar
          </Button>
        </div>
      </dialog>
    </>
  );
}
