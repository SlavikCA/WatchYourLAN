import { createSignal, createEffect, For, Show } from "solid-js"
// History page displays a table of hosts with their online/offline history.
// Added date selection (Today/Yesterday) to filter history displayed.
import Filter from "../components/Filter"
import { allHosts, histUpdOnFilter, Host, setHistUpdOnFilter, setShow } from "../functions/exports"
import MacHistory from "../components/MacHistory"
import HistShow from "../components/HistShow"

function History() {
  // Signal to hold selected date. Empty string means "Today" (last 24h), otherwise a YYYY-MM-DD string for a specific day.
  const [date, setDate] = createSignal<string>("")
  const yesterdayStr = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().split('T')[0]
  })()

  let hosts: Host[] = []
  hosts.push(...allHosts)

  // Initialize show value from localStorage with fallback
  const initShow = () => {
    const stored = localStorage.getItem("histShow");
    const num = stored ? Number(stored) : NaN;
    if (!isNaN(num) && num > 0) {
      setShow(num);
    } else {
      setShow(200);
    }
  };
  initShow();

  // Update hosts when filter changes
  createEffect(() => {
    if (histUpdOnFilter()) {
      hosts = []
      hosts.push(...allHosts)
      console.log("Upd on Filter")
      setHistUpdOnFilter(false)
    }
  })

  return (
    <div class="card border-primary">
      <div class="card-header d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center">
          <Filter />
          {/* Date selection buttons */}
          <div class="btn-group ms-3" role="group">
            <button
              class="btn btn-sm btn-outline-primary"
              classList={{ active: date() === "" }}
              onClick={() => setDate("")}
            >
              Today
            </button>
            <button
              class="btn btn-sm btn-outline-primary"
              classList={{ active: date() === yesterdayStr }}
              onClick={() => setDate(yesterdayStr)}
            >
              Yesterday
            </button>
          </div>
        </div>
        <HistShow name="histShow" />
      </div>
      <div class="card-body">
        <table class="table table-striped table-hover">
          <tbody>
            <Show when={!histUpdOnFilter()}>
              <For each={hosts}>{(host, index) => (
                <tr>
                  <td class="opacity-50" style="width: 2em;">{index() + 1}.</td>
                  <td>
                    <a href={"/host/" + host.ID}>{host.Name}</a><br />
                    <a href={"http://" + host.IP}>{host.IP}</a>
                  </td>
                  <td class="history-cell">
                    <MacHistory mac={host.Mac} date={date()} />
                  </td>
                </tr>
              )}</For>
            </Show>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default History
