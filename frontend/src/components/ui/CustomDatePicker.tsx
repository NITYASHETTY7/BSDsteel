import React, { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  placeholder?: string;
}

export function CustomDatePicker({ selectedDate, onDateSelect, placeholder = "Select Date" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day: Date) => {
    onDateSelect(day);
    setIsOpen(false);
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        days.push(
          <div
            key={day.toString()}
            onClick={() => onDateClick(cloneDay)}
            className={`w-8 h-8 flex items-center justify-center rounded-full text-xs cursor-pointer transition-colors ${
              !isSameMonth(day, monthStart)
                ? "text-text-muted/30"
                : isSameDay(day, selectedDate || new Date(0))
                ? "bg-accent text-white shadow-[0_0_10px_rgba(208,41,54,0.4)] font-bold"
                : isSameDay(day, new Date())
                ? "bg-accent/10 text-accent border border-accent/20 hover:bg-accent/25"
                : "text-text-primary hover:bg-white/5"
            }`}
          >
            {formattedDate}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="flex justify-between w-full mt-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return rows;
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-1.5 text-xs font-bold flex items-center gap-2 rounded-xl transition-all duration-300 border uppercase tracking-wider ${
          selectedDate 
            ? "bg-accent/15 text-accent border-accent/30 shadow-md shadow-accent/5" 
            : "text-text-muted hover:text-text-primary hover:bg-white/5 border-transparent"
        }`}
      >
        <CalendarIcon className="w-3.5 h-3.5" /> 
        {selectedDate ? format(selectedDate, 'dd MMM yyyy') : placeholder}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[260px] bg-panel border border-border rounded-xl shadow-2xl p-4">
          <div className="flex justify-between items-center mb-4">
            <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-4 h-4 text-text-muted hover:text-text-primary" />
            </button>
            <span className="text-sm font-bold text-text-primary font-display tracking-wider uppercase">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
              <ChevronRight className="w-4 h-4 text-text-muted hover:text-text-primary" />
            </button>
          </div>
          
          <div className="flex justify-between w-full mb-3">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="w-8 text-center text-[10px] font-bold text-text-muted uppercase">
                {day}
              </div>
            ))}
          </div>
          
          <div className="flex flex-col">
            {renderCells()}
          </div>
        </div>
      )}
    </div>
  );
}
