/**
 * Utility functions related to time.
 */
type DateStyle = Intl.DateTimeFormatOptions["dateStyle"]
type Timestamp = string | number | Date

const getDateFormatter = (locale: string, dateStyle: DateStyle) => {
  return new Intl.DateTimeFormat(locale, { dateStyle })
}

/**
 * Formats a date according to the specified options.
 */
export const formatDate = (
  timestamp: Timestamp,
  dateStyle: DateStyle = "medium",
  locale = "en-US",
) => {
  return getDateFormatter(locale, dateStyle).format(new Date(timestamp))
}

/**
 * Short month + day, used when the year is shown separately as a group label.
 */
export const formatMonthDay = (timestamp: Timestamp, locale = "en-US") => {
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(
    new Date(timestamp),
  )
}
