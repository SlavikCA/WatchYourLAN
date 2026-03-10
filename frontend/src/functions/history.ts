import { apiGetHistory, apiGetHistoryByDate } from "./api";
import { Host } from "./exports";

export async function getHistoryForMac(mac: string, date: string) {
    console.log(`[getHistoryForMac] mac="${mac}" date="${date}"`);
    let h:Host[] = [];
    if (date === "") {
        h = await apiGetHistory(mac);
    } else {
        h = await apiGetHistoryByDate(mac, date);
    }

    console.log(`[getHistoryForMac] got ${h ? h.length : 'null'} entries`);
    if (h != null) {
        if (h.length > 0) {
            console.log("[getHistoryForMac] first entry:", JSON.stringify(h[0]));
        }
        h.sort((a:Host, b:Host) => (a.Date < b.Date ? 1 : -1));
        return h;
    }
    return [];
}