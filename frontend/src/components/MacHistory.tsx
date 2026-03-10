import { createEffect, For, onCleanup, onMount, Show } from "solid-js";
import { getHistoryForMac } from "../functions/history";
import { Host } from "../functions/exports";
import { createStore } from "solid-js/store";

interface TimeSlot {
  hour: number;
  minute: number;  // start minute of the slot (0, 10, 20, 30, 40, 50)
  isOn: boolean;
  entries: Host[];
}

interface MacHistoryProps {
  mac: string;
  date: string;
  showLabels?: boolean;
}

function MacHistory(_props: MacHistoryProps) {

  const [timeSlots, setTimeSlots] = createStore<TimeSlot[]>([]);
  let interval: number;
  const showLabels = () => _props.showLabels !== false; // Default to true

  const SLOT_MINUTES = 10; // each slot covers 10 minutes
  const SLOTS_PER_HOUR = 60 / SLOT_MINUTES;
  const TOTAL_SLOTS = 24 * SLOTS_PER_HOUR; // 144 slots

  const processHistoryToTimeline = (history: Host[], date: string): TimeSlot[] => {
    // Initialize 144 time slots (one per 10 minutes)
    const slots: TimeSlot[] = Array.from({ length: TOTAL_SLOTS }, (_, i) => ({
      hour: Math.floor(i / SLOTS_PER_HOUR),
      minute: (i % SLOTS_PER_HOUR) * SLOT_MINUTES,
      isOn: false,
      entries: []
    }));

    // Process history entries
    console.log(`[MacHistory] Processing ${history.length} entries for date="${date}"`);
    if (history.length > 0) {
      console.log("[MacHistory] Sample entry.Date:", history[0].Date);
    }

    history.forEach(entry => {
      // Replace space with T to ensure consistent local-time parsing
      const entryDate = new Date(entry.Date.replace(' ', 'T'));
      const entryDateStr = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;

      // Only process entries for the selected date
      if (entryDateStr === date) {
        const hour = entryDate.getHours();
        const minute = entryDate.getMinutes();
        const slotIndex = hour * SLOTS_PER_HOUR + Math.floor(minute / SLOT_MINUTES);
        if (slotIndex >= 0 && slotIndex < TOTAL_SLOTS) {
          slots[slotIndex].entries.push(entry);
          if (entry.Now === 1) {
            slots[slotIndex].isOn = true;
          }
        }
      } else {
        console.log(`[MacHistory] Entry date mismatch: entryDateStr="${entryDateStr}" vs selected="${date}" | raw="${entry.Date}" | parsed="${entryDate.toString()}"`);
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

  const formatTime = (hour: number, minute: number): string => {
    return hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');
  };

  const getTooltip = (slot: TimeSlot): string => {
    const status = slot.isOn ? 'ON' : 'OFF';
    const endMinute = slot.minute + SLOT_MINUTES;
    const endHour = slot.hour + Math.floor(endMinute / 60);
    const time = formatTime(slot.hour, slot.minute) + ' - ' + formatTime(endHour % 24, endMinute % 60);
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
      <Show when={showLabels()}>
        <div class="timeline-labels">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
      </Show>
    </div>
  )
}

export default MacHistory
