
/*
Vanilla Javascript Datepicker
Designed by: Dan Boswell
*/
let unavaildays 
// = [{ s: "01/03/2024", e: "03/03/2024" },
// { s: "04/01/2024", e: "04/04/2024" },
// { s: "04/09/2024", e: "04/13/2024" },
// { s: "06/23/2024", e: "06/25/2024" },]

//fetch data

async function getlatestdata() {

    const dates = await fetch(`/campgrounds/${campground._id}/getAllRes`);

    const data = await dates.json();
    console.log(data);
    unavaildays=data.map(d=>{return {s:d.s,e:d.e}})
    console.log('unavaildays: ',unavaildays)
 
}


console.log('unavaildays: ',unavaildays)
//console.log('unavaildays2: ',unavaildays2)
//  async function runCalender()
//  {
let formatter = new Intl.DateTimeFormat('en-US', {
  year: "numeric",
  month: '2-digit',
  day: '2-digit'
})

var monthsToShow, primary, accent, mode;
var cal;
const d = new Date();
var year = d.getFullYear();
var month = d.getMonth() - 1;
const calendar = document.getElementsByClassName("calendar")[0];
const calContainer = document.getElementsByClassName("cal__container")[0];
let startInput = document.getElementById("start");
let endInput = document.getElementById("end");
const inputContainer = document.getElementsByClassName('inputs')[0];
const clearContainer = document.getElementsByClassName('clear__btn')[0];
var dateRange = [];
var style = false;
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const disabledDays = [
  "23/03/2020", "29/02/2024"
];

Pikka = {
  date: function (options) {
    style = options.style;
    monthsToShow = options.monthsToRender;
    accent = options.accentColor;
    primary = options.primaryColor;
    mode = options.mode;
  }
}

// options for setting up the calendar
Pikka.date({
  format: "mm/dd/yyyy",
  style: "circles", // squares or circles
  primaryColor: "#FF5A5F",
  accentColor: "#f99092",
  monthsToRender: 4, // how many months to render in multiple mode
  disabledDatesFormat: "en-US",
  userDatesFormat: "en-US",
  mode: "multiple" // single or multiple
});

var startDateSelected, endDaySelected = false;
var startDay, endDay, cells, rangeSelected;

let daterange2 = []

document.addEventListener("DOMContentLoaded", async function () {
  await getlatestdata()
  if (mode == "single") {
    document.getElementsByClassName('mobile')[0].classList.add('single');
    monthsToShow = 1;
  } else {
    monthsToShow = 4;
  }
  for (let i = 1; i <= monthsToShow; i++) {
    month = month + 1;
    if (month == 12) {
      month = 0;
      year = year + 1;
    }
    buildCal();
  }
  if (mode == "multiple") {
    addMoreMonths();
  }
});

// function to destroy the calendar element
function clearCal() {
  let calCont = document.getElementsByClassName('cal__container')[0];
  calCont.innerHTML = "";
}

function nextMonth() {
  clearCal();
  month = month + 1;
  if (month > 11) {
    month = 0;
    year = year + 1;
  }
  buildCal();
  colourDates();
}

function prevMonth() {
  clearCal();
  if (month == 0) {
    month = 11;
    year = year - 1;
  } else {
    month = month - 1;
  }
  buildCal();
  colourDates();
}



