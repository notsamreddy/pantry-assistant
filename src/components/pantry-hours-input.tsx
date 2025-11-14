"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAYS_OF_WEEK = [
  { value: "Monday", label: "Mon" },
  { value: "Tuesday", label: "Tue" },
  { value: "Wednesday", label: "Wed" },
  { value: "Thursday", label: "Thu" },
  { value: "Friday", label: "Fri" },
  { value: "Saturday", label: "Sat" },
  { value: "Sunday", label: "Sun" },
];

export type HoursEntry = {
  day: string;
  time: string;
};

interface PantryHoursInputProps {
  hours: HoursEntry[];
  onChange: (hours: HoursEntry[]) => void;
}

export function PantryHoursInput({ hours, onChange }: PantryHoursInputProps) {
  const handleDayToggle = (day: string, checked: boolean) => {
    if (checked) {
      // Add the day with empty time
      onChange([...hours, { day, time: "" }]);
    } else {
      // Remove the day
      onChange(hours.filter((h) => h.day !== day));
    }
  };

  const handleTimeChange = (day: string, time: string) => {
    onChange(
      hours.map((h) => (h.day === day ? { ...h, time } : h))
    );
  };

  const isDaySelected = (day: string) => {
    return hours.some((h) => h.day === day);
  };

  const getTimeForDay = (day: string) => {
    return hours.find((h) => h.day === day)?.time || "";
  };

  return (
    <div className="space-y-3">
      <Label>Operating Hours</Label>
      <div className="space-y-2 rounded-md border p-3">
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = isDaySelected(day.value);
          const time = getTimeForDay(day.value);

          return (
            <div key={day.value} className="flex items-center gap-3">
              <div className="flex items-center gap-2 min-w-[80px]">
                <Checkbox
                  id={`day-${day.value}`}
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    handleDayToggle(day.value, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`day-${day.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {day.label}
                </Label>
              </div>
              {isSelected && (
                <Input
                  type="text"
                  placeholder="e.g., 2pm, 5pm, 9am-5pm"
                  value={time}
                  onChange={(e) => handleTimeChange(day.value, e.target.value)}
                  className="flex-1"
                />
              )}
            </div>
          );
        })}
      </div>
      {hours.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Select days and enter times when the pantry is open
        </p>
      )}
    </div>
  );
}

