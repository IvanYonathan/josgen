import moment from "moment";

const numberWithCommas = (x: string) => {
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x))
        x = x.replace(pattern, "$1,$2");
    return x;
}

const durationConvert = (start: string, end: string) =>
{
  const startMoment = moment(start, "YYYYMMDDHHmmss");
  const endMoment = moment(end, "YYYYMMDDHHmmss");

  let differenceInSeconds = endMoment.diff(startMoment, 'seconds');
  // Convert seconds to mm:ss format
  let minutes = Math.floor(differenceInSeconds / 60);
  let seconds = differenceInSeconds % 60;

  let formattedTime = String(minutes).padStart(2, '0') +":"+String(seconds).padStart(2, '0');
  return formattedTime;
}

const timeConvert = (str: string) =>
{
    var hour = str.substring(8, 10);
    var minute = str.substring(10, 12);
    var second = str.substring(12, 14);
    
    let callTime = hour+":"+minute+":"+second;

    return callTime;
}

const dateConvert = (str: string) =>
{
  var year = Number(str.substring(0, 4));
  var month = Number(str.substring(4, 6));
  var day = Number(str.substring(6, 8));

  let formattedMonth = String(month).padStart(2, '0')
  
  let callDate = day+"/"+formattedMonth+"/"+year;
 
  return callDate;
}

const isoDateConvert = (isoDate: string) => {
  if (!isoDate) return '-';

  if (isoDate.endsWith('Z')) {
    return moment.utc(isoDate).format('DD/MM/YYYY HH:mm');
  }
  
  return moment(isoDate).format('DD/MM/YYYY HH:mm');
}

export {
  numberWithCommas,
  durationConvert,
  timeConvert,
  dateConvert,
  isoDateConvert
}