// Logic for calendar
function buildCal() {
  let monthControls = document.createElement("div");
  monthControls.classList.add('month__controls');
  let newMonth = document.createElement("div");
  let monthTitle = document.createElement("span");
  let monthText = document.createTextNode(months[month] + " " + year);
  let rArrow, lArrow;
  newMonth.appendChild(monthControls);

  //single mode needs next/prev month controls
  if (mode == "single") {
    rArrow = document.createElement('div');
    lArrow = document.createElement('div');
    lArrow.innerHTML = '<i class="fas fa-arrow-left"></i>';
    lArrow.classList.add('lArrow');
    rArrow.innerHTML = '<i class="fas fa-arrow-right"></i>';
    rArrow.classList.add('rArrow');
    rArrow.addEventListener('click', nextMonth);
    lArrow.addEventListener('click', prevMonth);
  }
  monthTitle.appendChild(monthText);
  newMonth.classList.add("month");

  // create the table in the DOM
  cal = createTable();
  const daysOfWeek = ["m", "t", "w", "t", "f", "s", "s"];
  let header = cal.createTHead();
  for (let i = 0; i < daysOfWeek.length; i++) {
    th = document.createElement("th");
    th.innerHTML = daysOfWeek[i];
    header.appendChild(th);
  }

  // this adds a day onto February every leap year (every 4 years)
  let daysInMonth = new Date(2019, parseInt(month) + 1, 0).getDate();
  if (month == 1 && year % 4 == 0) {
    daysInMonth = daysInMonth + 1;
  }

  // define a start day, then loop through the month
  let startDay = new Date(year, month, 1).getDay();
  let weekIndex = cal.getElementsByTagName("tr").length;
  let day = startDay == 0 ? 7 : startDay;
  var row = cal.insertRow(weekIndex);

  // creates the blanks at the start of the month
  for (let ed = 1; ed < day; ed++) {
    row.insertCell(-1);
  }

  // loops through the days adding cells and creating new rows
  for (let dim = 1; dim <= daysInMonth; dim++) {
    let cell = row.insertCell(-1);
    let usFormat = formatter.format(new Date(year, month, dim))
    cell.setAttribute("data-date-intl", new Date(year, month, dim));
    cell.setAttribute("data-date", usFormat);
    //arguments: gbFormat, cell, year,month,dim,
    //start of block
    if (disabledDays.includes(usFormat)) {
      cell.classList.add('disabled');
    }
    //block dates
    if (processDate(cell.getAttribute('data-date')) < new Date()) {
      cell.classList.add('disabled')
    }
    //console.log('now in initcells, unavaildays: ',unavaildays)
    unavaildays.forEach((u) => {
      if (processDate(cell.getAttribute('data-date')) >= processDate(u.s) && processDate(cell.getAttribute('data-date')) <= processDate(u.e))
        cell.classList.add('disabled')
    })


    //if daterange2 exists
    if (daterange2.length > 0 && startDateSelected && !endDaySelected) {
      console.log('now in buildCal blockingdate part of daterange2 part: ')
      console.log('daterange2: ', daterange2)
      if (processDate(usFormat) < processDate(daterange2[0]) || daterange2[1] && processDate(usFormat) > processDate(daterange2[1])) {
        console.log('condition is true')
        cell.classList.add('disabled2')
      }
    }
    if (startDateSelected && endDaySelected && daterange2.length > 0) {
      if (processDate(usFormat) < processDate(daterange2[0]) || processDate(usFormat) > processDate(daterange2[1])) {
        console.log('condition is true')
        if (cell.classList.contains('disabled2'))
          cell.classList.remove('disabled2')
      }
    }
    //end of block


    cell.innerHTML = '<span>' + dim + '</span>';
    day++;
    if (day == 8) {
      weekIndex++;
      row = cal.insertRow(weekIndex);
      day = 1;
    }
  }


  let monthTitleCont = document.createElement("div");
  monthTitleCont.appendChild(monthTitle);
  if (mode == "single") {
    monthControls.appendChild(lArrow);
    monthControls.appendChild(monthTitleCont);
    monthControls.appendChild(rArrow);
  } else {
    monthControls.appendChild(monthTitleCont);
  }
  newMonth.appendChild(cal);
  calContainer.appendChild(newMonth);
  if (month == new Date().getMonth() && year == new Date().getFullYear()) {
    highlightToday();
  }

  // function to add event listeners to each table cell
  //blockDates()
  initCells(cal);
}

// function to create and append more months to the calendar
let timesOfAddMonthsButtonClicked = 0


function addMoreMonths() {
  console.log('now in addMoreMonths')
  let moreMonths = document.createElement("div");
  moreMonths.classList.add("more__months");
  moreMonths.innerHTML = "+";
  moreMonths.addEventListener("click", function () {
    console.log('now in addMoreMonths2')//this is called after user selected startdate then click + button
    timesOfAddMonthsButtonClicked += 1;
    for (let i = 1; i <= 3; i++) {
      month = month + 1;
      if (month == 12) {
        month = 0;
        year = year + 1;
      }
      buildCal();

    }
    let moreMonthsCurrent = document.getElementsByClassName("more__months")[0];
    moreMonthsCurrent.remove();
    calContainer.appendChild(moreMonths);


  });
  calContainer.appendChild(moreMonths);
}

/* function to build a table */
function createTable() {
  let table = document.createElement("table");
  let thead = table.createTHead();
  let tbody = table.createTBody();
  table.classList.add(style)
  return table;
}




