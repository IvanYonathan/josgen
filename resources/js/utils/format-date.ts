
export function formatDate(date: Date, isEndDate: boolean)
{
  const newDate = new Date(date)

  if (isEndDate) {
    newDate.setHours(23, 59, 59, 0)
  } else {
    newDate.setHours(0, 0, 0, 0)
  }

  const year = newDate.getFullYear()
  const month = String(newDate.getMonth() + 1).padStart(2, '0')
  const day = String(newDate.getDate()).padStart(2, '0')
  const hours = String(newDate.getHours()).padStart(2, '0')
  const minutes = String(newDate.getMinutes()).padStart(2, '0')
  const seconds = String(newDate.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}