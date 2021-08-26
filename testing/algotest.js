const DAY_ZERO = new Date(2021, 4, 1, 0, 0, 0);

let startDayIndex = 77;
let dayArrayLength = 180;


let baseDate = new Date(DAY_ZERO + startDayIndex*24*60*60*1000);
let nextDate = baseDate;
let diff = null;
let diffInDays = null;
let baseIndex = startDayIndex;
let nextIndex = null;
while(baseIndex<dayArrayLength)
{
    nextDate.setMonth(baseDate.getMonth()+1)
    diff = nextDate-baseDate;
    diffInDays = Math.round(diff/(24*60*60*1000));
    nextIndex = baseIndex+diffInDays;
    console.log(nextIndex)
    
    baseDate = nextDate;
    baseIndex = nextIndex;
}