function initCells(newMonth) {
  console.log('i m now at top of initcell')
  cells = newMonth.querySelectorAll("[data-date]");
  // loop through all cells adding event listeners
  cells.forEach(function (item, idx) {
    item.addEventListener("click", function () {
      /* 
      if the start date hasn't been selected
      get the start date, set it and highlight it 
      */
      if (!startDateSelected || typeof startDateSelected == "undefined") {
        clearRange();
        //mycode
        endDaySelected = false;
        //endofmycode
        console.log('beg of initcells, daterange2: ', daterange2)
        endInput.value = "";
        startDay = item.getAttribute("data-date");//31/05/2024 string dd/mm/yyyy
        //mycode
        //to alert that startDay cannot be 1 day b4 other res start date n go back to top of fn
        let oneDayBeforeRes = false
        unavaildays.forEach(u => {
          if (Math.floor((processDate(u.s).getTime() - processDate(startDay).getTime()) / (1000 * 3600 * 24)) === 1) {
            oneDayBeforeRes = true
            return;
          }
        })
        if (oneDayBeforeRes) {
          console.log('oneDayBeforeRes')

          endDay = false;
          endDaySelected = false;
          //20240301
          startDateSelected = false;
          rangeSelected = false;
          console.log('oneDayBeforeRes, daterange2: ', daterange2)//daterange2 is empty

          clearRange();
          startInput.value = ''
          createAlertDiv('Start date cannot be 1 day before an unavailable day.')
          return
        }

        //endofmycode




        item.classList.add('selected__startEnd');
        dateRange.push(startDay);
        rangeStart = startDay;
        startInput.value = startDay;
        endDay = false;
        startDateSelected = true;
        rangeSelected = false;
        //mycode

        //end of mycode

        console.log('startDay: ', startDay)//05/04/2024 dd/mm/yyyy
        console.log('endDaySelected: ', endDaySelected)
        console.log('startDateSelected: ', startDateSelected)

        let earlierthanares = false;
        for (let i = 0; i < unavaildays.length; i++) {
          let u = unavaildays[i];

          console.log('now in initcell loop, startDay: ', startDay)
          if (processDate(startDay) < processDate(u.s)) {
            console.log('processDate(startDay) < processDate(u.s), u.s: ', u.s)
            earlierthanares = true;
            daterange2.push(startDay);
            daterange2.push(u.s);
            console.log('daterange2: ', daterange2)

            break;

          }

          // if(processDate(startDay)>processDate(u.e))
          // {
          //   if(daterange2.length>0)daterange2=[]
          //   daterange2.push(u.s)
          // }
        }
        //if(!earlierthanares)daterange2.push(unavaildays[unavaildays.length-1].s)
        if (!earlierthanares) {
          daterange2.push(startDay)
          console.log('pushed startday to daterange2')
        }
        //block

        handleBlocking()

      } else {






        // when the user clicks the end date, set the date and highlight
        endDay = this.getAttribute("data-date");
        let selected = false;
        /* 
        loop through the days between the start and end day
        highlight each cell until you reach the end date
        processDate turns the en-GB date format back to standard format to compare 
        */
        if (processDate(endDay) > processDate(startDay)) {
          //clear blocked
          //use a flag eg blockAfterStarted
          console.log('end dates selected?', endDaySelected)
          rangeEnd = endDay;
          endInput.value = endDay;
          //mycode
          endDaySelected = true
          console.log('end dates selected,', endDaySelected)
          //clear blocked?
          handleBlocking()
          //clear daterange2
          daterange2 = []

          //end of mycode
          item.classList.add('selected__startEnd');
          while (selected == false) {
            //mycode
            // if(startDay===endDay)
            // {

            // } 
            //endofmycode
            if (startDay !== endDay) {

              var dateParts = startDay.split("/");
              let tomorrow = new Date(
                parseInt(dateParts[2]),
                parseInt(dateParts[0]) - 1,
                parseInt(dateParts[1]) + 1
              );
              let tempDate = formatter.format(tomorrow);
              startDay = tempDate;
              rangeSelected = true;
            } else {
              selected = true;
              logDateArray();
              //mycode
              // endDaySelected=false;
              //endofmycode
            }
          }
          startDateSelected = false;
          //mycode
          //endDaySelected=false;
          //end of mycode
        } else {
          /* 
          if the user selects an earlier start date:
          clear the range
          set the new start date
          colour the new start date 
          */
          //my code
          if (startDay === endDay) {
            //daterange2=[]
            console.log('startend=endday,endDay,endDaySelected, startDaySelected: ', endDay, endDaySelected, startDateSelected)
            createAlertDiv('Start date cannot be same as end date.')
            endDay = false;
            endDaySelected = false;
            //20240301
            startDateSelected = false;
            rangeSelected = false;
            console.log('startday===endday, daterange2: ', daterange2)//daterange2 not cleared
            handleBlocking()
            clearRange();
            startInput.value = ''
            console.log('startday===endda,daterange2: ', daterange2)
            return;

          }
          //end of my code
          console.log('came here')
          clearRange();
          startDay = item.getAttribute("data-date");
          startInput.value = startDay;
          item.classList.add('selected__startEnd');
          endDay = false;
          startDateSelected = true;
          rangeSelected = false;
        }
      }
    });
  });
  //mycode - for clear date 
  document.getElementById('cleardates').addEventListener('click', function () {
    console.log('cleardates link hit')
    endDay = false
    endDaySelected = false
    startDateSelected = false
    rangeSelected = false
    if (daterange2.length > 0) handleBlocking()
    clearRange()
    startInput.value = ''
    endInput.value = ''
    return
  })
  //endofmycode
}


