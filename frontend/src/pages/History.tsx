import { createEffect, createSignal, For, Show } from "solid-js"
import Filter from "../components/Filter"
import { allHosts, histUpdOnFilter, Host, setHistUpdOnFilter } from "../functions/exports"
import MacHistory from "../components/MacHistory"

function History() {

  let hosts: Host[] = [];
  hosts.push(...allHosts);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = createSignal(getTodayDate());
  
  createEffect(() => {
    if (histUpdOnFilter()) {
      hosts = [];
      hosts.push(...allHosts);
      console.log("Upd on Filter");
      setHistUpdOnFilter(false);
    }
  });

  return (
    <div class="card border-primary">
      <div class="card-header d-flex justify-content-between">
        <Filter></Filter>
        <input 
          type="date" 
          class="form-control" 
          style="max-width: 12em;"
          value={selectedDate()}
          onInput={(e) => setSelectedDate(e.target.value)}
          title="Select date to view history"
        />
      </div>
      <div class="card-body">
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th style="width: 2em;"></th>
              <th style="white-space: nowrap;">Device</th>
              <th style="width: 100%;">
                <div class="timescale-header">
                  <div class="timescale-bar">
                    <For each={Array.from({length: 24}, (_, i) => i)}>{(hour) =>
                      <div class="timescale-tick">
                        <span class="timescale-label">{hour.toString().padStart(2, '0')}</span>
                      </div>
                    }</For>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
          <Show
            when={!histUpdOnFilter()}
          >
            <For each={hosts}>{(host, index) =>
            <tr>
              <td class="opacity-50" style="width: 2em;">{index()+1}.</td>
              <td style="white-space: nowrap;">
                <a href={"/host/"+host.ID}>{host.Name}</a><br></br>
                <a href={"http://"+host.IP}>{host.IP}</a>
              </td>
              <td style="width: 100%;">
                <MacHistory mac={host.Mac} date={selectedDate()} showLabels={false}></MacHistory>
              </td>
            </tr>
            }</For>
          </Show>
          </tbody> 
        </table>
      </div>
    </div>
  )
}

export default History
