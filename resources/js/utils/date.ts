import moment from "moment"

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

  // Parsing the date
  if (date === undefined || date === 'now')
  {
    return moment().format(opts.format)
  }
  else if (typeof date === "string" && /^\d{14}$/.test(date))
  {
    // YYYYMMDDHHmmss format
    return moment(date, "YYYYMMDDHHmmss").format(opts.format)
  }
  else if (typeof date === "string" && date.endsWith('Z'))
  {
    // ISO 8601 with 'Z' suffix - treat as already adjusted time
    return moment.utc(date).format(opts.format)
  }
  else
  {
    return moment(date).format(opts.format)
  }
}

export function generateTimestamp(): string
{
  return moment().format('YYYYMMDDHHmmss')
}