/*
This function saves the selected dates into an array
The saved array is used to render the selected dates
if the month changes.
*/
function logDateArray() {
  dateRange = [];
  let start = startInput.value;
  let end = endInput.value;

  console.log('now in logDateArray, start, end: ', start, end)
  let tempDate = start;
  while (tempDate !== endInput.value) {
    var dateParts = tempDate.split("/");
    let tomorrow = new Date(
      parseInt(dateParts[2]),
      parseInt(dateParts[0]) - 1,
      parseInt(dateParts[1]) + 1
    );
    tempDate = formatter.format(tomorrow);
    dateRange.push(tempDate);
  }
  dateRange.unshift(start);
  colourDates();
  //mycode
  console.log('in logDateArray, start: ', start)
  console.log('in logDateArray, end: ', end)
  //
}

/*
Function to loop through the saved array and colour the dates
*/
function colourDates() {
  dateRange.forEach(function (itm, idx) {
    let classToAdd = idx == 0 || idx == dateRange.length - 1 ? 'selected__startEnd' : 'selected';
    let cell = document.querySelectorAll('[data-date="' + itm + '"]')[0];
    if (typeof cell != "undefined") {
      cell.classList.add(classToAdd);
    }
  });
}

/*
Process date turns en-GB date format back to a standard date object
*/
function processDate(date) {
  var parts = date.split("/");
  return new Date(parts[2], parts[0] - 1, parts[1]);
}

/* 
this function deletes all the <tr> elements
then rebuilds the table header
*/
function deletePrevMonth() {
  const cal = document.getElementById("cal");
  cal.innerHTML = "";
}

/* 
function highlights the current day we're on
only if we're on the right month
*/
function highlightToday() {
  let today = new Date();
  let todayCell = document.querySelector(
    'td[data-date="' + formatter.format(today) + '"]'
  );
  todayCell.style.backgroundColor = "#ededed";
}

/* function to clear the selected dates */
function clearRange() {
  let selected = document.querySelectorAll('.selected,.selected__startEnd');
  for (let item of selected) {
    //if(!item.classList.contains('disabled'))
    //item.classList = "";
    if (item.classList.contains('selected')) item.classList.remove('selected')
    if (item.classList.contains('selected__startEnd')) item.classList.remove('selected__startEnd')
  }
  dateRange = [];
  //mycode
  daterange2 = []
  //endofmycode
}


