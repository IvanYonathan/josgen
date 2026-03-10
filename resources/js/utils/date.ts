import moment from "moment"
import "moment/locale/id"

export function parseDate(date?: string): moment.Moment
{
  if (date === undefined)
  {
    return moment()
  }
  else if (typeof date === "string" && /^\d{14}$/.test(date))
  {
    return moment(date, "YYYYMMDDHHmmss")
  }
  else
  {
    return moment(date)
  }
}

export interface FormatDateOptions
{
  format?: string
  fullFormat?: boolean
  locale?: string
}

export interface FormatDateProps
{
  (date?: Date | string | number, opts?: FormatDateOptions): string
}

export function formatDate(date?: Date | string | number | 'now', opts?: FormatDateOptions): string
{
  if (typeof date === "string" && date === '') {
    return '-'
  }

  // Setting up the format
  if (opts !== undefined && opts?.fullFormat === true)
  {
    opts = { format: "dddd, DD MMMM YYYY, hh:mm:ss A", ...opts }
  }
  else
  {
    opts = { format: "DD MMM YYYY HH:mm:ss", ...opts }
  }

  // Parse the date into a moment instance
  let m: moment.Moment;
  if (date === undefined || date === 'now')
  {
    m = moment()
  }
  else if (typeof date === "string" && /^\d{14}$/.test(date))
  {
    // YYYYMMDDHHmmss format
    m = moment(date, "YYYYMMDDHHmmss")
  }
  else if (typeof date === "string" && date.endsWith('Z'))
  {
    // ISO 8601 with 'Z' suffix - remove 'Z' to treat as local time
    const localDateString = date.replace('Z', '');
    m = moment(localDateString)
  }
  else
  {
    m = moment(date)
  }

  if (opts.locale) {
    m = m.locale(opts.locale)
  }

  return m.format(opts.format)
}

export function generateTimestamp(): string
{
  return moment().format('YYYYMMDDHHmmss')
}