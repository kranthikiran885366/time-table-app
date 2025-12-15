const moment = require('moment');

const getCurrentDay = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

const getCurrentTime = () => {
  return moment().format('HH:mm');
};

const isCurrentClass = (startTime, endTime) => {
  const current = moment();
  const start = moment(startTime, 'HH:mm');
  const end = moment(endTime, 'HH:mm');
  return current.isBetween(start, end);
};

const getNextClass = (timetable) => {
  const currentTime = moment();
  const today = getCurrentDay();
  
  return timetable
    .filter(item => item.day === today)
    .find(item => {
      const startTime = moment(item.startTime, 'HH:mm');
      return startTime.isAfter(currentTime);
    });
};

module.exports = {
  getCurrentDay,
  getCurrentTime,
  isCurrentClass,
  getNextClass
};