function handleBlocking() {
  //ori 4 months, then +
  //check buttonclicktime
  //letsay clicktime=1 means need to go back 3 months
  console.log('in handleBlocking, endDaySelected: ', endDaySelected)
  console.log('in handleBlocking, startDateSelected: ', startDateSelected)
  console.log('daterange2: ', daterange2)
  console.log('in handleBlocking, timesOfAddMonthsButtonClicked: ', timesOfAddMonthsButtonClicked)


  console.log('month: ', month)
  console.log('year: ', year)

  let newmonth = month  //go back 3 months + buttontime*3months
  let newyear = year

  let noOfMonthsToGoBack = 3 + (timesOfAddMonthsButtonClicked * 3)
  console.log('noOfMonthsToGoBack', noOfMonthsToGoBack)
  for (let i = 0; i < noOfMonthsToGoBack; i++) {
    newmonth -= 1;
    if (newmonth < 0) {
      newmonth += 12
      newyear = newyear - 1
    }


  }


  console.log('newmonth: ', newmonth)
  console.log('newyear: ', newyear)
  let newmonth2 = newmonth;
  let newyear2 = newyear
  if (startDateSelected && !endDaySelected) {
    console.log('startDateSelected && !endDaySelected')
    for (let i = 0; i <= noOfMonthsToGoBack; i++) {

      //newmonth2 = newmonth2 + 1;

      if (newmonth2 === 12) {
        newmonth2 = 0;
        newyear2 = newyear2 + 1;
      }
      // buildCal();
      // if(startDateSelected&&!endDaySelected)buildCalAfterStartDate()
      let daysInMonth = new Date(2019, parseInt(newmonth2) + 1, 0).getDate();
      //console.log('in handleBlocking, daysInMonth:', daysInMonth)
      //console.log('in handleBlocking, month:', month)
      //console.log('in handleBlocking, year:', year)

      if (newmonth2 == 1 && newyear2 % 4 == 0) {
        daysInMonth = daysInMonth + 1;
      }


      // loops through the days adding cells and creating new rows
      for (let dim = 1; dim <= daysInMonth; dim++) {
        //let cell = row.insertCell(-1);

        let usFormat = formatter.format(new Date(newyear2, newmonth2, dim));

        let cell = document.querySelectorAll('[data-date="' + usFormat + '"]')[0];
        //console.log('in handleBlocking, cell: ', cell)

        if (new Date(newyear2, newmonth2, dim) < processDate(daterange2[0]) || daterange2[1] && new Date(newyear2, newmonth2, dim) > processDate(daterange2[1])) {
          //recheck 
          console.log('hit first loop add disabled2 yyyy-mm-dd: ', new Date(newyear2, newmonth2, dim), processDate(daterange2[0]))
          cell.classList.add('disabled2')
        }

      }
      newmonth2 += 1;
    }
  }
  console.log('end of loop, newmonth2', newmonth2)
  let newmonth3 = newmonth;
  let newyear3 = newyear
  if (startDateSelected && endDaySelected || (!startDateSelected && !endDaySelected)) {
    console.log('startDateSelected&&endDaySelected')
    //clear blocked
    for (let i = 0; i <= noOfMonthsToGoBack; i++) {

      //newmonth3 = newmonth3 + 1;
      if (newmonth3 == 12) {
        newmonth3 = 0;
        newyear3 = newyear3 + 1;
      }
      // buildCal();
      // if(startDateSelected&&!endDaySelected)handleBlocking()
      let daysInMonth = new Date(2019, parseInt(newmonth3) + 1, 0).getDate();
      console.log('in handleBlocking, daysInMonth:', daysInMonth)
      console.log('in handleBlocking, month:', month)
      console.log('in handleBlocking, year:', year)

      if (newmonth3 == 1 && newyear3 % 4 == 0) {
        daysInMonth = daysInMonth + 1;
      }


      // loops through the days adding cells and creating new rows
      for (let dim = 1; dim <= daysInMonth; dim++) {
        //let cell = row.insertCell(-1);

        let usFormat = formatter.format(new Date(newyear3, newmonth3, dim));

        let cell = document.querySelectorAll('[data-date="' + usFormat + '"]')[0];

        console.log('now in handleBlockin 2nd loop, cell: ', cell)
        console.log('now in handleBlockin 2nd loop, newyear3: ', newyear3)
        console.log('now in handleBlockin 2nd loop, newmonth3: ', newmonth3)
        console.log('now in handleBlockin 2nd loop, dim: ', dim)
        //console.log('now in handleBlockin 2nd loop, new Date(newyear3, newmonth3, dim): ',new Date(newyear3, newmonth3, dim))

        if (new Date(newyear3, newmonth3, dim) < processDate(daterange2[0]) || daterange2[1] && new Date(newyear3, newmonth3, dim) > processDate(daterange2[1])) {
          if (cell && cell.classList.contains('disabled2'))
            cell.classList.remove('disabled2')
        }
      }
      newmonth3 += 1;
    }
    // daterange2=[]
  }

}

function createAlertDiv(message) {
  let alertdiv = document.createElement('div')
  alertdiv.setAttribute('class', "alert alert-warning alert-dismissible fade show")
  alertdiv.setAttribute('role', 'alert')
  alertdiv.innerHTML = `<strong>Warning!</strong> ${message} <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button><a href="/test">Clear dates</a>`
  document.getElementsByClassName('modal-body')[0].append(alertdiv)

}
//  }

// async function main()
// {
//   await getlatestdata()
//   await runCalender()
// }
// main()