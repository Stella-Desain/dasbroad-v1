import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TimeInputProps {
  value: string; // 24h format like "14:30"
  onChange: (value: string) => void;
  className?: string;
}

export function TimeInput({ value, onChange, className }: TimeInputProps) {
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  // Parse 24h value into 12h format
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      const hourNum = parseInt(h, 10);
      if (hourNum === 0) {
        setHours('12');
        setPeriod('AM');
      } else if (hourNum === 12) {
        setHours('12');
        setPeriod('PM');
      } else if (hourNum > 12) {
        setHours(String(hourNum - 12).padStart(2, '0'));
        setPeriod('PM');
      } else {
        setHours(String(hourNum).padStart(2, '0'));
        setPeriod('AM');
      }
      setMinutes(m || '00');
    }
  }, [value]);

  // Convert 12h to 24h and emit
  const emitChange = (h: string, m: string, p: 'AM' | 'PM') => {
    let hourNum = parseInt(h, 10) || 0;
    if (p === 'AM') {
      if (hourNum === 12) hourNum = 0;
    } else {
      if (hourNum !== 12) hourNum += 12;
    }
    const formatted = `${String(hourNum).padStart(2, '0')}:${m.padStart(2, '0')}`;
    onChange(formatted);
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    let num = parseInt(val, 10);
    if (val === '') {
      setHours('');
      return;
    }
    if (num > 12) num = 12;
    if (num < 1 && val.length === 2) num = 1;
    const newHours = String(num).padStart(2, '0');
    setHours(newHours);
    emitChange(newHours, minutes, period);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    let num = parseInt(val, 10);
    if (val === '') {
      setMinutes('');
      return;
    }
    if (num > 59) num = 59;
    const newMinutes = String(num).padStart(2, '0');
    setMinutes(newMinutes);
    emitChange(hours, newMinutes, period);
  };

  const handleHoursBlur = () => {
    if (!hours || parseInt(hours, 10) < 1) {
      setHours('01');
      emitChange('01', minutes, period);
    }
  };

  const handleMinutesBlur = () => {
    if (!minutes) {
      setMinutes('00');
      emitChange(hours, '00', period);
    }
  };

  const togglePeriod = () => {
    const newPeriod = period === 'AM' ? 'PM' : 'AM';
    setPeriod(newPeriod);
    emitChange(hours || '12', minutes || '00', newPeriod);
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <input
        type="text"
        inputMode="numeric"
        value={hours}
        onChange={handleHoursChange}
        onBlur={handleHoursBlur}
        placeholder="12"
        className="w-10 text-center form-input px-1"
        maxLength={2}
      />
      <span className="text-muted-foreground font-medium">:</span>
      <input
        type="text"
        inputMode="numeric"
        value={minutes}
        onChange={handleMinutesChange}
        onBlur={handleMinutesBlur}
        placeholder="00"
        className="w-10 text-center form-input px-1"
        maxLength={2}
      />
      <button
        type="button"
        onClick={togglePeriod}
        className="px-2 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-sm font-medium transition-colors min-w-[40px]"
      >
        {period}
      </button>
    </div>
  );
}
