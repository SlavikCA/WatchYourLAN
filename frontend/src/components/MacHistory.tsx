import { createEffect, For, onCleanup, onMount } from "solid-js";
import { getHistoryForMac } from "../functions/history";
import { Host } from "../functions/exports";
import { createStore } from "solid-js/store";

interface TimeSlot {
  hour: number;
  isOn: boolean;
  entries: Host[];
}

function MacHistory(_props: any) {

  const [timeSlots, setTimeSlots] = createStore<TimeSlot[]>([]);
  let interval: number;

  const processHistoryToTimeline = (history: Host[], date: string): TimeSlot[] => {
    // Initialize 24 time slots (one per hour)
    const slots: TimeSlot[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      isOn: false,
      entries: []
    }));

    // Process history entries
    history.forEach(entry => {
      const entryDate = new Date(entry.Date);
      const entryDateStr = entryDate.toISOString().split('T')[0];
      
      // Only process entries for the selected date
      if (entryDateStr === date) {
        const hour = entryDate.getHours();
        if (hour >= 0 && hour < 24) {
          slots[hour].entries.push(entry);
          // If any entry in this hour has Now=1, mark the slot as ON
          if (entry.Now === 1) {
            slots[hour].isOn = true;
          }
        }
      }
    });

    return slots;
  };

  const fetchAndProcess = async () => {
    const newHistory = await getHistoryForMac(_props.mac, _props.date);
    const slots = processHistoryToTimeline(newHistory, _props.date);
    setTimeSlots(slots);
  };

  onMount(async () => {
    await fetchAndProcess();
    interval = setInterval(fetchAndProcess, 60000); // 60000 ms = 1 minute
  });

  // Re-fetch when date changes
  createEffect(async () => {
    const date = _props.date;
    if (date) {
      await fetchAndProcess();
    }
  });

  onCleanup(() => {
    clearInterval(interval);
  });

  const formatHour = (hour: number): string => {
    return hour.toString().padStart(2, '0') + ':00';
  };

  const getTooltip = (slot: TimeSlot): string => {
    const status = slot.isOn ? 'ON' : 'OFF';
    const time = formatHour(slot.hour) + ' - ' + formatHour((slot.hour + 1) % 24);
    if (slot.entries.length > 0) {
      const lastEntry = slot.entries[slot.entries.length - 1];
      return `Time: ${time}\nStatus: ${status}\nIP: ${lastEntry.IP}\nIface: ${lastEntry.Iface}`;
    }
    return `Time: ${time}\nStatus: ${status}\nNo data`;
  };

  return (
    <div class="timeline-container">
      <div class="timeline-bar">
        <For each={timeSlots}>{(slot) =>
          <div 
            class={slot.isOn ? "timeline-slot timeline-on" : "timeline-slot timeline-off"}
            title={getTooltip(slot)}
          ></div>
        }</For>
      </div>
      <div class="timeline-labels">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>
    </div>
  )
}

export default MacHistory
