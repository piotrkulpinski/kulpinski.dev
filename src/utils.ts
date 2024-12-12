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
 * @param timestamp - The timestamp to format.
 * @param dateStyle - The date formatting style to use. Defaults to 'medium'.
 * @param locale - The locale to use for formatting. Defaults to 'en'.
 * @returns The formatted date string.
 */
export const formatDate = (
  timestamp: Timestamp,
  dateStyle: DateStyle = "medium",
  locale = "en-US",
) => {
  return getDateFormatter(locale, dateStyle).format(new Date(timestamp))
}
