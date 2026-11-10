import { formatCurrency } from "../../../utils/formatters";

const clock = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export function orderTime(date: string) {
  return clock.format(new Date(date));
}

export function orderReference(id: string) {
  return `SB-${id.slice(0, 8).toUpperCase()}`;
}

export function orderMoney(paise: number) {
  return formatCurrency(paise / 100);
}
