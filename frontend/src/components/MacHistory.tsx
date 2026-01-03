import { For, onCleanup, onMount, Show, createEffect } from "solid-js";
import { getHistoryForMac } from "../functions/history";
import { Host, show } from "../functions/exports";
import { createStore } from "solid-js/store";

function MacHistory(_props: any) {
  const [hist, setHist] = createStore<Host[]>([]);
  let interval: number;

  const fetchHistory = async () => {
    const newHistory = await getHistoryForMac(_props.mac, _props.date);
    if (!_props.date) {
      const now = Date.now();
      const filtered = newHistory.filter((h: Host) => {
        const entryDate = new Date(h.Date);
        return now - entryDate.getTime() <= 24 * 60 * 60 * 1000;
      });
      setHist(filtered);
    } else {
      setHist(newHistory);
    }
  };

  createEffect(() => {
    fetchHistory();
  });

  onMount(() => {
    interval = setInterval(fetchHistory, 60000);
  });

  onCleanup(() => {
    clearInterval(interval);
  });

  return (
    <div class="history-line">
      <For each={hist}>{(h, index) => (
        <Show when={index() < show()}>
          <i title={`Date:${h.Date}\nIface:${h.Iface}\nIP:${h.IP}\nKnown:${h.Known}`} class={h.Now === 0 ? "my-box-off" : "my-box-on"}></i>
        </Show>
      )}</For>
    </div>
  );
}

export default MacHistory
