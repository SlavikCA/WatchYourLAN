import { For, createEffect, onCleanup, onMount, Show } from "solid-js";
import { getHistoryForMac } from "../functions/history";
import { Host, show } from "../functions/exports";
import { createStore } from "solid-js/store";

interface TimelineSegment {
  start: number;
  end: number;
  status: 'on' | 'off';
  date: string;
  iface: string;
  ip: string;
  known: string;
}

function MacHistory(_props: { mac: string; date?: string }) {

  const [hist, setHist] = createStore<Host[]>([]);
  const [segments, setSegments] = createStore<TimelineSegment[]>([]);
  let interval: number;

  // Parse timestamp from Date string (format: "2006-01-02 15:04:05")
  const parseTimestamp = (dateStr: string): Date => {
    const [datePart, timePart] = dateStr.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds);
  };

  // Convert time to percentage within 24-hour day (0-100)
  const timeToPercent = (date: Date): number => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    return (totalSeconds / 86400) * 100; // 86400 = 24 * 60 * 60
  };

  // Build timeline segments from history data
  const buildSegments = (history: Host[]) => {
    if (history.length === 0) {
      setSegments([]);
      return;
    }

    const newSegments: TimelineSegment[] = [];
    const selectedDate = _props.date || new Date().toISOString().split('T')[0];
    
    // Parse the selected date to get the start of the day
    const [selYear, selMonth, selDay] = selectedDate.split('-').map(Number);
    const dayStart = new Date(selYear, selMonth - 1, selDay, 0, 0, 0);
    const dayEnd = new Date(selYear, selMonth - 1, selDay, 23, 59, 59);

    // Sort history by date ascending
    const sortedHist = [...history].sort((a, b) => 
      parseTimestamp(a.Date).getTime() - parseTimestamp(b.Date).getTime()
    );

    // Build segments based on state changes
    let currentStatus: 'on' | 'off' | null = null;
    let segmentStart: Date | null = null;

    for (const h of sortedHist) {
      const timestamp = parseTimestamp(h.Date);
      
      // Skip entries outside the selected date range
      if (timestamp < dayStart || timestamp > dayEnd) continue;

      const status = h.Now === 0 ? 'off' : 'on';

      if (currentStatus === null) {
        // First entry for this day
        currentStatus = status;
        segmentStart = timestamp;
      } else if (status !== currentStatus) {
        // State changed, close current segment and start new one
        if (segmentStart) {
          newSegments.push({
            start: timeToPercent(segmentStart),
            end: timeToPercent(timestamp),
            status: currentStatus,
            date: h.Date,
            iface: h.Iface,
            ip: h.IP,
            known: String(h.Known)
          });
        }
        currentStatus = status;
        segmentStart = timestamp;
      }
    }

    // Close the last segment
    if (currentStatus !== null && segmentStart) {
      newSegments.push({
        start: timeToPercent(segmentStart),
        end: 100, // End of day
        status: currentStatus,
        date: sortedHist[sortedHist.length - 1].Date,
        iface: sortedHist[sortedHist.length - 1].Iface,
        ip: sortedHist[sortedHist.length - 1].IP,
        known: String(sortedHist[sortedHist.length - 1].Known)
      });
    }

    setSegments(newSegments);
  };

  onMount(async () => {
    const newHistory = await getHistoryForMac(_props.mac, _props.date || "");
    setHist(newHistory);
    buildSegments(newHistory);

    interval = setInterval(async () => {
      const newHistory = await getHistoryForMac(_props.mac, _props.date || "");
      setHist(newHistory);
      buildSegments(newHistory);
    }, 60000); // 60000 ms = 1 minute
  });

  onCleanup(() => {
    clearInterval(interval);
  });

  // Rebuild segments when date changes
  createEffect(() => {
    if (_props.date !== undefined) {
      buildSegments(hist);
    }
  });

  return (
    <div class="timeline-container" title="Timeline: 24-hour history">
      <div class="timeline-bar">
        <For each={segments}>{(segment, index) =>
          <Show when={index() < show()}>
            <div
              class={`timeline-segment timeline-${segment.status}`}
              style={{
                left: `${segment.start}%`,
                width: `${segment.end - segment.start}%`
              }}
              title={`Date: ${segment.date}\nIface: ${segment.iface}\nIP: ${segment.ip}\nKnown: ${segment.known}`}
            />
          </Show>
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
